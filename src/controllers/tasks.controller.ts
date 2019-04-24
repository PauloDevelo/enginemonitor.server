import * as express from "express";
import auth from "../security/auth";

import mongoose from "mongoose";

import Equipments from "../models/Equipments";
import Tasks from "../models/Tasks";
import Users from "../models/Users";
import Entries from "../models/Entries";

import IController from "./IController";

class TasksController implements IController {
    private path: string = "/tasks";
    private router: express.Router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private intializeRoutes() {
        this.router.use(this.path + "/:equipmentId", auth.required, this.checkAuth)
        .get(this.path + "/:equipmentId",            auth.required, this.getTasks)
        .post(this.path + "/:equipmentId",           auth.required, this.createTask)
        .post(this.path + "/:equipmentId/:taskId",   auth.required, this.changeTask)
        .delete(this.path + "/:equipmentId/:taskId", auth.required, this.deleteTask);
    }

    private checkTaskProperties = (task: any) => {
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

    private checkAuth = async (req: express.Request, res: express.Response, next: any) => {
        const { payload: { id, verificationToken } } = req.body;
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);

        if (verificationToken === undefined) {
            return res.status(422).json({ errors: { authentication: "error" } });
        }

        if (id === undefined) {
            return res.status(422).json({ errors: { id: "isrequired" } });
        }

        const user = await Users.findById(id);
        if (!user) {
            return res.sendStatus(400);
        }

        if (user.verificationToken !== verificationToken) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        const existingEquipment = await Equipments.findById(equipmentId);
        if (!existingEquipment) {
            return res.sendStatus(400);
        }

        if (existingEquipment.ownerId.toString() !== id) {
            return res.sendStatus(401);
        }

        next();
    }

    private getTasks = async (req: express.Request, res: express.Response) => {
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);

        const query = { equipmentId };
        const tasks = await Tasks.find(query);

        const jsonTasks: any[] = [];
        for (const task of tasks) {
            jsonTasks.push(await task.toJSON());
        }

        return res.json({ tasks: jsonTasks });
    }

    private createTask = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
            const { body: { task } } = req;

            const errors = this.checkTaskProperties(task);
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

    private changeTask = async (req: express.Request, res: express.Response) => {
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

    private deleteTask = async (req: express.Request, res: express.Response) => {
        try {
            const taskId = new mongoose.Types.ObjectId(req.params.taskId);

            const existingTask = await Tasks.findById(taskId);
            if (!existingTask) {
                return res.sendStatus(400);
            }

            if (existingTask.equipmentId.toString() !== req.params.equipmentId) {
                return res.sendStatus(401);
            }

            const entriesReq = { taskId }
            await Entries.deleteMany(entriesReq);
            
            await existingTask.remove();

            return res.json({ task: await existingTask.toJSON() });
        } catch (error) {
            res.send(error);
        }
    }
}

export default TasksController;
