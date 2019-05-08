import mongoose from "mongoose";

export const EntriesSchema = new mongoose.Schema({
    age: Number,
    date: Date,
    equipmentId: mongoose.Schema.Types.ObjectId,
    name: String,
    remarks: String,
    taskId: mongoose.Schema.Types.ObjectId,
});

EntriesSchema.methods.toJSON = async function() {
    return {
        _id: this._id,
        age: this.age,
        date: this.date,
        equipmentId: this.equipmentId,
        name: this.name,
        remarks: this.remarks,
        taskId: this.taskId,
    };
};

export interface IEntries extends mongoose.Document {
    equipmentId: mongoose.Types.ObjectId;
    taskId: mongoose.Types.ObjectId | undefined;
    name: string;
    date: Date;
    age: number;
    remarks: string;

    toJSON(): any;
}

const Entries = mongoose.model<IEntries>("Entries", EntriesSchema);
export default Entries;
