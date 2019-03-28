const mongoose = require('mongoose');

const { Schema } = mongoose;

const EquipmentsSchema = new Schema({
    ownerId: Schema.Types.ObjectId,
    name: String,
    brand: String,
    model: String,
    age: Number,
    installation: Date
});

EquipmentsSchema.methods.updateFromEngineMaintenanceApi = function(engineInfo){
    this.brand = engineInfo.brand;
    this.model = engineInfo.model;
    this.age = engineInfo.age;
    this.installation = new Date(engineInfo.installation);
}

mongoose.model('Equipments', EquipmentsSchema);