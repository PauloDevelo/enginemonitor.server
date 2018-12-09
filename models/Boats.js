const mongoose = require('mongoose');

const { Schema } = mongoose;

const BoatsSchema = new Schema({
    idboat: String,
    name: String
});

mongoose.model('Boats', BoatsSchema);