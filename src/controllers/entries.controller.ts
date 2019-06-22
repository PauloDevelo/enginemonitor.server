import * as express from "express";
import auth from "../security/auth";

import Entries, { getEntryByUiId, IEntries } from "../models/Entries";
import { getEquipmentByUiId } from "../models/Equipments";
import { getTaskByUiId } from "../models/Tasks";

import {getUser} from "../utils/requestContext";

import IController from "./IController";

class EntriesController implements IController {
    private path: string = "/entries";
    private router: express.Router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private intializeRoutes() {
        this.router.use(this.path + "/:equipmentUiId", auth.required, this.checkAuthAndOwnership)
        .get(this.path + "/:equipmentUiId", auth.required, this.getAllEntries)
        .get(this.path + "/:equipmentUiId/:taskUiId",             auth.required, this.getEntries)
        .post(this.path + "/:equipmentUiId/:taskUiId",            auth.required, this.createEntry)
        .post(this.path + "/:equipmentUiId/:taskUiId/:entryUiId",   auth.required, this.changeEntry)
        .delete(this.path + "/:equipmentUiId/:taskUiId/:entryUiId", auth.required, this.deleteEntry);
    }

    private checkEntryProperties = (entry: IEntries) => {
        const errors: any = {};

        if (!entry._uiId) {
            errors._uiId = "isrequired";
        }

        if (!entry.name) {
            errors.name = "isrequired";
        }

        if (!entry.date) {
            errors.date = "isrequired";
        }

        if (entry.age === undefined) {
            errors.age = "isrequired";
        }

        if (!entry.remarks) {
            errors.remarks = "isrequired";
        }

        if (Object.keys(errors).length === 0) {
            return undefined;
        } else {
            return { errors };
        }
    }

    private checkAuthAndOwnership = async (req: express.Request, res: express.Response, next: any) => {
        const user = getUser();

        if (!user) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        const existingEquipment = await getEquipmentByUiId(req.params.equipmentUiId);
        if (!existingEquipment) {
            return res.sendStatus(400);
        }

        if (existingEquipment.ownerId.toString() !== user._id.toString()) {
            return res.sendStatus(401);
        }

        next();
    }

    private getEntries = async (req: express.Request, res: express.Response) => {
        const equipmentId = (await getEquipmentByUiId(req.params.equipmentUiId))._id;
        const taskId = (await getTaskByUiId(equipmentId, req.params.taskUiId))._id;

        const query = { equipmentId, taskId };

        const entries = await Entries.find(query);

        return res.json({ entries: await this.sortAndConvertToJson(entries) });
    }

    private getAllEntries = async (req: express.Request, res: express.Response) => {
        const equipment = await getEquipmentByUiId(req.params.equipmentUiId);

        const query = { equipmentId: equipment._id };

        const entries = await Entries.find(query);

        return res.json({ entries: await this.sortAndConvertToJson(entries) });
    }

    private sortAndConvertToJson = async (entries: IEntries[]) => {
        entries.sort((entryA, entryB) => entryA.date.getTime() - entryB.date.getTime() );
        const jsonEntries = [];

        for (const entry of entries) {
            jsonEntries.push(await entry.toJSON());
        }

        return jsonEntries;
    }

    private createEntry = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = (await getEquipmentByUiId(req.params.equipmentUiId))._id;
            const taskUiId = req.params.taskUiId;
            const taskId = taskUiId !== "-" ? (await getTaskByUiId(equipmentId, taskUiId))._id : undefined;
            const { body: { entry } } = req;

            const errors = this.checkEntryProperties(entry);
            if (errors) {
                return res.status(422).json(errors);
            }

            let newEntry = new Entries(entry);
            newEntry.equipmentId = equipmentId;
            newEntry.taskId = taskId;

            newEntry = await newEntry.save();
            return res.json({ entry: await newEntry.toJSON() });
        } catch (err) {
            res.send(err);
        }
    }

    private changeEntry = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = (await getEquipmentByUiId(req.params.equipmentUiId))._id;
            const task = req.params.taskUiId === "-" ?
                undefined :
                (await getTaskByUiId(equipmentId, req.params.taskUiId));
            const taskId = task ? task._id : undefined;

            let existingEntry = await getEntryByUiId(equipmentId, req.params.entryUiId);

            if (!existingEntry) {
                return res.sendStatus(400);
            }

            const { body: { entry } } = req;

            if ((!(existingEntry.taskId)  && taskId) ||
                (existingEntry.taskId  && !taskId) ||
                (existingEntry.taskId && existingEntry.taskId.toHexString() !== taskId.toHexString())) {
                return res.sendStatus(401);
            }

            existingEntry = Object.assign(existingEntry, entry);

            existingEntry = await existingEntry.save();
            return res.json({ entry: await existingEntry.toJSON() });
        } catch (error) {
            res.send(error);
        }
    }

    private deleteEntry = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = (await getEquipmentByUiId(req.params.equipmentUiId))._id;
            const task = req.params.taskUiId === "-" ?
                undefined :
                (await getTaskByUiId(equipmentId, req.params.taskUiId));
            const taskId = task ? task._id : undefined;

            const existingEntry = await getEntryByUiId(equipmentId, req.params.entryUiId);

            if (!existingEntry) {
                return res.sendStatus(400);
            }

            if ((!(existingEntry.taskId)  && taskId) ||
                (existingEntry.taskId  && !taskId) ||
                (existingEntry.taskId && existingEntry.taskId.toHexString() !== taskId.toHexString())) {
                return res.sendStatus(401);
            }

            await existingEntry.remove();
            return res.json({ entry: await existingEntry.toJSON() });
        } catch (error) {
            res.send(error);
        }
    }
}

export default EntriesController;
