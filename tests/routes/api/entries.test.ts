//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import server from '../../../src/server';
const app = server.app;

const chai = require('chai')
  , chaiHttp = require('chai-http');
 
chai.use(chaiHttp);
const expect = chai.expect;
const should = chai.should();

import Users from '../../../src/models/Users';
import Equipments from '../../../src/models/Equipments';
import Tasks from '../../../src/models/Tasks';
import Entries from '../../../src/models/Entries';

describe('Entries', () => {
    afterEach(async () => {
        await Entries.deleteMany({}); 
        await Tasks.deleteMany({}); 
        await Equipments.deleteMany({});  
        await Users.deleteMany({});  
    });

    describe('/GET/:equipmentUiId entries', () => {
        it('it should GET a 200 http code as a result because entries were returned successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" , _uiId:"entry_01"});
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let task2 = new Tasks({name:"Vidange2", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId:"task_02"});
            task2.equipmentId = boat._id;
            task2 = await task2.save();

            let entry2 = new Entries({ name: "My second entry", date: new Date().toString(), age: 12346, remarks: "RAS2", _uiId:"entry_02" });
            entry2.equipmentId = boat._id;
            entry2.taskId = task2._id;
            entry2 = await entry2.save();

            let entry3 = new Entries({ name: "My third entry", date: new Date().toString(), age: 12347, remarks: "RAS3", _uiId:"entry_03" });
            entry3.equipmentId = boat._id;
            entry3 = await entry3.save();

            // Act
            let res = await chai.request(app).get('/api/entries/' + boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entries");
            res.body.entries.should.be.a("array");
            res.body.entries.length.should.be.eql(3);

            res.body.entries[0].should.have.property("name");
            res.body.entries[0].name.should.be.eql("My first entry");

            res.body.entries[0].should.have.property("date");

            res.body.entries[0].should.have.property("age");
            res.body.entries[0].age.should.be.eql(12345);

            res.body.entries[0].should.have.property("remarks");
            res.body.entries[0].remarks.should.be.eql("RAS");

            res.body.entries[0].should.have.property("_uiId");
            res.body.entries[0]._uiId.should.be.eql("entry_01");

            res.body.entries[0].should.have.property("equipmentUiId");
            res.body.entries[0].equipmentUiId.should.be.eql("boat_01");

            res.body.entries[0].should.not.have.property("_id");
            res.body.entries[0].should.not.have.property("equipmentId");

            res.body.entries[1].should.have.property("name");
            res.body.entries[1].name.should.be.eql("My second entry");

            res.body.entries[1].should.have.property("date");

            res.body.entries[1].should.have.property("age");
            res.body.entries[1].age.should.be.eql(12346);

            res.body.entries[1].should.have.property("remarks");
            res.body.entries[1].remarks.should.be.eql("RAS2");

            res.body.entries[1].should.have.property("_uiId");
            res.body.entries[1]._uiId.should.be.eql("entry_02");

            res.body.entries[1].should.have.property("equipmentUiId");
            res.body.entries[1].equipmentUiId.should.be.eql("boat_01");


            res.body.entries[2].should.have.property("name");
            res.body.entries[2].name.should.be.eql("My third entry");

            res.body.entries[2].should.have.property("date");

            res.body.entries[2].should.have.property("age");
            res.body.entries[2].age.should.be.eql(12347);

            res.body.entries[2].should.have.property("remarks");
            res.body.entries[2].remarks.should.be.eql("RAS3");

            res.body.entries[2].should.have.property("_uiId");
            res.body.entries[2]._uiId.should.be.eql("entry_03");

            res.body.entries[2].should.have.property("equipmentUiId");
            res.body.entries[2].equipmentUiId.should.be.eql("boat_01");
        });

        it('it should GET a 400 http code as a result because the user does not exist', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId:"entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._uiId.toString()).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the current user is not the boat owner', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            fakeUser = await fakeUser.save();

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._uiId.toString()).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the boat does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task01"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });
    });

    describe('/GET/:equipmentUiId/:taskUiId entries', () => {
        it('it should GET a 200 http code as a result because entries were returned successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            // Act
            let res = await chai.request(app).get('/api/entries/' + boat._uiId.toString() + '/' + task._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entries");
            res.body.entries.should.be.a("array");
            res.body.entries.length.should.be.eql(1);

            res.body.entries[0].should.have.property("name");
            res.body.entries[0].name.should.be.eql("My first entry");

            res.body.entries[0].should.have.property("date");

            res.body.entries[0].should.have.property("age");
            res.body.entries[0].age.should.be.eql(12345);

            res.body.entries[0].should.have.property("remarks");
            res.body.entries[0].remarks.should.be.eql("RAS");

            res.body.entries[0].should.have.property("_uiId");
            res.body.entries[0]._uiId.should.be.eql("entry_01");

            res.body.entries[0].should.have.property("equipmentUiId");
            res.body.entries[0].equipmentUiId.should.be.eql("boat_01");

            res.body.entries[0].should.not.have.property("_id");
            res.body.entries[0].should.not.have.property("equipmentId");
        });

        it('it should GET entries sorted by date', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId:"task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entryA = new Entries({ name: "My first entry", date: new Date("01/01/2017").toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });//
            entryA.equipmentId = boat._id;
            entryA.taskId = task._id;
            entryA = await entryA.save();

            let entryB = new Entries({ name: "My second entry", date: new Date("01/01/2018", ).toString(), age: 12345, remarks: "RAS", _uiId: "entry_02" });
            entryB.equipmentId = boat._id;
            entryB.taskId = task._id;
            entryB = await entryB.save();

            // Act
            let res = await chai.request(app).get('/api/entries/' + boat._uiId.toString() + '/' + task._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            const entry0Date = new Date(res.body.entries[0].date);
            const entry1Date = new Date(res.body.entries[1].date);
            entryA.date.should.be.eql(entry0Date);
            entryB.date.should.be.eql(entry1Date);
        });

        it('it should GET entries sorted by date', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entryB = new Entries({ name: "My second entry", date: new Date("01/01/2018", ).toString(), age: 12345, remarks: "RAS", _uiId: "entry_02" });
            entryB.equipmentId = boat._id;
            entryB.taskId = task._id;
            entryB = await entryB.save();

            let entryA = new Entries({ name: "My first entry", date: new Date("01/01/2017").toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });//
            entryA.equipmentId = boat._id;
            entryA.taskId = task._id;
            entryA = await entryA.save();

            // Act
            let res = await chai.request(app).get('/api/entries/' + boat._uiId.toString() + '/' + task._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            const entry0Date = new Date(res.body.entries[0].date);
            const entry1Date = new Date(res.body.entries[1].date);
            entryA.date.should.be.eql(entry0Date);
            entryB.date.should.be.eql(entry1Date);
        });

        it('it should GET a 400 http code as a result because the user does not exist', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the current user is not the boat owner', async () => {
            // Arrange
            let fakeUser = new Users({ name: "t", firstname: "p", email: "tp@gmail.com" });
            fakeUser.setPassword("test");
            fakeUser = await fakeUser.save();

            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString()).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should GET a 400 http code as a result because the boat does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });
    });

    describe('/POST/:equipmentUiId/:taskUiId new entry', () => {
        it('it should GET a 200 http code as a result because the entry was return successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { name: "My first vidange", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: '123456' }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.have.property("equipmentUiId");
            res.body.entry.should.not.have.property("taskId");
            res.body.entry.should.not.have.property("equipmentId");
            res.body.entry.should.have.property("name");
            res.body.entry.should.have.property("date");
            res.body.entry.should.have.property("age");
            res.body.entry.should.have.property("remarks");
            res.body.entry.should.have.property("_uiId");
            res.body.entry.should.not.have.property("_id");

            res.body.entry.name.should.be.eql("My first vidange",);
            res.body.entry.age.should.be.eql(12345);
            res.body.entry.remarks.should.be.eql("RAS");
            res.body.entry.equipmentUiId.should.be.eql(boat._uiId.toString());
            res.body.entry._uiId.should.be.eql('123456');
        });

        it('it should GET a 200 http code as a result because the orphan entry was return successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let entry = { name: "My first vidange", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId:"123456" }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/-').send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.not.have.property("equipmentId");
            res.body.entry.should.have.property("equipmentUiId");
            res.body.entry.should.have.property("name");
            res.body.entry.should.have.property("date");
            res.body.entry.should.have.property("age");
            res.body.entry.should.have.property("remarks");
            res.body.entry.should.have.property("_uiId");

            res.body.entry.name.should.be.eql("My first vidange",);
            res.body.entry.age.should.be.eql(12345);
            res.body.entry.remarks.should.be.eql("RAS");
            res.body.entry.equipmentUiId.should.be.eql(boat._uiId.toString());
            res.body.entry._uiId.should.be.eql("123456");
        });

        it('it should GET a 422 http code as a result because the entry _uiId was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { date: new Date().toString(), age: 12345, remarks: "RAS" }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("_uiId");
            res.body.errors._uiId.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the entry name was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the entry date was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { name: "My first vidange", age: 12345, remarks: "RAS", _uiId: "entry_01" };

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("date");
            res.body.errors.date.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the entry age was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { name: "My first vidange", date: new Date().toString(), remarks: "RAS", _uiId: "entry_01" };

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("age");
            res.body.errors.age.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the entry remarks was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { name: "My first vidange", date: new Date().toString(), age: 12345, _uiId: "entry_01" };

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("remarks");
            res.body.errors.remarks.should.be.eql("isrequired");
        });
    });

    describe('/POST/:equipmentUiId/:taskUiId/:entryUiId change an entry', () => {
        it('it should get a 200 http code as a result because the orphan entry name changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry = await entry.save();

            let jsonEntry = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/-/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.have.property("name");
            res.body.entry.should.have.property("date");
            res.body.entry.should.have.property("age");
            res.body.entry.should.have.property("remarks");

            res.body.entry.name.should.be.eql("Vidange d'huile");
            res.body.entry.age.should.be.eql(12345);
            res.body.entry.remarks.should.be.eql("RAS");
        });

        it('it should get a 200 http code as a result because the entry name changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.have.property("name");
            res.body.entry.should.have.property("date");
            res.body.entry.should.have.property("age");
            res.body.entry.should.have.property("remarks");

            res.body.entry.name.should.be.eql("Vidange d'huile");
            res.body.entry.age.should.be.eql(12345);
            res.body.entry.remarks.should.be.eql("RAS");
        });

        it('it should get a 200 http code as a result because the entry date changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = { date: "2018-10-12" };
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.have.property("name");
            res.body.entry.should.have.property("date");
            res.body.entry.should.have.property("age");
            res.body.entry.should.have.property("remarks");

            res.body.entry.name.should.be.eql("My first entry");
            res.body.entry.date.should.be.eql( "2018-10-12T00:00:00.000Z");
            res.body.entry.age.should.be.eql(12345);
            res.body.entry.remarks.should.be.eql("RAS");
        });

        it('it should get a 200 http code as a result because the entry age changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = { age: 100 };
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.have.property("name");
            res.body.entry.should.have.property("date");
            res.body.entry.should.have.property("age");
            res.body.entry.should.have.property("remarks");

            res.body.entry.name.should.be.eql("My first entry");
            res.body.entry.age.should.be.eql(100);
            res.body.entry.remarks.should.be.eql("RAS");
        });

        it('it should get a 200 http code as a result because the entry remarks changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = { remarks: "remarks" };
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.have.property("name");
            res.body.entry.should.have.property("date");
            res.body.entry.should.have.property("age");
            res.body.entry.should.have.property("remarks");

            res.body.entry.name.should.be.eql("My first entry");
            res.body.entry.age.should.be.eql(12345);
            res.body.entry.remarks.should.be.eql("remarks");
        });

        it('it should get a 401 http code as a result because the entry does not belong to the boat of the request', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let boat2 = new Equipments({name: "Albatros", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_02"});
            boat2.ownerId = user._id;
            boat2 = await  boat2.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat2._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat2._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });

        it('it should get a 400 http code as a result because the entry does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId =  user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            
            let jsonEntry = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).send({ entry: jsonEntry }).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });

    });

    describe('/DELETE/:equipmentId/:taskId/:entryId delete entry', () => {
        it('it should get a 200 http code as a result because the orphan entry was deleted successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry = await entry.save();

            // Act
            let res = await chai.request(app).delete('/api/entries/'+ boat._uiId.toString() + '/-/' + entry._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.not.have.property("_id");
            res.body.entry.should.have.property("_uiId");
            res.body.entry._uiId.should.be.eql(entry._uiId.toString());
        });

        it('it should get a 200 http code as a result because the entry was deleted successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            // Act
            let res = await chai.request(app).delete('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.not.have.property("_id");
            res.body.entry.should.have.property("_uiId");
            res.body.entry._uiId.should.be.eql(entry._uiId.toString());
        });

        it('it should get a 400 http code as a result because the entry does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId: "boat_01"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS", _uiId: "entry_01" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            
            // Act
            let res = await chai.request(app).delete('/api/entries/'+ boat._uiId.toString() + '/' + task._uiId.toString() + '/' + entry._uiId.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });
    });
});