import * as express from "express";
import auth from "../security/auth";

import { ServerResponse } from "http";

import Images, {getImagesByParentUiId, getImageByUiId, deleteImage} from "../models/Images";
import Equipments from '../models/Equipments';
import Tasks from '../models/Tasks';
import Entries from '../models/Entries';

import {getUser} from "../utils/requestContext";

import IController from "./IController";

import logger from "../utils/logger";
import upload from "../utils/uploadMulter";
import { Types } from "mongoose";

class ImagesController implements IController {
    private path: string = "/images";
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
        .use(   this.path + "/:parentUiId", auth.required, this.checkOwnershipFromParams)
        .get(   this.path + "/:parentUiId", this.getImages)
        .post(  this.path + "/:parentUiId", this.cpUpload, this.addImage)
        .post(  this.path + "/:parentUiId/:imageUiId", this.checkImageProperties, this.updateImage)
        .delete(this.path + "/:parentUiId/:imageUiId", this.deleteImage);
    }

    private checkImageProperties = (req: express.Request, res: express.Response, next: express.NextFunction):void => {
        const { body: { image } } = req;
        
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
            throw res.status(422).json(errors);
        }
    }

    private checkOwnershipFromParams = async (req: express.Request, res: express.Response, next: express.NextFunction):Promise<void> => {
        const user = getUser();
        if (!user) {
            res.status(400).json({ errors: { authentication: "error" } });
        }

        const userId = user._id;
        if(await this.checkOwnership(userId, req.params.parentUiId) === true){
            next();
        }
        else{
            res.status(400).json({ errors: { authentication: "error" } });
        }
    }

    private getImages = async (req: express.Request, res: express.Response) => {
        try {
            const images = await getImagesByParentUiId(req.params.parentUiId);

            const jsonImages: any[] = [];
            for (const image of images) {
                jsonImages.push(await image.toJSON());
            }

            res.json({ images: jsonImages }); 
        } catch (error) {
            this.handleCaughtError(req, res, error);
        }
    }

    private addImage = async (req: any, res: express.Response):Promise<void> => {
        try{
            const { body: { _uiId, name, parentUiId } } = req;
            const userId = getUser()._id;
    
            if(await this.checkOwnership(userId, parentUiId) === true){
                const newImage = new Images({
                    _uiId,
                    name,
                    parentUiId,
                    path: req.files['imageData'][0].path,
                    thumbnailPath: req.files['thumbnail'][0].path
                });
    
                const result = await newImage.save();
                res.json({ image: await result.toJSON() });
            }
            else{
                res.status(400).json({ errors: { authentication: "error" } });
            }
        }
        catch(error){
            this.handleCaughtError(req, res, error);
        }
    }

    private updateImage = async (req: express.Request, res: express.Response):Promise<void> => {
        const { body: { image } } = req;

        let existingImage = await getImageByUiId(image._uiId);
        
        existingImage = Object.assign(existingImage, image);
        existingImage = await existingImage.save();

        res.json({ image: await existingImage.toJSON() });
    }

    private deleteImage = async (req: express.Request, res: express.Response):Promise<void> => {
        try {
            const existingImage = await getImageByUiId(req.params.imageUiId);
            if (!existingImage) {
                res.sendStatus(400);
            }

            deleteImage(existingImage);

            res.json({ image: await existingImage.toJSON() });
        } catch (error) {
            this.handleCaughtError(req, res, error);
        }
    }

    private checkOwnership = async (userId: Types.ObjectId, parentUiId: string):Promise<boolean> => {
        const query = { _uiId : parentUiId };

        const equipments = await Equipments.find(query);
        if(equipments.length > 0){
            return equipments[0].ownerId.toString() === userId.toString();
        }

        const tasks = await Tasks.find(query)
        if(tasks.length > 0){
            const task = tasks[0];
            const parentEquipment = await Equipments.findById(task.equipmentId);

            return parentEquipment.ownerId.toString() === userId.toString();
        }

        const entries = await Entries.find(query);
        if(entries.length > 0){
            const entry = entries[0];
            const parentEquipment = await Equipments.findById(entry.equipmentId);

            return parentEquipment.ownerId.toString() === userId.toString();
        }

        return true;
    }

    private handleCaughtError = (req: express.Request, res: express.Response, err: any) => {
        if (err instanceof ServerResponse) {
            return;
        } else {
            logger.error(err);
            res.sendStatus(500);
        }
    }
}

export default ImagesController;
