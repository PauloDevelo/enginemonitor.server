import mongoose from 'mongoose';

import { deleteEntriesFromParent } from './Entries';
import { deleteExistingImages } from './Images';
import { deleteTasks } from './Tasks';

// eslint-disable-next-line no-shadow
export enum AgeAcquisitionType {
    // eslint-disable-next-line no-unused-vars
    time = 0,
    // eslint-disable-next-line no-unused-vars
    manualEntry= 1,
    // eslint-disable-next-line no-unused-vars
    tracker= 2
}

export const EquipmentsSchema = new mongoose.Schema({
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

EquipmentsSchema.methods.toJSON = async function () {
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

    toJSON(): any;
}

const Equipments = mongoose.model<IEquipments>('Equipments', EquipmentsSchema);
export default Equipments;

export const getEquipment = async (equipmentId: mongoose.Types.ObjectId): Promise<IEquipments> => Equipments.findById(equipmentId);

export const getEquipmentByUiId = async (assetId: mongoose.Types.ObjectId, equipmentUiId: string): Promise<IEquipments> => {
  const query = { assetId, _uiId: equipmentUiId };
  return Equipments.findOne(query);
};

export const deleteEquipmentModel = async (equipment: IEquipments): Promise<void> => {
  const deletions: Array<PromiseLike<void>> = [];

  const removeEquipmentPromise = async () => {
    await equipment.remove();
  };

  deletions.push(deleteExistingImages(equipment._uiId));
  deletions.push(deleteTasks(equipment._id));
  deletions.push(deleteEntriesFromParent({ equipmentId: equipment._id, taskId: undefined }));
  deletions.push(removeEquipmentPromise());

  await Promise.all(deletions);
};

export const deleteEquipments = async (assetId: mongoose.Types.ObjectId) => {
  const equipments = await Equipments.find({ assetId });
  const promises = equipments.map((equipment) => deleteEquipmentModel(equipment));

  await Promise.all(promises);
};
