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

function checkAuth(req, res, authSucceed){
    const { payload: { id } } = req;

    return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.status(400).json({
            errors: {
              id: 'isinvalid',
            },
        });
      }

      return authSucceed();
    });
}

function getBoats(req, res){
    const userId = new mongoose.Types.ObjectId(req.payload.id);
    let query = { ownerId: userId };
    return Boats.find(query).then((boats) => {
        return res.json({ boats: boats });
    });
}

function addBoat(req, res){
    const { body: { boat } } = req;
    const userId = new mongoose.Types.ObjectId(req.payload.id);

    const errors = checkBoatProperties(boat);
    if(errors){
        return res.status(422).json(errors);
    }

    let query = { name: boat.name, ownerId: userId };
    return Boats.count(query).then((number) => {
        if(number > 0){
            return res.status(422).json({
                errors: {
                    name: 'alreadyexisting',
                },
            });
        }

        const newBoat = new Boats(boat);
        newBoat.ownerId = userId;

        return newBoat.save((err, newBoat) => {
            if(err) res.send(err);
            res.json({ boat: newBoat });
        });
    });
}

function changeBoat(req, res){
    const { body: { boat } } = req;

    return Boats.findById(req.params.boatId).then((existingBoat) => {
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
    });
}

function deleteBoat(req, res){
    return Boats.findById(req.params.boatId).then((existingBoat) => {
        if(!existingBoat){
            return res.sendStatus(400);
        }

        if(existingBoat.ownerId.toString() !== req.payload.id){
            return res.sendStatus(401);
        }

        return existingBoat.delete().then(() => res.json({ boat: existingBoat }));
    });
}

module.exports = { checkAuth, getBoats, addBoat, deleteBoat, changeBoat };