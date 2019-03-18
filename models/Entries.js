const mongoose = require('mongoose');

const { Schema } = mongoose;

const EntriesSchema = new Schema({
    equipmentId: Schema.Types.ObjectId,
    taskId: Schema.Types.ObjectId,
    name: String,
    date: Date,
    age: Number,
    remarks: String
});

EntriesSchema.methods.toJSON = async function(){
    return {
        _id: this._id,
        equipmentId: this.equipmentId,
        taskId: this.taskId,
        name: this.name,
        date: this.date,
        age: this.age,
        remarks: this.remarks
    };
}

EntriesSchema.methods.updateFromEngineMaintenanceApi = function(entry){
    this.name = entry.name;
    this.date = new Date(entry.UTCDate);
    this.age = entry.age;
    this.remarks = entry.remarks;
}

mongoose.model('Entries', EntriesSchema);