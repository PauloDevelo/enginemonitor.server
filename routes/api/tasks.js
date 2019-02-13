const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Equipments = mongoose.model('Equipments');
const Tasks = mongoose.model('Tasks');
const Users = mongoose.model('Users');

function checkTaskProperties(task){
    let errors = {};

    if(!task.name) {
        errors.name = 'isrequired';
    }

    if(!task.usagePeriodInHour) {
        errors.usagePeriodInHour = 'isrequired';
    }

    if(!task.periodInMonth) {
        errors.periodInMonth = 'isrequired';
    }

    if(!task.description) {
        errors.description = 'isrequired';
    }

    if(Object.keys(errors).length === 0){
        return undefined;
    }
    else{
        return { errors : errors };
    }
}

async function checkAuth(req, res, next){
    const { payload: { id } } = req;
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);

    let user = await Users.findById(id);
    if(!user) {
        return res.sendStatus(400);
    }

    let existingEquipment = await Equipments.findById(equipmentId);
    if(!existingEquipment){
        return res.sendStatus(400);
    }

    if (existingEquipment.ownerId.toString() !== req.payload.id){
        return res.sendStatus(401);
    }

    next();
}

async function getTasks(req, res){
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
    
    let query = { equipmentId: equipmentId };
    let tasks = await Tasks.find(query);

    let jsonTasks = [];
    for(let i = 0; i < tasks.length; i++){
        jsonTasks.push(await tasks[i].toJSON());
    }
    
    return res.json({ tasks: jsonTasks });
}

async function createTask(req, res){
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
    const { body: { task } } = req;
    
    const errors = checkTaskProperties(task);
    if(errors){
        return res.status(422).json(errors);
    }

    let query = { name: task.name, equipmentId: equipmentId };
    let number = await Tasks.count(query);
    if(number > 0){
        return res.status(422).json({
            errors: {
                name: 'alreadyexisting',
            },
        });
    }
    else{
        const newTask = new Tasks(task);
        newTask.equipmentId = equipmentId;

        return newTask.save(async (err, newTask) => {
            if(err){
                res.send(err);
            }
            else {
                res.json({ task: await newTask.toJSON() });
            }
        });
    }
}

async function changeTask(req, res){
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    const { body: { task } } = req;

    let existingTask = await Tasks.findById(taskId);
    if(!existingTask){
        return res.sendStatus(400);
    }

    if(existingTask.equipmentId.toString() !== req.params.equipmentId){
        return res.sendStatus(401);
    }
    
    if(task.name){
        const query = { name: task.name, equipmentId: equipmentId };
        const tasks = await Tasks.find(query);
        const alreadyExistingTaskWithSameNameIndex = tasks.findIndex(task => task._id !== taskId);
        if(alreadyExistingTaskWithSameNameIndex !== -1){
            return res.status(422).json({
                errors: {
                    name: 'alreadyexisting',
                },
            });
        }
    }
    
    return Object.assign(existingTask, task).save(async (err, updatedTask) => {
        if(err){
            res.send(err);
        }
        else{
            res.json({ task: await updatedTask.toJSON() });
        }
    });
}

async function deleteTask(req, res){
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    
    let existingTask = await Tasks.findById(taskId);
    if(!existingTask){
        return res.sendStatus(400);
    }

    if(existingTask.equipmentId.toString() !== req.params.equipmentId){
        return res.sendStatus(401);
    }

    return existingTask.delete().then(async () => res.json({ task: await existingTask.toJSON() }));
}

module.exports = { checkAuth, getTasks, createTask, changeTask, deleteTask };