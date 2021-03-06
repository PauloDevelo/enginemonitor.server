import * as express from 'express';
import mongoose from 'mongoose';

import auth from '../security/auth';

import wrapAsync from '../utils/expressHelpers';
import { getUser } from '../utils/requestContext';

import { getAssetByUiId } from '../models/Assets';
import { getEquipmentByUiId, IEquipments } from '../models/Equipments';
import Tasks, { getTaskByUiId, ITasks } from '../models/Tasks';

import { checkCredentials } from './controller.helper';
import IController from './IController';

class TasksController implements IController {
    private path: string = '/tasks';

    private router: express.Router = express.Router();

    constructor() {
      this.intializeRoutes();
    }

    public getRouter() {
      return this.router;
    }

    private intializeRoutes() {
      this.router
        .use(`${this.path}/:assetUiId/:equipmentUiId`, auth.required, wrapAsync(this.checkAuthAndOwnership), wrapAsync(checkCredentials))
        .get(`${this.path}/:assetUiId/:equipmentUiId`, auth.required, wrapAsync(this.getTasks))
        .post(`${this.path}/:assetUiId/:equipmentUiId/:taskUiId`, auth.required, wrapAsync(this.changeOrCreateTask))
        .delete(`${this.path}/:assetUiId/:equipmentUiId/:taskUiId`, auth.required, wrapAsync(this.deleteTask));
    }

    private checkTaskProperties = (equipment: IEquipments, task: ITasks) => {
      const errors: any = {};

      if (!task._uiId) {
        errors._uiId = 'isrequired';
      }

      if (!task.name) {
        errors.name = 'isrequired';
      }

      if (!task.periodInMonth) {
        errors.periodInMonth = 'isrequired';
      }

      if (!task.description) {
        errors.description = 'isrequired';
      }

      if (Object.keys(errors).length === 0) {
        return undefined;
      }
      return { errors };
    }

    private checkAuthAndOwnership = async (req: express.Request, res: express.Response, next: any) => {
      const user = getUser();
      if (!user) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      const { assetUiId } = req.params;
      const asset = await getAssetByUiId(assetUiId);
      if (!asset) {
        return res.status(400).json({ errors: { asset: 'notfound' } });
      }

      const existingEquipment = (await getEquipmentByUiId(asset._id, req.params.equipmentUiId));
      if (!existingEquipment) {
        return res.sendStatus(400);
      }

      return next();
    }

    private getTasks = async (req: express.Request, res: express.Response) => {
      const equipmentId = await this.getEquipmentId(req, res);

      const query = { equipmentId };
      const tasks = await Tasks.find(query);

      const jsonTasks: ITasks[] = await Promise.all(tasks.map((task) => task.exportToJSON()));

      return res.json({ tasks: jsonTasks });
    }

    private createTask = async (equipment: IEquipments, req: express.Request, res: express.Response) => {
      const { body: { task } } = req;

      const errors = this.checkTaskProperties(equipment, task);
      if (errors) {
        return res.status(422).json(errors);
      }

      const query = { name: task.name, equipmentId: equipment._id };
      const taskCounter = await Tasks.countDocuments(query);
      if (taskCounter > 0) {
        return res.status(422).json({
          errors: {
            name: 'alreadyexisting',
          },
        });
      }
      let newTask = new Tasks(task);
      newTask.equipmentId = equipment._id;

      newTask = await newTask.save();
      return res.json({ task: await newTask.exportToJSON() });
    }

    private changeOrCreateTask = async (req: express.Request, res: express.Response) => {
      const assetId = (await getAssetByUiId(req.params.assetUiId))._id;
      const equipment = await getEquipmentByUiId(assetId, req.params.equipmentUiId);

      let existingTask = (await getTaskByUiId(equipment._id, req.params.taskUiId));
      if (!existingTask) {
        return this.createTask(equipment, req, res);
      }
      const { body: { task } } = req;

      if (task.name) {
        const query = { name: task.name, equipmentId: equipment._id };
        const tasks = await Tasks.find(query);
        const taskWithSameNameIndex = tasks.findIndex((t) => t._uiId !== req.params.taskUiId);
        if (taskWithSameNameIndex !== -1) {
          return res.status(422).json({
            errors: {
              name: 'alreadyexisting',
            },
          });
        }
      }

      existingTask = Object.assign(existingTask, task);
      existingTask = await existingTask.save();
      return res.json({ task: await existingTask.exportToJSON() });
    }

    private deleteTask = async (req: express.Request, res: express.Response) => {
      const equipmentId = await this.getEquipmentId(req, res);
      const existingTask = await getTaskByUiId(equipmentId, req.params.taskUiId);

      if (!existingTask) {
        return res.sendStatus(400);
      }

      await existingTask.deleteOne();

      return res.json({ task: await existingTask.exportToJSON() });
    }

    private getEquipmentId = async (req: express.Request, res: express.Response): Promise<mongoose.Types.ObjectId> => {
      const assetId = (await getAssetByUiId(req.params.assetUiId))._id;
      const equipment = await getEquipmentByUiId(assetId, req.params.equipmentUiId);

      if (equipment) {
        return equipment._id;
      }
      throw res.status(400).json('inexistingequipment');
    }
}

export default TasksController;
