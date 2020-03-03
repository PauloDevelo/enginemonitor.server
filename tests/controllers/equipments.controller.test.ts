//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
import ignoredErrorMessages, {restoreLogger, mockLogger} from '../MockLogger';

import server from '../../src/server';
const app = server.app;

import mongoose from 'mongoose';

const chai = require('chai')
  , chaiHttp = require('chai-http');
 
chai.use(chaiHttp);
const expect = chai.expect;
const should = chai.should();

import Users, {IUser} from '../../src/models/Users';
import Equipments, { AgeAcquisitionType, IEquipments } from '../../src/models/Equipments';
import Tasks from '../../src/models/Tasks';
import Entries from '../../src/models/Entries';
import Assets, { IAssets } from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';

describe('Equipments', () => {
    let user: IUser;
    let userJWT: string;

    let roUser: IUser;
    let roUserJWT: string;

    let boat: IAssets;

    before(() => {
        mockLogger();
        ignoredErrorMessages.push("[object Object]");
        ignoredErrorMessages.push("No authorization token was found");
        ignoredErrorMessages.push("jwt expired");
    });

    after(() => {
        restoreLogger();
    });

    beforeEach(async() => {
        user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
        user.setPassword("test");
        user = await user.save();
        userJWT = `Token ${user.generateJWT()}`;

        roUser = new Users({ name: "read", firstname: "only", email: "read.only@gmail.com" });
        roUser.setPassword("test");
        roUser = await roUser.save();
        roUserJWT = `Token ${roUser.generateJWT()}`;

        boat = new Assets({_uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',});
        boat = await boat.save();

        let assetUserLink = new AssetUser({ assetId: boat._id, userId: user._id });
        assetUserLink = await assetUserLink.save();

        let assetRoUserLink = new AssetUser({ assetId: boat._id, userId: roUser._id, readonly: true });
        assetRoUserLink = await assetRoUserLink.save();
    })

    afterEach(async () => {
        await Assets.deleteMany({});
        await AssetUser.deleteMany({});
        await Equipments.deleteMany({});  
        await Users.deleteMany({});     
        await Tasks.deleteMany({});
        await Entries.deleteMany({});

    });

    describe('/GET equipments', () => {
        let equipment: IEquipments;

        beforeEach(async() => {
            equipment = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01" });
            equipment.assetId = boat._id;
            equipment = await equipment.save();
        });

        it('it should GET a 401 http code as a result because the request does not have the token', async () => {

            // Act
            let res = await chai.request(app).get(`/api/equipments/${boat._uiId}`);

            // Assert
            res.should.have.status(401);
            res.body.errors.message.should.be.eql("No authorization token was found");
            res.body.errors.error.name.should.be.eql("UnauthorizedError");
            res.body.errors.error.code.should.be.eql("credentials_required");
            res.body.errors.error.status.should.be.eql(401);
        });

        it('it should get a 400 http code as a result because the token is invalid', async () => {
            // Arrange
            await user.remove();

            // Act
            let res = await chai.request(app).get(`/api/equipments/${boat._uiId}`).set("Authorization", userJWT);

            // Assert
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("authentication");
            res.body.errors.authentication.should.be.eql("error");
        });

        it('it should get a 401 http code as a result because the token is expired', async () => {
            // Arrange
            const expiredToken = "Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdWwudG9ycnVlbGxhQGdtYWlsLmNvbSIsImlkIjoiNWMyNWJmYmY1NDE4ZTM0ZGJjN2I5ZTkzIiwiZXhwIjoxNTUxMTYxNzkxLCJpYXQiOjE1NDU5Nzc3OTF9.uBge-2VvmJiweF-jCPOcLonn0ewBlNjy9wm6mFdSVQo";
            
            // Act
            let res = await chai.request(app).get(`/api/equipments/${boat._uiId}`).set("Authorization", expiredToken);

            // Assert
            res.should.have.status(401);
        });

        it('it should GET a 200 http code as a result and a equipment because we set the correct token', async () => {
            // Arrange
            
            // Act
            let res = await chai.request(app).get(`/api/equipments/${boat._uiId}`).set("Authorization", userJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipments");
            res.body.equipments.should.be.a("array");
            res.body.equipments.length.should.be.eql(1);

            res.body.equipments[0].should.have.property("name");
            res.body.equipments[0].name.should.be.eql("Arbutus");

            res.body.equipments[0].should.have.property("brand");
            res.body.equipments[0].brand.should.be.eql("Nanni");
            
            res.body.equipments[0].should.have.property("model");
            res.body.equipments[0].model.should.be.eql("N3.30");

            res.body.equipments[0].should.have.property("age");
            res.body.equipments[0].age.should.be.eql(1234);

            res.body.equipments[0].should.have.property("_uiId");
            res.body.equipments[0]._uiId.should.be.eql("boat_01");
        });

        it('it should GET a 200 http code as a result and a equipment because we set a read only user token', async () => {
            // Arrange
            
            // Act
            let res = await chai.request(app).get(`/api/equipments/${boat._uiId}`).set("Authorization", roUserJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipments");
            res.body.equipments.should.be.a("array");
            res.body.equipments.length.should.be.eql(1);

            res.body.equipments[0].should.have.property("name");
            res.body.equipments[0].name.should.be.eql("Arbutus");

            res.body.equipments[0].should.have.property("brand");
            res.body.equipments[0].brand.should.be.eql("Nanni");
            
            res.body.equipments[0].should.have.property("model");
            res.body.equipments[0].model.should.be.eql("N3.30");

            res.body.equipments[0].should.have.property("age");
            res.body.equipments[0].age.should.be.eql(1234);

            res.body.equipments[0].should.have.property("_uiId");
            res.body.equipments[0]._uiId.should.be.eql("boat_01");
        });
    });

    describe('POST equipments', () => {
        it('it should get a 401 http code as a result because the request does not have the token', async () => {
            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}`);
            
            // Assert
            res.should.have.status(401);
            res.body.errors.message.should.be.eql("No authorization token was found");
            res.body.errors.error.name.should.be.eql("UnauthorizedError");
            res.body.errors.error.code.should.be.eql("credentials_required");
            res.body.errors.error.status.should.be.eql(401);
        });

        it('it should get a 400 http code as a result because the token is invalid', async () => {
            // Arrange
            await user.remove();
                
            let equipment = { name: "Arbutus", brand: "Nanni", model: "N3.30", age: 1234, installation: "2018-01-09T23:00:00.000Z", _uiId:"boat_01" };

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}`).send({equipment:equipment}).set("Authorization", userJWT);
            
            // Assert
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("authentication");
            res.body.errors.authentication.should.be.eql("error");
        });

        it('it should get a 200 http code as a result because the equipment was successfully created', async () => {
            // Arrange
            let equipment = { name: "Arbutus", brand: "Nanni", model: "N3.30", age: 1234, installation: "2018-01-09T23:00:00.000Z", ageAcquisitionType:AgeAcquisitionType.manualEntry, ageUrl:'', _uiId:'123456' };

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${equipment._uiId}`).send({equipment:equipment}).set("Authorization", userJWT);
            
            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.have.property("name");
            res.body.equipment.should.have.property("brand");
            res.body.equipment.should.have.property("model");
            res.body.equipment.should.have.property("age");
            res.body.equipment.should.have.property("installation");
            res.body.equipment.should.not.have.property("_id");
            res.body.equipment.should.not.have.property("ownerId");
            res.body.equipment.should.have.property("ageAcquisitionType");
            res.body.equipment.should.have.property("ageUrl");
            res.body.equipment.should.have.property("_uiId");

            res.body.equipment.name.should.be.eql("Arbutus");
            res.body.equipment.brand.should.be.eql("Nanni");
            res.body.equipment.model.should.be.eql("N3.30");
            res.body.equipment.age.should.be.eql(1234);
            res.body.equipment.installation.should.be.eql("2018-01-09T23:00:00.000Z");
            res.body.equipment.ageAcquisitionType.should.be.eql(AgeAcquisitionType.manualEntry);  
            res.body.equipment.ageUrl.should.be.eql('');
            res.body.equipment._uiId.should.be.eql('123456');
        });

        it('it should get a 400 http code credential error as a result because the user is readonly', async () => {
            // Arrange
            let equipment = { name: "Arbutus", brand: "Nanni", model: "N3.30", age: 1234, installation: "2018-01-09T23:00:00.000Z", ageAcquisitionType:AgeAcquisitionType.manualEntry, ageUrl:'', _uiId:'123456' };

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${equipment._uiId}`).send({equipment:equipment}).set("Authorization", roUserJWT);
            
            // Assert
            res.should.have.status(400);
            res.body.errors.should.be.eql('credentialError');
        });

        it('it should get a 422 http error code because there is already an equipment with the same name', async () => {
            // Arrange
            let equipment = { name: "Arbutus", brand: "Nanni", model: "N3.30", age: 1234, installation: "2018-01-09T23:00:00.000Z", ageAcquisitionType:AgeAcquisitionType.manualEntry, ageUrl:'', _uiId:'fvvaqrtkmint' };
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${equipment._uiId}`).send({equipment:equipment}).set("Authorization", userJWT);

            let equipment2 = { name: "Arbutus", brand: "Nanni", model: "N3.30", age: 1234, installation: "2018-01-09T23:00:00.000Z", ageAcquisitionType:AgeAcquisitionType.manualEntry, ageUrl:'', _uiId:'asdfdfas' };

            // Act
            res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${equipment2._uiId}`).send({equipment:equipment2}).set("Authorization", userJWT);
            
            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.be.eql("alreadyexisting");
        });
    })

    describe('POST/:equipmentId equipment', () => {
        let engine: IEquipments;

        beforeEach(async() => {
            engine = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01", assetId: boat._id});
            engine = await engine.save();
        });

        it('it should get a 200 http code as a result because the equipment age was successfully modified', async () => {
            // Arrange
            const modifications = {equipment:{age:1235}};

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${engine._uiId}`).send(modifications).set("Authorization", userJWT);
            
            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("age");
            res.body.equipment.age.should.be.eql(1235);
        });

        it('it should get a 200 http code as a result because the equipment name was successfully modified', async () => {
            // Arrange
            const modifications = {equipment:{name:'Arbatros'}};

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${engine._uiId}`).send(modifications).set("Authorization", userJWT);
            
            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("name");
            res.body.equipment.name.should.be.eql('Arbatros');
        });

        it('it should get a 200 http code as a result because the equipment brand was successfully modified', async () => {
            // Arrange
            const modifications = {equipment:{brand:'Nanni Diesel'}};

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${engine._uiId}`).send(modifications).set("Authorization", userJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("brand");
            res.body.equipment.brand.should.be.eql('Nanni Diesel');
        });

        it('it should get a 200 http code as a result because the equipment model was successfully modified', async () => {
            // Arrange
            const modifications = {equipment:{model:'3.30'}};

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${engine._uiId}`).send(modifications).set("Authorization", userJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("model");
            res.body.equipment.model.should.be.eql('3.30');
        });

        it('it should get a 200 http code as a result because the equipment age acquisition type was successfully modified', async () => {
            // Arrange
            const modifications = {equipment:{ageAcquisitionType:2}};

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${engine._uiId}`).send(modifications).set("Authorization", userJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");
            res.body.equipment.should.have.property("ageAcquisitionType");
            res.body.equipment.ageAcquisitionType.should.be.eql(2);
        });

        it('it should get a 400 http code credential error as a result because the user is readonly', async () => {
            // Arrange
            const modifications = {equipment:{ageAcquisitionType:2}};

            // Act
            let res = await chai.request(app).post(`/api/equipments/${boat._uiId}/${engine._uiId}`).send(modifications).set("Authorization", roUserJWT);

            // Assert
            res.should.have.status(400);
            res.body.errors.should.be.eql('credentialError');
        });
    });

    describe('DELETE/:equipmentId equipment', () => {
        let engine: IEquipments;

        beforeEach(async() => {
            engine = new Equipments({name: "Arbutus", brand:"Nanni", model:"N3.30", age:1234, installation:"2018/01/20", _uiId:"boat_01", assetId: boat._id});
            engine = await engine.save();
        });

        it('it should get a 200 http code as a result because the equipment was successfully deleted', async () => {
            // Arrange
            let task = new Tasks({name:"Vidange", usagePeriodInHour:200, periodInMonth:12, description:"Faire la vidange", _uiId: "task_01"});
            task.equipmentId = engine._id;
            task = await task.save();

            let entry2 = new Entries({ name: "My second entry", date: new Date().toString(), age: 12346, remarks: "RAS2", _uiId: "entry_01" });
            entry2.equipmentId = engine._id;
            entry2.taskId = task._id;
            entry2 = await entry2.save();

            let entry3 = new Entries({ name: "My third entry", date: new Date().toString(), age: 12347, remarks: "RAS3", _uiId: "entry-02" });
            entry3.equipmentId = engine._id;
            entry3 = await entry3.save();

            let nbTasks = await Tasks.countDocuments({});
            nbTasks.should.be.eql(1);

            let nbEntries = await Entries.countDocuments({});
            nbEntries.should.be.eql(2);

            // Act
            let res = await chai.request(app).delete(`/api/equipments/${boat._uiId}/${engine._uiId}`).set("Authorization", userJWT);

            // Assert
            res.should.have.status(200);
            res.body.should.have.property("equipment");
            res.body.equipment.should.be.a("object");

            res = await chai.request(app).get(`/api/equipments/${boat._uiId}`).set("Authorization", userJWT);
            res.should.have.status(200);
            res.body.should.have.property("equipments");
            res.body.equipments.should.be.a("array");
            res.body.equipments.length.should.be.eql(0);

            nbTasks = await Tasks.countDocuments({});
            nbTasks.should.be.eql(0);

            nbEntries = await Entries.countDocuments({});
            nbEntries.should.be.eql(0);
        });

        it('it should get a 400 http code credential error because the user is read only', async () => {
            // Arrange
            
            // Act
            let res = await chai.request(app).delete(`/api/equipments/${boat._uiId}/${engine._uiId}`).set("Authorization", roUserJWT);

            // Assert
            res.should.have.status(400);
            res.body.errors.should.be.eql('credentialError');
        });

        it('it should get a 400 http code as a result because the equipment does not exist', async () => {
            // Act
            let res = await chai.request(app).delete(`/api/equipments/${boat._uiId}/5c27912a9bc7e61fdcd2e82c`).set("Authorization", userJWT);

            // Assert
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.be.a("object");
            res.body.errors.should.have.property("entity");
            res.body.errors.entity.should.be.eql("notfound");
        });

        it('it should get a 400 http code as a result because the equipment requested is not own by the user', async () => {
            // Arrange
            let anotherUser = new Users({ name: "rs", firstname: "ps", email: "rs@gmail.com" });
            anotherUser.setPassword("test");
            anotherUser = await anotherUser.save();

            // Act
            let res = await chai.request(app).delete(`/api/equipments/${boat._uiId}/${engine._uiId}`).set("Authorization", "Token " + anotherUser.generateJWT());

            // Assert
            res.should.have.status(400);
        });
    });
});