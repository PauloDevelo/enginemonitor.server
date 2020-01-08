
import App from "./app";
import EntriesController from "./controllers/entries.controller";
import EquipmentsController from "./controllers/equipments.controller";
import ImagesController from "./controllers/images.controller";
import TasksController from "./controllers/tasks.controller";
import UsersController from "./controllers/users.controller";
import logger from "./utils/logger";
import CheckDbVersion from "./utils/mongoDb";

const server = new App(
  [
    new UsersController(),
    new EntriesController(),
    new TasksController(),
    new EquipmentsController(),
    new ImagesController()
]);

export default server; // for testing

const tryStartServer = async () => {
  try {
    await CheckDbVersion();
    server.listen();
  } catch (error) {
    logger.error(error);
  }
};

tryStartServer();
