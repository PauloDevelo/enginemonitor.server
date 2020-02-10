import * as express from "express";
import auth from "../security/auth";

import Assets, { deleteAssetModel, getAssetByUiId, IAssets } from "../models/Assets";
import { createUserAssetLink, getUserAssets } from "../models/AssetUser";
import Equipments from "../models/Equipments";
import { IUser } from "../models/Users";

import wrapAsync from "../utils/expressHelpers";
import {getUser} from "../utils/requestContext";

import { Mongoose } from "mongoose";
import IController from "./IController";

class AssetsController implements IController {
    private path: string = "/assets";
    private router: express.Router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private intializeRoutes() {
        this.router
        .use(   this.path,                      auth.required, wrapAsync(this.checkAuth))
        .get(   this.path,                      auth.required, wrapAsync(this.getAssets))
        .post(  this.path + "/:assetUiId",      auth.required, wrapAsync(this.changeOrAddAsset))
        .delete(this.path + "/:assetUiId",      auth.required, wrapAsync(this.deleteAsset));
    }

    private checkAssetProperties = (next: (req: express.Request, res: express.Response) => void) => {
        return (req: express.Request, res: express.Response) => {
            const { body: { asset } } = req;

            const errors: any = {};

            if (!asset._uiId) {
                errors._uiId = "isrequired";
            }

            if (!asset.name) {
                errors.name = "isrequired";
            }

            if (!asset.brand) {
                errors.brand = "isrequired";
            }

            if (!asset.modelBrand) {
                errors.modelBrand = "isrequired";
            }

            if (asset.manufactureDate === undefined) {
                errors.manufactureDate = "isrequired";
            }

            if (Object.keys(errors).length === 0) {
                return next(req, res);
            } else {
                return res.status(422).json({ errors });
            }
        };
    }

    private checkNameDoesNotExist = (next: (req: express.Request, res: express.Response) => void) => {
        return async (req: express.Request, res: express.Response) => {
            const { body: { asset } } = req;

            const assetWithSimilarNameIndex = (await getUserAssets()).findIndex((a) => a.name === asset.name);
            if (assetWithSimilarNameIndex !== -1) {
                return res.status(422).json({ errors: { name: "alreadyexisting" } });
            }

            return next(req, res);
        };
    }

    private checkAuth = async (req: express.Request, res: express.Response, authSucceed: any) => {
        const user = getUser();
        if (!user) {
            return res.status(400).json({ errors: { authentication: "error" } });
        }

        return authSucceed();
    }

    private getAssets = async (req: express.Request, res: express.Response) => {
        const assets = await getUserAssets();

        const jsonAssets: any[] = [];
        for (const asset of assets) {
            jsonAssets.push(await asset.toJSON());
        }

        return res.json({ assets: jsonAssets });
    }

    private addAsset = async (req: express.Request, res: express.Response) =>  {
        const { body: { asset } } = req;

        let newAsset = new Assets(asset);
        newAsset = await newAsset.save();

        const user = getUser();

        await createUserAssetLink(user, newAsset);

        await this.assignAssetInOrphanEquipment(user, newAsset);

        res.json({ asset: await newAsset.toJSON() });
    }

    private changeOrAddAsset = async (req: express.Request, res: express.Response) => {
        const { body: { asset } } = req;

        let existingAsset = await getAssetByUiId(req.params.assetUiId);
        if (!existingAsset) {
            this.checkAssetProperties(this.checkNameDoesNotExist(this.addAsset))(req, res);
        } else {
            const updateExistingAsset = async () => {
                existingAsset = Object.assign(existingAsset, asset);
                existingAsset = await existingAsset.save();
                res.json({ asset: await existingAsset.toJSON() });
            };

            this.checkNameDoesNotExist(updateExistingAsset)(req, res);
        }
    }

    private deleteAsset = async (req: express.Request, res: express.Response) => {
        const existingAsset = await getAssetByUiId(req.params.assetUiId);
        if (!existingAsset) {
            return res.sendStatus(400);
        }

        deleteAssetModel(existingAsset);

        return res.json({ asset: await existingAsset.toJSON() });
    }

    // This function needs to be removed since it was used for migrating the users
    // from the version without asset to the version with asset.
    // Once all the user are migrated, there should be no orphan equipment anymore...
    private assignAssetInOrphanEquipment = async (owner: IUser, asset: IAssets) => {
        const query = { assetId: undefined, ownerId: owner._id };
        const equipments = await Equipments.find(query);

        const equipmentSavingPromises = equipments.map(async (equipment) => {
            equipment.assetId = asset._id;
            equipment.ownerId = undefined;
            await equipment.save();
        });

        await Promise.all(equipmentSavingPromises);
        return;
    }
}

export default AssetsController;