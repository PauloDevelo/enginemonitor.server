import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import config from "../utils/configUtils";
import getFolderSize from "../utils/fileHelpers";

import { INewPassword } from "./NewPasswords";

export const UsersSchema = new mongoose.Schema({
  _uiId: String,
  email: String,
  firstname: String,
  hash: String,
  isVerified: Boolean,
  name: String,
  salt: String,
  verificationToken: String
});

UsersSchema.methods.setPassword = function(password: string) {
  this.isVerified = false;
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
  this.changeVerificationToken();
};

UsersSchema.methods.setNewPassword = function(newPassword: INewPassword) {
  this.isVerified = true;
  this.salt = newPassword.salt;
  this.hash = newPassword.hash;
  this.changeVerificationToken();
};

UsersSchema.methods.changeVerificationToken = function() {
  this.verificationToken = crypto.randomBytes(16).toString("hex");
};

UsersSchema.methods.validatePassword = function(password: string) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
  return this.hash === hash;
};

UsersSchema.methods.generateJWT = function() {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);

  return jwt.sign({
    email: this.email,
    exp: expirationDate.getTime() / 1000,
    id: this._id,
    verificationToken: this.verificationToken,
  }, config.get("JWT_PrivateKey"));
};

UsersSchema.methods.toAuthJSON = async function() {
  return {
    _uiId: this._uiId,
    email: this.email,
    firstname: this.firstname,
    imageFolder: this.getUserImageFolder(),
    imageFolderSizeInByte: await getUserImageFolderSizeInByte(this),
    imageFolderSizeLimitInByte: this.getUserImageFolderSizeLimitInByte(),
    name: this.name,
    token: this.generateJWT(),
  };
};

UsersSchema.methods.getUserImageFolder = function(): string {

  return config.get("ImageFolder") + this._id;
};

UsersSchema.methods.getUserImageFolderSizeLimitInByte = (): number => {
    return config.get("userImageFolderLimitInByte");
};

const getUserImageFolderSizeInByte = async (user: IUser): Promise<number> => {
  const imageFolder = user.getUserImageFolder();

  try {
    return await getFolderSize(imageFolder);
  } catch (error) {
    return 0;
  }
};

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  _uiId: string;
  name: string;
  firstname: string;
  email: string;
  hash: string;
  verificationToken: string;
  salt: string;
  isVerified: boolean;

  setPassword(password: string): void;
  setNewPassword(password: INewPassword): void;
  validatePassword(password: string): boolean;
  changeVerificationToken(): void;
  generateJWT(): string;
  toAuthJSON(): any;
  getUserImageFolder(): string;
  getUserImageFolderSizeLimitInByte(): number;
}

const Users = mongoose.model<IUser>("Users", UsersSchema);
export default Users;
