const mongoose = require('mongoose');
const moment = require('moment');

const Boats = mongoose.model('Boats');
const Entries = mongoose.model('Entries');

const { Schema } = mongoose;

const TasksSchema = new Schema({
    boatId: Schema.Types.ObjectId,
    name: String,
    engineHours: Number,
    month: Number,
    description:String
});

TasksSchema.methods.getLastEntry = async function(){
    let query = { boatId: this.boatId, taskId: this._id };
    let entries = await Entries.find(query);
    entries = entries.sort((a, b) => {
        if( a.UTCDate > b.UTCDate){
            return -1;
        }
        else if( a.UTCDate < b.UTCDate){
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

TasksSchema.methods.getLastEngineHour = async function(){
    let lastEntry = await this.getLastEntry();
    if(lastEntry != null)
        return lastEntry.age;
    else{
        return 0;
    }
}

TasksSchema.methods.getEngineHoursLeft = async function(){
    if(this.engineHours == -1){
        return 0;
    }

    let boat = await Boats.findById(this.boatId);
    
    return  this.engineHours + await this.getLastEngineHour() - Math.round(boat.engineAge + 0.5);
}

TasksSchema.methods.getLastDate = async function(){
    let lastEntry = await this.getLastEntry();
    if(lastEntry != null) {
        return lastEntry.UTCDate;
    }
    else{
        let boat = await Boats.findById(this.boatId);
        return boat.engineInstallation;
    }
}

TasksSchema.methods.getNextDueDate = async function(){
    let nextDueDate = moment(await this.getLastDate());
    nextDueDate.add(this.month, 'M');
    
    return nextDueDate.toDate();
}    

TasksSchema.methods.getLevel = async function() {
    let nextDueDate = await this.getNextDueDate();
    let now = new Date();

    if(this.engineHours != -1){
        let engineHourLeft = await this.getEngineHoursLeft();
        

        if(engineHourLeft <= 0 || nextDueDate <= now){
            return 3;
        }
        else if(engineHourLeft < Math.round(this.engineHours/10 + 0.5) || Math.abs(nextDueDate - now) <= this.month * 30.5 * 24 * 360000.5){
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
        else if(Math.abs(nextDueDate - now) <= this.month * 30.5 * 24 * 360000.5){
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
    let engineHoursLeft = await this.getEngineHoursLeft();

    return {
        _id: this._id,
        name: this.name,
        engineHours: this.engineHours,
        month: this.month,
        description: this.description,
        level: level,
        nextDueDate: nextDueDate,
        engineHoursLeft: engineHoursLeft
    };
}

mongoose.model('Tasks', TasksSchema);