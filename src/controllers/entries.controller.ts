import * as express from 'express';
import mongoose from 'mongoose';

import auth from '../security/auth';

import { getAssetByUiId } from '../models/Assets';
import Entries, { getEntryByUiId, IEntries } from '../models/Entries';
import { getEquipmentByUiId } from '../models/Equipments';
import { getTaskByUiId } from '../models/Tasks';

import wrapAsync from '../utils/expressHelpers';
import { getUser } from '../utils/requestContext';

import { checkCredentials } from './controller.helper';
import IController from './IController';

class EntriesController implements IController {
    private path: string = '/entries';

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
        .get(`${this.path}/:assetUiId/:equipmentUiId`, auth.required, wrapAsync(this.getAllEntries))
        .get(`${this.path}/:assetUiId/:equipmentUiId/:taskUiId`, auth.required, wrapAsync(this.getEntries))
        .post(`${this.path}/:assetUiId/:equipmentUiId/:taskUiId/:entryUiId`, auth.required, wrapAsync(this.changeOrCreateEntry))
        .delete(`${this.path}/:assetUiId/:equipmentUiId/:taskUiId/:entryUiId`, auth.required, wrapAsync(this.deleteEntry));
    }

    private checkEntryProperties = (entry: IEntries) => {
      const errors: any = {};

      if (!entry._uiId) {
        errors._uiId = 'isrequired';
      }

      if (!entry.name) {
        errors.name = 'isrequired';
      }

      if (!entry.date) {
        errors.date = 'isrequired';
      }

      if (entry.age === undefined) {
        errors.age = 'isrequired';
      }

      if (!entry.remarks) {
        errors.remarks = 'isrequired';
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

      const asset = await getAssetByUiId(req.params.assetUiId);
      if (!asset) {
        return res.status(400).json({ errors: { asset: 'notfound' } });
      }

      const existingEquipment = await getEquipmentByUiId(asset._id, req.params.equipmentUiId);
      if (!existingEquipment) {
        return res.sendStatus(400);
      }

      return next();
    }

    private getEntries = async (req: express.Request, res: express.Response) => {
      const equipmentId = (await this.getEquipmentId(req, res));
      const taskId = (await this.getTaskId(equipmentId, req, res));

      const query = { equipmentId, taskId };
      const entries = await Entries.find(query);
      return res.json({ entries: await this.sortAndConvertToJson(entries) });
    }

    private getAllEntries = async (req: express.Request, res: express.Response) => {
      const equipmentId = await this.getEquipmentId(req, res);

      const query = { equipmentId };
      const entries = await Entries.find(query);
      return res.json({ entries: await this.sortAndConvertToJson(entries) });
    }

    private sortAndConvertToJson = async (entries: IEntries[]) => {
      entries.sort((entryA, entryB) => entryA.date.getTime() - entryB.date.getTime());
      return Promise.all(entries.map((entry) => entry.exportToJSON()));
    }

    private createEntry = async (equipmentId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId, req: express.Request, res: express.Response) => {
      const { body: { entry } } = req;

      if (entry.ack === undefined) {
        entry.ack = true;
      }

      const errors = this.checkEntryProperties(entry);
      if (errors) {
        return res.status(422).json(errors);
      }

      let newEntry = new Entries(entry);
      newEntry.equipmentId = equipmentId;
      newEntry.taskId = taskId;

      newEntry = await newEntry.save();
      return res.json({ entry: await newEntry.exportToJSON() });
    }

    private changeOrCreateEntry = async (req: express.Request, res: express.Response) => {
      const equipmentId = (await this.getEquipmentId(req, res));
      const taskId = (await this.getTaskId(equipmentId, req, res));
      let existingEntry = await getEntryByUiId(equipmentId, req.params.entryUiId);

      if (existingEntry) {
        const { body: { entry } } = req;

        if ((!(existingEntry.taskId) && taskId)
                || (existingEntry.taskId && taskId && existingEntry.taskId.toHexString() !== taskId.toHexString())) {
          return res.sendStatus(401);
        }

        existingEntry = Object.assign(existingEntry, entry);

        existingEntry = await existingEntry.save();
        return res.json({ entry: await existingEntry.exportToJSON() });
      }
      return this.createEntry(equipmentId, taskId, req, res);
    }

    private deleteEntry = async (req: express.Request, res: express.Response) => {
      const equipmentId = await this.getEquipmentId(req, res);
      const taskId = await this.getTaskId(equipmentId, req, res);

      const existingEntry = await getEntryByUiId(equipmentId, req.params.entryUiId);

      if (!existingEntry) {
        return res.status(400).json({ errors: { entity: 'notfound' } });
      }

      if ((!(existingEntry.taskId) && taskId)
            || (existingEntry.taskId && !taskId)
            || (existingEntry.taskId && taskId && existingEntry.taskId.toHexString() !== taskId.toHexString())) {
        return res.sendStatus(401);
      }

      await existingEntry.deleteOne();

      return res.json({ entry: await existingEntry.exportToJSON() });
    }

    private getEquipmentId = async (req: express.Request, res: express.Response): Promise<mongoose.Types.ObjectId> => {
      const assetId = (await getAssetByUiId(req.params.assetUiId))._id;
      const equipment = await getEquipmentByUiId(assetId, req.params.equipmentUiId);

      if (!equipment) {
        throw res.status(400).json('inexistingequipment');
      }

      return equipment._id;
    }

    private getTaskId = async (equipmentId: mongoose.Types.ObjectId, req: express.Request, res: express.Response): Promise<mongoose.Types.ObjectId | undefined> => {
      if (req.params.taskUiId === '-') {
        return undefined;
      }

      const task = (await getTaskByUiId(equipmentId, req.params.taskUiId));
      if (!task) {
        throw res.status(400).json('inexistingtask');
      }

      return task._id;
    }
}

export default EntriesController;
