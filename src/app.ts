import config, {isDev, isProd} from "./utils/configUtils";
import logger from "./utils/logger";

import bodyParser from "body-parser";
import cors from "cors";
import errorHandler from "errorhandler";
import express from "express";
import fs from "fs";
import http from "http";
import https from "https";

import morgan from "morgan";
import path from "path";

import IController from "./controllers/IController";

class App {
    public app: express.Application;
    private readonly port: number;
    private readonly path: string = "/api";

    constructor(controllers: IController[]) {
        this.app = express();

        this.initializeMiddlewares();
        this.initializeControllers(controllers);
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
                logger.log("info", `Server running in https and listening on port ${this.port}`);
            });
        } else {
            this.app.listen(config.get("port"), () => {
                logger.log("info", `Server running and listening on port ${this.port}`);
            });
        }
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        if (isDev) {
            this.app.use(morgan("dev"));
        }

        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(express.static(path.join(__dirname, "public")));

        if (!isProd) {
            this.app.use(errorHandler());
        }
    }

    private initializeControllers(controllers: IController[]) {
        controllers.forEach((controller) => {
            this.app.use(this.path, controller.getRouter());
        });

        this.app.use(this.path, (err: any, req: express.Request, res: express.Response, next: any) => {
            if (err) {
                res.status(err.status || 500).json({
                    errors: {
                        error: err,
                        message: err.message,
                    },
                });
            }
        });
    }
}

export default App;
