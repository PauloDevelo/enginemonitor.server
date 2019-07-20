import * as express from "express";
import mongoose from "mongoose";

import auth from "../security/auth";

import {getUser} from "../utils/requestContext";

import Entries from "../models/Entries";
import { getEquipmentByUiId } from "../models/Equipments";
import Tasks, { getTaskByUiId, ITasks } from "../models/Tasks";

import { ServerResponse } from "http";
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
        this.router.use(this.path + "/:equipmentUiId", auth.required, this.checkAuthAndOwnership)
        .get(this.path + "/:equipmentUiId",            auth.required, this.getTasks)
        .post(this.path + "/:equipmentUiId/:taskUiId",   auth.required, this.changeOrCreateTask)
        .delete(this.path + "/:equipmentUiId/:taskUiId", auth.required, this.deleteTask);
    }

    private checkTaskProperties = (task: ITasks) => {
        const errors: any = {};

        if (!task._uiId) {
            errors._uiId = "isrequired";
        }

        if (!task.name) {
            errors.name = "isrequired";
        }

        if (!task.usagePeriodInHour) {
            errors.usagePeriodInHour = "isrequired";
        }

        if (!task.periodInMonth) {
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

    private checkAuthAndOwnership = async (req: express.Request, res: express.Response, next: any) => {
        const user = getUser();

        if (!user) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        const existingEquipment = (await getEquipmentByUiId(req.params.equipmentUiId));
        if (!existingEquipment) {
            return res.sendStatus(400);
        }

        if (existingEquipment.ownerId.toString() !== user._id.toString()) {
            return res.sendStatus(401);
        }

        next();
    }

    private getTasks = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = await this.getEquipmentId(req, res);

            const query = { equipmentId };
            const tasks = await Tasks.find(query);

            const jsonTasks: any[] = [];
            for (const task of tasks) {
                jsonTasks.push(await task.toJSON());
            }

            return res.json({ tasks: jsonTasks });
        } catch (error) {
            this.handleCaughtError(req, res, error);
        }
    }

    private createTask = async (equipmentId: mongoose.Types.ObjectId, req: express.Request, res: express.Response) => {
        const { body: { task } } = req;

        const errors = this.checkTaskProperties(task);
        if (errors) {
            throw res.status(422).json(errors);
        }

        const query = { name: task.name, equipmentId };
        const taskCounter = await Tasks.countDocuments(query);
        if (taskCounter > 0) {
            throw res.status(422).json({
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
    }

    private changeOrCreateTask = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = await this.getEquipmentId(req, res);

            let existingTask = (await getTaskByUiId(equipmentId, req.params.taskUiId));
            if (!existingTask) {
                return await this.createTask(equipmentId, req, res);
            } else {
                const { body: { task } } = req;

                if (task.name) {
                    const query = { name: task.name, equipmentId };
                    const tasks = await Tasks.find(query);
                    const taskWithSameNameIndex = tasks.findIndex((t) => t._uiId !== req.params.taskUiId);
                    if (taskWithSameNameIndex !== -1) {
                        throw res.status(422).json({
                            errors: {
                                name: "alreadyexisting",
                            },
                        });
                    }
                }

                existingTask = Object.assign(existingTask, task);
                existingTask = await existingTask.save();
                return res.json({ task: await existingTask.toJSON() });
            }
        } catch (error) {
            this.handleCaughtError(req, res, error);
        }
    }

    private deleteTask = async (req: express.Request, res: express.Response) => {
        try {
            const equipmentId = await this.getEquipmentId(req, res);
            const existingTask = await getTaskByUiId(equipmentId, req.params.taskUiId);

            if (!existingTask) {
                throw res.sendStatus(400);
            }

            const entriesReq = { taskId: existingTask._id };
            await Entries.deleteMany(entriesReq);

            await existingTask.remove();

            return res.json({ task: await existingTask.toJSON() });
        } catch (error) {
            this.handleCaughtError(req, res, error);
        }
    }

    private getEquipmentId = async (req: express.Request, res: express.Response): Promise<mongoose.Types.ObjectId> => {
        const equipment = await getEquipmentByUiId(req.params.equipmentUiId);

        if (equipment) {
            return equipment._id;
        } else {
            throw res.status(400).json("inexistingequipment");
        }
    }

    private handleCaughtError = (req: express.Request, res: express.Response, err: any) => {
        if (err instanceof ServerResponse) {
            return;
        } else {
            res.send(err);
        }
    }
}

export default TasksController;
