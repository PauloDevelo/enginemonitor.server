/* eslint-disable no-unused-vars */
import * as express from 'express';
import sendEmailHelper from '../utils/sendEmailHelper';
import PendingRegistrations from '../models/PendingRegistrations';
import auth from '../security/auth';

import Assets, { deleteAssetModel, getAssetByUiId, IAssets } from '../models/Assets';
import AssetUser, { createUserAssetLink, getUserAssets } from '../models/AssetUser';
import Equipments from '../models/Equipments';
import Users, { IUser } from '../models/Users';

import wrapAsync from '../utils/expressHelpers';
import { getUser } from '../utils/requestContext';

import { checkCredentials } from './controller.helper';
import IController from './IController';

class AssetsController implements IController {
    private path: string = '/assets';

    private router: express.Router = express.Router();

    constructor() {
      this.intializeRoutes();
    }

    public getRouter() {
      return this.router;
    }

    private intializeRoutes() {
      this.router
        .use(this.path, auth.required, wrapAsync(this.checkAuth))
        .get(this.path, auth.required, wrapAsync(this.getAssets))
        .post(`${this.path}/changeownership/:assetUiId`, auth.required, wrapAsync(this.changeOwnership))
        .post(`${this.path}/:assetUiId`, auth.required, wrapAsync(this.changeOrAddAsset))
        .delete(`${this.path}/:assetUiId`, auth.required, wrapAsync(this.checkDeleteCredentials), wrapAsync(this.deleteAsset));
    }

    // eslint-disable-next-line max-len
    private checkAssetProperties = (next: (req: express.Request, res: express.Response) => void) => (req: express.Request, res: express.Response) => {
      const { body: { asset } } = req;

      const errors: any = {};

      if (!asset._uiId) {
        errors._uiId = 'isrequired';
      }

      if (!asset.name) {
        errors.name = 'isrequired';
      }

      if (!asset.brand) {
        errors.brand = 'isrequired';
      }

      if (!asset.modelBrand) {
        errors.modelBrand = 'isrequired';
      }

      if (asset.manufactureDate === undefined) {
        errors.manufactureDate = 'isrequired';
      }

      if (Object.keys(errors).length === 0) {
        return next(req, res);
      }
      return res.status(422).json({ errors });
    }

    private checkNameDoesNotExist = (next: (req: express.Request, res: express.Response) => void) => async (req: express.Request, res: express.Response) => {
      const { assetUiId } = req.params;
      const { body: { asset } } = req;

      if (asset.name !== undefined && assetUiId !== undefined) {
        const assetWithSimilarNameIndex = (await getUserAssets()).findIndex((a) => a.name === asset.name && a._uiId !== assetUiId);
        if (assetWithSimilarNameIndex !== -1) {
          return res.status(422).json({ errors: { name: 'alreadyexisting' } });
        }
      }

      return next(req, res);
    }

    private checkNewOwnerDoesNotExist = (next: (req: express.Request, res: express.Response) => void) => async (req: express.Request, res: express.Response) => {
      const { body: { newOwnerEmail } } = req;

      const users = await Users.find({ email: newOwnerEmail });
      if (users.length > 0) {
        return res.status(422).json({ errors: { newOwnerEmail: 'alreadyregistered' } });
      }

      return next(req, res);
    }

    private checkAssetCreationCredential = async (req: express.Request, res: express.Response, next: any) => {
      const user = getUser();

      if (user.forbidCreatingAsset) {
        return res.status(400).json({ errors: 'credentialError' });
      }

      return next(req, res);
    }

    private checkAuth = async (req: express.Request, res: express.Response, authSucceed: any) => {
      const user = getUser();
      if (!user) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      return authSucceed();
    }

    private getAssets = async (req: express.Request, res: express.Response) => {
      const assets = await getUserAssets();
      const jsonAssets: any[] = await Promise.all(assets.map((asset) => asset.exportToJSON()));

      return res.json({ assets: jsonAssets });
    }

