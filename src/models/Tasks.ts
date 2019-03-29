import moment from "moment";
import mongoose from "mongoose";

import Entries, { IEntries } from "./Entries";
import Equipments from "./Equipments";

export const TasksSchema = new mongoose.Schema({
    description: String,
    equipmentId: mongoose.Schema.Types.ObjectId,
    name: String,
    periodInMonth: Number,
    usagePeriodInHour: Number,
});

TasksSchema.methods.getLastEntry = async function(): Promise<IEntries> {
    const query = { equipmentId: this.equipmentId, taskId: this._id };
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

TasksSchema.methods.getLastEntryAge = async function(): Promise<number> {
    const lastEntry = await this.getLastEntry();
    if (lastEntry != null) {
        return lastEntry.age;
    } else {
        return 0;
    }
};

TasksSchema.methods.getTimeInHourLeft = async function(): Promise<number> {
    if (this.usagePeriodInHour === -1) {
        return 0;
    }

    const equipment = await Equipments.findById(this.equipmentId);

    return  this.usagePeriodInHour + await this.getLastEntryAge() - equipment.age;
};

TasksSchema.methods.getLastEntryDate = async function(): Promise<Date> {
    const lastEntry = await this.getLastEntry();
    if (lastEntry != null) {
        return lastEntry.date;
    } else {
        const equipment = await Equipments.findById(this.equipmentId);
        return equipment.installation;
    }
};

TasksSchema.methods.getNextDueDate = async function(): Promise<Date> {
    const nextDueDate = moment(await this.getLastEntryDate());
    nextDueDate.add(this.periodInMonth, "M");

    return nextDueDate.toDate();
};

TasksSchema.methods.getLevel = async function(): Promise<number> {
    const nextDueDate = await this.getNextDueDate();
    const now = new Date();
    const delayInMillisecond = nextDueDate.getTime() - now.getTime();

    if (this.usagePeriodInHour !== -1) {
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
        _id: this._id,
        description: this.description,
        level,
        name: this.name,
        nextDueDate,
        periodInMonth: this.periodInMonth,
        usageInHourLeft,
        usagePeriodInHour: this.usagePeriodInHour,
    };
};

TasksSchema.methods.updateFromEngineMaintenanceApi = function(task: any) {
    this.name = task.name;
    this.usagePeriodInHour = task.engineHours;
    this.periodInMonth = task.month;
    this.description = task.description;
};

export interface ITasks extends mongoose.Document {
    equipmentId: mongoose.Types.ObjectId;
    name: string;
    usagePeriodInHour: number;
    periodInMonth: number;
    description: string;

    getLastEntry(): Promise<IEntries>;
    getLastEntryAge(): Promise<number>;
    getTimeInHourLeft(): Promise<number>;
    getLastEntryDate(): Promise<Date>;
    getNextDueDate(): Promise<Date>;
    getLevel(): Promise<number>;
    toJSON(): Promise<any>;
    updateFromEngineMaintenanceApi(task: any): void;
}

const Tasks = mongoose.model<ITasks>("Tasks", TasksSchema);
export default Tasks;