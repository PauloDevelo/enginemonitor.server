import mongoose from "mongoose";
import {getUser} from "../utils/requestContext";

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

export const getEquipment =  async (equipmentId: mongoose.Types.ObjectId): Promise<IEquipments> => {
    return await Equipments.findById(equipmentId);
};

export const getEquipmentByUiId = async (equipmentUiId: string): Promise<IEquipments> => {
    const user = getUser();

    const query = { ownerId: user._id, _uiId: equipmentUiId };
    return await Equipments.findOne(query);
};

const Equipments = mongoose.model<IEquipments>("Equipments", EquipmentsSchema);
export default Equipments;
