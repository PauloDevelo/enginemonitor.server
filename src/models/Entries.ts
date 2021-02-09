import mongoose from 'mongoose';
import { getEquipment } from './Equipments';
import { deleteExistingImages } from './Images';
import { getTask } from './Tasks';

export const EntriesSchema = new mongoose.Schema({
  _uiId: String,
  ack: Boolean,
  age: Number,
  date: Date,
  equipmentId: mongoose.Schema.Types.ObjectId,
  name: String,
  remarks: String,
  taskId: mongoose.Schema.Types.ObjectId,
});

EntriesSchema.methods.toJSON = async function () {
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

export interface IEntries extends mongoose.Document {
    _uiId: string;
    ack: boolean;
    equipmentId: mongoose.Types.ObjectId;
    taskId: mongoose.Types.ObjectId | undefined;
    name: string;
    date: Date;
    age: number;
    remarks: string;

    toJSON(): any;
}

const Entries = mongoose.model<IEntries>('Entries', EntriesSchema);
export default Entries;

export const getEntryByUiId = async (equipmentId: mongoose.Types.ObjectId, entryUiId: string): Promise<IEntries> => {
  const query = { equipmentId, _uiId: entryUiId };
  return Entries.findOne(query);
};

export const deleteEntry = async (entry: IEntries): Promise<void> => {
  const promises = [];
  promises.push(deleteExistingImages(entry._uiId));
  promises.push(entry.remove());

  await Promise.all(promises);
};

export const deleteEntriesFromParent = async (conditions: any): Promise<void> => {
  const entries = await Entries.find(conditions);
  const promises = entries.map((entry) => deleteEntry(entry));
  Promise.all(promises);
};
