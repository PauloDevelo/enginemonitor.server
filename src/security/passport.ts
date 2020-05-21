import passport from "passport";
import LocalStrategy from "passport-local";
import logger from "../utils/logger";

import Users from "../models/Users";

const localStrategy = new LocalStrategy.Strategy(
  {
    passwordField: "user[password]",
    usernameField: "user[email]",
  },
  async (email: string, password: string, done: any) => {
    try {
      const user = await Users.findOne({ email });
      if (!user) {
        return done(null, false, { errors: { email: "invalid" } });
      } else if (user.isVerified === undefined || user.isVerified === false) {
        return done(null, false, { errors: { email: "needVerification" } });
      } else if (!user.validatePassword(password)) {
        return done(null, false, { errors: { password: "invalid" } });
      }

      return done(null, user);
    } catch (error) {
      logger.log("error", "Authentification error", error);
      done(error);
    }
});

export default localStrategy;
