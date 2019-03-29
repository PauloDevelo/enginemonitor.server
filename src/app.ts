import config, {isDev, isProd} from "./utils/configUtils";

import bodyParser from "body-parser";
import cors from "cors";
import errorHandler from "errorhandler";
import express from "express";

import morgan from "morgan";
import path from "path";

import IController from "./controllers/IController";

class App {
    public app: express.Application;
    private port: number;
    private path: string = "/api";

    constructor(controllers: IController[], port: number) {
        this.app = express();
        this.port = port;

        this.initializeMiddlewares();
        this.initializeControllers(controllers);
    }

    public listen() {
        this.app.listen(this.port, () => {
            // tslint:disable-next-line:no-console
            console.log(`Server running on http://localhost:${this.port}/`);
        });
    }

    private initializeMiddlewares() {
        // Configure our app
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
