import mongoose from "mongoose";
import App from "./app";
import EntriesController from "./controllers/entries.controller";
import EquipmentsController from "./controllers/equipments.controller";
import TasksController from "./controllers/tasks.controller";
import UsersController from "./controllers/users.controller";
import config, {isDev, isProd} from "./utils/configUtils";

// Configure mongoose's promise to global promise
mongoose.Promise = global.Promise;
// Configure Mongoose
mongoose.connect("mongodb:" + config.get("DBHost"), {useNewUrlParser: true});
if (isDev) {
  mongoose.set("debug", true);
}

const server = new App(
  [
    new UsersController(),
    new EntriesController(),
    new TasksController(),
    new EquipmentsController(),
  ],
  config.get("port")
);

server.listen();

export default server; // for testing
