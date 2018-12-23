const mongoose = require('mongoose');

const { Schema } = mongoose;

const BoatsSchema = new Schema({
    ownerId: Schema.Types.ObjectId,
    name: String,
    engineBrand: String,
    engineModel: String,
    engineAge: Number,
    engineInstallation: Date
});

mongoose.model('Boats', BoatsSchema);