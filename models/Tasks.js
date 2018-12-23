const mongoose = require('mongoose');

const { Schema } = mongoose;

const TasksSchema = new Schema({
    boatId: Schema.Types.ObjectId,
    name: String,
    engineHours: Number,
    month: Number,
    description:String
});

mongoose.model('Tasks', TasksSchema);