//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import moment from 'moment';

import server from '../../src/server';
const app = server.app;

const chai = require('chai')
  , chaiHttp = require('chai-http');
 
chai.use(chaiHttp);
const expect = chai.expect;
const should = chai.should();

import Users from '../../src/models/Users';
import Equipments from '../../src/models/Equipments';
import Entries from '../../src/models/Entries';
import Tasks from '../../src/models/Tasks';

describe('Tasks', () => {
    afterEach(async () => {
        await Entries.deleteMany({}); 
        await Tasks.deleteMany({}); 
        await Equipments.deleteMany({});  
        await Users.deleteMany({});  
    });

    describe('/GET/:equipmentId tasks', () => {
        it('it should GET a 200 http code as a result because the task was return successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com", _uiId:"user_01" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("tasks");
            res.body.tasks.should.be.a("array");
            res.body.tasks.length.should.be.eql(1);
            res.body.tasks[0].should.have.property("name");
            res.body.tasks[0].should.have.property("usagePeriodInHour");
            res.body.tasks[0].should.have.property("periodInMonth");
            res.body.tasks[0].should.have.property("description");
            res.body.tasks[0].should.have.property("level");
            res.body.tasks[0].should.have.property("nextDueDate");
            res.body.tasks[0].should.have.property("usageInHourLeft");
            res.body.tasks[0].should.have.property("_uiId");
            res.body.tasks[0].should.not.have.property("_id");


            res.body.tasks[0].name.should.be.eql("Vidange");
            res.body.tasks[0].usagePeriodInHour.should.be.eql(200);
            res.body.tasks[0].periodInMonth.should.be.eql(12);
            res.body.tasks[0].description.should.be.eql("Faire la vidange");
            res.body.tasks[0].level.should.be.eql(3);
            res.body.tasks[0]._uiId.should.be.eql("task_01");
        });

        it('it should GET a 400 http code as a result because the user does not exist', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            let fakeToken = fakeUser.generateJWT();

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + fakeToken);

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the user is not the owner', async () => {
            // Arrange
            let differentUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            differentUser.setPassword("test");
            let differentUserToken = differentUser.generateJWT();
            differentUser = await differentUser.save();

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;

            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + differentUserToken);

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the boat does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(400);
        });

        it('it should get a task with a level 1 because the task were performed less than 12 months and less than 200 hours of usage', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:12345, installation:"2015/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12235, remarks: "RAS", _uiId:"entry_01" });
            entry1.equipmentId = boat._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(2, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12335, remarks: "RAS", _uiId:"entry_02" });
            entry2.equipmentId = boat._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.body.tasks[0].level.should.be.eql(1);
        });

        it('it should get a task with a level 1 because the task were performed less than 12 months', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:12345, installation:"2015/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:-1, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 1, remarks: "RAS", _uiId:"entry_01" });
            entry1.equipmentId = boat._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(2, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 100, remarks: "RAS", _uiId:"entry_02" });
            entry2.equipmentId = boat._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.body.tasks[0].level.should.be.eql(1);
        });

        it('it should get a task with a level 2 because the task as to be performed in less than 20 hours of usage', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:12345, installation:"2015/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12045, remarks: "RAS", _uiId:"entry_01" });
            entry1.equipmentId = boat._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(6, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12155, remarks: "RAS", _uiId:"entry_02" });
            entry2.equipmentId = boat._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.body.tasks[0].level.should.be.eql(2);
        });

        it('it should get a task with a level 2 because the task has to be performed in less than 1.2 months', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:12345, installation:"2015/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:-1, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12045, remarks: "RAS", _uiId:"entry_01" });
            entry1.equipmentId = boat._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(11, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12155, remarks: "RAS", _uiId:"entry_02" });
            entry2.equipmentId = boat._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.body.tasks[0].level.should.be.eql(2);
        });

        it('it should get a task with a level 3 because the task is overdue', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:12345, installation:"2015/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:-1, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12045, remarks: "RAS", _uiId:"entry_01" });
            entry1.equipmentId = boat._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(13, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12155, remarks: "RAS", _uiId:"entry_02" });
            entry2.equipmentId = boat._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.body.tasks[0].level.should.be.eql(3);
        });

        it('it should get a task with a level 3 because the task is overdue', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:12345, installation:"2015/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12045, remarks: "RAS", _uiId:"entry_01" });
            entry1.equipmentId = boat._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(3, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12135, remarks: "RAS", _uiId:"entry_02" });
            entry2.equipmentId = boat._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            // Act
            let res = await chai.request(app).get('/api/tasks/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.body.tasks[0].level.should.be.eql(3);
        });
    });

    describe('/POST/:equipmentId new task', () => {
        it('it should GET a 200 http code as a result because the task was return successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com", _uiId: "sadvasdvoqeeb" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:'dfvnsdffnsdnfb'});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = {name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId: "asdggg"};

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("usagePeriodInHour");
            res.body.task.should.have.property("periodInMonth");
            res.body.task.should.have.property("description");
            res.body.task.should.have.property("_uiId");
            res.body.task.should.not.have.property("_id");

            res.body.task.name.should.be.eql("Vidange");
            res.body.task.usagePeriodInHour.should.be.eql(200);
            res.body.task.periodInMonth.should.be.eql(12);
            res.body.task.description.should.be.eql("Faire la vidange");
            res.body.task._uiId.should.be.eql("asdggg");
        });

        it('it should GET a 422 http code as a result because the task name was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01" };

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task usagePeriodInHour was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { name:"Vidange", periodInMonth:12, description:"Faire la vidange", _uiId:"task_01" };

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("usagePeriodInHour");
            res.body.errors.usagePeriodInHour.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task month was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { name:"Vidange", usagePeriodInHour:200, description:"Faire la vidange", _uiId:"task_01" };

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("periodInMonth");
            res.body.errors.periodInMonth.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task description was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { name:"Vidange", usagePeriodInHour:200, periodInMonth:12, _uiId: "task_01"};

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId).send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("description");
            res.body.errors.description.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task _uiId was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            let userId = user._id;
            let token = user.generateJWT();

            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = { name:"Vidange", usagePeriodInHour:200, periodInMonth:12};

            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/task-01').send({task: task}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("_uiId");
            res.body.errors.description.should.be.eql("isrequired");
        });
    });

    describe('/POST/:equipmentId/:taskId change a task', () => {
        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let jsonTask = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("usagePeriodInHour");
            res.body.task.should.have.property("periodInMonth");
            res.body.task.should.have.property("description");

            res.body.task.name.should.be.eql("Vidange d'huile");
            res.body.task.usagePeriodInHour.should.be.eql(200);
            res.body.task.periodInMonth.should.be.eql(12);
            res.body.task.description.should.be.eql("Faire la vidange");
        });

        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let jsonTask = {usagePeriodInHour:300};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("usagePeriodInHour");
            res.body.task.should.have.property("periodInMonth");
            res.body.task.should.have.property("description");

            res.body.task.name.should.be.eql("Vidange");
            res.body.task.usagePeriodInHour.should.be.eql(300);
            res.body.task.periodInMonth.should.be.eql(12);
            res.body.task.description.should.be.eql("Faire la vidange");
        });

        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let jsonTask = {periodInMonth:24};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("usagePeriodInHour");
            res.body.task.should.have.property("periodInMonth");
            res.body.task.should.have.property("description");

            res.body.task.name.should.be.eql("Vidange");
            res.body.task.usagePeriodInHour.should.be.eql(200);
            res.body.task.periodInMonth.should.be.eql(24);
            res.body.task.description.should.be.eql("Faire la vidange");
        });

        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let jsonTask = {description:"Bien Faire la vidange"};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.have.property("usagePeriodInHour");
            res.body.task.should.have.property("periodInMonth");
            res.body.task.should.have.property("description");

            res.body.task.name.should.be.eql("Vidange");
            res.body.task.usagePeriodInHour.should.be.eql(200);
            res.body.task.periodInMonth.should.be.eql(12);
            res.body.task.description.should.be.eql("Bien Faire la vidange");
        });

        it('it should get a 422 http code as a result because the task already exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            let userId = user._id;
            let token = user.generateJWT();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = userId;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let task2 = new Tasks({name:"Vidange d'huile", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_02"});
            task2.equipmentId = boat._id;
            task2 = await task2.save();

            let jsonTask = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({task: jsonTask}).set("Authorization", "Token " + token);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("alreadyexisting");
        });
    });

    describe('/DELETE/:equipmentId/:taskId delete task', () => {
        it('it should get a 200 http code as a result because the task was deleted successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry2 = new Entries({ name: "My second entry", date: new Date().toString(), age: 12346, remarks: "RAS2", _uiId:"entry_01" });
            entry2.equipmentId = boat._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let entry3 = new Entries({ name: "My third entry", date: new Date().toString(), age: 12347, remarks: "RAS3", _uiId:"entry_02" });
            entry3.equipmentId = boat._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).delete('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.not.have.property("_id");
            res.body.task.should.have.property("_uiId");
            res.body.task._uiId.should.be.eql(task._uiId);

            const nbTask = await Tasks.countDocuments({});
            nbTask.should.be.eql(0);

            const nbEntries = await Entries.countDocuments({});
            nbEntries.should.be.eql(1);
        });

        it('it should get a 400 http code as a result because the task does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            //task = await task.save();

            // Act
            let res = await chai.request(app).delete('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should get a 400 http code as a result because the task does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let boat2 = new Equipments({name: "Albatros", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat2.ownerId = user._id;
            boat2 = await  boat2.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat2._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).delete('/api/tasks/'+ boat._uiId.toString() + '/' + task._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });
    });
});