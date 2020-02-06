//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
import ignoredErrorMessages, {restoreLogger, mockLogger} from '../MockLogger';

import moment from 'moment';

import server from '../../src/server';
const app = server.app;

const chai = require('chai')
  , chaiHttp = require('chai-http');
 
chai.use(chaiHttp);
const expect = chai.expect;
const should = chai.should();

import Users, { IUser } from '../../src/models/Users';
import Equipments, {AgeAcquisitionType, IEquipments} from '../../src/models/Equipments';
import Entries from '../../src/models/Entries';
import Tasks, { ITasks } from '../../src/models/Tasks';
import Assets, { IAssets } from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';

describe('Tasks', () => {
    let user: IUser;
    let userJWT: string;
    let boat: IAssets;
    let engine: IEquipments;
    
    before(() => {
        mockLogger();
        ignoredErrorMessages.push("[object Object]");
    });

    after(() => {
        restoreLogger();
    });

    beforeEach(async() => {
        user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
        user.setPassword("test");
        user = await user.save();

        userJWT = `Token ${user.generateJWT()}`;

        boat = new Assets({_uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',});
        boat = await boat.save();

        let assetUserLink = new AssetUser({ assetId: boat._id, userId: user._id });
        assetUserLink = await assetUserLink.save();

        engine = new Equipments({name: "Engine", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"engine_01"});
        engine.assetId = boat._id;
        engine = await  engine.save();
    });

    afterEach(async () => {
        await Assets.deleteMany({}); 
        await AssetUser.deleteMany({}); 
        await Entries.deleteMany({}); 
        await Tasks.deleteMany({}); 
        await Equipments.deleteMany({});  
        await Users.deleteMany({});  
    });

    describe('/GET/:equipmentId tasks', () => {
        let task: ITasks;
        let getTasksUrl: string;

        beforeEach(async() => {
            task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = engine._id;
            task = await task.save();

            getTasksUrl = `/api/tasks/${boat._uiId}/${engine._uiId}`
        });

        it('it should GET a 200 http code as a result because the task was return successfully', async () => {
            // Arrange

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", userJWT);

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

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", "Token " + fakeToken);

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the user is not the owner', async () => {
            // Arrange
            let differentUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            differentUser.setPassword("test");
            let differentUserToken = differentUser.generateJWT();
            differentUser = await differentUser.save();

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", "Token " + differentUserToken);

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the engine does not exist', async () => {
            // Arrange
            await engine.remove();

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", userJWT);

            // Assert
            res.should.have.status(400);
        });

        it('it should get a task with a level 1 because the task were performed less than 12 months and less than 200 hours of usage', async () => {
            // Arrange
            engine.age = 12345;
            engine = await engine.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12235, remarks: "RAS", _uiId:"entry_01", ack: true });
            entry1.equipmentId = engine._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(2, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12335, remarks: "RAS", _uiId:"entry_02", ack: true });
            entry2.equipmentId = engine._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let now3 = moment();
            let entry3 = new Entries({ name: "My third entry", date: now3.toDate().toString(), age: 12253, remarks: "RAS", _uiId:"entry_03", ack: false });
            entry3.equipmentId = engine._id;
            entry3.taskId = task._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", userJWT);

            // Assert
            res.body.tasks[0].level.should.be.eql(1);
        });

        it('it should get a task with a level 1 because the task were performed less than 12 months', async () => {
            // Arrange
            engine.age = 12345;
            engine = await engine.save();

            task.usagePeriodInHour = -1;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 1, remarks: "RAS", _uiId:"entry_01", ack: true });
            entry1.equipmentId = engine._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(2, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 100, remarks: "RAS", _uiId:"entry_02", ack: true });
            entry2.equipmentId = engine._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let now3 = moment();
            let entry3 = new Entries({ name: "My third entry", date: now3.toDate().toString(), age: 12253, remarks: "RAS", _uiId:"entry_03", ack: false });
            entry3.equipmentId = engine._id;
            entry3.taskId = task._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", userJWT);

            // Assert
            res.body.tasks[0].level.should.be.eql(1);
        });

        it('it should get a task with a level 2 because the task as to be performed in less than 20 hours of usage', async () => {
            // Arrange
            engine.age = 12345;
            engine = await engine.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12045, remarks: "RAS", _uiId:"entry_01", ack: true });
            entry1.equipmentId = engine._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(6, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12155, remarks: "RAS", _uiId:"entry_02", ack: true });
            entry2.equipmentId = engine._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let now3 = moment();
            let entry3 = new Entries({ name: "My third entry", date: now3.toDate().toString(), age: 12253, remarks: "RAS", _uiId:"entry_03", ack: false });
            entry3.equipmentId = engine._id;
            entry3.taskId = task._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", userJWT);

            // Assert
            res.body.tasks[0].level.should.be.eql(2);
        });

        it('it should get a task with a level 2 because the task has to be performed in less than 1.2 months', async () => {
            // Arrange
            engine.age = 12345;
            engine = await engine.save();

            task.usagePeriodInHour = -1;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12045, remarks: "RAS", _uiId:"entry_01", ack: true });
            entry1.equipmentId = engine._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(11, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12155, remarks: "RAS", _uiId:"entry_02", ack: true });
            entry2.equipmentId = engine._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let now3 = moment();
            let entry3 = new Entries({ name: "My third entry", date: now3.toDate().toString(), age: 12253, remarks: "RAS", _uiId:"entry_03", ack: false });
            entry3.equipmentId = engine._id;
            entry3.taskId = task._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", userJWT);

            // Assert
            res.body.tasks[0].level.should.be.eql(2);
        });

        it('it should get a task with a level 3 because the task is overdue', async () => {
            // Arrange
            engine.age = 12345;
            engine = await engine.save();

            task.usagePeriodInHour = -1;
            task = await task.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12045, remarks: "RAS", _uiId:"entry_01", ack: true });
            entry1.equipmentId = engine._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(13, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12155, remarks: "RAS", _uiId:"entry_02", ack: true });
            entry2.equipmentId = engine._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let now3 = moment();
            let entry3 = new Entries({ name: "My third entry", date: now3.toDate().toString(), age: 12253, remarks: "RAS", _uiId:"entry_03", ack: false });
            entry3.equipmentId = engine._id;
            entry3.taskId = task._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", userJWT);

            // Assert
            res.body.tasks[0].level.should.be.eql(3);
        });

        it('it should get a task with a level 3 because the task is overdue', async () => {
            // Arrange
            engine.age = 12345;
            engine = await engine.save();

            let now1 = moment();
            now1.subtract(2, 'years');
            let entry1 = new Entries({ name: "My first entry", date: now1.toDate().toString(), age: 12045, remarks: "RAS", _uiId:"entry_01", ack: true });
            entry1.equipmentId = engine._id;
            entry1.taskId = task._id;
            entry1 = await entry1.save();

            let now2 = moment();
            now2.subtract(3, 'month');
            let entry2 = new Entries({ name: "My second entry", date: now2.toDate().toString(), age: 12135, remarks: "RAS", _uiId:"entry_02", ack: true });
            entry2.equipmentId = engine._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let now3 = moment();
            let entry3 = new Entries({ name: "My third entry", date: now3.toDate().toString(), age: 12253, remarks: "RAS", _uiId:"entry_03", ack: false });
            entry3.equipmentId = engine._id;
            entry3.taskId = task._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).get(getTasksUrl).set("Authorization", userJWT);

            // Assert
            res.body.tasks[0].level.should.be.eql(3);
        });
    });

    describe('/POST/:equipmentId new task', () => {

        it('it should GET a 200 http code as a result because the task was return successfully', async () => {
            // Arrange
            let task = {name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId: "asdggg"};

            // Act
            let res = await chai.request(app).post(`/api/tasks/${boat._uiId}/${engine._uiId}/${task._uiId}`).send({task: task}).set("Authorization", userJWT);

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
            let task = { usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01" };

            // Act
            let res = await chai.request(app).post(`/api/tasks/${boat._uiId}/${engine._uiId}/${task._uiId}`).send({task: task}).set("Authorization", userJWT);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("isrequired");
        });

        it('it should GET a 200 http code as a result even when the task usagePeriodInHour was missing', async () => {
            // Arrange
            let task = { name:"Vidange", periodInMonth:12, description:"Faire la vidange", _uiId:"task_01" };

            // Act
            let res = await chai.request(app).post(`/api/tasks/${boat._uiId}/${engine._uiId}/${task._uiId}`).send({task: task}).set("Authorization", userJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("task");
            res.body.task.should.be.a("object");
            res.body.task.should.have.property("name");
            res.body.task.should.not.have.property("usagePeriodInHour");
            res.body.task.should.have.property("periodInMonth");
            res.body.task.should.have.property("description");
            res.body.task.should.have.property("_uiId");
            res.body.task.should.not.have.property("_id");

            res.body.task.name.should.be.eql("Vidange");
            res.body.task.periodInMonth.should.be.eql(12);
            res.body.task.description.should.be.eql("Faire la vidange");
            res.body.task._uiId.should.be.eql("task_01");
        });

        it('it should GET a 200 http code as a result because the task usagePeriodInHour was missing but its equipment is using only time and no usage tracking', async () => {
            // Arrange
            engine.ageAcquisitionType = AgeAcquisitionType.time;
            engine = await engine.save();

            let task = { name:"Vidange", periodInMonth:12, description:"Faire la vidange", _uiId:"task_01" };

            // Act
            let res = await chai.request(app).post(`/api/tasks/${boat._uiId}/${engine._uiId}/${task._uiId}`).send({task: task}).set("Authorization", userJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.not.have.property("errors");
        });

        it('it should GET a 422 http code as a result because the task month was missing', async () => {
            // Arrange
            let task = { name:"Vidange", usagePeriodInHour:200, description:"Faire la vidange", _uiId:"task_01" };

            // Act
            let res = await chai.request(app).post(`/api/tasks/${boat._uiId}/${engine._uiId}/${task._uiId}`).send({task: task}).set("Authorization", userJWT);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("periodInMonth");
            res.body.errors.periodInMonth.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task description was missing', async () => {
            // Arrange
            let task = { name:"Vidange", usagePeriodInHour:200, periodInMonth:12, _uiId: "task_01"};

            // Act
            let res = await chai.request(app).post(`/api/tasks/${boat._uiId}/${engine._uiId}/${task._uiId}`).send({task: task}).set("Authorization", userJWT);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("description");
            res.body.errors.description.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the task _uiId was missing', async () => {
            // Arrange
            let task = { name:"Vidange", usagePeriodInHour:200, periodInMonth:12};

            // Act
            let res = await chai.request(app).post(`/api/tasks/${boat._uiId}/${engine._uiId}/a_task_uiId`).send({task: task}).set("Authorization", userJWT);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("_uiId");
            res.body.errors.description.should.be.eql("isrequired");
        });
    });

    describe('/POST/:equipmentId/:taskId change a task', () => {
        let task: ITasks;
        let postTaskUrl: string;

        beforeEach(async() => {
            task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = engine._id;
            task = await task.save();

            postTaskUrl = `/api/tasks/${boat._uiId}/${engine._uiId}/${task._uiId}`;
        });

        it('it should get a 200 http code as a result because the task changed successfully', async () => {
            // Arrange
            let jsonTask = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post(postTaskUrl).send({task: jsonTask}).set("Authorization", userJWT);

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
            let jsonTask = {usagePeriodInHour:300};
            
            // Act
            let res = await chai.request(app).post(postTaskUrl).send({task: jsonTask}).set("Authorization", userJWT);

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
            let jsonTask = {periodInMonth:24};
            
            // Act
            let res = await chai.request(app).post(postTaskUrl).send({task: jsonTask}).set("Authorization", userJWT);

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
            let jsonTask = {description:"Bien Faire la vidange"};
            
            // Act
            let res = await chai.request(app).post(postTaskUrl).send({task: jsonTask}).set("Authorization", userJWT);

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
            let task2 = new Tasks({name:"Vidange d'huile", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_02"});
            task2.equipmentId = engine._id;
            task2 = await task2.save();

            let jsonTask = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post(postTaskUrl).send({task: jsonTask}).set("Authorization", userJWT);

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("alreadyexisting");
        });
    });

    describe('/DELETE/:equipmentId/:taskId delete task', () => {
        let task: ITasks;
        let deleteTaskUrl: string;

        beforeEach(async() => {
            task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = engine._id;
            task = await task.save();

            deleteTaskUrl = `/api/tasks/${boat._uiId}/${engine._uiId}/${task._uiId}`;
        });

        it('it should get a 200 http code as a result because the task was deleted successfully', async () => {
            // Arrange
            let entry2 = new Entries({ name: "My second entry", date: new Date().toString(), age: 12346, remarks: "RAS2", _uiId:"entry_01" });
            entry2.equipmentId = engine._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let entry3 = new Entries({ name: "My third entry", date: new Date().toString(), age: 12347, remarks: "RAS3", _uiId:"entry_02" });
            entry3.equipmentId = engine._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).delete(deleteTaskUrl).set("Authorization", userJWT);

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
            await task.remove();

            // Act
            let res = await chai.request(app).delete(deleteTaskUrl).set("Authorization", userJWT);

            // Assert
            res.should.have.status(400);
        });

        it('it should get a 400 http code as a result because the task does not exist', async () => {
            // Arrange
            let waterMaker = new Equipments({name: "Watermaker", brand:"Katadin", model:"PowerSurvivor", age:1234, installation:"2018/01/20"});
            waterMaker.assetId = boat._id;
            waterMaker = await waterMaker.save();

            task.equipmentId = waterMaker._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).delete(deleteTaskUrl).set("Authorization", userJWT);

            // Assert
            res.should.have.status(400);
        });
    });
});