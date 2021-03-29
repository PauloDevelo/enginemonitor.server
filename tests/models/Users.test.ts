/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// eslint-disable-next-line import/order
import server from '../../src/server';
import fs from 'fs';
import rimraf from 'rimraf';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiFs from 'chai-fs';
import chaiString from 'chai-string';
import sinon from 'sinon';
import timeService from '../../src/services/TimeService';

import { restoreLogger, mockLogger } from '../MockLogger';

import Users, { IUser } from '../../src/models/Users';
import Assets, { IAssets } from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';
import Equipments, { IEquipments } from '../../src/models/Equipments';
import PendingRegistrations from '../../src/models/PendingRegistrations';
import config from '../../src/utils/configUtils';
import Images from '../../src/models/Images';

const { app } = server;
chai.use(chaiHttp);
chai.use(chaiFs);
chai.use(chaiString);
const { expect } = chai;
const should = chai.should();

const currentTime = new Date('2020-06-28T09:47:00');

describe('Users model', () => {
  let stubGetUTCDateTime: sinon.SinonStub<[], Date>;

  before(() => {
    mockLogger();
  });

  after(() => {
    restoreLogger();
  });

  beforeEach(() => {
    stubGetUTCDateTime = sinon.stub(timeService, 'getUTCDateTime').callsFake(() => currentTime);
  });

  afterEach(async () => {
    await Images.deleteMany({});
    await Users.deleteMany({});
    await AssetUser.deleteMany({});
    await Assets.deleteMany({});
    await Equipments.deleteMany({});
    await PendingRegistrations.deleteMany({});

    await new Promise((resolve, reject) => {
      rimraf('./tests/uploads/*', resolve, reject);
    });

    sinon.restore();
  });

  describe('new User', () => {
    it('should create the image folder', async () => {
      // Arrange

      // Act
      const user = new Users({
        name: 'r', firstname: 'p', email: 'rg@gmail.com', _uiId: 'test', isVerified: true,
      });
      await user.save();

      // Assert
      expect(user.getUserImageFolder()).to.be.a.directory().and.empty;
    });
  });

  describe('toAuthJSON', () => {
    it('should update the lastAuth field in the database', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      // Act
      await user.toAuthJSON();

      // Assert
      user.lastAuth.should.eql(currentTime);

      const userInDb = await Users.findById(user._id);
      userInDb.lastAuth.should.eql(currentTime);
    });
  });

  describe('checkAndProcessPendingInvitation', () => {
    let previousOwner: IUser;
    let boat: IAssets;
    let engine: IEquipments;

    beforeEach(async () => {
      previousOwner = new Users({
        name: 'r', firstname: 'p', email: 'r@gmail.com', isVerified: true,
      });
      previousOwner.setPassword('test');
      previousOwner = await previousOwner.save();
      const userJWT = `Token ${previousOwner.generateJWT()}`;

      boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      let assetUserLink = new AssetUser({ assetId: boat._id, userId: previousOwner._id, readonly: false });
      assetUserLink = await assetUserLink.save();

      engine = new Equipments({
        name: 'Engine', brand: 'Nanni', model: 'N3.30', age: 1234, installation: '2018/01/20', _uiId: 'engine_01',
      });
      engine.assetId = boat._id;
      engine = await engine.save();

      const res = await chai.request(app).post(`/api/images/${engine._uiId.toString()}`)
        .field('name', 'my first image added')
        .field('_uiId', 'image_added_01')
        .field('parentUiId', engine._uiId)
        .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), `${engine._uiId}.jpeg`)
        .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), `thumbnail_${engine._uiId}.jpeg`)
        .set('Authorization', userJWT);

      let pendingInvitation = new PendingRegistrations({ assetId: boat._id, newOwnerEmail: 'new@gmail.com' });
      pendingInvitation = await pendingInvitation.save();
    });

    it('should change the path of all the images related to the previous owner', async () => {
      // Arrange

      // Act
      let newOwner = new Users({
        name: 'g', firstname: 't', email: 'new@gmail.com', isVerified: true,
      });
      newOwner = await newOwner.save();

      // Assert
      expect(config.get('ImageFolder') + previousOwner._id.toString()).to.be.a.directory().and.empty;

      expect(config.get('ImageFolder') + newOwner._id.toString()).to.be.a.directory().and.not.empty;
      expect(config.get('ImageFolder') + newOwner._id.toString()).to.be.a.directory().with.files(['engine_01.jpeg', 'thumbnail_engine_01.jpeg']);

      const image = await Images.findOne({ parentUiId: engine._uiId });
      expect(image.thumbnailPath).containIgnoreCase(newOwner._id.toString());
      expect(image.path).containIgnoreCase(newOwner._id.toString());
    });

    it('should change the asset user link to link the asset to the new user', async () => {
      // Arrange

      // Act
      let newOwner = new Users({
        name: 'g', firstname: 't', email: 'new@gmail.com', isVerified: true,
      });
      newOwner = await newOwner.save();

      // Assert
      const assetUserLink = await AssetUser.findOne({ assetId: boat._id, readonly: false });
      expect(assetUserLink.userId.toString()).to.be.eqls(newOwner._id.toString());
    });

    it('should remove the pending invitation document', async () => {
      // Arrange

      // Act
      let newOwner = new Users({
        name: 'g', firstname: 't', email: 'new@gmail.com', isVerified: true,
      });
      newOwner = await newOwner.save();

      // Assert
      const nbPendingInvitation = await PendingRegistrations.countDocuments();
      expect(nbPendingInvitation).to.be.equal(0);
    });

    it('should do nothing if there isn\'t any pending registration', async () => {
      // Arrange
      await PendingRegistrations.deleteMany({});

      // Act
      let newOwner = new Users({
        name: 'g', firstname: 't', email: 'new@gmail.com', isVerified: true,
      });
      newOwner = await newOwner.save();

      // Assert
      const assetUserLink = await AssetUser.findOne({ assetId: boat._id, readonly: false });
      expect(assetUserLink.userId.toString()).to.be.equal(previousOwner._id.toString());

      expect(config.get('ImageFolder') + newOwner._id.toString()).to.be.a.directory().and.empty;

      expect(config.get('ImageFolder') + previousOwner._id.toString()).to.be.a.directory().and.not.empty;
      expect(config.get('ImageFolder') + previousOwner._id.toString()).to.be.a.directory().with.files(['engine_01.jpeg', 'thumbnail_engine_01.jpeg']);

      const image = await Images.findOne({ parentUiId: engine._uiId });
      expect(image.thumbnailPath).containIgnoreSpaces(previousOwner._id.toString());
      expect(image.path).containIgnoreSpaces(previousOwner._id.toString());
    });
  });
});
