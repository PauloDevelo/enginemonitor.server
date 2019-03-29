import express from "express";
import mongoose from "mongoose";
const router = express.Router();

import Entries, { IEntries } from "../../models/Entries";
import Equipments from "../../models/Equipments";
import Tasks from "../../models/Tasks";
import Users from "../../models/Users";
import auth from "../auth";

function checkEntryProperties(entry: IEntries) {
    const errors: any = {};

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

export async function checkAuth(req: any, res: any, next: any) {
    const { payload: { id } } = req;
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);

    const user = await Users.findById(id);
    if (!user) {
        return res.sendStatus(400);
    }

    const existingEquipment = await Equipments.findById(equipmentId);
    if (!existingEquipment) {
        return res.sendStatus(400);
    }

    if (existingEquipment.ownerId.toString() !== req.payload.id) {
        return res.sendStatus(401);
    }

    next();
}

export async function getEntries(req: any, res: any) {
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);

    const query = { equipmentId, taskId };

    const entries = await Entries.find(query);
    const jsonEntries = [];

    for (const entry of entries) {
        jsonEntries.push(await entry.toJSON());
    }

    return res.json({ entries: jsonEntries });
}

export async function createEntry(req: any, res: any) {
    try {
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
        const taskId = new mongoose.Types.ObjectId(req.params.taskId);
        const { body: { entry } } = req;

        const errors = checkEntryProperties(entry);
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

export async function changeEntry(req: any, res: any) {
    try {
        const entryId = new mongoose.Types.ObjectId(req.params.entryId);
        const { body: { entry } } = req;

        let existingEntry = await Entries.findById(entryId);
        if (!existingEntry) {
            return res.sendStatus(400);
        }

        if (existingEntry.equipmentId.toString() !== req.params.equipmentId ||
            existingEntry.taskId.toString() !== req.params.taskId) {
            return res.sendStatus(401);
        }

        existingEntry = Object.assign(existingEntry, entry);

        existingEntry = await existingEntry.save();
        res.json({ entry: await existingEntry.toJSON() });
    } catch (error) {
        res.send(error);
    }
}

export async function deleteEntry(req: any, res: any) {
    try {
        const entryId = new mongoose.Types.ObjectId(req.params.entryId);

        const existingEntry = await Entries.findById(entryId);
        if (!existingEntry) {
            return res.sendStatus(400);
        }

        if (existingEntry.equipmentId.toString() !== req.params.equipmentId ||
            existingEntry.taskId.toString() !== req.params.taskId) {
            return res.sendStatus(401);
        }

        await existingEntry.remove();
        return res.json({ entry: await existingEntry.toJSON() });
    } catch (error) {
        res.send(error);
    }
}

export default { checkAuth, createEntry, getEntries, changeEntry, deleteEntry };
