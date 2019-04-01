import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../utils/configUtils";

import { INewPassword } from "./NewPasswords";

export const UsersSchema = new mongoose.Schema({
  email: String,
  firstname: String,
  hash: String,
  isVerified: Boolean,
  name: String,
  salt: String,
  verificationToken: String,
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

UsersSchema.methods.toAuthJSON = function() {
  return {
    email: this.email,
    firstname: this.firstname,
    name: this.name,
    token: this.generateJWT(),
  };
};

export interface IUser extends mongoose.Document {
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
}

const Users = mongoose.model<IUser>("Users", UsersSchema);
export default Users;
