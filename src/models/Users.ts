import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import timeService from '../services/TimeService';

import config from '../utils/configUtils';
import getFolderSize from '../utils/fileHelpers';

import AssetUser, { getAssetsOwnedByUser } from './AssetUser';
import { getImagesRelatedToAsset } from './Images';
import { INewPassword } from './NewPasswords';
import PendingRegistrations from './PendingRegistrations';

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  _uiId: string;
  authStrategy: 'google' | 'local';
  name: string;
  firstname: string;
  email: string;
  hash: string;
  lastAuth: Date;
  verificationToken: string;
  salt: string;
  isVerified: boolean;
  forbidUploadingImage?: boolean;
  forbidSelfDelete: boolean;
  forbidCreatingAsset?: boolean;
  privacyPolicyAccepted: boolean;

  // eslint-disable-next-line no-unused-vars
  setPassword(password: string): void;
  // eslint-disable-next-line no-unused-vars
  setNewPassword(password: INewPassword): void;
  // eslint-disable-next-line no-unused-vars
  validatePassword(password: string): boolean;
  changeVerificationToken(): void;
  generateJWT(): string;
  toAuthJSON(): Promise<object>;
  getUserImageFolder(): string;
  getUserImageFolderSizeLimitInByte(): number;
  checkAndProcessPendingInvitation(): Promise<void>;
  createImageFolder(): Promise<void>;
}

export const UsersSchema = new mongoose.Schema<IUser>({
  _uiId: String,
  authStrategy: String,
  email: String,
  firstname: String,
  forbidCreatingAsset: Boolean,
  forbidSelfDelete: Boolean,
  forbidUploadingImage: Boolean,
  hash: String,
  isVerified: Boolean,
  lastAuth: Date,
  name: String,
  privacyPolicyAccepted: Boolean,
  salt: String,
  verificationToken: String,
});

const getUserImageFolderSizeInByte = async (user: IUser): Promise<number> => {
  const imageFolder = user.getUserImageFolder();

  try {
    return await getFolderSize(imageFolder);
  } catch (error) {
    return 0;
  }
};

// eslint-disable-next-line func-names
UsersSchema.methods.setPassword = function (password: string) {
  this.isVerified = false;
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  this.changeVerificationToken();
};

// eslint-disable-next-line func-names
UsersSchema.methods.setNewPassword = function (newPassword: INewPassword) {
  this.salt = newPassword.salt;
  this.hash = newPassword.hash;
  this.changeVerificationToken();
};

// eslint-disable-next-line func-names
UsersSchema.methods.changeVerificationToken = function () {
  this.verificationToken = crypto.randomBytes(16).toString('hex');
};

// eslint-disable-next-line func-names
UsersSchema.methods.validatePassword = function (password: string) {
  if (!this.salt || !this.hash) {
    return false;
  }

  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

// eslint-disable-next-line func-names
UsersSchema.methods.generateJWT = function () {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);

  return jwt.sign({
    email: this.email,
    exp: expirationDate.getTime() / 1000,
    id: this._id,
    verificationToken: this.verificationToken,
  }, config.get('JWT_PrivateKey'));
};

// eslint-disable-next-line func-names
UsersSchema.methods.toAuthJSON = async function () {
  this.lastAuth = timeService.getUTCDateTime();
  this.save();

  return {
    _uiId: this._uiId,
    email: this.email,
    firstname: this.firstname,
    forbidCreatingAsset: this.forbidCreatingAsset,
    forbidSelfDelete: this.forbidSelfDelete,
    forbidUploadingImage: this.forbidUploadingImage,
    imageFolder: this.getUserImageFolder(),
    imageFolderSizeInByte: await getUserImageFolderSizeInByte(this),
    imageFolderSizeLimitInByte: this.getUserImageFolderSizeLimitInByte(),
    name: this.name,
    privacyPolicyAccepted: this.privacyPolicyAccepted,
    token: this.generateJWT(),
  };
};

// eslint-disable-next-line func-names
UsersSchema.methods.getUserImageFolder = function (): string {
  return `${config.get('ImageFolder')}${this._id}`;
};

UsersSchema.methods.getUserImageFolderSizeLimitInByte = (): number => config.get('userImageFolderLimitInByte');

// eslint-disable-next-line func-names
UsersSchema.methods.checkAndProcessPendingInvitation = async function () {
  const pendingInvitations = await PendingRegistrations.find({ newOwnerEmail: this.email });
  if (pendingInvitations.length > 0) {
    const pendingInvitation = pendingInvitations[0];

    const assetUser = await AssetUser.findOne({ assetId: pendingInvitation.assetId, readonly: false });
    const previousOwnerId = assetUser.userId;
    assetUser.userId = this._id;
    await assetUser.save();

    // eslint-disable-next-line no-use-before-define
    const ownedImages = await getImagesRelatedToAsset(pendingInvitation.assetId);
    const promises = ownedImages.map((ownedImage) => ownedImage.changePath(previousOwnerId, this._id));
    await Promise.all(promises);

    await pendingInvitation.deleteOne();
  }
};

// eslint-disable-next-line func-names
UsersSchema.methods.createImageFolder = async function () {
  const dir = this.getUserImageFolder();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

/**
 * This is called after a new IUser document is created
 */
// eslint-disable-next-line func-names
UsersSchema.post('save', { document: true, query: false }, async function () {
  await this.createImageFolder();
  await this.checkAndProcessPendingInvitation();
});

// eslint-disable-next-line func-names
UsersSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const assetsOwned = await getAssetsOwnedByUser(this);
  const assetDeletion = assetsOwned.map((assetOwned) => assetOwned.deleteOne());

  await Promise.all(assetDeletion);
});

// eslint-disable-next-line func-names
UsersSchema.post('deleteOne', { document: true, query: false }, function () {
  const userImageFolder = this.getUserImageFolder();
  if (fs.existsSync(userImageFolder)) {
    fs.rmdirSync(userImageFolder);
  }
});

const Users = mongoose.model<IUser>('Users', UsersSchema);
export default Users;
