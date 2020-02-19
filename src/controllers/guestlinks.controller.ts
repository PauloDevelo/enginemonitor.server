import * as express from "express";
import auth from "../security/auth";

import shortid from "shortid";

import wrapAsync from "../utils/expressHelpers";

import Assets, { getAssetByUiId, IAssets } from "../models/Assets";
import AssetUser, { createUserAssetLink } from "../models/AssetUser";
import GuestLinks, { getGuestLinkByNiceKey, IGuestLink } from "../models/GuestLinks";
import Users from "../models/Users";

import IController from "./IController";

import { checkUserCredentials } from '../controllers/controller.helper';

class GuestLinksController implements IController {
    private path: string = "/guestlinks";
    private router: express.Router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private initializeRoutes() {
        this.router
        // tslint:disable-next-line:max-line-length
        .post(this.path,                       auth.required, this.checkGuestLinkProperties, wrapAsync(this.createGuestAndLink))
        .get(`${this.path}/asset/:assetUiId`,  auth.required, wrapAsync(this.getGuestLinksForAnAssetUiId))
        .get(`${this.path}/nicekey/:niceKey`,  auth.optional, wrapAsync(this.getGuestUserFromNiceKey))
        .delete(`${this.path}/:guestLinkUiId`, auth.required, wrapAsync(this.deleteGuestAndLink));
    }

    private checkGuestLinkProperties = (req: express.Request, res: express.Response, next: any) => {
        const { body: { guestLinkUiId, guestUiId, nameGuestLink, assetUiId } } = req;

        const errors: any = {};

        if (!guestLinkUiId) {
            errors.guestLinkUiId = "isrequired";
        }

        if (!guestUiId) {
            errors.guestUiId = "isrequired";
        }

        if (!nameGuestLink) {
            errors.nameGuestLink = "isrequired";
        }

        if (!assetUiId) {
            errors.assetUiId = "isrequired";
        }

        if (Object.keys(errors).length === 0) {
            next();
            return;
        } else {
            return res.status(422).json({ errors });
        }
    }

    // POST create a new guest user and a new link route (required, need to be authenticated)
    private createGuestAndLink = async (req: express.Request, res: express.Response) => {
        const { body: { guestLinkUiId, guestUiId, nameGuestLink, assetUiId } } = req;

        const asset = await getAssetByUiId(assetUiId);
        if (!asset) {
            return res.status(400).json({ errors: { assetUiId: "isinvalid" } });
        }

        const next = async() => {
            const niceKey = shortid.generate();
    
            let guestUser = new Users({ _uiId: guestUiId, name: "Guest", firstname: "Guest", email: "", isVerified: true, forbidUploadingImage: true, forbidCreatingAsset: true });
            guestUser.setPassword(niceKey);
            guestUser = await guestUser.save();
    
            await createUserAssetLink( { user: guestUser, asset, readonly: true});
    
            const guestLink = new GuestLinks({
                _uiId: guestLinkUiId,
                guestUserId: guestUser._id,
                name: nameGuestLink,
                niceKey
            });
            await guestLink.save();
    
            return res.json({ guestlink: await guestLink.toJSON() });
        };

        checkUserCredentials(req.method, assetUiId, res, next);
    }

    private getGuestLinksForAnAssetUiId = async (req: express.Request, res: express.Response) => {
        const asset = await getAssetByUiId(req.params.assetUiId);
        if (!asset) {
            return res.status(400).json({ errors: { assetUiId: "isinvalid" } });
        }

        const guestLinks = await this.getGuestLinksForAnAsset(asset);

        const jsonGuestLinkPromises = guestLinks.map(async (guestLink) => await guestLink.toJSON());
        const jsonGuestLinks = await Promise.all(jsonGuestLinkPromises);

        return res.json({ guestlinks: jsonGuestLinks });
    }

    private getGuestLinksForAnAsset = async (asset: IAssets): Promise<IGuestLink[]> => {
        const assetUserLinks = await AssetUser.find({ assetId: asset._id });

        const guestPromises =  assetUserLinks.map(async (assetUserLink) => {
            const guestArray = await GuestLinks.find({ guestUserId: assetUserLink.userId });
            return guestArray.length === 0 ? undefined : guestArray[0];
        });
        const guests = await Promise.all(guestPromises);

        return guests.filter((guest) => guest !== undefined);
    }

    private deleteGuestAndLink = async (req: express.Request, res: express.Response) => {
        let guestLinkToRemove = await GuestLinks.findOne({_uiId: req.params.guestLinkUiId});
        if (!guestLinkToRemove) {
            return res.status(400).json({ errors: { entity: "notfound" } });
        }

        const guestUser = await Users.findById(guestLinkToRemove.guestUserId);
        const assetUser = await AssetUser.findOne({ userId: guestUser._id });
        const asset = await Assets.findById(assetUser.assetId);
        if ((await asset.isOwnedByCurrentUser()) === false){
            return res.status(400).json({ errors: { guestLinkUiId: "isinvalid" } });
        }

        const next = async() => {
            await assetUser.remove();
            await guestUser.remove();
            guestLinkToRemove = await guestLinkToRemove.remove();
    
            return res.json({ guestlink: await guestLinkToRemove.toJSON() });
        }
        
        checkUserCredentials(req.method, asset._uiId, res, next);
    }

    // GET guest route (optional, everyone has access)
    private getGuestUserFromNiceKey = async (req: express.Request, res: express.Response) => {
      const guestLink = await getGuestLinkByNiceKey(req.params.niceKey);

      if (!guestLink) {
          return res.status(400).json({ errors: { niceKey: "isinvalid" } });
      }

      const guestUser = await Users.findById(guestLink.guestUserId);
      if (!guestUser) {
          return res.status(400).json({ errors: { guestUserId: "isinvalid" } });
      }

      return res.json({ user: await guestUser.toAuthJSON() });
    }
}

export default GuestLinksController;
