const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Boats = mongoose.model('Boats');
const Tasks = mongoose.model('Tasks');
const Entries = mongoose.model('Entries');
const Users = mongoose.model('Users');

function checkEntryProperties(entry){
    let errors = {};

    if(!entry.name) {
        errors.name = 'isrequired';
    }

    if(!entry.UTCDate) {
        errors.UTCDate = 'isrequired';
    }

    if(!entry.age) {
        errors.age = 'isrequired';
    }

    if(!entry.remarks) {
        errors.remarks = 'isrequired';
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

    return Users.findById(id)
    .then((user) => {
        if(!user) {
            return res.sendStatus(400);
        }

        return Boats.findById(boatId).then((existingBoat) => {
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

function getEntries(req, res){
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    
    let query = { boatId: boatId, taskId: taskId };
    return Entries.find(query).then((entries) => {
        return res.json({ entries: entries });
    });
}

function createEntry(req, res){
    const boatId = new mongoose.Types.ObjectId(req.params.boatId);
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    const { body: { entry } } = req;
    
    const errors = checkEntryProperties(entry);
    if(errors){
        return res.status(422).json(errors);
    }

    let query = { name: entry.name, boatId: boatId, taskId: taskId };
    return Entries.count(query).then((number) => {
        if(number > 0){
            return res.status(422).json({
                errors: {
                    name: 'alreadyexisting',
                },
            });
        }

        const newEntry = new Entries(entry);
        newEntry.boatId = boatId;
        newEntry.taskId = taskId;

        return newEntry.save((err, newEntry) =>{
            if(err) res.send(err);
            res.json({ entry: newEntry });
        });
    });
}

function changeEntry(req, res){
    const entryId = new mongoose.Types.ObjectId(req.params.entryId);
    const { body: { entry } } = req;

    return Entries.findById(entryId).then((existingEntry) => {
        if(!existingEntry){
            return res.sendStatus(400);
        }

        if(existingEntry.boatId.toString() !== req.params.boatId || existingEntry.taskId.toString() !== req.params.taskId){
            return res.sendStatus(401);
        }

        return Object.assign(existingEntry, entry).save((err, existingEntry) => {
            if(err) res.send(err);
            res.json({ entry: existingEntry });
        });
    });
}

function deleteEntry(req, res){
    const entryId = new mongoose.Types.ObjectId(req.params.entryId);
    
    return Entries.findById(entryId).then((existingEntry) => {
        if(!existingEntry){
            return res.sendStatus(400);
        }

        if(existingEntry.boatId.toString() !== req.params.boatId || existingEntry.taskId.toString() !== req.params.taskId){
            return res.sendStatus(401);
        }

        return existingEntry.delete().then(() => res.json({ entry: existingEntry }));
    });
}

module.exports = { checkAuth, createEntry, getEntries, changeEntry, deleteEntry };