import moment from "moment";
import mongoose from "mongoose";

import Entries, { deleteEntriesFromParent, IEntries } from "./Entries";
import Equipments, { AgeAcquisitionType } from "./Equipments";
import {deleteExistingImages} from "./Images";

export const TasksSchema = new mongoose.Schema({
    _uiId: String,
    description: String,
    equipmentId: mongoose.Schema.Types.ObjectId,
    name: String,
    periodInMonth: Number,
    usagePeriodInHour: Number,
});

TasksSchema.methods.getLastAckEntry = async function(): Promise<IEntries> {
    const query = { equipmentId: this.equipmentId, taskId: this._id, ack: true };
    let entries = await Entries.find(query);
    entries = entries.sort((a, b) => {
        if ( a.date > b.date) {
            return -1;
        } else if ( a.date < b.date) {
            return 1;
        } else {
            return 0;
        }
    });

    if (entries.length === 0) {
        return null;
    } else {
        return entries[0];
    }
};

TasksSchema.methods.getLastAckEntryAge = async function(): Promise<number> {
    const lastAckEntry = await this.getLastAckEntry();
    if (lastAckEntry != null) {
        return lastAckEntry.age;
    } else {
        return 0;
    }
};

TasksSchema.methods.getTimeInHourLeft = async function(): Promise<number> {
    if (this.usagePeriodInHour === -1) {
        return 0;
    }

    const equipment = await Equipments.findById(this.equipmentId);

    return  this.usagePeriodInHour + await this.getLastAckEntryAge() - equipment.age;
};

TasksSchema.methods.getLastAckEntryDate = async function(): Promise<Date> {
    const lastAckEntry = await this.getLastAckEntry();
    if (lastAckEntry != null) {
        return lastAckEntry.date;
    } else {
        const equipment = await Equipments.findById(this.equipmentId);
        return equipment.installation;
    }
};

TasksSchema.methods.getNextDueDate = async function(): Promise<Date> {
    const nextDueDate = moment(await this.getLastAckEntryDate());
    nextDueDate.add(this.periodInMonth, "M");

    return nextDueDate.toDate();
};

TasksSchema.methods.getLevel = async function(): Promise<number> {
    const nextDueDate = await this.getNextDueDate();
    const now = new Date();
    const delayInMillisecond = nextDueDate.getTime() - now.getTime();

    const equipment = await Equipments.findById(this.equipmentId);

    if (equipment.ageAcquisitionType !== AgeAcquisitionType.time && isNaN(this.usagePeriodInHour) === false && this.usagePeriodInHour > 0) {
        const usageHourLeft = await this.getTimeInHourLeft();

        if (usageHourLeft <= 0 || nextDueDate <= now) {
            return 3;
        } else if (usageHourLeft < Math.round(this.usagePeriodInHour / 10 + 0.5) ||
                   Math.abs(delayInMillisecond) <= this.periodInMonth * 30.5 * 24 * 360000.5) {
            return 2;
        } else {
            return 1;
        }
    } else {
        if (nextDueDate <= now) {
            return 3;
        } else if (Math.abs(delayInMillisecond) <= this.periodInMonth * 30.5 * 24 * 360000.5) {
            return 2;
        } else {
            return 1;
        }
    }
};

TasksSchema.methods.toJSON = async function(): Promise<any> {
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
    toJSON(): Promise<any>;
}

export const getTaskByUiId = async (equipmentId: mongoose.Types.ObjectId, taskUiId: string): Promise<ITasks> => {
    const query = { equipmentId, _uiId: taskUiId };
    return await Tasks.findOne(query);
};

export const getTask = async (taskId: mongoose.Types.ObjectId): Promise<ITasks> => {
    return await Tasks.findById(taskId);
};

export const deleteTasks = async (equipmentId: mongoose.Types.ObjectId): Promise<void> => {
    const tasks = await Tasks.find({ equipmentId });
    const promises = tasks.map((task) => deleteTask(task));

    await Promise.all(promises);
};

export const deleteTask = async (task: ITasks): Promise<void> => {
    const promises = [];
    promises.push(deleteExistingImages(task._uiId));
    promises.push(deleteEntriesFromParent({taskId: task._id}));
    promises.push(task.remove());

    await Promise.all(promises);
};

const Tasks = mongoose.model<ITasks>("Tasks", TasksSchema);
export default Tasks;
