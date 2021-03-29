import fs from 'fs';
import mongoose from 'mongoose';
import config from 'config';
import { getFileSizeInBytes } from '../utils/fileHelpers';
import logger from '../utils/logger';
import Assets from './Assets';
import Tasks from './Tasks';
import Equipments from './Equipments';
import Entries from './Entries';

const buildURL = (path: string): string => {
  let newPath = path.replace(/\\/g, '/');
  const imageFolder = (config.get('ImageFolder') as string).replace(/\\/g, '/');

  newPath = newPath.replace(imageFolder, '');

  return `${config.get('hostURL')}uploads/${newPath}`;
};

export interface IImages extends mongoose.Document {
  _uiId: string;
  description: String,
  name: String,
  parentUiId: string;
  path: string;
  thumbnailPath: string;
  title: String,

  exportToJSON(): any,
  // eslint-disable-next-line no-unused-vars
  changePath(previousOwnerId: mongoose.Types.ObjectId, newOwnerId: mongoose.Types.ObjectId): Promise<IImages>
}

export const ImagesSchema = new mongoose.Schema<IImages>({
  _uiId: String,
  description: String,
  name: String,
  parentUiId: String,
  path: String,
  thumbnailPath: String,
  title: String,
});

// eslint-disable-next-line func-names
ImagesSchema.methods.exportToJSON = async function () {
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

// eslint-disable-next-line func-names
ImagesSchema.methods.changePath = async function (previousOwnerId: mongoose.Types.ObjectId, newOwnerId: mongoose.Types.ObjectId): Promise<IImages> {
  {
    const oldPath = this.path;
    // eslint-disable-next-line no-param-reassign
    this.path = this.path.replace(previousOwnerId.toString(), newOwnerId.toString());
    const newPath = this.path;
    fs.renameSync(oldPath, newPath);
  }

  {
    const oldPath = this.thumbnailPath;
    // eslint-disable-next-line no-param-reassign
    this.thumbnailPath = this.thumbnailPath.replace(previousOwnerId.toString(), newOwnerId.toString());
    const newPath = this.thumbnailPath;
    fs.renameSync(oldPath, newPath);
  }

  return this.save();
};

// eslint-disable-next-line func-names
ImagesSchema.pre('deleteOne', { document: true, query: false }, async function () {
  try {
    if (fs.existsSync(this.path)) {
      fs.unlinkSync(this.path);
    }
    if (fs.existsSync(this.thumbnailPath)) {
      fs.unlinkSync(this.thumbnailPath);
    }
  } catch (err) {
    logger.error(err);
  }
});

const Images = mongoose.model<IImages>('Images', ImagesSchema);
export default Images;

export const getImagesByParentUiId = async (parentUiId: string): Promise<IImages[]> => {
  const query = { parentUiId };
  return Images.find(query);
};

export const deleteExistingImages = async (parentUiId: string): Promise<void> => {
  const imagesToDelete = await getImagesByParentUiId(parentUiId);

  const deletion = imagesToDelete.map((imageToDelete) => imageToDelete.deleteOne());

  await Promise.all(deletion);
};

export const getImageByUiId = async (uiId: string): Promise<IImages> => Images.findOne({ _uiId: uiId });

export const getImagesRelatedToAsset = async (assetId: mongoose.Types.ObjectId): Promise<IImages[]> => {
  const asset = await Assets.findById(assetId);
  const parentUiIds = [asset._uiId];

  const equipments = await Equipments.find({ assetId: asset._id });
  const entriesPromises = equipments.map((equipment) => {
    parentUiIds.push(equipment._uiId);
    return Entries.find({ equipmentId: equipment._id });
  });

  const entriesArray = await Promise.all(entriesPromises);
  entriesArray.forEach((entries) => entries.forEach((entry) => parentUiIds.push(entry._uiId)));

  const tasksPromises = equipments.map((equipment) => Tasks.find({ equipmentId: equipment._id }));
  const tasksArray = await Promise.all(tasksPromises);
  tasksArray.forEach((tasks) => tasks.forEach((task) => parentUiIds.push(task._uiId)));

  return Images.find({ parentUiId: { $in: parentUiIds } });
};
