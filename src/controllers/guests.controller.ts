import * as express from "express";
import auth from "../security/auth";

import shortid from 'shortid';

import wrapAsync from "../utils/expressHelpers";

import Guests, { getGuestByNiceKey } from "../models/Guests";
import Users from "../models/Users";

import IController from "./IController";

import {getUser} from "../utils/requestContext";

class GuestsController implements IController {
    private path: string = "/guests";
    private router: express.Router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private initializeRoutes() {
        this.router  .post(this.path,     auth.required, wrapAsync(this.createGuest))
        .get(this.path + "/:niceKey",     auth.optional, wrapAsync(this.getGuest));
    }

    private checkGuestsProperties = ({ guestUiId, nameGuestLink }: { guestUiId: string, nameGuestLink: string }) => {
        const errors: any = {};

        if (!guestUiId) {
            errors.guestUiId = "isrequired";
        }

        if (!nameGuestLink) {
            errors.nameGuestLink = "isrequired";
        }

        if (Object.keys(errors).length === 0) {
            return undefined;
        } else {
            return { errors };
        }
    }

    // POST new guest route (required, need to be authenticated)
    private createGuest = async (req: express.Request, res: express.Response) => {
        const { body: { guestUiId, nameGuestLink } } = req;

        const errors = this.checkGuestsProperties({ guestUiId, nameGuestLink });
        if (errors) {
            return res.status(422).json(errors);
        }

        let guestUser = new Users({ _uiId: guestUiId, name: 'Guest', firstname: 'Guest', email: '', isVerified: true });
        guestUser.setPassword('guest');
        guestUser = await guestUser.save();

        const niceKey = shortid.generate();
        const guestLink = new Guests({ name: nameGuestLink, ownerUserId:  getUser()._id, guestUserId: guestUser._id, niceKey });
        await guestLink.save();

        return res.json({ guest: await guestLink.toJSON() });
    }

    // GET guest route (optional, everyone has access)
    private getGuest = async (req: express.Request, res: express.Response) => {
      const guest = await getGuestByNiceKey(req.params.niceKey);

      if (!guest) {
          return res.status(400).json({ errors: { niceKey: "isinvalid" } });
      }

      const user = await Users.findById(guest.ownerUserId);
      if (!user) {
          return res.status(400).json({ errors: { ownerUserId: "isinvalid" } });
      }

      const guestUser = await Users.findById(guest.guestUserId);
      if (!guestUser) {
          return res.status(400).json({ errors: { guestUserId: "isinvalid" } });
      }

      return res.json({ user: await guestUser.toAuthJSON() });
    }
}

export default GuestsController;
