import config, {isDev, isProd} from "./utils/configUtils";
import App from './app';
import mongoose from "mongoose";
import UsersController from "./controllers/users.controller";
import EntriesController from "./controllers/entries.controller";
import TasksController from "./controllers/tasks.controller";
import EquipmentsController from "./controllers/equipments.controller";

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