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

    describe('/GET/:equipmentId/:taskId entries', () => {
        it('it should GET a 200 http code as a result because entries were returned successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            // Act
            let res = await chai.request(app).get('/api/entries/' + boat._id.toString() + '/' + task._id.toString()).set("Authorization", "Token " + user.generateJWT());

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
        });

        it('it should GET entries sorted by date', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entryA = new Entries({ name: "My first entry", date: new Date("01/01/2017").toString(), age: 12345, remarks: "RAS" });//
            entryA.equipmentId = boat._id;
            entryA.taskId = task._id;
            entryA = await entryA.save();

            let entryB = new Entries({ name: "My second entry", date: new Date("01/01/2018", ).toString(), age: 12345, remarks: "RAS" });
            entryB.equipmentId = boat._id;
            entryB.taskId = task._id;
            entryB = await entryB.save();

            // Act
            let res = await chai.request(app).get('/api/entries/' + boat._id.toString() + '/' + task._id.toString()).set("Authorization", "Token " + user.generateJWT());

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

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entryB = new Entries({ name: "My second entry", date: new Date("01/01/2018", ).toString(), age: 12345, remarks: "RAS" });
            entryB.equipmentId = boat._id;
            entryB.taskId = task._id;
            entryB = await entryB.save();

            let entryA = new Entries({ name: "My first entry", date: new Date("01/01/2017").toString(), age: 12345, remarks: "RAS" });//
            entryA.equipmentId = boat._id;
            entryA.taskId = task._id;
            entryA = await entryA.save();

            // Act
            let res = await chai.request(app).get('/api/entries/' + boat._id.toString() + '/' + task._id.toString()).set("Authorization", "Token " + user.generateJWT());

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

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._id.toString() + '/' + task._id).set("Authorization", "Token " + fakeUser.generateJWT());

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

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._id.toString() + '/' + task._id.toString()).set("Authorization", "Token " + fakeUser.generateJWT());

            // Assert
            res.should.have.status(401);
        });

        it('it should GET a 400 http code as a result because the boat does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            // Act
            let res = await chai.request(app).get('/api/entries/'+ boat._id.toString() + '/' + task._id).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });
    });

    describe('/POST/:equipmentId/:taskId new entry', () => {
        it('it should GET a 200 http code as a result because the entry was return successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { name: "My first vidange", date: new Date().toString(), age: 12345, remarks: "RAS" }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.have.property("equipmentId");
            res.body.entry.should.have.property("taskId");
            res.body.entry.should.have.property("name");
            res.body.entry.should.have.property("date");
            res.body.entry.should.have.property("age");
            res.body.entry.should.have.property("remarks");

            res.body.entry.name.should.be.eql("My first vidange",);
            res.body.entry.age.should.be.eql(12345);
            res.body.entry.remarks.should.be.eql("RAS");
            res.body.entry.equipmentId.should.be.eql(boat._id.toString());
            res.body.entry.taskId.should.be.eql(task._id.toString());
        });

        it('it should GET a 422 http code as a result because the entry name was missing', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { date: new Date().toString(), age: 12345, remarks: "RAS" }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

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

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { name: "My first vidange", age: 12345, remarks: "RAS" }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

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

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { name: "My first vidange", date: new Date().toString(), remarks: "RAS" }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

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

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = { name: "My first vidange", date: new Date().toString(), age: 12345 }

            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString()).send({entry: entry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("remarks");
            res.body.errors.remarks.should.be.eql("isrequired");
        });
    });

    describe('/POST/:equipmentId/:taskId/:entryId change an entry', () => {
        it('it should get a 200 http code as a result because the entry changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString() + '/' + entry._id.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

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

        it('it should get a 200 http code as a result because the entry changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = { date: "2018-10-12" };
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString() + '/' + entry._id.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

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

        it('it should get a 200 http code as a result because the entry changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = { age: 100 };
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString() + '/' + entry._id.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

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

        it('it should get a 200 http code as a result because the entry changed successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = { remarks: "remarks" };
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString() + '/' + entry._id.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

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
            
            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let boat2 = new Equipments({name: "Albatros", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat2.ownerId = user._id;
            boat2 = await  boat2.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat2._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat2._id;
            entry.taskId = task._id;
            entry = await entry.save();

            let jsonEntry = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString() + '/' + entry._id.toString()).send({entry: jsonEntry}).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(401);
        });

        it('it should get a 400 http code as a result because the entry does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();
            
            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId =  user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            
            let jsonEntry = {name:"Vidange d'huile"};
            
            // Act
            let res = await chai.request(app).post('/api/entries/'+ boat._id.toString() + '/' + task._id.toString() + '/' + entry._id.toString()).send({ entry: jsonEntry }).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });

    });

    describe('/DELETE/:equipmentId/:taskId/:entryId delete entry', () => {
        it('it should get a 200 http code as a result because the entry was deleted successfully', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            entry = await entry.save();

            // Act
            let res = await chai.request(app).delete('/api/entries/'+ boat._id.toString() + '/' + task._id.toString() + '/' + entry._id.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("entry");
            res.body.entry.should.be.a("object");
            res.body.entry.should.have.property("_id");
            res.body.entry._id.should.be.eql(entry._id.toString());
        });

        it('it should get a 400 http code as a result because the entry does not exist', async () => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let boat = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20"});
            boat.ownerId = user._id;
            boat = await  boat.save();

            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodMonth:12, description:"Faire la vidange"});
            task.equipmentId = boat._id;
            task = await task.save();

            let entry = new Entries({ name: "My first entry", date: new Date().toString(), age: 12345, remarks: "RAS" });
            entry.equipmentId = boat._id;
            entry.taskId = task._id;
            
            // Act
            let res = await chai.request(app).delete('/api/entries/'+ boat._id.toString() + '/' + task._id.toString() + '/' + entry._id.toString()).set("Authorization", "Token " + user.generateJWT());

            // Assert
            res.should.have.status(400);
        });
    });
});