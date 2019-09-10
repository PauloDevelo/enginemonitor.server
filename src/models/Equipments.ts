import mongoose from "mongoose";
import {getUser} from "../utils/requestContext";

import {deleteTasks} from "./Tasks";
import {deleteExistingImages} from "./Images";
import { deleteEntriesFromParent } from './Entries'

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

EquipmentsSchema.methods.toJSON = async function() {
    return {
        _uiId: this._uiId,
        age: this.age,
        ageAcquisitionType: this.ageAcquisitionType,
        ageUrl: this.ageUrl,
        brand: this.brand,
        installation: this.installation,
        model: this.model,
        name: this.name,
    };
};

export interface IEquipments extends mongoose.Document {
    _uiId: string;
    age: number;
    ageAcquisitionType: number;
    ageUrl: string;
    brand: string;
    installation: Date;
    ownerId: mongoose.Types.ObjectId;
    name: string;

    toJSON(): any;
}

export const getEquipment =  async (equipmentId: mongoose.Types.ObjectId): Promise<IEquipments> => {
    return await Equipments.findById(equipmentId);
};

export const getEquipmentByUiId = async (equipmentUiId: string): Promise<IEquipments> => {
    const user = getUser();

    const query = { ownerId: user._id, _uiId: equipmentUiId };
    return await Equipments.findOne(query);
};

export const deleteEquipmentModel = async(equipment:IEquipments):Promise<void> => {
    const promises = [];

    promises.push(deleteExistingImages(equipment._uiId));
    promises.push(deleteTasks(equipment._id));
    promises.push(deleteEntriesFromParent({eq}))

    await Entries.deleteMany({ equipmentId: existingEquipment._id});
    
    await existingEquipment.remove();
}

const Equipments = mongoose.model<IEquipments>("Equipments", EquipmentsSchema);
export default Equipments;
