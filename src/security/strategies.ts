import passport from "passport";
import googleStrategy from "./google";
import localStrategy from "./passport";

passport.use("google", googleStrategy);
passport.use("local", localStrategy);

export default passport;
