import passport from 'passport';
import localStrategy from "./passport";
import googleStrategy from "./google";

passport.use("google", googleStrategy);
passport.use("local", localStrategy);

export default passport;

