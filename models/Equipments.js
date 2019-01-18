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

mongoose.model('Equipments', EquipmentsSchema);