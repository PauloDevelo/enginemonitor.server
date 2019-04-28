import * as express from "express";
import auth from "../security/auth";

import mongoose from "mongoose";

import Entries from "../models/Entries";
import Equipments, { AgeAcquisitionType } from "../models/Equipments";
import Tasks from "../models/Tasks";
import Users from "../models/Users";

import IController from "./IController";

class EquipmentsController implements IController {
    private path: string = "/equipments";
    private router: express.Router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private intializeRoutes() {
        this.router.use(this.path,              auth.required, this.checkAuth)
        .get(   this.path,                      auth.required, this.getEquipments)
        .post(  this.path,                      auth.required, this.addEquipment)
        .post(  this.path + "/:equipmentId",    auth.required, this.changeEquipment)
        .delete(this.path + "/:equipmentId",    auth.required, this.deleteEquipment);
    }

    private checkEquipmentProperties = (equipment: any) => {
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

        if (equipment.ageAcquisitionType === undefined) {
            errors.ageAcquisitionType = "isrequired";
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

    private checkAuth = async (req: express.Request, res: express.Response, authSucceed: any) => {
        const { payload: { id, verificationToken } } = req.body;

        if (verificationToken === undefined) {
            return res.status(422).json({ errors: { authentication: "error" } });
        }

        if (id === undefined) {
            return res.status(422).json({ errors: { id: "isrequired" } });
        }

        const user = await Users.findById(id);
        if (!user) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        if (user.verificationToken !== verificationToken) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        return authSucceed();
    }

    private getEquipments = async (req: express.Request, res: express.Response) => {
        const {payload: { id }} = req.body;
        const userId = new mongoose.Types.ObjectId(id);

        const query = { ownerId: userId };
        const equipments = await Equipments.find(query);

        return res.json({ equipments });
    }

    private addEquipment = async (req: express.Request, res: express.Response) => {
        try {
            const { body: { equipment, payload: { id } } } = req;
            const userId = new mongoose.Types.ObjectId(id);

            const errors = this.checkEquipmentProperties(equipment);
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

    private changeEquipment = async (req: express.Request, res: express.Response) => {
        try {
            const { body: { equipment, payload: { id } } } = req;

            let existingEquipment = await Equipments.findById(req.params.equipmentId);
            if (!existingEquipment) {
                return res.sendStatus(400);
            }

            if (existingEquipment.ownerId.toString() !== id) {
                return res.sendStatus(401);
            }

            existingEquipment = Object.assign(existingEquipment, equipment);
            existingEquipment = await existingEquipment.save();

            return res.json({ equipment: existingEquipment });
        } catch (err) {
            res.send(err);
        }
    }

    private deleteEquipment = async (req: express.Request, res: express.Response) => {
        try {
            const { payload: { id } } = req.body;
            const existingEquipment = await Equipments.findById(req.params.equipmentId);
            if (!existingEquipment) {
                return res.sendStatus(400);
            }

            if (existingEquipment.ownerId.toString() !== id) {
                return res.sendStatus(401);
            }

            await Entries.deleteMany({ equipmentId: req.params.equipmentId});
            await Tasks.deleteMany({ equipmentId: req.params.equipmentId});

            await existingEquipment.remove();
            return res.json({ equipment: existingEquipment });
        } catch (err) {
            res.send(err);
        }
    }
}

export default EquipmentsController;
