const mongoose = require('mongoose');

const { Schema } = mongoose;

const BoatsOwnersSchema = new Schema({
    idboat: String,
    email: String
});

mongoose.model('BoatsOwners', BoatsOwnersSchema);