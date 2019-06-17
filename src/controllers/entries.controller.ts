import * as express from "express";
import auth from "../security/auth";

import mongoose from "mongoose";

import Entries, { IEntries } from "../models/Entries";
import Equipments from "../models/Equipments";
import Users from "../models/Users";

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
        this.router.use(this.path + "/:equipmentId",          auth.required, this.checkAuth)
        .get(this.path + "/:equipmentId",                     auth.required, this.getAllEntries)
        .get(this.path + "/:equipmentId/:taskId",             auth.required, this.getEntries)
        .post(this.path + "/:equipmentId/:taskId",            auth.required, this.createEntry)
        .post(this.path + "/:equipmentId/:taskId/:entryId",   auth.required, this.changeEntry)
        .delete(this.path + "/:equipmentId/:taskId/:entryId", auth.required, this.deleteEntry);
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

    private checkAuth = async (req: express.Request, res: express.Response, next: any) => {
        const { payload: { id, verificationToken } } = req.body;

        if (verificationToken === undefined) {
            return res.status(422).json({ errors: { authentication: "error" } });
        }

        if (id === undefined) {
            return res.status(422).json({ errors: { id: "isrequired" } });
        }

        const user = await Users.findById(id);
        if (!user) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        if (user.verificationToken !== verificationToken) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
        const existingEquipment = await Equipments.findById(equipmentId);
        if (!existingEquipment) {
            return res.sendStatus(400);
        }

        if (existingEquipment.ownerId.toString() !== id) {
            return res.sendStatus(401);
        }

        next();
    }

    private getEntries = async (req: express.Request, res: express.Response) => {
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
        const taskId = new mongoose.Types.ObjectId(req.params.taskId);

        const query = { equipmentId, taskId };

        const entries = await Entries.find(query);

        return res.json({ entries: await this.sortAndConvertToJson(entries) });
    }

    private getAllEntries = async (req: express.Request, res: express.Response) => {
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);

        const query = { equipmentId };

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
            const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
            const taskId = req.params.taskId ! !== "-" ? new mongoose.Types.ObjectId(req.params.taskId) : undefined;
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
            const entryId = new mongoose.Types.ObjectId(req.params.entryId);
            const { body: { entry } } = req;

            let existingEntry = await Entries.findById(entryId);
            if (!existingEntry) {
                return res.sendStatus(400);
            }

            if (existingEntry.equipmentId.toString() !== req.params.equipmentId ||
                (req.params.taskId !== "-" && existingEntry.taskId.toString() !== req.params.taskId)) {
                return res.sendStatus(401);
            }

            existingEntry = Object.assign(existingEntry, entry);

            existingEntry = await existingEntry.save();
            res.json({ entry: await existingEntry.toJSON() });
        } catch (error) {
            res.send(error);
        }
    }

    private deleteEntry = async (req: express.Request, res: express.Response) => {
        try {
            const entryId = new mongoose.Types.ObjectId(req.params.entryId);

            const existingEntry = await Entries.findById(entryId);
            if (!existingEntry) {
                return res.sendStatus(400);
            }

            if (existingEntry.equipmentId.toString() !== req.params.equipmentId ||
                (req.params.taskId !== "-" && existingEntry.taskId.toString() !== req.params.taskId)) {
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
