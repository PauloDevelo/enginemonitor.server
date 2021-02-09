import crypto from 'crypto';
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const NewPasswordsSchema = new Schema({
  email: String,
  hash: String,
  salt: String,
  verificationToken: String,
});

NewPasswordsSchema.methods.initNewPassword = function (email: string, password: string) {
  this.email = email;
  this.verificationToken = crypto.randomBytes(16).toString('hex');
  this.setPassword(password);
};

NewPasswordsSchema.methods.setPassword = function (password: string) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

export interface INewPassword extends mongoose.Document {
  email: string;
  hash: string;
  verificationToken: string;
  salt: string;

  // eslint-disable-next-line no-unused-vars
  initNewPassword(email: string, password: string): void;
  // eslint-disable-next-line no-unused-vars
  setPassword(password: string): void;
}

const NewPasswords = mongoose.model<INewPassword>('NewPasswords', NewPasswordsSchema);
export default NewPasswords;
