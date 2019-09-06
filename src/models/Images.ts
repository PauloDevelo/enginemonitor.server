import fs from "fs";
import mongoose from "mongoose";
import logger from "../utils/logger";
import config = require("config");

export const ImagesSchema = new mongoose.Schema({
    _uiId: String,
    path: String,
    name: String,
    parentUiId: String
});

ImagesSchema.methods.toJSON = async function() {
    return {
        _uiId: this._uiId,
        name: this.name,
        parentUiId: this.parentUiId,
        url: buildURL(config.get("hostURL"), this.path)
    };
};

export interface IImages extends mongoose.Document {
    _uiId: string;
    path: string;
    name: string;
    parentUiId: string;

    toJSON(): any;
}

export const deleteExistingImages = async (parentUiId: string): Promise<void> => {
    const imagesToDelete = await getImagesByParentUiId(parentUiId);

    const deletion: Array<Promise<void>> = [];
    imagesToDelete.forEach((imageToDelete) => {
        deletion.concat(deleteImage(imageToDelete));
    });

    await Promise.all(deletion);
};

export const getImagesByParentUiId = async (parentUiId: string): Promise<IImages[]> => {
    const query = { parentUiId };
    return await Images.find(query);
};

export const getImageByUiId = async(uiId: string):Promise<IImages> => {
    return await Images.findOne({_uiId: uiId});
}

export const deleteImage = async (image: IImages): Promise<void> => {
    try {
        fs.unlinkSync(image.path);
    } catch (err) {
        logger.error(err);
    } finally {
        await image.remove();
    }
};

const buildURL = (url: string, path: string): string => {
    const newPath = path.replace("\\","/");
    return config.get("hostURL") + newPath;
}

const Images = mongoose.model<IImages>("Images", ImagesSchema);
export default Images;
