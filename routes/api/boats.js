const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Boats = mongoose.model('Boats');
const Users = mongoose.model('Users');

function checkBoatProperties(boat){
    let errors = {};

    if(!boat.name) {
        errors.name = 'is required';
    }

    if(!boat.engineBrand) {
        errors.engineBrand = 'is required';
    }

    if(!boat.engineModel) {
        errors.engineModel = 'is required';
    }

    if(!boat.engineAge) {
        errors.engineAge = 'is required';
    }

    if(!boat.engineInstallation) {
        errors.engineInstallation = 'is required';
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

async function getBoats(req, res){
    const userId = new mongoose.Types.ObjectId(req.payload.id);

    let query = { ownerId: userId };
    let boats = await Boats.find(query);

    return res.json({ boats: boats });
}

async function addBoat(req, res){
    const { body: { boat } } = req;
    const userId = new mongoose.Types.ObjectId(req.payload.id);

    const errors = checkBoatProperties(boat);
    if(errors){
        return res.status(422).json(errors);
    }

    let query = { name: boat.name, ownerId: userId };
    let number = await Boats.count(query);
    if(number > 0){
        return res.status(422).json({ errors: { name: 'alreadyexisting' } });
    }

    const newBoat = new Boats(boat);
    newBoat.ownerId = userId;

    return newBoat.save((err, newBoat) => {
        if(err){
            res.send(err);
        }
        else{
            res.json({ boat: newBoat });
        }      
    });
}

async function changeBoat(req, res){
    const { body: { boat } } = req;

    let existingBoat = await Boats.findById(req.params.boatId);
    if(!existingBoat){
        return res.sendStatus(400);
    }

    if(existingBoat.ownerId.toString() !== req.payload.id){
        return res.sendStatus(401);
    }

    return Object.assign(existingBoat, boat).save((err, existingBoat) => {
        if(err) res.send(err);
        res.json({ boat: existingBoat });
    });
}

async function deleteBoat(req, res){
    let existingBoat = await Boats.findById(req.params.boatId);
    if(!existingBoat){
        return res.sendStatus(400);
    }

    if(existingBoat.ownerId.toString() !== req.payload.id){
        return res.sendStatus(401);
    }

    return existingBoat.delete().then(() => res.json({ boat: existingBoat }));
}

module.exports = { checkAuth, getBoats, addBoat, deleteBoat, changeBoat };