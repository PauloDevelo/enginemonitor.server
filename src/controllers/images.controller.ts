import * as express from 'express';
import fs from 'fs';
import auth from '../security/auth';

import { getUserAssets } from '../models/AssetUser';
import Entries from '../models/Entries';
import Equipments from '../models/Equipments';
import Images, { deleteImage, getImageByUiId, getImagesByParentUiId } from '../models/Images';
import Tasks from '../models/Tasks';

import { getUser } from '../utils/requestContext';

import IController from './IController';

import wrapAsync from '../utils/expressHelpers';
import upload, { checkImageQuota } from '../utils/uploadMulter';

class ImagesController implements IController {
    private path: string = '/images';

    private router: express.Router = express.Router();

    private cpUpload = upload.fields([{ name: 'imageData', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);

    constructor() {
      this.initializeRoutes();
    }

    public getRouter() {
      return this.router;
    }

    private initializeRoutes() {
      this.router
        .use(`${this.path}/:parentUiId`, auth.required, wrapAsync(this.checkOwnershipFromParams), wrapAsync(this.checkCredentials))
        .get(`${this.path}/:parentUiId`, wrapAsync(this.getImages))
        .post(`${this.path}/:parentUiId`, wrapAsync(checkImageQuota), this.cpUpload, wrapAsync(this.checkImageDoesNotExistAlready), wrapAsync(this.addImage))
        .post(`${this.path}/:parentUiId/:imageUiId`, wrapAsync(this.checkParentBelongsImage), wrapAsync(this.updateImage))
        .delete(`${this.path}/:parentUiId/:imageUiId`, wrapAsync(this.deleteImage));
    }

    // eslint-disable-next-line no-unused-vars
    private checkImageProperties = async (image: any, res: express.Response, next: () => Promise<express.Response>, reject: (_errors: any) => express.Response): Promise<express.Response> => {
      const errors: any = {};

      if (!image._uiId) {
        errors._uiId = 'isrequired';
      }

      if (!image.name) {
        errors.name = 'isrequired';
      }

      if (!image.parentUiId) {
        errors.parentUiId = 'isrequired';
      }

      if (Object.keys(errors).length === 0) {
        return next();
      }

      return reject(errors);
    }

    private checkOwnershipFromParams = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void | express.Response> => {
      const user = getUser();
      if (user === null || user === undefined) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      if (await this.checkOwnership(req.params.parentUiId) === false) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      return next();
    }

    private checkImageDoesNotExistAlready = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void | express.Response> => {
      const { body: { _uiId, parentUiId } } = req;

      const existingImages = await Images.find({ _uiId, parentUiId });

      if (existingImages.length > 0) {
        return res.json({ image: await existingImages[0].exportToJSON() });
      }

      return next();
    }

    private checkCredentials = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      switch (req.method) {
        case 'GET':
          return next();
        case 'POST':
        case 'DELETE':
        default:
        {
          const user = getUser();

          if (user.forbidUploadingImage) {
            return res.status(400).json({ errors: 'credentialError' });
          }
          return next();
        }
      }
    }

    private checkParentBelongsImage = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void | express.Response> => {
      const existingImage = await getImageByUiId(req.params.imageUiId);
      if (!existingImage) {
        return res.status(400).json({ errors: { entity: 'notfound' } });
      }

      if (existingImage.parentUiId !== req.params.parentUiId) {
        return res.status(400).json({ errors: { operation: 'invalid' } });
      }

      return next();
    }

    private getImages = async (req: express.Request, res: express.Response) => {
      const images = await getImagesByParentUiId(req.params.parentUiId);

      const jsonImages: any[] = await Promise.all(images.map((image) => image.exportToJSON()));

      return res.json({ images: jsonImages });
    }

    private addImage = async (req: any, res: express.Response): Promise<express.Response> => {
      const { body: { _uiId, name, parentUiId } } = req;

      const newImage = new Images({
        _uiId,
        description: '',
        name,
        parentUiId,
        path: req.files.imageData[0].path,
        thumbnailPath: req.files.thumbnail[0].path,
        title: '',
      });

      return this.checkImageProperties(newImage, res,
        async () => {
          const result = await newImage.save();
          return res.json({ image: await result.exportToJSON() });
        },
        (errors) => {
          fs.unlinkSync(req.files.imageData[0].path);
          fs.unlinkSync(req.files.thumbnail[0].path);
          return res.status(422).json({ errors });
        });
    }

    private updateImage = async (req: express.Request, res: express.Response): Promise<express.Response> => {
      const { body: { image } } = req;

      let existingImage = await getImageByUiId(req.params.imageUiId);
      if (!existingImage) {
        return res.status(400).json({ errors: { entity: 'notfound' } });
      }

      existingImage = Object.assign(existingImage, image);
      existingImage = await existingImage.save();

      return res.json({ image: await existingImage.exportToJSON() });
    }

    private deleteImage = async (req: express.Request, res: express.Response): Promise<express.Response> => {
      const existingImage = await getImageByUiId(req.params.imageUiId);
      if (!existingImage) {
        return res.status(400).json({ errors: { entity: 'notfound' } });
      }

      const imageJson = await existingImage.exportToJSON();

      await deleteImage(existingImage);

      return res.json({ image: imageJson });
    }

    private checkOwnership = async (parentUiId: string): Promise<boolean> => {
      const assetsOwned = await getUserAssets();

      const query = { _uiId: parentUiId };

      const assetIds = (await Equipments.find(query)).map((equipment) => equipment.assetId);
      if (assetIds.length > 0) {
        return assetsOwned.findIndex((assetOwned) => assetIds.findIndex((assetId) => assetId.toString() === assetOwned._id.toString()) !== -1) !== -1;
      }

      const tasks = await Tasks.find(query);
      if (tasks.length > 0) {
        const task = tasks[0];
        const parentEquipment = await Equipments.findById(task.equipmentId);
        return assetsOwned.findIndex((assetOwned) => assetOwned._id.toString() === parentEquipment.assetId.toString()) !== -1;
      }

      const entries = await Entries.find(query);
      if (entries.length > 0) {
        const entry = entries[0];
        const parentEquipment = await Equipments.findById(entry.equipmentId);
        return assetsOwned.findIndex((assetOwned) => assetOwned._id.toString() === parentEquipment.assetId.toString()) !== -1;
      }

      return true;
    }
}

export default ImagesController;
