const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Users = mongoose.model('Users');

passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]',
}, (email, password, done) => {
  Users.findOne({ email })
    .then((user) => {
      if(!user){
        return done(null, false, { errors: { 'email': 'invalid' } });
      }
      else if(!user.validatePassword(password)) {
        return done(null, false, { errors: { 'password': 'invalid' } });
      }

      return done(null, user);
    }).catch(done);
}));