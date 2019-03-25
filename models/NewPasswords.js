const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

const NewPasswordsSchema = new Schema({
  email: String,
  hash: String,
  verificationToken: String,
  salt: String
});

NewPasswordsSchema.methods.initNewPassword = function(email, password){
    this.email = email;
    this.verificationToken = crypto.randomBytes(16).toString('hex');
    this.setPassword(password);
}

NewPasswordsSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

mongoose.model('NewPasswords', NewPasswordsSchema);