import mongoose from "mongoose";

export enum AgeAcquisitionType {
    time = 0,
    manualEntry= 1,
    tracker= 2
}

export const EquipmentsSchema = new mongoose.Schema({
    age: Number,
    ageAcquisitionType: Number,
    ageUrl: String,
    brand: String,
    installation: Date,
    model: String,
    name: String,
    ownerId: mongoose.Schema.Types.ObjectId
});

EquipmentsSchema.methods.updateFromEngineMaintenanceApi = function(engineInfo: any) {
    this.brand = engineInfo.brand;
    this.model = engineInfo.model;
    this.age = engineInfo.age;
    this.installation = new Date(engineInfo.installation);
    this.ageAcquisitionType = AgeAcquisitionType.manualEntry;
    this.ageUrl = "";
};

export interface IEquipments extends mongoose.Document {
    ownerId: mongoose.Types.ObjectId;
    name: string;
    age: number;
    installation: Date;
    ageAcquisitionType: number;
    ageUrl: string;

    updateFromEngineMaintenanceApi(engineInfo: any): void;
}

const Equipments = mongoose.model<IEquipments>("Equipments", EquipmentsSchema);
export default Equipments;
