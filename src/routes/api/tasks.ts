import express from "express";
import mongoose from "mongoose";
const router = express.Router();
import Equipments from "../../models/Equipments";
import Tasks from "../../models/Tasks";
import Users from "../../models/Users";
import auth from "../auth";

function checkTaskProperties(task: any) {
    const errors: any = {};

    if (!task.name) {
        errors.name = "isrequired";
    }

    if (task.usagePeriodInHour === undefined) {
        errors.usagePeriodInHour = "isrequired";
    }

    if (task.periodInMonth === undefined) {
        errors.periodInMonth = "isrequired";
    }

    if (!task.description) {
        errors.description = "isrequired";
    }

    if (Object.keys(errors).length === 0) {
        return undefined;
    } else {
        return { errors };
    }
}

async function checkAuth(req: any, res: any, next: any) {
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

async function getTasks(req: any, res: any) {
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);

    const query = { equipmentId };
    const tasks = await Tasks.find(query);

    const jsonTasks: any[] = [];
    for (const task of tasks) {
        jsonTasks.push(await task.toJSON());
    }

    return res.json({ tasks: jsonTasks });
}

async function createTask(req: any, res: any) {
    try {
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
        const { body: { task } } = req;

        const errors = checkTaskProperties(task);
        if (errors) {
            return res.status(422).json(errors);
        }

        const query = { name: task.name, equipmentId };
        const taskCounter = await Tasks.countDocuments(query);
        if (taskCounter > 0) {
            return res.status(422).json({
                errors: {
                    name: "alreadyexisting",
                },
            });
        } else {
            let newTask = new Tasks(task);
            newTask.equipmentId = equipmentId;

            newTask = await newTask.save();
            return res.json({ task: await newTask.toJSON() });
        }
    } catch (error) {
        res.send(error);
    }
}

async function changeTask(req: any, res: any) {
    try {
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
        const taskId = new mongoose.Types.ObjectId(req.params.taskId);
        const { body: { task } } = req;

        let existingTask = await Tasks.findById(taskId);
        if (!existingTask) {
            return res.sendStatus(400);
        }

        if (existingTask.equipmentId.toString() !== req.params.equipmentId) {
            return res.sendStatus(401);
        }

        if (task.name) {
            const query = { name: task.name, equipmentId };
            const tasks = await Tasks.find(query);
            const taskWithSameNameIndex = tasks.findIndex((t) => t._id.toString() !== req.params.taskId);
            if (taskWithSameNameIndex !== -1) {
                return res.status(422).json({
                    errors: {
                        name: "alreadyexisting",
                    },
                });
            }
        }

        existingTask = Object.assign(existingTask, task);
        existingTask = await existingTask.save();
        return res.json({ task: await existingTask.toJSON() });
    } catch (error) {
        res.send(error);
    }
}

async function deleteTask(req: any, res: any) {
    try {
        const taskId = new mongoose.Types.ObjectId(req.params.taskId);

        const existingTask = await Tasks.findById(taskId);
        if (!existingTask) {
            return res.sendStatus(400);
        }

        if (existingTask.equipmentId.toString() !== req.params.equipmentId) {
            return res.sendStatus(401);
        }

        await existingTask.remove();

        return res.json({ task: await existingTask.toJSON() });
    } catch (error) {
        res.send(error);
    }
}

export default { checkAuth, getTasks, createTask, changeTask, deleteTask };