    private addAsset = async (req: express.Request, res: express.Response) => {
      const { body: { asset } } = req;

      let newAsset = new Assets(asset);
      newAsset = await newAsset.save();

      const user = getUser();

      await createUserAssetLink({ user, asset: newAsset, readonly: false });

      await this.assignAssetInOrphanEquipment(user, newAsset);

      res.json({ asset: await newAsset.exportToJSON() });
    }

    private changeOrAddAsset = async (req: express.Request, res: express.Response) => {
      const { body: { asset } } = req;

      let existingAsset = await getAssetByUiId(req.params.assetUiId);
      if (!existingAsset) {
        this.checkAssetCreationCredential(req, res, this.checkAssetProperties(this.checkNameDoesNotExist(this.addAsset)));
      } else {
        const updateExistingAsset = async () => {
          existingAsset = Object.assign(existingAsset, asset);
          existingAsset = await existingAsset.save();
          res.json({ asset: await existingAsset.exportToJSON() });
        };

        checkCredentials(req, res, () => this.checkNameDoesNotExist(updateExistingAsset)(req, res));
      }
    }

    private deleteAsset = async (req: express.Request, res: express.Response) => {
      const existingAsset = await getAssetByUiId(req.params.assetUiId);

      deleteAssetModel(existingAsset);

      return res.json({ asset: await existingAsset.exportToJSON() });
    }

    private changeOwnership = async (req: express.Request, res: express.Response) => {
      const { body: { newOwnerEmail } } = req;

      // We check that the asset exists and it is linked to the current user.
      const existingAsset = await getAssetByUiId(req.params.assetUiId);
      if (!existingAsset) {
        return res.status(400).json({ errors: { authentication: 'error' } });
      }

      const startOwnershipTransaction = async () => {
        // We delete previous new owner invitations if there was some (because for now, a user can only have one asset)
        await PendingRegistrations.deleteMany({ newOwnerEmail });
        // We also delete all the previous invitation related to this asset
        await PendingRegistrations.deleteMany({ assetId: existingAsset._id });

        // Then, we create the invitation
        const pendingRegistration = new PendingRegistrations({ assetId: existingAsset._id, newOwnerEmail });
        await pendingRegistration.save();

        // And finally, we send the invitation by email
        sendEmailHelper.sendRegistrationInvitation({ newOwnerEmail, previousOwner: getUser(), asset: existingAsset });
        return res.json({ newOwnerEmail });
      };

      // Before, we check that the current user has enough credentials,
      // and we check that the new owner is not already using Equipment maintenance (because currently, an owner can have only one asset)
      return checkCredentials(req, res, () => this.checkNewOwnerDoesNotExist(startOwnershipTransaction)(req, res));
    }

    // This function needs to be removed since it was used for migrating the users
    // from the version without asset to the version with asset.
    // Once all the user are migrated, there should be no orphan equipment anymore...
    private assignAssetInOrphanEquipment = async (owner: IUser, asset: IAssets) => {
      const query = { assetId: undefined, ownerId: owner._id };
      const equipments = await Equipments.find(query);

      const equipmentSavingPromises = equipments.map(async (equipment) => {
        // eslint-disable-next-line no-param-reassign
        equipment.assetId = asset._id;
        // eslint-disable-next-line no-param-reassign
        equipment.ownerId = undefined;
        await equipment.save();
      });

      await Promise.all(equipmentSavingPromises);
    }

    private checkDeleteCredentials = async (req: express.Request, res: express.Response, next: any) => {
      const user = getUser();
      const asset = await getAssetByUiId(req.params.assetUiId);

      if (!asset) {
        return res.status(400).json({ errors: { entity: 'notfound' } });
      }

      try {
        const assetUser = await AssetUser.findOne({ assetId: asset._id, userId: user._id });

        if (assetUser.readonly) {
          return res.status(400).json({ errors: 'credentialError' });
        }
        return next();
      } catch (error) {
        return res.status(400).json({ errors: 'credentialError' });
      }
    }
}

export default AssetsController;
