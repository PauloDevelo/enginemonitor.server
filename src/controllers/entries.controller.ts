import * as express from "express";
import mongoose from "mongoose";

import auth from "../security/auth";

import Entries, { getEntryByUiId, IEntries } from "../models/Entries";
import { getEquipmentByUiId, IEquipments } from "../models/Equipments";
import { getTaskByUiId } from "../models/Tasks";

import {getUser} from "../utils/requestContext";

import IController from "./IController";
import { ServerResponse } from "http";

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
        .post(this.path + "/:equipmentUiId/:taskUiId/:entryUiId",   auth.required, this.changeOrCreateEntry)
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
        try{
            const equipmentId = (await this.getEquipmentId(req, res));
            const taskId = (await this.getTaskId(equipmentId, req, res));

            const query = { equipmentId, taskId };
            const entries = await Entries.find(query);
            return res.json({ entries: await this.sortAndConvertToJson(entries) });
        }
        catch(err){
            this.handleCaughtError(req, res, err);
        }
    }

    private getAllEntries = async (req: express.Request, res: express.Response) => {
        try{
            const equipmentId = await this.getEquipmentId(req, res);

            const query = { equipmentId };
            const entries = await Entries.find(query);
            return res.json({ entries: await this.sortAndConvertToJson(entries) });
        }
        catch(err){
            this.handleCaughtError(req, res, err);
        }
    }

    private sortAndConvertToJson = async (entries: IEntries[]) => {
        entries.sort((entryA, entryB) => entryA.date.getTime() - entryB.date.getTime() );
        const jsonEntries = [];

        for (const entry of entries) {
            jsonEntries.push(await entry.toJSON());
        }

        return jsonEntries;
    }

    private createEntry = async (equipmentId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId, req: express.Request, res: express.Response) => {
        const { body: { entry } } = req;

        const errors = this.checkEntryProperties(entry);
        if (errors) {
            throw res.status(422).json(errors);
        }

        let newEntry = new Entries(entry);
        newEntry.equipmentId = equipmentId;
        newEntry.taskId = taskId;

        newEntry = await newEntry.save();
        return res.json({ entry: await newEntry.toJSON() });
    }

    private changeOrCreateEntry = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = (await this.getEquipmentId(req, res));
            const taskId = (await this.getTaskId(equipmentId, req, res));
            let existingEntry = await getEntryByUiId(equipmentId, req.params.entryUiId);

            if (existingEntry) {
                const { body: { entry } } = req;

                if ((!(existingEntry.taskId)  && taskId) ||
                    (existingEntry.taskId  && !taskId) ||
                    (existingEntry.taskId && existingEntry.taskId.toHexString() !== taskId.toHexString())) {
                    return res.sendStatus(401);
                }

                existingEntry = Object.assign(existingEntry, entry);

                existingEntry = await existingEntry.save();
                return res.json({ entry: await existingEntry.toJSON() });
            }
            else{
                return await this.createEntry(equipmentId, taskId, req, res);
            }
        } 
        catch (error) {
            this.handleCaughtError(req, res, error);
        }
    }

    private deleteEntry = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = await this.getEquipmentId(req, res);
            const taskId = await this.getTaskId(equipmentId, req, res);

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
        } 
        catch (error) {
            this.handleCaughtError(req, res, error);
        }
    }

    private getEquipmentId = async (req: express.Request, res: express.Response):Promise<mongoose.Types.ObjectId> =>{
        const equipment = await getEquipmentByUiId(req.params.equipmentUiId);

        if (equipment){
            return equipment._id;
        }
        else{
            throw res.status(400).json("inexistingequipment");
        }
    }

    private getTaskId = async (equipmentId: mongoose.Types.ObjectId, req: express.Request, res: express.Response):Promise<mongoose.Types.ObjectId | undefined> =>{
        if (req.params.taskUiId === "-")
        {
            return undefined;
        }

        const task = (await getTaskByUiId(equipmentId, req.params.taskUiId));
        if (task){
            return task._id;
            
        }

        throw res.status(400).json("inexistingtask");
    }

    private handleCaughtError = (req: express.Request, res: express.Response, err: any) => {
        if (err instanceof ServerResponse){
            return;
        }
        else{
            res.send(err);
        }
    }
}

export default EntriesController;
