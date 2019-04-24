
import App from "./app";
import EntriesController from "./controllers/entries.controller";
import EquipmentsController from "./controllers/equipments.controller";
import TasksController from "./controllers/tasks.controller";
import UsersController from "./controllers/users.controller";
import CheckDbVersion from "./utils/mongoDb";

const server = new App(
  [
    new UsersController(),
    new EntriesController(),
    new TasksController(),
    new EquipmentsController(),
]);

export default server; // for testing

CheckDbVersion(() => { server.listen(); });
