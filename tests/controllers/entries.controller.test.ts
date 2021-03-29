/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import chai from 'chai';
import chaiHttp from 'chai-http';
import ignoredErrorMessages, { restoreLogger, mockLogger } from '../MockLogger';

import server from '../../src/server';

import Users, { IUser } from '../../src/models/Users';
import Equipments, { IEquipments } from '../../src/models/Equipments';
import Tasks, { ITasks } from '../../src/models/Tasks';
import Entries, { IEntries } from '../../src/models/Entries';
import Assets, { IAssets } from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';

const { app } = server;

chai.use(chaiHttp);
const { expect } = chai;
const should = chai.should();

describe('Entries', () => {
  let user: IUser;
  let userJWT: string;

  let roUser: IUser;
  let roUserJWT: string;

  let boat: IAssets;
  let engine: IEquipments;
  let task: ITasks;

  before(() => {
    mockLogger();
    ignoredErrorMessages.push('[object Object]');
    ignoredErrorMessages.push('invalid signature');
  });

  after(() => {
    restoreLogger();
  });

  beforeEach('Set the minimum of data in the db', async () => {
    user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
    user.setPassword('test');
    user = await user.save();

    roUser = new Users({ name: 'read', firstname: 'only', email: 'read.only@gmail.com' });
    roUser.setPassword('test');
    roUser = await roUser.save();
    roUserJWT = `Token ${roUser.generateJWT()}`;

    boat = new Assets({
      _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
    });
    boat = await boat.save();

    userJWT = `Token ${user.generateJWT()}`;

    let assetUserLink = new AssetUser({ assetId: boat._id, userId: user._id });
    assetUserLink = await assetUserLink.save();

    let assetRoUserLink = new AssetUser({ assetId: boat._id, userId: roUser._id, readonly: true });
    assetRoUserLink = await assetRoUserLink.save();

    engine = new Equipments({
      name: 'Engine', brand: 'Nanni', model: 'N3.30', age: 1234, installation: '2018/01/20', _uiId: 'engine_01', assetId: boat._id,
    });
    engine = await engine.save();

    task = new Tasks({
      name: 'Vidange', usagePeriodInHour: 200, periodMonth: 12, description: 'Faire la vidange', _uiId: 'task_01', equipmentId: engine._id,
    });
    task = await task.save();
  });

  afterEach('Remove all the data in the db', async () => {
    await Promise.all([
      Assets.deleteMany({}),
      AssetUser.deleteMany({}),
      Entries.deleteMany({}),
      Tasks.deleteMany({}),
      Equipments.deleteMany({}),
      Users.deleteMany({}),
    ]);
  });

  describe('/GET/:equipmentUiId entries', () => {
    it('it should GET a 200 http code as a result because entries were returned successfully', async () => {
      // Arrange
      let entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01', equipmentId: engine._id, taskId: task._id,
      });
      entry = await entry.save();

      let task2 = new Tasks({
        name: 'Vidange2', usagePeriodInHour: 200, periodMonth: 12, description: 'Faire la vidange', _uiId: 'task_02',
      });
      task2.equipmentId = engine._id;
      task2 = await task2.save();

      let entry2 = new Entries({
        name: 'My second entry', date: new Date().toString(), age: 12346, remarks: 'RAS2', _uiId: 'entry_02',
      });
      entry2.equipmentId = engine._id;
      entry2.taskId = task2._id;
      entry2 = await entry2.save();

      let entry3 = new Entries({
        name: 'My third entry', date: new Date().toString(), age: 12347, remarks: 'RAS3', _uiId: 'entry_03',
      });
      entry3.equipmentId = engine._id;
      entry3 = await entry3.save();

      // Act
      const res = await chai.request(app).get(`/api/entries/${boat._uiId}/${engine._uiId}`).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entries');
      res.body.entries.should.be.a('array');
      res.body.entries.length.should.be.eql(3);

      res.body.entries[0].should.have.property('name');
      res.body.entries[0].name.should.be.eql('My first entry');

      res.body.entries[0].should.have.property('date');

      res.body.entries[0].should.have.property('age');
      res.body.entries[0].age.should.be.eql(12345);

      res.body.entries[0].should.have.property('remarks');
      res.body.entries[0].remarks.should.be.eql('RAS');

      res.body.entries[0].should.have.property('_uiId');
      res.body.entries[0]._uiId.should.be.eql('entry_01');

      res.body.entries[0].should.have.property('equipmentUiId');
      res.body.entries[0].equipmentUiId.should.be.eql('engine_01');

      res.body.entries[0].should.not.have.property('_id');
      res.body.entries[0].should.not.have.property('equipmentId');

      res.body.entries[1].should.have.property('name');
      res.body.entries[1].name.should.be.eql('My second entry');

      res.body.entries[1].should.have.property('date');

      res.body.entries[1].should.have.property('age');
      res.body.entries[1].age.should.be.eql(12346);

      res.body.entries[1].should.have.property('remarks');
      res.body.entries[1].remarks.should.be.eql('RAS2');

      res.body.entries[1].should.have.property('_uiId');
      res.body.entries[1]._uiId.should.be.eql('entry_02');

      res.body.entries[1].should.have.property('equipmentUiId');
      res.body.entries[1].equipmentUiId.should.be.eql('engine_01');

      res.body.entries[2].should.have.property('name');
      res.body.entries[2].name.should.be.eql('My third entry');

      res.body.entries[2].should.have.property('date');

      res.body.entries[2].should.have.property('age');
      res.body.entries[2].age.should.be.eql(12347);

      res.body.entries[2].should.have.property('remarks');
      res.body.entries[2].remarks.should.be.eql('RAS3');

      res.body.entries[2].should.have.property('_uiId');
      res.body.entries[2]._uiId.should.be.eql('entry_03');

      res.body.entries[2].should.have.property('equipmentUiId');
      res.body.entries[2].equipmentUiId.should.be.eql('engine_01');
    });

    it('it should GET a 200 http code as a result with the read only user as well', async () => {
      // Arrange
      let entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01', equipmentId: engine._id, taskId: task._id,
      });
      entry = await entry.save();

      let task2 = new Tasks({
        name: 'Vidange2', usagePeriodInHour: 200, periodMonth: 12, description: 'Faire la vidange', _uiId: 'task_02',
      });
      task2.equipmentId = engine._id;
      task2 = await task2.save();

      let entry2 = new Entries({
        name: 'My second entry', date: new Date().toString(), age: 12346, remarks: 'RAS2', _uiId: 'entry_02',
      });
      entry2.equipmentId = engine._id;
      entry2.taskId = task2._id;
      entry2 = await entry2.save();

      let entry3 = new Entries({
        name: 'My third entry', date: new Date().toString(), age: 12347, remarks: 'RAS3', _uiId: 'entry_03',
      });
      entry3.equipmentId = engine._id;
      entry3 = await entry3.save();

      // Act
      const res = await chai.request(app).get(`/api/entries/${boat._uiId}/${engine._uiId}`).set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entries');
      res.body.entries.should.be.a('array');
      res.body.entries.length.should.be.eql(3);

      res.body.entries[0].should.have.property('name');
      res.body.entries[0].name.should.be.eql('My first entry');

      res.body.entries[0].should.have.property('date');

      res.body.entries[0].should.have.property('age');
      res.body.entries[0].age.should.be.eql(12345);

      res.body.entries[0].should.have.property('remarks');
      res.body.entries[0].remarks.should.be.eql('RAS');

      res.body.entries[0].should.have.property('_uiId');
      res.body.entries[0]._uiId.should.be.eql('entry_01');

      res.body.entries[0].should.have.property('equipmentUiId');
      res.body.entries[0].equipmentUiId.should.be.eql('engine_01');

      res.body.entries[0].should.not.have.property('_id');
      res.body.entries[0].should.not.have.property('equipmentId');

      res.body.entries[1].should.have.property('name');
      res.body.entries[1].name.should.be.eql('My second entry');

      res.body.entries[1].should.have.property('date');

      res.body.entries[1].should.have.property('age');
      res.body.entries[1].age.should.be.eql(12346);

      res.body.entries[1].should.have.property('remarks');
      res.body.entries[1].remarks.should.be.eql('RAS2');

      res.body.entries[1].should.have.property('_uiId');
      res.body.entries[1]._uiId.should.be.eql('entry_02');

      res.body.entries[1].should.have.property('equipmentUiId');
      res.body.entries[1].equipmentUiId.should.be.eql('engine_01');

      res.body.entries[2].should.have.property('name');
      res.body.entries[2].name.should.be.eql('My third entry');

      res.body.entries[2].should.have.property('date');

      res.body.entries[2].should.have.property('age');
      res.body.entries[2].age.should.be.eql(12347);

      res.body.entries[2].should.have.property('remarks');
      res.body.entries[2].remarks.should.be.eql('RAS3');

      res.body.entries[2].should.have.property('_uiId');
      res.body.entries[2]._uiId.should.be.eql('entry_03');

      res.body.entries[2].should.have.property('equipmentUiId');
      res.body.entries[2].equipmentUiId.should.be.eql('engine_01');
    });

    it('it should GET a 400 http code as a result because the user does not exist', async () => {
      // Arrange
      const fakeUser = new Users({ name: 't', firstname: 'p', email: 'tp@gmail.com' });
      fakeUser.setPassword('test');

      // Act
      const res = await chai.request(app).get(`/api/entries/${boat._uiId}/${engine._uiId}`).set('Authorization', `Token ${fakeUser.generateJWT()}`);

      // Assert
      res.should.have.status(400);
    });

    it('it should GET a 400 http code as a result because the current user is not the boat owner', async () => {
      // Arrange
      let fakeUser = new Users({ name: 't', firstname: 'p', email: 'tp@gmail.com' });
      fakeUser.setPassword('test');
      fakeUser = await fakeUser.save();

      // Act
      const res = await chai.request(app).get(`/api/entries/${boat._uiId}/${engine._uiId}`).set('Authorization', `Token ${fakeUser.generateJWT()}`);

      // Assert
      res.should.have.status(400);
    });

    it('it should GET a 400 http code as a result because the engine does not exist', async () => {
      // Arrange
      await engine.remove();

      // Act
      const res = await chai.request(app).get(`/api/entries/${boat._uiId}/${engine._uiId}`).set('Authorization', userJWT);

      // Assert
      res.should.have.status(400);
    });
  });

  describe('/GET/:equipmentUiId/:taskUiId entries', () => {
    let getEntriesUrl: string;

    beforeEach(async () => {
      let entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01', equipmentId: engine._id, taskId: task._id,
      });
      entry = await entry.save();

      getEntriesUrl = `/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}`;
    });

    it('it should GET a 200 http code as a result because entries were returned successfully', async () => {
      // Arrange

      // Act
      const res = await chai.request(app).get(getEntriesUrl).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entries');
      res.body.entries.should.be.a('array');
      res.body.entries.length.should.be.eql(1);

      res.body.entries[0].should.have.property('name');
      res.body.entries[0].name.should.be.eql('My first entry');

      res.body.entries[0].should.have.property('date');

      res.body.entries[0].should.have.property('age');
      res.body.entries[0].age.should.be.eql(12345);

      res.body.entries[0].should.have.property('remarks');
      res.body.entries[0].remarks.should.be.eql('RAS');

      res.body.entries[0].should.have.property('_uiId');
      res.body.entries[0]._uiId.should.be.eql('entry_01');

      res.body.entries[0].should.have.property('equipmentUiId');
      res.body.entries[0].equipmentUiId.should.be.eql('engine_01');

      res.body.entries[0].should.not.have.property('_id');
      res.body.entries[0].should.not.have.property('equipmentId');
    });

    it('it should GET a 200 http code as a result because the read only user has enough credential to get them', async () => {
      // Arrange

      // Act
      const res = await chai.request(app).get(getEntriesUrl).set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entries');
      res.body.entries.should.be.a('array');
      res.body.entries.length.should.be.eql(1);

      res.body.entries[0].should.have.property('name');
      res.body.entries[0].name.should.be.eql('My first entry');

      res.body.entries[0].should.have.property('date');

      res.body.entries[0].should.have.property('age');
      res.body.entries[0].age.should.be.eql(12345);

      res.body.entries[0].should.have.property('remarks');
      res.body.entries[0].remarks.should.be.eql('RAS');

      res.body.entries[0].should.have.property('_uiId');
      res.body.entries[0]._uiId.should.be.eql('entry_01');

      res.body.entries[0].should.have.property('equipmentUiId');
      res.body.entries[0].equipmentUiId.should.be.eql('engine_01');

      res.body.entries[0].should.not.have.property('_id');
      res.body.entries[0].should.not.have.property('equipmentId');
    });

    it('it should GET entries sorted by date', async () => {
      // Arrange
      await Entries.deleteMany({});

      let entryA = new Entries({
        name: 'My first entry', date: new Date('01/01/2017').toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });//
      entryA.equipmentId = engine._id;
      entryA.taskId = task._id;
      entryA = await entryA.save();

      let entryB = new Entries({
        name: 'My second entry', date: new Date('01/01/2018').toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_02',
      });
      entryB.equipmentId = engine._id;
      entryB.taskId = task._id;
      entryB = await entryB.save();

      // Act
      const res = await chai.request(app).get(getEntriesUrl).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      const entry0Date = new Date(res.body.entries[0].date);
      const entry1Date = new Date(res.body.entries[1].date);
      entryA.date.should.be.eql(entry0Date);
      entryB.date.should.be.eql(entry1Date);
    });

    it('it should GET entries sorted by date', async () => {
      // Arrange
      await Entries.deleteMany({});

      let entryB = new Entries({
        name: 'My second entry', date: new Date('01/01/2018').toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_02',
      });
      entryB.equipmentId = engine._id;
      entryB.taskId = task._id;
      entryB = await entryB.save();

      let entryA = new Entries({
        name: 'My first entry', date: new Date('01/01/2017').toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });//
      entryA.equipmentId = engine._id;
      entryA.taskId = task._id;
      entryA = await entryA.save();

      // Act
      const res = await chai.request(app).get(getEntriesUrl).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      const entry0Date = new Date(res.body.entries[0].date);
      const entry1Date = new Date(res.body.entries[1].date);
      entryA.date.should.be.eql(entry0Date);
      entryB.date.should.be.eql(entry1Date);
    });

    it('it should GET a 400 http code as a result because the user does not exist', async () => {
      // Arrange
      await user.remove();

      // Act
      const res = await chai.request(app).get(getEntriesUrl).set('Authorization', userJWT);

      // Assert
      res.should.have.status(400);
    });

    it('it should GET a 400 http code as a result because the current user is not the boat owner', async () => {
      // Arrange
      let fakeUser = new Users({ name: 't', firstname: 'p', email: 'tp@gmail.com' });
      fakeUser.setPassword('test');
      fakeUser = await fakeUser.save();

      // Act
      const res = await chai.request(app).get(getEntriesUrl).set('Authorization', `Token ${fakeUser.generateJWT()}`);

      // Assert
      res.should.have.status(400);
    });

    it('it should GET a 400 http code as a result because the engine does not exist', async () => {
      // Arrange
      await engine.remove();

      // Act
      const res = await chai.request(app).get(getEntriesUrl).set('Authorization', userJWT);

      // Assert
      res.should.have.status(400);
    });
  });

  describe('/POST/:assetUiId/:equipmentUiId/:taskUiId/:newEntryUiId new entry', () => {
    it('it should GET a 200 http code as a result because the entry was return successfully', async () => {
      // Arrange
      const entry = {
        name: 'My first vidange', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: '123456',
      };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.have.property('equipmentUiId');
      res.body.entry.should.not.have.property('taskId');
      res.body.entry.should.not.have.property('equipmentId');
      res.body.entry.should.have.property('name');
      res.body.entry.should.have.property('date');
      res.body.entry.should.have.property('age');
      res.body.entry.should.have.property('remarks');
      res.body.entry.should.have.property('_uiId');
      res.body.entry.should.have.property('ack');
      res.body.entry.should.not.have.property('_id');

      res.body.entry.name.should.be.eql('My first vidange');
      res.body.entry.age.should.be.eql(12345);
      res.body.entry.remarks.should.be.eql('RAS');
      res.body.entry.equipmentUiId.should.be.eql(engine._uiId.toString());
      res.body.entry._uiId.should.be.eql('123456');
      res.body.entry.ack.should.be.eql(true);
    });

    it('it should GET a 400 http code and a credential error because the read only user does not have credential to change an entry', async () => {
      // Arrange
      const entry = {
        name: 'My first vidange', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: '123456',
      };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry }).set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(400);
      res.body.errors.should.be.eql('credentialError');
    });

    it('it should GET a 200 http code as a result because the entry was return successfully', async () => {
      // Arrange
      const entry = {
        name: 'My first vidange', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: '123456', ack: false,
      };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.have.property('equipmentUiId');
      res.body.entry.should.not.have.property('taskId');
      res.body.entry.should.not.have.property('equipmentId');
      res.body.entry.should.have.property('name');
      res.body.entry.should.have.property('date');
      res.body.entry.should.have.property('age');
      res.body.entry.should.have.property('remarks');
      res.body.entry.should.have.property('_uiId');
      res.body.entry.should.have.property('ack');
      res.body.entry.should.not.have.property('_id');

      res.body.entry.name.should.be.eql('My first vidange');
      res.body.entry.age.should.be.eql(12345);
      res.body.entry.remarks.should.be.eql('RAS');
      res.body.entry.equipmentUiId.should.be.eql(engine._uiId.toString());
      res.body.entry._uiId.should.be.eql('123456');
      res.body.entry.ack.should.be.eql(false);
    });

    it('it should GET a 200 http code as a result because the orphan entry was return successfully', async () => {
      // Arrange
      const entry = {
        name: 'My first vidange', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: '123456',
      };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/-/${entry._uiId}`).send({ entry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.not.have.property('equipmentId');
      res.body.entry.should.have.property('equipmentUiId');
      res.body.entry.should.have.property('name');
      res.body.entry.should.have.property('date');
      res.body.entry.should.have.property('age');
      res.body.entry.should.have.property('remarks');
      res.body.entry.should.have.property('_uiId');
      res.body.entry.should.have.property('ack');

      res.body.entry.name.should.be.eql('My first vidange');
      res.body.entry.age.should.be.eql(12345);
      res.body.entry.remarks.should.be.eql('RAS');
      res.body.entry.equipmentUiId.should.be.eql(engine._uiId);
      res.body.entry._uiId.should.be.eql('123456');
      res.body.entry.ack.should.be.eql(true);
    });

    it('it should GET a 422 http code as a result because the entry _uiId was missing', async () => {
      // Arrange
      const entry = { date: new Date().toString(), age: 12345, remarks: 'RAS' };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/any-ui-id`).send({ entry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('_uiId');
      res.body.errors._uiId.should.be.eql('isrequired');
    });

    it('it should GET a 422 http code as a result because the entry name was missing', async () => {
      // Arrange
      const entry = {
        date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('name');
      res.body.errors.name.should.be.eql('isrequired');
    });

    it('it should GET a 422 http code as a result because the entry date was missing', async () => {
      // Arrange
      const entry = {
        name: 'My first vidange', age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('date');
      res.body.errors.date.should.be.eql('isrequired');
    });

    it('it should GET a 422 http code as a result because the entry age was missing', async () => {
      // Arrange
      const entry = {
        name: 'My first vidange', date: new Date().toString(), remarks: 'RAS', _uiId: 'entry_01',
      };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('age');
      res.body.errors.age.should.be.eql('isrequired');
    });

    it('it should GET a 422 http code as a result because the entry remarks was missing', async () => {
      // Arrange
      const entry = {
        name: 'My first vidange', date: new Date().toString(), age: 12345, _uiId: 'entry_01',
      };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('remarks');
      res.body.errors.remarks.should.be.eql('isrequired');
    });
  });

  describe('/POST/:equipmentUiId/:taskUiId/:entryUiId change an entry', () => {
    let entry: IEntries;

    beforeEach(async () => {
      entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });
      entry.equipmentId = engine._id;
      entry.taskId = task._id;
      entry = await entry.save();
    });

    it('it should get a 200 http code as a result because the orphan entry name changed successfully', async () => {
      // Arrange
      let orphanEntry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });
      orphanEntry.equipmentId = engine._id;
      orphanEntry = await orphanEntry.save();

      const jsonEntry = { name: "Vidange d'huile" };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/-/${orphanEntry._uiId}`).send({ entry: jsonEntry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.have.property('name');
      res.body.entry.should.have.property('date');
      res.body.entry.should.have.property('age');
      res.body.entry.should.have.property('remarks');

      res.body.entry.name.should.be.eql("Vidange d'huile");
      res.body.entry.age.should.be.eql(12345);
      res.body.entry.remarks.should.be.eql('RAS');
    });

    it('it should get a 400 http code and a credential error with the read only user', async () => {
      // Arrange
      let orphanEntry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });
      orphanEntry.equipmentId = engine._id;
      orphanEntry = await orphanEntry.save();

      const jsonEntry = { name: "Vidange d'huile" };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/-/${orphanEntry._uiId}`).send({ entry: jsonEntry }).set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(400);
      res.body.errors.should.be.eql('credentialError');
    });

    it('it should get a 200 http code as a result because the entry name changed successfully', async () => {
      // Arrange
      const jsonEntry = { name: "Vidange d'huile" };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry: jsonEntry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.have.property('name');
      res.body.entry.should.have.property('date');
      res.body.entry.should.have.property('age');
      res.body.entry.should.have.property('remarks');

      res.body.entry.name.should.be.eql("Vidange d'huile");
      res.body.entry.age.should.be.eql(12345);
      res.body.entry.remarks.should.be.eql('RAS');
    });

    it('it should get a 200 http code as a result because the entry date changed successfully', async () => {
      // Arrange
      const jsonEntry = { date: '2018-10-12' };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry: jsonEntry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.have.property('name');
      res.body.entry.should.have.property('date');
      res.body.entry.should.have.property('age');
      res.body.entry.should.have.property('remarks');

      res.body.entry.name.should.be.eql('My first entry');
      res.body.entry.date.should.be.eql('2018-10-12T00:00:00.000Z');
      res.body.entry.age.should.be.eql(12345);
      res.body.entry.remarks.should.be.eql('RAS');
    });

    it('it should get a 200 http code as a result because the entry age changed successfully', async () => {
      // Arrange
      const jsonEntry = { age: 100 };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry: jsonEntry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.have.property('name');
      res.body.entry.should.have.property('date');
      res.body.entry.should.have.property('age');
      res.body.entry.should.have.property('remarks');

      res.body.entry.name.should.be.eql('My first entry');
      res.body.entry.age.should.be.eql(100);
      res.body.entry.remarks.should.be.eql('RAS');
    });

    it('it should get a 200 http code as a result because the entry remarks changed successfully', async () => {
      // Arrange
      const jsonEntry = { remarks: 'remarks' };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).send({ entry: jsonEntry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.have.property('name');
      res.body.entry.should.have.property('date');
      res.body.entry.should.have.property('age');
      res.body.entry.should.have.property('remarks');

      res.body.entry.name.should.be.eql('My first entry');
      res.body.entry.age.should.be.eql(12345);
      res.body.entry.remarks.should.be.eql('remarks');
    });

    it('it should get a 400 http code as a result because the entry does not belong to the engine of the request', async () => {
      // Arrange
      let engine2 = new Equipments({
        name: 'Engine2', brand: 'Nanni', model: 'N3.30', age: 1234, installation: '2018/01/20', _uiId: 'boat_02',
      });
      engine2.assetId = boat._id;
      engine2 = await engine2.save();

      let task2 = new Tasks({
        name: 'Vidange', usagePeriodInHour: 200, periodMonth: 12, description: 'Faire la vidange', _uiId: 'task_02',
      });
      task2.equipmentId = engine2._id;
      task2 = await task2.save();

      const jsonEntry = { name: "Vidange d'huile" };

      // Act
      const res = await chai.request(app).post(`/api/entries/${boat._uiId}/${engine._uiId}/${task2._uiId}/${entry._uiId}`).send({ entry: jsonEntry }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(400);
    });
  });

  describe('/DELETE/:equipmentId/:taskId/:entryId delete entry', () => {
    it('it should get a 200 http code as a result because the orphan entry was deleted successfully', async () => {
      // Arrange
      let entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });
      entry.equipmentId = engine._id;
      entry = await entry.save();

      // Act
      const res = await chai.request(app).delete(`/api/entries/${boat._uiId}/${engine._uiId}/-/${entry._uiId}`).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.not.have.property('_id');
      res.body.entry.should.have.property('_uiId');
      res.body.entry._uiId.should.be.eql(entry._uiId.toString());
    });

    it('it should get a 200 http code as a result because the entry was deleted successfully', async () => {
      // Arrange
      let entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });
      entry.equipmentId = engine._id;
      entry.taskId = task._id;
      entry = await entry.save();

      // Act
      const res = await chai.request(app).delete(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('entry');
      res.body.entry.should.be.a('object');
      res.body.entry.should.not.have.property('_id');
      res.body.entry.should.have.property('_uiId');
      res.body.entry._uiId.should.be.eql(entry._uiId.toString());
    });

    it('it should get a 400 http code and a credential error with the read only user', async () => {
      // Arrange
      let entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });
      entry.equipmentId = engine._id;
      entry.taskId = task._id;
      entry = await entry.save();

      // Act
      const res = await chai.request(app).delete(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(400);
      res.body.errors.should.be.eql('credentialError');
    });

    it('it should get a 400 http code as a result because the entry does not exist', async () => {
      // Arrange
      const entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01',
      });
      entry.equipmentId = engine._id;
      entry.taskId = task._id;

      // Act
      const res = await chai.request(app).delete(`/api/entries/${boat._uiId}/${engine._uiId}/${task._uiId}/${entry._uiId}`).set('Authorization', userJWT);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('entity');
      res.body.errors.entity.should.be.eql('notfound');
    });
  });
});
