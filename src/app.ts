import config, {isDev, isProd} from "./utils/configUtils";
import logger from "./utils/logger";
import {requestContextBinder} from "./utils/requestContext";

import auth from "./security/auth";

import bodyParser from "body-parser";
import cors from "cors";
import errorHandler from "errorhandler";
import express from "express";
import fs from "fs";
import https from "https";

import morgan from "morgan";
import path from "path";

import { ServerResponse } from "http";
import IController from "./controllers/IController";

class App {
    public app: express.Application;
    private readonly path: string = "/api";

    constructor(controllers: IController[]) {
        this.app = express();

        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandlers();
    }

    public listen() {
        if (config.get("ssl") === true) {
            const privateKey = fs.readFileSync(config.get("privateKey"), "utf8");
            const certificate = fs.readFileSync(config.get("certificate"), "utf8");
            const ca = fs.readFileSync(config.get("ca"), "utf8");

            const credentials = {
                ca,
                cert: certificate,
                key: privateKey,
            };

            const httpsServer = https.createServer(credentials, this.app);

            httpsServer.listen(config.get("port"), () => {
                logger.log("info", `Server running in https and listening on port ${config.get("port")}`);
            });
        } else {
            this.app.listen(config.get("port"), () => {
                logger.log("info", `Server running and listening on port ${config.get("port")}`);
            });
        }
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        if (isDev) {
            this.app.use(morgan("dev"));
        }

        this.app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
        this.app.use(bodyParser.json({limit: "50mb"}));
        this.app.use(express.static(path.join(__dirname, "public")));

        this.app.use("/api/uploads", express.static("uploads"));

        this.app.use(auth.optional, requestContextBinder());
    }

    private initializeControllers(controllers: IController[]) {
        controllers.forEach((controller) => {
            this.app.use(this.path, controller.getRouter());
        });
    }

    private initializeErrorHandlers() {
        this.app.use(this.logErrors);
        this.app.use(this.clientErrorHandler);
        this.app.use(this.errorHandler);
    }

    private logErrors(err: any, req: express.Request, res: express.Response, next: any) {
        logger.error(err);
        next(err);
    }

    private clientErrorHandler(err, req, res, next) {
        if (req.xhr) {
          res.status(500).send({ error: "Something failed!" });
        } else {
          next(err);
        }
      }

    private errorHandler(err: any, req: express.Request, res: express.Response, next: any) {
        if (!(err instanceof ServerResponse)) {
            res.status(err.status || 500).json({
                errors: {
                    error: err,
                    message: err.message,
                },
            });
        }
    }
}

export default App;
