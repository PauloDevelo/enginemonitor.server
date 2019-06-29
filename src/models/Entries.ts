import mongoose from "mongoose";
import { getEquipment } from "./Equipments";
import { getTask } from "./Tasks";

export const EntriesSchema = new mongoose.Schema({
    _uiId: String,
    age: Number,
    date: Date,
    equipmentId: mongoose.Schema.Types.ObjectId,
    name: String,
    remarks: String,
    taskId: mongoose.Schema.Types.ObjectId,
});

EntriesSchema.methods.toJSON = async function() {
    return {
        _uiId: this._uiId,
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
    equipmentId: mongoose.Types.ObjectId;
    taskId: mongoose.Types.ObjectId | undefined;
    name: string;
    date: Date;
    age: number;
    remarks: string;

    toJSON(): any;
}

export const getEntryByUiId = async (equipmentId: mongoose.Types.ObjectId, entryUiId: string): Promise<IEntries> => {
    const query = { equipmentId, _uiId: entryUiId };
    return await Entries.findOne(query);
};

const Entries = mongoose.model<IEntries>("Entries", EntriesSchema);
export default Entries;
