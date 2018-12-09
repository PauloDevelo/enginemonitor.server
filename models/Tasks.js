const mongoose = require('mongoose');

const { Schema } = mongoose;

const TasksSchema = new Schema({
    idboat: String,
    idtask: String,
    name: String,
    engineHours: number,
    month: number,
    description:String
});

mongoose.model('Tasks', TasksSchema);