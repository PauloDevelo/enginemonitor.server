import * as express from "express";
import auth from "../security/auth";

import IController from "./IController";

class ServerController implements IController {
    private path: string = "/server";
    private router: express.Router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private intializeRoutes() {
        this.router
        .use(   this.path,                      auth.optional)
        .get(   `${this.path}/ping`,            auth.optional, this.pong);
    }

    private pong = async (req: express.Request, res: express.Response) => {
        return res.json({ pong: true });
    }
}

export default ServerController;
