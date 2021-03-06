import * as express from 'express';
import auth from '../security/auth';

import { getAssetByUiId } from '../models/Assets';
import Equipments, { getEquipmentByUiId, IEquipments } from '../models/Equipments';

import wrapAsync from '../utils/expressHelpers';
import { getUser } from '../utils/requestContext';

import { checkCredentials } from './controller.helper';
import IController from './IController';

class EquipmentsController implements IController {
    private path: string = '/equipments';

    private router: express.Router = express.Router();

    constructor() {
      this.intializeRoutes();
    }

    public getRouter() {
      return this.router;
    }

    private intializeRoutes() {
      this.router
        .use(`${this.path}/:assetUiId`, auth.required, wrapAsync(this.checkAuth), wrapAsync(checkCredentials))
        .get(`${this.path}/:assetUiId`, auth.required, wrapAsync(this.getEquipments))
        .post(`${this.path}/:assetUiId/:equipmentUiId`, auth.required, wrapAsync(this.changeOrAddEquipment))
        .delete(`${this.path}/:assetUiId/:equipmentUiId`, auth.required, wrapAsync(this.deleteEquipment));
    }

    private checkEquipmentProperties = (equipment: IEquipments) => {
      const errors: any = {};

      if (!equipment._uiId) {
        errors._uiId = 'isrequired';
      }

      if (!equipment.name) {
        errors.name = 'isrequired';
      }

      if (!equipment.brand) {
        errors.brand = 'isrequired';
      }

      if (!equipment.model) {
        errors.model = 'isrequired';
      }

      if (equipment.ageAcquisitionType === undefined) {
        errors.ageAcquisitionType = 'isrequired';
      }

      if (!equipment.installation) {
        errors.installation = 'isrequired';
      }

      if (Object.keys(errors).length === 0) {
        return undefined;
      }
      return { errors };
    }

    private checkAuth = async (req: express.Request, res: express.Response, authSucceed: any) => {
      const user = getUser();
      if (!user) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      const asset = await getAssetByUiId(req.params.assetUiId);
      if (!asset) {
        return res.status(400).json({ errors: { asset: 'notfound' } });
      }

      return authSucceed();
    }

    private getEquipments = async (req: express.Request, res: express.Response) => {
      const asset = await getAssetByUiId(req.params.assetUiId);

      const query = { assetId: asset._id };
      const equipments = await Equipments.find(query);

      const jsonEquipments: any[] = await Promise.all(equipments.map((equipment) => equipment.exportToJSON()));

      return res.json({ equipments: jsonEquipments });
    }

    private addEquipment = async (req: express.Request, res: express.Response) => {
      const { body: { equipment } } = req;
      const assetId = (await getAssetByUiId(req.params.assetUiId))._id;

      const errors = this.checkEquipmentProperties(equipment);
      if (errors) {
        return res.status(422).json(errors);
      }

      const query = { name: equipment.name, assetId };
      const equipmentCounter = await Equipments.countDocuments(query);
      if (equipmentCounter > 0) {
        return res.status(422).json({ errors: { name: 'alreadyexisting' } });
      }

      let newEquipment = new Equipments(equipment);
      newEquipment.assetId = assetId;

      newEquipment = await newEquipment.save();
      return res.json({ equipment: await newEquipment.exportToJSON() });
    }

    private changeOrAddEquipment = async (req: express.Request, res: express.Response) => {
      const { body: { equipment } } = req;
      const assetId = (await getAssetByUiId(req.params.assetUiId))._id;

      let existingEquipment = await getEquipmentByUiId(assetId, req.params.equipmentUiId);
      if (!existingEquipment) {
        return this.addEquipment(req, res);
      }

      existingEquipment = Object.assign(existingEquipment, equipment);
      existingEquipment = await existingEquipment.save();

      return res.json({ equipment: await existingEquipment.exportToJSON() });
    }

    private deleteEquipment = async (req: express.Request, res: express.Response) => {
      const assetId = (await getAssetByUiId(req.params.assetUiId))._id;
      const existingEquipment = await getEquipmentByUiId(assetId, req.params.equipmentUiId);
      if (!existingEquipment) {
        return res.status(400).json({ errors: { entity: 'notfound' } });
      }

      await existingEquipment.deleteOne();

      return res.json({ equipment: await existingEquipment.exportToJSON() });
    }
}

export default EquipmentsController;
