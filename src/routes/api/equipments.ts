import express from "express";
import mongoose from "mongoose";
const router = express.Router();
import auth from "../auth";

import Equipments from "../../models/Equipments";
import Users from "../../models/Users";

function checkEquipmentProperties(equipment: any) {
    const errors: any = {};

    if (!equipment.name) {
        errors.name = "isrequired";
    }

    if (!equipment.brand) {
        errors.brand = "isrequired";
    }

    if (!equipment.model) {
        errors.model = "isrequired";
    }

    if (equipment.age === undefined) {
        errors.age = "isrequired";
    }

    if (!equipment.installation) {
        errors.installation = "isrequired";
    }

    if (Object.keys(errors).length === 0) {
        return undefined;
    } else {
        return { errors };
    }
}

async function checkAuth(req: any, res: any, authSucceed: any) {
    const { payload: { id } } = req;

    const user = await Users.findById(id);
    if (!user) {
        return res.status(400).json({ errors: { id: "isinvalid" } });
    }

    return authSucceed();
}

async function getEquipments(req: any, res: any) {
    const userId = new mongoose.Types.ObjectId(req.payload.id);

    const query = { ownerId: userId };
    const equipments = await Equipments.find(query);

    return res.json({ equipments });
}

async function addEquipment(req: any, res: any) {
    try {
        const { body: { equipment } } = req;
        const userId = new mongoose.Types.ObjectId(req.payload.id);

        const errors = checkEquipmentProperties(equipment);
        if (errors) {
            return res.status(422).json(errors);
        }

        const query = { name: equipment.name, ownerId: userId };
        const equipmentCounter = await Equipments.countDocuments(query);
        if (equipmentCounter > 0) {
            return res.status(422).json({ errors: { name: "alreadyexisting" } });
        }

        let newEquipment = new Equipments(equipment);
        newEquipment.ownerId = userId;

        newEquipment = await newEquipment.save();
        res.json({ equipment: newEquipment });
    } catch (err) {
        res.send(err);
    }
}

async function changeEquipment(req: any, res: any) {
    try {
        const { body: { equipment } } = req;

        let existingEquipment = await Equipments.findById(req.params.equipmentId);
        if (!existingEquipment) {
            return res.sendStatus(400);
        }

        if (existingEquipment.ownerId.toString() !== req.payload.id) {
            return res.sendStatus(401);
        }

        existingEquipment = Object.assign(existingEquipment, equipment);
        existingEquipment = await existingEquipment.save();

        return res.json({ equipment: existingEquipment });
    } catch (err) {
        res.send(err);
    }
}

async function deleteEquipment(req: any, res: any) {
    try {
        const existingEquipment = await Equipments.findById(req.params.equipmentId);
        if (!existingEquipment) {
            return res.sendStatus(400);
        }

        if (existingEquipment.ownerId.toString() !== req.payload.id) {
            return res.sendStatus(401);
        }

        await existingEquipment.remove();
        return res.json({ equipment: existingEquipment });
    } catch (err) {
        res.send(err);
    }
}

export default { checkAuth, getEquipments, addEquipment, deleteEquipment, changeEquipment };
