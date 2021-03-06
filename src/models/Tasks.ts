import moment from 'moment';
import mongoose from 'mongoose';

import Entries, { IEntries } from './Entries';
import Equipments, { AgeAcquisitionType } from './Equipments';
import { deleteExistingImages } from './Images';

export interface ITasks extends mongoose.Document {
  _uiId: string;
  equipmentId: mongoose.Types.ObjectId;
  name: string;
  usagePeriodInHour: number;
  periodInMonth: number;
  description: string;

  getLastAckEntry(): Promise<IEntries>;
  getLastAckEntryAge(): Promise<number>;
  getTimeInHourLeft(): Promise<number>;
  getLastAckEntryDate(): Promise<Date>;
  getNextDueDate(): Promise<Date>;
  getLevel(): Promise<number>;
  exportToJSON(): Promise<any>;
}

export const TasksSchema = new mongoose.Schema<ITasks>({
  _uiId: String,
  description: String,
  equipmentId: mongoose.Schema.Types.ObjectId,
  name: String,
  periodInMonth: Number,
  usagePeriodInHour: Number,
});

TasksSchema.methods.getLastAckEntry = async function (): Promise<IEntries> {
  const query = { equipmentId: this.equipmentId, taskId: this._id, ack: true };
  let entries = await Entries.find(query);
  entries = entries.sort((a, b) => {
    if (a.date > b.date) {
      return -1;
    } if (a.date < b.date) {
      return 1;
    }
    return 0;
  });

  if (entries.length === 0) {
    return null;
  }
  return entries[0];
};

TasksSchema.methods.getLastAckEntryAge = async function (): Promise<number> {
  const lastAckEntry = await this.getLastAckEntry();
  if (lastAckEntry != null) {
    return lastAckEntry.age;
  }
  return 0;
};

TasksSchema.methods.getTimeInHourLeft = async function (): Promise<number> {
  if (this.usagePeriodInHour === -1) {
    return 0;
  }

  const equipment = await Equipments.findById(this.equipmentId);

  return this.usagePeriodInHour + await this.getLastAckEntryAge() - equipment.age;
};

TasksSchema.methods.getLastAckEntryDate = async function (): Promise<Date> {
  const lastAckEntry = await this.getLastAckEntry();
  if (lastAckEntry != null) {
    return lastAckEntry.date;
  }
  const equipment = await Equipments.findById(this.equipmentId);
  return equipment.installation;
};

TasksSchema.methods.getNextDueDate = async function (): Promise<Date> {
  const nextDueDate = moment(await this.getLastAckEntryDate());
  nextDueDate.add(this.periodInMonth, 'M');

  return nextDueDate.toDate();
};

TasksSchema.methods.getLevel = async function (): Promise<number> {
  const nextDueDate = await this.getNextDueDate();
  const now = new Date();
  const delayInMillisecond = nextDueDate.getTime() - now.getTime();

  const equipment = await Equipments.findById(this.equipmentId);

  if (equipment.ageAcquisitionType !== AgeAcquisitionType.time
        && Number.isNaN(this.usagePeriodInHour) === false && this.usagePeriodInHour > 0) {
    const usageHourLeft = await this.getTimeInHourLeft();

    if (usageHourLeft <= 0 || nextDueDate <= now) {
      return 3;
    } if (usageHourLeft < Math.round(this.usagePeriodInHour / 10 + 0.5)
                   || Math.abs(delayInMillisecond) <= this.periodInMonth * 30.5 * 24 * 360000.5) {
      return 2;
    }
    return 1;
  }
  if (nextDueDate <= now) {
    return 3;
  } if (Math.abs(delayInMillisecond) <= this.periodInMonth * 30.5 * 24 * 360000.5) {
    return 2;
  }
  return 1;
};

TasksSchema.methods.exportToJSON = async function (): Promise<any> {
  const level = await this.getLevel();
  const nextDueDate = await this.getNextDueDate();
  const usageInHourLeft = await this.getTimeInHourLeft();

  return {
    _uiId: this._uiId,
    description: this.description,
    level,
    name: this.name,
    nextDueDate,
    periodInMonth: this.periodInMonth,
    usageInHourLeft,
    usagePeriodInHour: this.usagePeriodInHour,
  };
};

TasksSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await deleteExistingImages(this._uiId);

  const entriesToDelete = await Entries.find({ taskId: this._id });
  const entryDeletionPromises = entriesToDelete.map((entry) => entry.deleteOne());
  await Promise.all(entryDeletionPromises);
});

const Tasks = mongoose.model<ITasks>('Tasks', TasksSchema);
export default Tasks;

export const getTaskByUiId = async (equipmentId: mongoose.Types.ObjectId, taskUiId: string): Promise<ITasks> => {
  const query = { equipmentId, _uiId: taskUiId };
  return Tasks.findOne(query);
};

export const getTask = async (taskId: mongoose.Types.ObjectId): Promise<ITasks> => Tasks.findById(taskId);
