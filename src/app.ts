import config, {isDev, isProd} from "./utils/configUtils";

import bodyParser from "body-parser";
import cors from "cors";
import errorHandler from "errorhandler";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "path";

import routes from "./routes";

// Configure mongoose's promise to global promise
mongoose.Promise = global.Promise;

// Initiate our app
const app = express();

// Configure our app
app.use(cors());
if (isDev) {
  app.use(morgan("dev"));
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

if (!isProd) {
  app.use(errorHandler());
}

// Configure Mongoose
mongoose.connect("mongodb:" + config.get("DBHost"), {useNewUrlParser: true});
if (isDev) {
  mongoose.set("debug", true);
}

app.use(routes);

app.listen(config.get("port"), () => {
  // tslint:disable-next-line:no-console
  console.log("Server running on http://localhost:" + config.get("port") + "/");
});

export default app; // for testing
