import mongoose from 'mongoose';
import { getEquipment } from './Equipments';
import { deleteExistingImages } from './Images';
import { getTask } from './Tasks';

export interface IEntries extends mongoose.Document {
  _uiId: string;
  ack: boolean;
  equipmentId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId | undefined;
  name: string;
  date: Date;
  age: number;
  remarks: string;

  exportToJSON(): any;
}

export const EntriesSchema = new mongoose.Schema<IEntries>({
  _uiId: String,
  ack: Boolean,
  age: Number,
  date: Date,
  equipmentId: mongoose.Schema.Types.ObjectId,
  name: String,
  remarks: String,
  taskId: mongoose.Schema.Types.ObjectId,
});

EntriesSchema.methods.exportToJSON = async function () {
  return {
    _uiId: this._uiId,
    ack: this.ack,
    age: this.age,
    date: this.date,
    equipmentUiId: (await getEquipment(this.equipmentId))._uiId,
    name: this.name,
    remarks: this.remarks,
    taskUiId: this.taskId ? (await getTask(this.taskId))._uiId : undefined,
  };
};

EntriesSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await deleteExistingImages(this._uiId);
});

const Entries = mongoose.model<IEntries>('Entries', EntriesSchema);
export default Entries;

export const getEntryByUiId = async (equipmentId: mongoose.Types.ObjectId, entryUiId: string): Promise<IEntries> => {
  const query = { equipmentId, _uiId: entryUiId };
  return Entries.findOne(query);
};
