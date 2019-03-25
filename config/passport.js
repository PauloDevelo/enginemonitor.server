const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Users = mongoose.model('Users');

passport.use(
  new LocalStrategy(
  {
    usernameField: 'user[email]',
    passwordField: 'user[password]',
  }, 
  async (email, password, done) => {
    try{
      const user = await Users.findOne({ email });
      if(!user){
        return done(null, false, { errors: { 'email': 'invalid' } });
      }
      else if(user.isVerified === undefined || user.isVerified === false){
        return done(null, false, { errors: { 'email': 'needVerification' } });
      }
      else if(!user.validatePassword(password)) {
        return done(null, false, { errors: { 'password': 'invalid' } });
      }

      return done(null, user);
    }
    catch(error){
      console.log(error);
      done(error);
    }
}));