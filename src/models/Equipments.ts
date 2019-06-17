import mongoose from "mongoose";

export enum AgeAcquisitionType {
    time = 0,
    manualEntry= 1,
    tracker= 2
}

export const EquipmentsSchema = new mongoose.Schema({
    _uiId: String,
    age: Number,
    ageAcquisitionType: Number,
    ageUrl: String,
    brand: String,
    installation: Date,
    model: String,
    name: String,
    ownerId: mongoose.Schema.Types.ObjectId
});

export interface IEquipments extends mongoose.Document {
    _uiId: string;
    brand: string;
    ownerId: mongoose.Types.ObjectId;
    name: string;
    age: number;
    installation: Date;
    ageAcquisitionType: number;
    ageUrl: string;
}

const Equipments = mongoose.model<IEquipments>("Equipments", EquipmentsSchema);
export default Equipments;
