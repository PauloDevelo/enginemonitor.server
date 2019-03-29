import mongoose from "mongoose";

export const EquipmentsSchema = new mongoose.Schema({
    age: Number,
    brand: String,
    installation: Date,
    model: String,
    name: String,
    ownerId: mongoose.Schema.Types.ObjectId,
});

EquipmentsSchema.methods.updateFromEngineMaintenanceApi = function(engineInfo: any) {
    this.brand = engineInfo.brand;
    this.model = engineInfo.model;
    this.age = engineInfo.age;
    this.installation = new Date(engineInfo.installation);
};

export interface IEquipments extends mongoose.Document {
    ownerId: mongoose.Types.ObjectId;
    name: string;
    age: number;
    installation: Date;

    updateFromEngineMaintenanceApi(engineInfo: any): void;
}

const Equipments = mongoose.model<IEquipments>("Equipments", EquipmentsSchema);
export default Equipments;
