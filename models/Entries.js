const mongoose = require('mongoose');

const { Schema } = mongoose;

const EntriesSchema = new Schema({
    boatId: Schema.Types.ObjectId,
    taskId: Schema.Types.ObjectId,
    name: String,
    UTCDate: Date,
    age: Number,
    remarks: String
});

mongoose.model('Entries', EntriesSchema);