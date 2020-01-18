import * as express from "express";
import auth from "../security/auth";

import { ServerResponse } from "http";

import passport from "../security/passport";
import config from "../utils/configUtils";
import wrapAsync from "../utils/expressHelpers";
import sendGridHelper from "../utils/sendGridEmailHelper";

import NewPasswords, { INewPassword } from "../models/NewPasswords";
import Users, { IUser } from "../models/Users";

import IController from "./IController";

import logger from "../utils/logger";

class UsersController implements IController {
    private path: string = "/users";
    private router: express.Router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private intializeRoutes() {
        this.router  .post(this.path,           auth.optional, wrapAsync(this.createUser))
        .post(this.path + "/login",             auth.optional, wrapAsync(this.login))
        .post(this.path + "/resetpassword",     auth.optional, wrapAsync(this.resetPassword))
        .post(this.path + "/verificationemail", auth.optional, wrapAsync(this.verificationEmail))
        .get(this.path + "/changepassword",     auth.optional, wrapAsync(this.changePassword))
        .get(this.path + "/verification",       auth.optional, wrapAsync(this.checkEmail))
        .get(this.path + "/current",            auth.required, wrapAsync(this.getCurrent));
    }

    private checkUserProperties = (user: any) => {
        const errors: any = {};

        if (!user.email) {
            errors.email = "isrequired";
        }

        if (!user._uiId) {
            errors._uiId = "isrequired";
        }

        if (!user.password) {
            errors.password = "isrequired";
        }

        if (!user.name) {
            errors.name = "isrequired";
        }

        if (!user.firstname) {
            errors.firstname = "isrequired";
        }

        if (Object.keys(errors).length === 0) {
            return undefined;
        } else {
            return { errors };
        }
    }

    // POST new user route (optional, everyone has access)
    private createUser = async (req: express.Request, res: express.Response) => {
        const { body: { user } } = req;

        const errors = this.checkUserProperties(user);
        if (errors) {
            return res.status(422).json(errors);
        }

        const userCount = await Users.countDocuments({ email: user.email });
        if (userCount > 0) {
            return res.status(422).json({ errors: { email: "alreadyexisting" } });
        }

        let finalUser = new Users({ ...user, isVerified: false });
        finalUser.setPassword(user.password);
        finalUser = await finalUser.save();

        await sendGridHelper.sendVerificationEmail(finalUser.email, finalUser.verificationToken);

        res.status(200).json({});
    }

    // GET Verify the user's email
    private checkEmail = async (req: express.Request, res: express.Response) => {
        const { query: { email , token } } = req;

        if (!email) {
            return res.status(422).json({ errors: { email: "isrequired" } });
        }

        if (!token) {
            return res.status(422).json({ errors: { token: "isrequired" } });
        }

        const user = await Users.find({ email });

        if (!user[0]) {
            return res.status(400).json({ errors: { email: "isinvalid" } });
        }

        if (user[0].verificationToken !== token) {
            return res.status(400).json({ errors: { token: "isinvalid" } });
        }

        user[0].isVerified = true;

        await user[0].save();

        res.redirect(config.get("frontEndUrl"));
    }

    // GET Change the user's password after clicking on the confirmation email
    private changePassword = async (req: express.Request, res: express.Response) => {
        const { query: { token } } = req;

        if (!token) {
            return res.status(422).json({ errors: { token: "isrequired" } });
        }

        const newPassword = await NewPasswords.find({ verificationToken: token });
        if (!newPassword[0]) {
            return res.status(400).json({ errors: { token: "isinvalid" } });
        }

        const user = await Users.find({ email: newPassword[0].email });
        if (!user[0]) {
            return res.status(400).json({ errors: { email: "isinvalid" } });
        }

        user[0].setNewPassword(newPassword[0]);

        await user[0].save();
        await newPassword[0].remove();

        res.redirect(config.get("frontEndUrl"));
    }

    // POST create a new password and send an email to confirm the change of password
    private resetPassword = async (req: express.Request, res: express.Response) => {
        const { body: { email, newPassword } } = req;

        if (!email) {
            return res.status(422).json({ errors: { email: "isrequired" } });
        }

        if (!newPassword) {
            return res.status(422).json({ errors: { password: "isrequired" } });
        }

        const user = await Users.find({ email });

        if (!user[0]) {
            return res.status(400).json({ errors: { email: "isinvalid" } });
        }

        await NewPasswords.deleteMany({ email });

        let newPasswords = new NewPasswords();
        newPasswords.initNewPassword(email, newPassword);
        newPasswords = await newPasswords.save();

        await sendGridHelper.sendChangePasswordEmail(newPasswords.email, newPasswords.verificationToken);

        return res.status(200).json({});
    }

    // POST send another verification email
    private verificationEmail = async (req: express.Request, res: express.Response) => {
        const { body: { email } } = req;

        if (!email) {
            return res.status(422).json({ errors: { email: "isrequired" } });
        }

        const usersInDb = await Users.find({email});
        if (!usersInDb[0]) {
            return res.status(400).json({ errors: { email: "isinvalid" } });
        }

        let userInDb = usersInDb[0];
        if (!userInDb.isVerified) {
            userInDb.changeVerificationToken();
            userInDb = await userInDb.save();

            await sendGridHelper.sendVerificationEmail(userInDb.email, userInDb.verificationToken);
            return res.status(200).json({});
        } else {
            return res.status(400).json({ errors: { email: "alreadyverified" } });
        }
    }

    // POST login route (optional, everyone has access)
    private login = async (req: express.Request, res: express.Response, next: any): Promise<void> => {
        const { body: { user } } = req;

        if (!user.email) {
            res.status(422).json({ errors: { email: "isrequired" } });
            return;
        }

        if (!user.password) {
            res.status(422).json({ errors: { password: "isrequired" } });
            return;
        }

        return passport.authenticate("local", { session: false }, async (err, passportUser: IUser, info) => {
            if (err) {
                return next(err);
            }

            if (passportUser) {
                return res.json({ user: await passportUser.toAuthJSON() });
            }

            return res.status(400).json(info);
        })(req, res, next);
    }

    // GET current route (required, only authenticated users have access)
    private getCurrent = async (req: express.Request, res: express.Response) => {
        const { payload: { id, verificationToken } } = req.body;

        if (verificationToken === undefined) {
            return res.status(422).json({ errors: { authentication: "error" } });
        }

        const user = await Users.findById(id);
        if (!user) {
            return res.status(400).json({ errors: { id: "isinvalid" } });
        }

        if (user.verificationToken !== verificationToken) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        return res.json({ user: await user.toAuthJSON() });
    }
}

export default UsersController;
