import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import timeService from '../services/TimeService';

import config from '../utils/configUtils';
import getFolderSize from '../utils/fileHelpers';

import { deleteAssetModel } from './Assets';
import { getAssetsOwnedByUser } from './AssetUser';
import { INewPassword } from './NewPasswords';

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

UsersSchema.methods.setPassword = function (password: string) {
  this.isVerified = false;
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  this.changeVerificationToken();
};

UsersSchema.methods.setNewPassword = function (newPassword: INewPassword) {
  this.salt = newPassword.salt;
  this.hash = newPassword.hash;
  this.changeVerificationToken();
};

UsersSchema.methods.changeVerificationToken = function () {
  this.verificationToken = crypto.randomBytes(16).toString('hex');
};

UsersSchema.methods.validatePassword = function (password: string) {
  if (!this.salt || !this.hash) {
    return false;
  }

  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

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

UsersSchema.methods.getUserImageFolder = function (): string {
  return `${config.get('ImageFolder')}${this._id}`;
};

UsersSchema.methods.getUserImageFolderSizeLimitInByte = (): number => config.get('userImageFolderLimitInByte');

export const deleteUserModel = async (user: IUser): Promise<void> => {
  const assetsOwned = await getAssetsOwnedByUser(user);
  const assetDeletion = assetsOwned.map((assetOwned) => deleteAssetModel(assetOwned));

  await Promise.all(assetDeletion);

  await user.remove();

  const userImageFolder = user.getUserImageFolder();
  if (fs.existsSync(userImageFolder)) {
    fs.rmdirSync(userImageFolder);
  }
};

const Users = mongoose.model<IUser>('Users', UsersSchema);
export default Users;
