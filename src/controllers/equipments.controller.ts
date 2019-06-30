import * as express from "express";
import auth from "../security/auth";

import Entries from "../models/Entries";
import Equipments, { getEquipmentByUiId, IEquipments } from "../models/Equipments";
import Tasks from "../models/Tasks";

import {getUser} from "../utils/requestContext";

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
        .post(  this.path + "/:equipmentUiId",    auth.required, this.changeOrAddEquipment)
        .delete(this.path + "/:equipmentUiId",    auth.required, this.deleteEquipment);
    }

    private checkEquipmentProperties = (equipment: IEquipments) => {
        const errors: any = {};

        if (!equipment._uiId) {
            errors._uiId = "isrequired";
        }

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
        const user = getUser();
        if (!user) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        return authSucceed();
    }

    private getEquipments = async (req: express.Request, res: express.Response) => {
        const userId = getUser()._id;

        const query = { ownerId: userId };
        const equipments = await Equipments.find(query);

        const jsonEquipments: any[] = [];
        for (const equipment of equipments) {
            jsonEquipments.push(await equipment.toJSON());
        }

        return res.json({ equipments: jsonEquipments });
    }

    private addEquipment = async (req: express.Request, res: express.Response) => {
        try {
            const { body: { equipment } } = req;
            const userId = getUser()._id;

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
            res.json({ equipment: await newEquipment.toJSON() });
        } catch (err) {
            res.send(err);
        }
    }

    private changeOrAddEquipment = async (req: express.Request, res: express.Response) => {
        try {
            const { body: { equipment } } = req;

            let existingEquipment = await getEquipmentByUiId(req.params.equipmentUiId);
            if (!existingEquipment) {
                this.addEquipment(req, res);
                return;
            } else {
                existingEquipment = Object.assign(existingEquipment, equipment);
                existingEquipment = await existingEquipment.save();

                return res.json({ equipment: await existingEquipment.toJSON() });
            }
        } catch (err) {
            res.send(err);
        }
    }

    private deleteEquipment = async (req: express.Request, res: express.Response) => {
        try {
            const existingEquipment = await getEquipmentByUiId(req.params.equipmentUiId);
            if (!existingEquipment) {
                return res.sendStatus(400);
            }

            await Entries.deleteMany({ equipmentId: existingEquipment._id});
            await Tasks.deleteMany({ equipmentId: existingEquipment._id});

            await existingEquipment.remove();
            return res.json({ equipment: await existingEquipment.toJSON() });
        } catch (err) {
            res.send(err);
        }
    }
}

export default EquipmentsController;
