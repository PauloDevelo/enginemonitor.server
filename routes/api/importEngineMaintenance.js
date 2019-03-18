const mongoose = require('mongoose');
const {saveModel} = require('../../utils/mogoUtils');
const {asyncForEach} = require('../../utils/asyncUtils');
const router = require('express').Router();
const auth = require('../auth');

const axios = require('axios');

const Entries = mongoose.model('Entries');
const Tasks = mongoose.model('Tasks');
const Equipments = mongoose.model('Equipments');
const Users = mongoose.model('Users');

const port = 8080;
const baseUrl = '/engine-monitor/webapi/enginemaintenance/';

async function checkAuth(req, res, authSucceed){
    const { payload: { id } } = req;

    let user = await Users.findById(id);
    if(!user) {
        return res.status(400).json({ errors: { id: 'isinvalid' } });
    }

    return authSucceed();
}

async function getEngineInfo(ipAddress){
    const url = 'http://' + ipAddress + ':' + port.toString() + baseUrl + 'engineinfo';
    const response = await axios.get(url);
    return response.data;
}

async function getTasks(ipAddress){
    const url = 'http://' + ipAddress + ':' + port.toString() + baseUrl + 'tasks';
    const response = await axios.get(url);
    return response.data;
}

async function getEntries(ipAddress, task){
    const url = 'http://' + ipAddress + ':' + port.toString() + baseUrl + 'tasks/' + task.id + '/historic';
    const response = await axios.get(url);
    return response.data;
}

async function importMaintenanceHistory(req, res){
    try{
        const ipAddress = req.params.serverIpAddress;
        const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
        let existingEquipment = await Equipments.findById(req.params.equipmentId);
        if(!existingEquipment){
            return res.sendStatus(400);
        }

        if(existingEquipment.ownerId.toString() !== req.payload.id){
            return res.sendStatus(401);
        }

        const engineInfo = await getEngineInfo(ipAddress);

        existingEquipment.updateFromEngineMaintenanceApi(engineInfo);
        const newEquipment = await saveModel(existingEquipment);

        const tasks = await getTasks(ipAddress);
        const newTasks = await processTasks(tasks, ipAddress, equipmentId);

        res.json({ equipment: newEquipment, tasks: newTasks });
    }
    catch(error){
        res.send(error);
    }
}

const processTasks = async (taskArray, ipAddress, equipmentId) => {
    const newTasks = [];
    await asyncForEach(taskArray, async (task) => {
        let newTask = new Tasks();
        newTask.updateFromEngineMaintenanceApi(task);
        newTask.equipmentId = equipmentId;

        newTask = await saveModel(newTask);

        const entries = await getEntries(ipAddress, task);
        processEntries(entries, equipmentId, newTask._id);

        newTasks.push(newTask);
    });

    return newTasks;
}

const processEntries = async (entryArray, equipmentId, taskId) => {
    await asyncForEach(entryArray, async (entry) => {
        let newEntry = new Entries();
        newEntry.updateFromEngineMaintenanceApi(entry);
        newEntry.equipmentId = equipmentId;
        newEntry.taskId = taskId;

        newEntry = await saveModel(newEntry);
    });
}

module.exports = { checkAuth, importMaintenanceHistory };