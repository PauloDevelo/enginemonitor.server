const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Boats = mongoose.model('Boats');
const Tasks = mongoose.model('Tasks');
const Users = mongoose.model('Users');

function checkTaskProperties(task){
    let errors = {};

    if(!task.name) {
        errors.name = 'is required';
    }

    if(!task.engineHours) {
        errors.engineHours = 'is required';
    }

    if(!task.month) {
        errors.month = 'is required';
    }

    if(!task.description) {
        errors.description = 'is required';
    }

    if(Object.keys(errors).length === 0){
        return undefined;
    }
    else{
        return { errors : errors };
    }
}

function checkAuth(req, res, next){
    const { payload: { id } } = req;
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);

    return Users.findById(id).then((user) => {
        if(!user) {
            return res.sendStatus(400);
        }

        Boats.findById(boatId).then((existingBoat) => {
            if(!existingBoat){
                return res.sendStatus(400);
            }

            if (existingBoat.ownerId.toString() !== req.payload.id){
                return res.sendStatus(401);
            }

            next();
        });
    });
}

function getTasks(req, res){
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);
    
    let query = { boatId: boatId };
    return Tasks.find(query).then((tasks) => {
        return res.json({ tasks: tasks });
    });
}

function createTask(req, res){
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);
    const { body: { task } } = req;
    
    const errors = checkTaskProperties(task);
    if(errors){
        return res.status(422).json(errors);
    }

    let query = { name: task.name, boatId: boatId };
    return Tasks.count(query).then((number) => {
        if(number > 0){
            return res.status(422).json({
                errors: {
                    name: 'alreadyexisting',
                },
            });
        }

        const newTask = new Tasks(task);
        newTask.boatId = boatId;

        return newTask.save((err, newTask) => {
            if(err) res.send(err);
            res.json({ task: newTask });
        });
    });
}

function changeTask(req, res){
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    const { body: { task } } = req;

    return Tasks.findById(taskId).then((existingTask) => {
        if(!existingTask){
            return res.sendStatus(400);
        }

        if(existingTask.boatId.toString() !== req.params.boatId){
            return res.sendStatus(401);
        }

        return Object.assign(existingTask, task).save((err, updatedTask) => {
            if(err) res.send(err);
            res.json({ task: updatedTask });
        });
    });
}

function deleteTask(req, res){
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    
    return Tasks.findById(taskId).then((existingTask) => {
        if(!existingTask){
            return res.sendStatus(400);
        }

        if(existingTask.boatId.toString() !== req.params.boatId){
            return res.sendStatus(401);
        }

        return existingTask.delete().then(() => res.json({ task: existingTask }));
    });
}

module.exports = { checkAuth, getTasks, createTask, changeTask, deleteTask };