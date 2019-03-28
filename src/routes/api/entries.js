const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Equipments = mongoose.model('Equipments');
const Tasks = mongoose.model('Tasks');
const Entries = mongoose.model('Entries');
const Users = mongoose.model('Users');

function checkEntryProperties(entry){
    let errors = {};

    if(!entry.name) {
        errors.name = 'isrequired';
    }

    if(!entry.date) {
        errors.date = 'isrequired';
    }

    if(entry.age === undefined) {
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

async function getEntries(req, res){
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    
    let query = { equipmentId: equipmentId, taskId: taskId };

    let entries = await Entries.find(query);
    let jsonEntries = [];
    for(let i = 0; i < entries.length; i++){
        jsonEntries.push(await entries[i].toJSON());
    }

    return res.json({ entries: jsonEntries });
}

async function createEntry(req, res){
    const equipmentId = new mongoose.Types.ObjectId(req.params.equipmentId);
    const taskId = new mongoose.Types.ObjectId(req.params.taskId);
    const { body: { entry } } = req;
    
    const errors = checkEntryProperties(entry);
    if(errors){
        return res.status(422).json(errors);
    }

    const newEntry = new Entries(entry);
    newEntry.equipmentId = equipmentId;
    newEntry.taskId = taskId;

    return newEntry.save(async (err, newEntry) => {
        if(err) res.send(err);

        res.json({ entry: await newEntry.toJSON() });
    });
}

async function changeEntry(req, res){
    const entryId = new mongoose.Types.ObjectId(req.params.entryId);
    const { body: { entry } } = req;

    let existingEntry = await Entries.findById(entryId);
    if(!existingEntry){
        return res.sendStatus(400);
    }

    if(existingEntry.equipmentId.toString() !== req.params.equipmentId || existingEntry.taskId.toString() !== req.params.taskId){
        return res.sendStatus(401);
    }

    return Object.assign(existingEntry, entry).save(async (err, existingEntry) => {
        if(err) res.send(err);
        res.json({ entry: await existingEntry.toJSON() });
    });
}

async function deleteEntry(req, res){
    const entryId = new mongoose.Types.ObjectId(req.params.entryId);
    
    let existingEntry = await Entries.findById(entryId);
    if(!existingEntry){
        return res.sendStatus(400);
    }

    if(existingEntry.equipmentId.toString() !== req.params.equipmentId || existingEntry.taskId.toString() !== req.params.taskId){
        return res.sendStatus(401);
    }

    return existingEntry.delete().then(async () => res.json({ entry: await existingEntry.toJSON() }));
}

module.exports = { checkAuth, createEntry, getEntries, changeEntry, deleteEntry };