import * as express from "express";
import auth from "../security/auth";

import passport from "../security/passport";
import config from "../utils/configUtils";
import sendGridHelper from "../utils/sendGridEmailHelper";

import NewPasswords, { INewPassword } from "../models/NewPasswords";
import Users, { IUser } from "../models/Users";

import IController from "./IController";

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
        this.router  .post(this.path,           auth.optional, this.createUser)
        .post(this.path + "/login",             auth.optional, this.login)
        .post(this.path + "/resetpassword",     auth.optional, this.resetPassword)
        .post(this.path + "/verificationemail", auth.optional, this.verificationEmail)
        .get(this.path + "/changepassword",     auth.optional, this.changePassword)
        .get(this.path + "/verification",       auth.optional, this.checkEmail)
        .get(this.path + "/current",            auth.required, this.getCurrent);
    }

    // POST new user route (optional, everyone has access)
    private createUser = async (req: express.Request, res: express.Response) => {
        try {
            const { body: { user } } = req;

            if (!user.email) {
                return res.status(422).json({ errors: { email: "isrequired" } });
            }

            if (!user.password) {
                return res.status(422).json({ errors: { password: "isrequired" } });
            }

            if (!user.name) {
                return res.status(422).json({ errors: { name: "isrequired" } });
            }

            if (!user.firstname) {
                return res.status(422).json({ errors: { firstname: "isrequired" } });
            }

            const userCount = await Users.countDocuments({ email: user.email });
            if (userCount > 0) {
                return res.status(422).json({ errors: { email: "alreadyexisting" } });
            }

            let finalUser = new Users(user);
            finalUser.setPassword(user.password);
            finalUser = await finalUser.save();

            await sendGridHelper.sendVerificationEmail(finalUser.email, finalUser.verificationToken);

            res.status(200).json({});
        } catch (error) {
            res.send(error);
        }
    }

    // GET Verify the user's email
    private checkEmail = async (req: express.Request, res: express.Response) => {
        try {
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
        } catch (error) {
            res.send(error);
        }
    }

    // GET Change the user's password after clicking on the confirmation email
    private changePassword = async (req: express.Request, res: express.Response) => {
        try {
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
        } catch (error) {
            res.send(error);
        }
    }

    // POST create a new password and send an email to confirm the change of password
    private resetPassword = async (req: express.Request, res: express.Response) => {
        try {
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

            await NewPasswords.remove({ email });

            let newPasswords = new NewPasswords();
            newPasswords.initNewPassword(email, newPassword);
            newPasswords = await newPasswords.save();

            await sendGridHelper.sendChangePasswordEmail(newPasswords.email, newPasswords.verificationToken);

            return res.status(200).json({});
        } catch (error) {
            res.send(error);
        }
    }

    // POST send another verification email
    private verificationEmail = async (req: express.Request, res: express.Response) => {
        try {
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
        } catch (error) {
            res.send(error);
        }
    }

    // POST login route (optional, everyone has access)
    private login = (req: express.Request, res: express.Response, next: any) => {
        const { body: { user } } = req;

        if (!user.email) {
            return res.status(422).json({ errors: { email: "isrequired" } });
        }

        if (!user.password) {
            return res.status(422).json({ errors: { password: "isrequired" } });
        }

        return passport.authenticate("local", { session: false }, (err, passportUser: IUser, info) => {
            if (err) {
                return next(err);
            }

            if (passportUser) {
                return res.json({ user: passportUser.toAuthJSON() });
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

        return res.json({ user: user.toAuthJSON() });
    }
}

export default UsersController;
