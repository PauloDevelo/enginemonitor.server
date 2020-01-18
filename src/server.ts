
import App from "./app";
import EntriesController from "./controllers/entries.controller";
import EquipmentsController from "./controllers/equipments.controller";
import GuestsController from "./controllers/guests.controller";
import ImagesController from "./controllers/images.controller";
import TasksController from "./controllers/tasks.controller";
import UsersController from "./controllers/users.controller";
import logger from "./utils/logger";
import getDbVersion from "./utils/mongoDb";

const server = new App(
  [
    new UsersController(),
    new EntriesController(),
    new TasksController(),
    new EquipmentsController(),
    new ImagesController(),
    new GuestsController(),
]);

export default server; // for testing

const tryStartServer = async () => {
  try {
    const dbVersion = await getDbVersion();
    logger.info(`The Database version is ${dbVersion}`);
    server.listen();
  } catch (error) {
    logger.error(error);
  }
};

tryStartServer();
