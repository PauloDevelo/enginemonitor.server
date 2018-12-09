const mongoose = require('mongoose');

const { Schema } = mongoose;

const BoatsEnginesSchema = new Schema({
    idboat: String,
    brand: String,
    model: String,
    age: number,
    installation: Date
});

mongoose.model('BoatsEngines', BoatsEnginesSchema);