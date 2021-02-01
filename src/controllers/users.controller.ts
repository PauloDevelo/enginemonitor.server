import * as express from 'express';

import auth from '../security/auth';
import passport from '../security/strategies';

import config from '../utils/configUtils';
import wrapAsync from '../utils/expressHelpers';
import sendEmailHelper from '../utils/sendEmailHelper';

import IController from './IController';

import { getAssetByUiId } from '../models/Assets';
import AssetUser from '../models/AssetUser';
import NewPasswords from '../models/NewPasswords';
import Users, { deleteUserModel, IUser } from '../models/Users';
import getUser from '../utils/requestContext';

class UsersController implements IController {
    private path: string = '/users';

    private router: express.Router = express.Router();

    constructor() {
      this.intializeRoutes();
    }

    public getRouter() {
      return this.router;
    }

    private intializeRoutes() {
      this.router
        .post(this.path, auth.optional, this.checkUserProperties, wrapAsync(this.checkIfEmailAlreadyExist), wrapAsync(this.createUser))
        .post(`${this.path}/login`, auth.optional, this.checkLoginBody, wrapAsync(this.login))
        .get(`${this.path}/login/google`, auth.optional, this.loginGoogle)
        .get(`${this.path}/login/google/callback`, auth.optional, this.loginGoogleCallback)
        .post(`${this.path}/resetpassword`, auth.optional, wrapAsync(this.checkResetPasswordBody), wrapAsync(this.resetPassword))
        .post(`${this.path}/verificationemail`, auth.optional, wrapAsync(this.checkVerificationEmail), wrapAsync(this.verificationEmail))
        .get(`${this.path}/changepassword`, auth.optional, wrapAsync(this.checkChangePasswordQuery), wrapAsync(this.changePassword))
        .get(`${this.path}/verification`, auth.optional, wrapAsync(this.checkCheckEmailQuery), wrapAsync(this.checkEmail))
        .get(`${this.path}/current`, auth.required, wrapAsync(this.getCurrent))
        .get(`${this.path}/credentials/:assetUiId`, auth.required, wrapAsync(this.checkAssetOwnership), wrapAsync(this.getUserCredentials))
        .delete(this.path, auth.required, this.checkUserCanSelfDelete, wrapAsync(this.deleteUser));
    }

    private checkUserCanSelfDelete = (req: express.Request, res: express.Response, credentialOk: any) => {
      const user = getUser();
      if (!user) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      if (user.forbidSelfDelete) {
        return res.status(400).json({ errors: 'credentialError' });
      }

      return credentialOk();
    }

    private checkAssetOwnership = async (req: express.Request, res: express.Response, authSucceed: any) => {
      const user = getUser();
      if (!user) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      const asset = await getAssetByUiId(req.params.assetUiId);
      if (!asset) {
        return res.status(400).json({ errors: { asset: 'notfound' } });
      }

      return authSucceed();
    }

    // eslint-disable-next-line no-unused-vars
    private getUserCredentials = async (req: express.Request, res: express.Response, _authSucceed: any) => {
      const asset = await getAssetByUiId(req.params.assetUiId);
      const user = getUser();
      const assetUser = await AssetUser.findOne({ assetId: asset._id, userId: user._id });

      return res.json({ credentials: await assetUser.toJSON() });
    }

    private checkUserProperties = (req: express.Request, res: express.Response, next: any) => {
      const { body: { user } } = req;

      const errors: any = {};

      if (!user.email) {
        errors.email = 'isrequired';
      }

      if (!user._uiId) {
        errors._uiId = 'isrequired';
      }

      if (!user.password) {
        errors.password = 'isrequired';
      }

      if (!user.name) {
        errors.name = 'isrequired';
      }

      if (!user.firstname) {
        errors.firstname = 'isrequired';
      }

      if (Object.keys(errors).length === 0) {
        return next();
      }
      return res.status(422).json({ errors });
    }

    private checkIfEmailAlreadyExist = async (req: express.Request, res: express.Response, next: any) => {
      const { body: { user } } = req;

      const userCount = await Users.countDocuments({ email: user.email });
      if (userCount > 0) {
        return res.status(422).json({ errors: { email: 'alreadyexisting' } });
      }

      return next();
    }

    // POST new user route (optional, everyone has access)
    private createUser = async (req: express.Request, res: express.Response) => {
      const { body: { user } } = req;

      let finalUser = new Users({
        ...user, isVerified: false, authStrategy: 'local', forbidSelfDelete: false,
      });
      finalUser.setPassword(user.password);
      finalUser = await finalUser.save();

      sendEmailHelper.sendVerificationEmail(finalUser.email, finalUser.verificationToken);

      return res.status(200).json({});
    }

    private checkCheckEmailQuery = async (req: express.Request, res: express.Response, next: any) => {
      const { query: { email, token } } = req;

      if (!email) {
        return res.status(422).json({ errors: { email: 'isrequired' } });
      }

      if (!token) {
        return res.status(422).json({ errors: { token: 'isrequired' } });
      }

      const user = await Users.find({ email });

      if (!user[0]) {
        return res.status(400).json({ errors: { email: 'isinvalid' } });
      }

      if (user[0].verificationToken !== token) {
        return res.status(400).json({ errors: { token: 'isinvalid' } });
      }

      return next();
    }

