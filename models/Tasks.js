const mongoose = require('mongoose');
const moment = require('moment');

const Equipments = mongoose.model('Equipments');
const Entries = mongoose.model('Entries');

const { Schema } = mongoose;

const TasksSchema = new Schema({
    equipmentId: Schema.Types.ObjectId,
    name: String,
    usagePeriodInHour: Number,
    periodInMonth: Number,
    description:String
});

TasksSchema.methods.getLastEntry = async function(){
    let query = { equipmentId: this.equipmentId, taskId: this._id };
    let entries = await Entries.find(query);
    entries = entries.sort((a, b) => {
        if( a.date > b.date){
            return -1;
        }
        else if( a.date < b.date){
            return 1;
        }
        else{
            return 0;
        }
    })
		
    if(entries.length == 0){
        return null;
    }
    else{
        return entries[0];
    }
}

TasksSchema.methods.getLastEntryAge = async function(){
    let lastEntry = await this.getLastEntry();
    if(lastEntry != null)
        return lastEntry.age;
    else{
        return 0;
    }
}

TasksSchema.methods.getTimeInHourLeft = async function(){
    if(this.usagePeriodInHour == -1){
        return 0;
    }

    let equipment = await Equipments.findById(this.equipmentId);
    
    return  this.usagePeriodInHour + await this.getLastEntryAge() - Math.round(equipment.age + 0.5);
}

TasksSchema.methods.getLastEntryDate = async function(){
    let lastEntry = await this.getLastEntry();
    if(lastEntry != null) {
        return lastEntry.date;
    }
    else{
        let equipment = await Equipments.findById(this.equipmentId);
        return equipment.installation;
    }
}

TasksSchema.methods.getNextDueDate = async function(){
    let nextDueDate = moment(await this.getLastEntryDate());
    nextDueDate.add(this.periodInMonth, 'M');
    
    return nextDueDate.toDate();
}    

TasksSchema.methods.getLevel = async function() {
    let nextDueDate = await this.getNextDueDate();
    let now = new Date();

    if(this.usagePeriodInHour != -1){
        let usageHourLeft = await this.getTimeInHourLeft();
        

        if(usageHourLeft <= 0 || nextDueDate <= now){
            return 3;
        }
        else if(usageHourLeft < Math.round(this.usagePeriodInHour/10 + 0.5) || Math.abs(nextDueDate - now) <= this.periodInMonth * 30.5 * 24 * 360000.5){
            return 2;
        }
        else{
            return 1;
        }
    }
    else{
        if(nextDueDate <= now){
            return 3;
        }
        else if(Math.abs(nextDueDate - now) <= this.periodInMonth * 30.5 * 24 * 360000.5){
            return 2;
        }
        else{
            return 1;
        }
    }
}

TasksSchema.methods.toJSON = async function(){
    let level = await this.getLevel();
    let nextDueDate = await this.getNextDueDate();
    let usageInHourLeft = await this.getTimeInHourLeft();

    return {
        _id: this._id,
        name: this.name,
        usagePeriodInHour: this.usagePeriodInHour,
        periodInMonth: this.periodInMonth,
        description: this.description,
        level: level,
        nextDueDate: nextDueDate,
        usageInHourLeft: usageInHourLeft
    };
}

TasksSchema.methods.updateFromEngineMaintenanceApi = function(task){
    this.name = task.name;
    this.usagePeriodInHour = task.engineHours;
    this.periodInMonth = task.month;
    this.description = task.description;
}

mongoose.model('Tasks', TasksSchema);