const mongoose = require('mongoose');

const { Schema } = mongoose;

const EntriesSchema = new Schema({
    idboat: String,
    idtask: String,
    idEntry: String,
    name: String,
    UTCDate: Date,
    age: number,
    remarks: String
});

mongoose.model('Entries', EntriesSchema);