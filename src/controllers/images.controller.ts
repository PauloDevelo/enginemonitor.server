import * as express from "express";
import auth from "../security/auth";

import fs from "fs";

import Entries from "../models/Entries";
import Equipments from "../models/Equipments";
import Images, {deleteImage, getImageByUiId, getImagesByParentUiId} from "../models/Images";
import Tasks from "../models/Tasks";

import {getUser} from "../utils/requestContext";

import IController from "./IController";

import { Types } from "mongoose";
import wrapAsync from "../utils/expressHelpers";
import upload, {checkImageQuota} from "../utils/uploadMulter";

class ImagesController implements IController {
    private path: string = "/images";
    private router: express.Router = express.Router();
    private cpUpload = upload.fields([{ name: "imageData", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]);

    constructor() {
        this.initializeRoutes();
    }

    public getRouter() {
        return this.router;
    }

    private initializeRoutes() {
        this.router
        .use(   this.path + "/:parentUiId", auth.required, wrapAsync(this.checkOwnershipFromParams))
        .get(   this.path + "/:parentUiId", wrapAsync(this.getImages))
        .post(  this.path + "/:parentUiId", wrapAsync(checkImageQuota), this.cpUpload, wrapAsync(this.addImage))
        .post(  this.path + "/:parentUiId/:imageUiId", wrapAsync(this.checkParentBelongsImage), wrapAsync(this.updateImage))
        .delete(this.path + "/:parentUiId/:imageUiId", wrapAsync(this.deleteImage));
    }

    private checkImageProperties = (image: any, res: express.Response, next: express.NextFunction, reject: express.NextFunction): void => {
        const errors: any = {};

        if (!image._uiId) {
            errors._uiId = "isrequired";
        }

        if (!image.name) {
            errors.name = "isrequired";
        }

        if (!image.parentUiId) {
            errors.parentUiId = "isrequired";
        }

        if (Object.keys(errors).length === 0) {
            next();
        } else {
            reject(errors);
        }
    }

    // tslint:disable-next-line:max-line-length
    private checkOwnershipFromParams = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        const user = getUser();
        if (user === null || user === undefined) {
            res.status(400).json({ errors: { authentication: "error" } });
        }

        const userId = user._id;
        if (await this.checkOwnership(userId, req.params.parentUiId) === true) {
            next();
        } else {
            res.status(400).json({ errors: { authentication: "error" } });
        }
    }

    private checkParentBelongsImage = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        let existingImage = await getImageByUiId(req.params.imageUiId);
        if (!existingImage) {
            throw new Error("The image " + req.params.imageUiId + " doesn't exist.");
        }

        if(existingImage.parentUiId !== req.params.parentUiId){
            res.status(400).json({ errors: { operation: "invalid" } });
        }
        else{
            next();
        }
    }

    private getImages = async (req: express.Request, res: express.Response) => {
        const images = await getImagesByParentUiId(req.params.parentUiId);

        const jsonImages: any[] = [];
        for (const image of images) {
            jsonImages.push(await image.toJSON());
        }

        res.json({ images: jsonImages });
    }

    private addImage = async (req: any, res: express.Response): Promise<void> => {
        const { body: { _uiId, name, parentUiId } } = req;

        const userId = getUser()._id;

        if (await this.checkOwnership(userId, parentUiId) === false) {
            fs.unlinkSync(req.files.imageData[0].path);
            fs.unlinkSync(req.files.thumbnail[0].path);
            res.status(400).json({ errors: { authentication: "error" } });
        }
        else {
            const newImage = new Images({
                _uiId,
                name,
                parentUiId,
                path: req.files.imageData[0].path,
                thumbnailPath: req.files.thumbnail[0].path
            });

            this.checkImageProperties(newImage, res, 
                async() => {
                    const result = await newImage.save();
                    res.json({ image: await result.toJSON() });
                },
                async(errors) => {
                    fs.unlinkSync(req.files.imageData[0].path);
                    fs.unlinkSync(req.files.thumbnail[0].path);
                    throw res.status(422).json({errors});
                });
        }
    }

    private updateImage = async (req: express.Request, res: express.Response): Promise<void> => {
        const { body: { image } } = req;

        let existingImage = await getImageByUiId(req.params.imageUiId);
        if (!existingImage) {
            throw new Error("The image " + req.params.imageUiId + " doesn't exist.");
        }

        existingImage = Object.assign(existingImage, image);
        existingImage = await existingImage.save();

        res.json({ image: await existingImage.toJSON() });
    }

    private deleteImage = async (req: express.Request, res: express.Response): Promise<void> => {
        const existingImage = await getImageByUiId(req.params.imageUiId);
        if (!existingImage) {
            res.sendStatus(400);
        }

        const imageJson = await existingImage.toJSON();

        deleteImage(existingImage);

        res.json({ image: imageJson });
    }

    private checkOwnership = async (userId: Types.ObjectId, parentUiId: string): Promise<boolean> => {
        const query = { _uiId : parentUiId };

        const equipments = await Equipments.find(query);
        if (equipments.length > 0) {
            return equipments[0].ownerId.toString() === userId.toString();
        }

        const tasks = await Tasks.find(query);
        if (tasks.length > 0) {
            const task = tasks[0];
            const parentEquipment = await Equipments.findById(task.equipmentId);

            return parentEquipment.ownerId.toString() === userId.toString();
        }

        const entries = await Entries.find(query);
        if (entries.length > 0) {
            const entry = entries[0];
            const parentEquipment = await Equipments.findById(entry.equipmentId);

            return parentEquipment.ownerId.toString() === userId.toString();
        }

        return true;
    }
}

export default ImagesController;
