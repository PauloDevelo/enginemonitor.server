import * as express from "express";
import auth from "../security/auth";

import wrapAsync from "../utils/expressHelpers";

import { getGuestByNiceKey } from "../models/Guests";
import Users from "../models/Users";

import IController from "./IController";

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

    // POST new guest route (required, need to be authenticated)
    private createGuest = async (req: express.Request, res: express.Response) => {
        res.status(400).json({});
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
