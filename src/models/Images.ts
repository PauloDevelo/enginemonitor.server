import fs from "fs";
import mongoose from "mongoose";
import logger from "../utils/logger";
import config = require("config");

export const ImagesSchema = new mongoose.Schema({
    _uiId: String,
    path: String,
    thumbnailPath: String,
    name: String,
    parentUiId: String,
    title: String,
    description: String
});

ImagesSchema.methods.toJSON = async function() {
    return {
        _uiId: this._uiId,
        name: this.name,
        parentUiId: this.parentUiId,
        url: buildURL(config.get("hostURL"), this.path),
        thumbnailUrl: buildURL(config.get("hostURL"), this.thumbnailPath),
        title: this.title,
        description: this.description
    };
};

export interface IImages extends mongoose.Document {
    path: string;
    thumbnailPath: string;

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
        fs.unlinkSync(image.thumbnailPath);

        await image.remove()
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
