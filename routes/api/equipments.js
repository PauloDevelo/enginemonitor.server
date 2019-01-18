const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Equipments = mongoose.model('Equipments');
const Users = mongoose.model('Users');

function checkEquipmentProperties(equipment){
    let errors = {};

    if(!equipment.name) {
        errors.name = 'is required';
    }

    if(!equipment.brand) {
        errors.brand = 'is required';
    }

    if(!equipment.model) {
        errors.model = 'is required';
    }

    if(!equipment.age) {
        errors.age = 'is required';
    }

    if(!equipment.installation) {
        errors.installation = 'is required';
    }

    if(Object.keys(errors).length === 0){
        return undefined;
    }
    else{
        return { errors : errors };
    }
}

async function checkAuth(req, res, authSucceed){
    const { payload: { id } } = req;

    let user = await Users.findById(id);
    if(!user) {
        return res.status(400).json({ errors: { id: 'isinvalid' } });
    }

    return authSucceed();
}

async function getEquipments(req, res){
    const userId = new mongoose.Types.ObjectId(req.payload.id);

    let query = { ownerId: userId };
    let equipments = await Equipments.find(query);

    return res.json({ equipments: equipments });
}

async function addEquipment(req, res){
    const { body: { equipment } } = req;
    const userId = new mongoose.Types.ObjectId(req.payload.id);

    const errors = checkEquipmentProperties(equipment);
    if(errors){
        return res.status(422).json(errors);
    }

    let query = { name: equipment.name, ownerId: userId };
    let number = await Equipments.count(query);
    if(number > 0){
        return res.status(422).json({ errors: { name: 'alreadyexisting' } });
    }

    const newEquipment = new Equipments(equipment);
    newEquipment.ownerId = userId;

    return newEquipment.save((err, newEquipment) => {
        if(err){
            res.send(err);
        }
        else{
            res.json({ equipment: newEquipment });
        }      
    });
}

async function changeEquipment(req, res){
    const { body: { equipment } } = req;

    let existingEquipment = await Equipments.findById(req.params.equipmentId);
    if(!existingEquipment){
        return res.sendStatus(400);
    }

    if(existingEquipment.ownerId.toString() !== req.payload.id){
        return res.sendStatus(401);
    }

    return Object.assign(existingEquipment, equipment).save((err, existingEquipment) => {
        if(err) res.send(err);
        res.json({ equipment: existingEquipment });
    });
}

async function deleteEquipment(req, res){
    let existingEquipment = await Equipments.findById(req.params.equipmentId);
    if(!existingEquipment){
        return res.sendStatus(400);
    }

    if(existingEquipment.ownerId.toString() !== req.payload.id){
        return res.sendStatus(401);
    }

    return existingEquipment.delete().then(() => res.json({ equipment: existingEquipment }));
}

module.exports = { checkAuth, getEquipments, addEquipment, deleteEquipment, changeEquipment };