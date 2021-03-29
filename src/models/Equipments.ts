import mongoose from 'mongoose';

import Entries from './Entries';
import { deleteExistingImages } from './Images';
import Tasks from './Tasks';

// eslint-disable-next-line no-shadow
export enum AgeAcquisitionType {
    // eslint-disable-next-line no-unused-vars
    time = 0,
    // eslint-disable-next-line no-unused-vars
    manualEntry= 1,
    // eslint-disable-next-line no-unused-vars
    tracker= 2
}

export interface IEquipments extends mongoose.Document {
  _uiId: string;
  age: number;
  ageAcquisitionType: number;
  ageUrl: string;
  brand: string;
  installation: Date;
  assetId?: mongoose.Types.ObjectId;
  // deprecated
  ownerId?: mongoose.Types.ObjectId;
  name: string;

  exportToJSON(): any;
}

export const EquipmentsSchema = new mongoose.Schema<IEquipments>({
  _uiId: String,
  age: Number,
  ageAcquisitionType: Number,
  ageUrl: String,
  assetId: mongoose.Schema.Types.ObjectId,
  brand: String,
  installation: Date,
  model: String,
  name: String,
  // deprecated
  ownerId: mongoose.Schema.Types.ObjectId,
});

EquipmentsSchema.methods.exportToJSON = async function () {
  return {
    _uiId: this._uiId,
    age: this.age,
    ageAcquisitionType: this.ageAcquisitionType,
    ageUrl: this.ageUrl,
    brand: this.brand,
    installation: this.installation,
    model: this.model,
    name: this.name,
  };
};

EquipmentsSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await deleteExistingImages(this._uiId);

  const tasksToDelete = await Tasks.find({ equipmentId: this._id });
  const taskDeletionPromises = tasksToDelete.map((task) => task.deleteOne());
  await Promise.all(taskDeletionPromises);

  const entriesToDelete = await Entries.find({ equipmentId: this._id, taskId: undefined });
  const entryDeletionPromises = entriesToDelete.map((entry) => entry.deleteOne());
  await Promise.all(entryDeletionPromises);
});

const Equipments = mongoose.model<IEquipments>('Equipments', EquipmentsSchema);
export default Equipments;

export const getEquipment = async (equipmentId: mongoose.Types.ObjectId): Promise<IEquipments> => Equipments.findById(equipmentId);

export const getEquipmentByUiId = async (assetId: mongoose.Types.ObjectId, equipmentUiId: string): Promise<IEquipments> => {
  const query = { assetId, _uiId: equipmentUiId };
  return Equipments.findOne(query);
};
