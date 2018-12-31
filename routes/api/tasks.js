const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Boats = mongoose.model('Boats');
const Tasks = mongoose.model('Tasks');
const Users = mongoose.model('Users');

function checkTaskProperties(task){
    let errors = {};

    if(!task.name) {
        errors.name = 'isrequired';
    }

    if(!task.engineHours) {
        errors.engineHours = 'isrequired';
    }

    if(!task.month) {
        errors.month = 'isrequired';
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
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);

    let user = await Users.findById(id);
    if(!user) {
        return res.sendStatus(400);
    }

    let existingBoat = await Boats.findById(boatId);
    if(!existingBoat){
        return res.sendStatus(400);
    }

    if (existingBoat.ownerId.toString() !== req.payload.id){
        return res.sendStatus(401);
    }

    next();
}

async function getTasks(req, res){
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);
    
    let query = { boatId: boatId };

    return res.json({ tasks: await Tasks.find(query) });
}

async function createTask(req, res){
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);
    const { body: { task } } = req;
    
    const errors = checkTaskProperties(task);
    if(errors){
        return res.status(422).json(errors);
    }

    let query = { name: task.name, boatId: boatId };
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
        newTask.boatId = boatId;

        return newTask.save((err, newTask) => {
            if(err) res.send(err);
            res.json({ task: newTask });
        });
    }
}

async function changeTask(req, res){
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    const { body: { task } } = req;

    let existingTask = await Tasks.findById(taskId);
    if(!existingTask){
        return res.sendStatus(400);
    }

    if(existingTask.boatId.toString() !== req.params.boatId){
        return res.sendStatus(401);
    }

    if(task.name){
        let query = { name: task.name, boatId: boatId };
        let number = await Tasks.count(query);
        if(number > 0){
            return res.status(422).json({
                errors: {
                    name: 'alreadyexisting',
                },
            });
        }

        return Object.assign(existingTask, task).save((err, updatedTask) => {
            if(err) res.send(err);
            res.json({ task: updatedTask });
        });
    }
    else{
        return Object.assign(existingTask, task).save((err, updatedTask) => {
            if(err) res.send(err);
            res.json({ task: updatedTask });
        });
    }
}

async function deleteTask(req, res){
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    
    let existingTask = await Tasks.findById(taskId);
    if(!existingTask){
        return res.sendStatus(400);
    }

    if(existingTask.boatId.toString() !== req.params.boatId){
        return res.sendStatus(401);
    }

    return existingTask.delete().then(() => res.json({ task: existingTask }));
}

module.exports = { checkAuth, getTasks, createTask, changeTask, deleteTask };