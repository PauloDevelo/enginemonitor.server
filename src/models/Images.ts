import fs from 'fs';
import mongoose from 'mongoose';
import config from 'config';
import { getFileSizeInBytes } from '../utils/fileHelpers';
import logger from '../utils/logger';

const buildURL = (path: string): string => {
  let newPath = path.replace(/\\/g, '/');
  const imageFolder = (config.get('ImageFolder') as string).replace(/\\/g, '/');

  newPath = newPath.replace(imageFolder, '');

  return `${config.get('hostURL')}uploads/${newPath}`;
};

export const ImagesSchema = new mongoose.Schema({
  _uiId: String,
  description: String,
  name: String,
  parentUiId: String,
  path: String,
  thumbnailPath: String,
  title: String,
});

ImagesSchema.methods.toJSON = async function () {
  return {
    _uiId: this._uiId,
    description: this.description,
    name: this.name,
    parentUiId: this.parentUiId,
    sizeInByte: getFileSizeInBytes(this.path) + getFileSizeInBytes(this.thumbnailPath),
    thumbnailUrl: buildURL(this.thumbnailPath),
    title: this.title,
    url: buildURL(this.path),
  };
};

export interface IImages extends mongoose.Document {
    _uiId: string;
    parentUiId: string;
    path: string;
    thumbnailPath: string;

    toJSON(): any;
}

const Images = mongoose.model<IImages>('Images', ImagesSchema);
export default Images;

export const getImagesByParentUiId = async (parentUiId: string): Promise<IImages[]> => {
  const query = { parentUiId };
  return Images.find(query);
};

export const deleteImage = async (image: IImages): Promise<void> => {
  try {
    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }
    if (fs.existsSync(image.thumbnailPath)) {
      fs.unlinkSync(image.thumbnailPath);
    }
  } catch (err) {
    logger.error(err);
  } finally {
    await image.remove();
  }
};

export const deleteExistingImages = async (parentUiId: string): Promise<void> => {
  const imagesToDelete = await getImagesByParentUiId(parentUiId);

  const deletion = imagesToDelete.map((imageToDelete) => deleteImage(imageToDelete));

  await Promise.all(deletion);
};

export const getImageByUiId = async (uiId: string): Promise<IImages> => Images.findOne({ _uiId: uiId });
