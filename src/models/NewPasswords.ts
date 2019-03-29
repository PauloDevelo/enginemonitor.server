import crypto from "crypto";
import mongoose from "mongoose";

const { Schema } = mongoose;

export const NewPasswordsSchema = new Schema({
  email: String,
  hash: String,
  salt: String,
  verificationToken: String,
});

NewPasswordsSchema.methods.initNewPassword = function(email: string, password: string) {
    this.email = email;
    this.verificationToken = crypto.randomBytes(16).toString("hex");
    this.setPassword(password);
};

NewPasswordsSchema.methods.setPassword = function(password: string) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
};

export interface INewPasswords extends mongoose.Document {
  email: string;
  hash: string;
  verificationToken: string;
  salt: string;

  initNewPassword(email: string, password: string): void;
  setPassword(password: string): void;
}

const NewPasswords = mongoose.model<INewPasswords>("NewPasswords", NewPasswordsSchema);
export default NewPasswords;