import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const UsersSchema = new mongoose.Schema({
  email: String,
  firstname: String,
  hash: String,
  isVerified: Boolean,
  name: String,
  salt: String,
  verificationToken: String,
});

UsersSchema.methods.initUser = function() {
  this.verificationToken = crypto.randomBytes(16).toString("hex");
  this.isVerified = false;
};

UsersSchema.methods.setPassword = function(password: string) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
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
  }, "secret");
};

UsersSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
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

  initUser(): void;
  setPassword(password: string): void;
  validatePassword(password: string): boolean;
  generateJWT(): string;
  toAuthJSON(): any;
}

const Users = mongoose.model<IUser>("Users", UsersSchema);
export default Users;
