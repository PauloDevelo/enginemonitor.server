import express from "express";
import mongoose from "mongoose";
import {asyncForEach} from "../../utils/asyncUtils";
const router = express.Router();
import auth from "../auth";

import axios from "axios";

import Entries from "../../models/Entries";
import Equipments from "../../models/Equipments";
import Tasks, { ITasks } from "../../models/Tasks";
import Users from "../../models/Users";

const port = 8080;
const baseUrl = "/engine-monitor/webapi/enginemaintenance/";

async function checkAuth(req: any, res: any, authSucceed: any) {
    const { payload: { id } } = req;

    const user = await Users.findById(id);
    if (!user) {
        return res.status(400).json({ errors: { id: "isinvalid" } });
    }

    return authSucceed();
}

async function getEngineInfo(ipAddress: string) {
    const url = "http://" + ipAddress + ":" + port.toString() + baseUrl + "engineinfo";
    const response = await axios.get(url);
    return response.data;
}

async function getTasks(ipAddress: string) {
    const url = "http://" + ipAddress + ":" + port.toString() + baseUrl + "tasks";
    const response = await axios.get(url);
    return response.data;
}

async function getEntries(ipAddress: string, task: any) {
    const url = "http://" + ipAddress + ":" + port.toString() + baseUrl + "tasks/" + task.id + "/historic";
    const response = await axios.get(url);
    return response.data;
}

async function importMaintenanceHistory(req: any, res: any) {
    try {
        const ipAddress = req.params.serverIpAddress;
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
        const existingEquipment = await Equipments.findById(equipmentId);
        if (!existingEquipment) {
            return res.sendStatus(400);
        }

        if (existingEquipment.ownerId.toString() !== req.payload.id) {
            return res.sendStatus(401);
        }

        const engineInfo = await getEngineInfo(ipAddress);

        existingEquipment.updateFromEngineMaintenanceApi(engineInfo);
        const newEquipment = await existingEquipment.save();

        const tasks = await getTasks(ipAddress);
        const newTasks = await processTasks(tasks, ipAddress, equipmentId);

        res.json({ equipment: newEquipment, tasks: newTasks });
    } catch (error) {
        res.send(error);
    }
}

const processTasks = async (taskArray: any[], ipAddress: string, equipmentId: mongoose.Types.ObjectId) => {
    const newTasks: ITasks[] = [];
    await asyncForEach(taskArray, async (task: any) => {
        let newTask = new Tasks();
        newTask.updateFromEngineMaintenanceApi(task);
        newTask.equipmentId = equipmentId;

        newTask = await newTask.save();

        const entries = await getEntries(ipAddress, task);
        processEntries(entries, equipmentId, newTask._id);

        newTasks.push(newTask);
    });

    return newTasks;
};

 // tslint:disable-next-line:max-line-length
const processEntries = async (entryArray: any[], equipmentId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId) => {
    await asyncForEach(entryArray, async (entry: any) => {
        let newEntry = new Entries();
        newEntry.updateFromEngineMaintenanceApi(entry);
        newEntry.equipmentId = equipmentId;
        newEntry.taskId = taskId;

        newEntry = await newEntry.save();
    });
};

export default { checkAuth, importMaintenanceHistory };