    // GET Verify the user's email
    private checkEmail = async (req: express.Request, res: express.Response) => {
      const { query: { email } } = req;

      const user = await Users.findOne({ email });
      user.isVerified = true;
      await user.save();

      res.redirect(config.get('frontEndUrl'));
    }

    private checkChangePasswordQuery = async (req: express.Request, res: express.Response, next: any) => {
      const { query: { token } } = req;

      if (!token) {
        return res.status(422).json({ errors: { token: 'isrequired' } });
      }

      const newPassword = await NewPasswords.find({ verificationToken: token });
      if (!newPassword[0]) {
        return res.status(400).json({ errors: { token: 'isinvalid' } });
      }

      const user = await Users.find({ email: newPassword[0].email });
      if (!user[0]) {
        return res.status(400).json({ errors: { email: 'isinvalid' } });
      }

      return next();
    }

    // GET Change the user's password after clicking on the confirmation email
    private changePassword = async (req: express.Request, res: express.Response) => {
      const { query: { token } } = req;

      const newPassword = await NewPasswords.findOne({ verificationToken: token });
      const user = await Users.findOne({ email: newPassword.email });

      user.setNewPassword(newPassword);

      await user.save();
      await newPassword.remove();

      res.redirect(config.get('frontEndUrl'));
    }

    private checkResetPasswordBody = async (req: express.Request, res: express.Response, next: any) => {
      const { body: { email, newPassword } } = req;

      if (!email) {
        return res.status(422).json({ errors: { email: 'isrequired' } });
      }

      if (!newPassword) {
        return res.status(422).json({ errors: { password: 'isrequired' } });
      }

      const user = await Users.find({ email });

      if (!user[0]) {
        return res.status(400).json({ errors: { email: 'isinvalid' } });
      }

      return next();
    }

    // POST create a new password and send an email to confirm the change of password
    private resetPassword = async (req: express.Request, res: express.Response) => {
      const { body: { email, newPassword } } = req;

      await NewPasswords.deleteMany({ email });

      let newPasswords = new NewPasswords();
      newPasswords.initNewPassword(email, newPassword);
      newPasswords = await newPasswords.save();

      sendEmailHelper.sendChangePasswordEmail(newPasswords.email, newPasswords.verificationToken);

      return res.status(200).json({});
    }

    private checkVerificationEmail = async (req: express.Request, res: express.Response, next: any) => {
      const { body: { email } } = req;

      if (!email) {
        return res.status(422).json({ errors: { email: 'isrequired' } });
      }

      const usersInDb = await Users.find({ email });
      if (!usersInDb[0]) {
        return res.status(400).json({ errors: { email: 'isinvalid' } });
      }

      return next();
    }

    // POST send another verification email
    private verificationEmail = async (req: express.Request, res: express.Response) => {
      const { body: { email } } = req;

      let userInDb = (await Users.find({ email }))[0];
      if (!userInDb.isVerified) {
        userInDb.changeVerificationToken();
        userInDb = await userInDb.save();

        sendEmailHelper.sendVerificationEmail(userInDb.email, userInDb.verificationToken);
        return res.status(200).json({});
      }
      return res.status(400).json({ errors: { email: 'alreadyverified' } });
    }

    private checkLoginBody = (req: express.Request, res: express.Response, next: any) => {
      const { body: { user } } = req;

      if (!user.email) {
        res.status(422).json({ errors: { email: 'isrequired' } });
        return;
      }

      if (!user.password) {
        res.status(422).json({ errors: { password: 'isrequired' } });
        return;
      }

      next();
    }

    // POST login route (optional, everyone has access)
    private login = async (req: express.Request, res: express.Response, next: any): Promise<void> => passport.authenticate('local', { session: false }, async (err, passportUser: IUser, info) => {
      if (err) {
        return next(err);
      }

      if (passportUser) {
        return res.json({ user: await passportUser.toAuthJSON() });
      }

      return res.status(400).json(info);
    })(req, res, next)

    private loginGoogle = (req: express.Request, res: express.Response, next: any) => {
      passport.authenticate('google', {
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
      })(req, res, next);

      return res;
    }

    private loginGoogleCallback = (req: express.Request, res: express.Response, next: any) => {
      passport.authenticate('google', { failureRedirect: '/login' }, async (error, user: IUser) => {
        const authUser = JSON.stringify(await user.toAuthJSON());

        return res
          .status(200)
          .cookie('authUser', authUser, {
            httpOnly: false,
          })
          .redirect(config.get('frontEndUrl'));
      })(req, res, next);

      return res;
    }

    // GET current route (required, only authenticated users have access)
    private getCurrent = async (req: express.Request, res: express.Response) => {
      const { payload: { id, verificationToken } } = req.body;

      if (verificationToken === undefined) {
        return res.status(422).json({ errors: { authentication: 'error' } });
      }

      const user = await Users.findById(id);
      if (!user) {
        return res.status(400).json({ errors: { id: 'isinvalid' } });
      }

      if (user.verificationToken !== verificationToken) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      return res.json({ user: await user.toAuthJSON() });
    }

    private deleteUser = async (req: express.Request, res: express.Response) => {
      const currentUser = getUser();
      await deleteUserModel(currentUser);
      return res.json({ user: await currentUser.toJSON() });
    }
}

export default UsersController;
