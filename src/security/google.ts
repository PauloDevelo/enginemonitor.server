import passport from 'passport';
import crypto from "crypto";
import passportGoogle from 'passport-google-oauth';
import logger from "../utils/logger";

import Users from "../models/Users";

import config from "../utils/configUtils";

const GoogleStrategy = passportGoogle.OAuth2Strategy

const strategyOptions = {
  clientID: config.get("GOOGLE_CLIENT_ID"),
  clientSecret: config.get("GOOGLE_CLIENT_SECRET"),
  callbackURL: `${config.get("hostURL")}users/login/google/callback`,
}

const verifyCallback = async (accessToken, refreshToken, profile, done) => {
  try{
    const user = await Users.findOne({ _uiId: profile.id });

    if(user){
      return done(null, user);
    }
    else{
      const verifiedEmail = profile.emails.find(email => email.verified) || profile.emails[0];

      let createdUser = new Users({ 
        _uiId: profile.id,
        email: verifiedEmail.value,
        firstname: profile.name.givenName,
        name: profile.name.familyName,
        forbidCreatingAsset: false,
        forbidUploadingImage: false,
        isVerified: true,
        
        salt: null,
        hash: null,
        verificationToken: crypto.randomBytes(16).toString("hex")
      });
      createdUser = await createdUser.save();

      return done(null, createdUser);
    }
  }
  catch(err){
    logger.log("error", "Authentification error", err);
    return done(err);
  }
}

const googleStrategy = new GoogleStrategy(strategyOptions, verifyCallback)

export default googleStrategy;