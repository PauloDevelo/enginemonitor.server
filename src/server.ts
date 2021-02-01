import App from './app';
import AssetsController from './controllers/assets.controller';
import EntriesController from './controllers/entries.controller';
import EquipmentsController from './controllers/equipments.controller';
import GuestLinksController from './controllers/guestlinks.controller';
import ImagesController from './controllers/images.controller';
import ServerController from './controllers/server.controller';
import TasksController from './controllers/tasks.controller';
import UsersController from './controllers/users.controller';
import logger from './utils/logger';
import getDbVersion from './utils/mongoDb';

import TaskManager from './tasks/TaskManager';

import {
  deleteOrphanGuestUser,
  deleteUserWhoDidNotUseTheWebApp,
  sendEmailToUsersWhoAreGoingToBeDeleted,
} from './tasks/UserCleanerHelper';

const server = new App(
  [
    new UsersController(),
    new EntriesController(),
    new TasksController(),
    new EquipmentsController(),
    new ImagesController(),
    new GuestLinksController(),
    new AssetsController(),
    new ServerController(),
  ],
);
export default server; // for testing

const taskManager: TaskManager = new TaskManager([
  { cronTabConfig: '0 1 * * *', action: () => sendEmailToUsersWhoAreGoingToBeDeleted(30) },
  { cronTabConfig: '1 1 * * *', action: () => sendEmailToUsersWhoAreGoingToBeDeleted(15) },
  { cronTabConfig: '2 1 * * *', action: () => sendEmailToUsersWhoAreGoingToBeDeleted(7) },
  { cronTabConfig: '3 1 * * *', action: () => sendEmailToUsersWhoAreGoingToBeDeleted(1) },
  { cronTabConfig: '4 1 * * *', action: deleteUserWhoDidNotUseTheWebApp },
  { cronTabConfig: '5 1 * * *', action: deleteOrphanGuestUser },
]);

const tryStartServer = async () => {
  try {
    const dbVersion = await getDbVersion();
    logger.info(`The Database version is ${dbVersion}`);

    taskManager.start();

    server.listen();
  } catch (error) {
    logger.error(error);
    taskManager.stop();
  }
};

tryStartServer();
