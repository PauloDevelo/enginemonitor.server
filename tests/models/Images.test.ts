/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';
import fs from 'fs';
import rimraf from 'rimraf';
// eslint-disable-next-line import/order
import server from '../../src/server';

import chai from 'chai';
import chaiFs from 'chai-fs';
import chaiString from 'chai-string';
import sinon from 'sinon';
import config from '../../src/utils/configUtils';
import timeService from '../../src/services/TimeService';

import { restoreLogger, mockLogger } from '../MockLogger';
import Images, { deleteExistingImages, getImagesRelatedToAsset } from '../../src/models/Images';
import Users from '../../src/models/Users';
import Assets from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';
import Equipments from '../../src/models/Equipments';
import Tasks from '../../src/models/Tasks';
import Entries from '../../src/models/Entries';

const { app } = server;
chai.use(chaiFs);
chai.use(chaiString);
const { expect } = chai;
const should = chai.should();

const currentTime = new Date('2020-06-28T09:47:00');

describe('Images model', () => {
  let stubGetUTCDateTime: sinon.SinonStub<[], Date>;

  before(async () => {
    await new Promise((resolve, reject) => {
      rimraf('./tests/uploads/*', resolve, reject);
    });

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
    await Assets.deleteMany({}),
    await AssetUser.deleteMany({}),
    await Entries.deleteMany({}),
    await Tasks.deleteMany({}),
    await Equipments.deleteMany({}),
    sinon.restore();

    await new Promise((resolve, reject) => {
      rimraf('./tests/uploads/*', resolve, reject);
    });
  });

  describe('deleteExistingImages', () => {
    it('should delete images related to the parent', async () => {
      // Arrange
      const image1Path = `${config.get('ImageFolder')}image1.jpeg`;
      const thumbnail1Path = `${config.get('ImageFolder')}thumbnail1.jpeg`;

      const image2Path = `${config.get('ImageFolder')}image2.jpeg`;
      const thumbnail2Path = `${config.get('ImageFolder')}thumbnail2.jpeg`;

      fs.copyFileSync('tests/toUpload/image1.jpeg', image1Path);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', thumbnail1Path);

      fs.copyFileSync('tests/toUpload/image2.jpeg', image2Path);
      fs.copyFileSync('tests/toUpload/thumbnail2.jpeg', thumbnail2Path);

      let image1 = new Images({
        _uiId: 'image_01', description: 'image 1 description', name: 'image1', parentUiId: 'sailboat_01', path: image1Path, thumbnailPath: thumbnail1Path, title: 'image1',
      });
      image1 = (await image1.save());

      let image2 = new Images({
        _uiId: 'image_02', description: 'image 2 description', name: 'image2', parentUiId: 'sailboat_01', path: image2Path, thumbnailPath: thumbnail2Path, title: 'image2',
      });
      image2 = (await image2.save());

      // Act
      await deleteExistingImages('sailboat_01');

      // Assert
      (await Images.countDocuments()).should.be.equal(0);
      expect(image1Path).to.not.be.a.path();
      expect(thumbnail1Path).to.not.be.a.path();
      expect(image2Path).to.not.be.a.path();
      expect(thumbnail2Path).to.not.be.a.path();
    });
  });

  describe('deleteOne', () => {
    it('should delete the 2 files as well', async () => {
      // Arrange
      const image1Path = `${config.get('ImageFolder')}image1.jpeg`;
      const thumbnail1Path = `${config.get('ImageFolder')}thumbnail1.jpeg`;

      fs.copyFileSync('tests/toUpload/image1.jpeg', image1Path);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', thumbnail1Path);

      let image1 = new Images({
        _uiId: 'image_01', description: 'image 1 description', name: 'image1', parentUiId: 'sailboat_01', path: image1Path, thumbnailPath: thumbnail1Path, title: 'image1',
      });
      image1 = (await image1.save());

      // Act
      await image1.deleteOne();

      // Assert
      (await Images.countDocuments()).should.be.equal(0);
      expect(image1Path).to.not.be.a.path();
      expect(thumbnail1Path).to.not.be.a.path();
    });
  });

  describe('changePath', () => {
    it('should change the path in the Image document and move the files', async () => {
      // Arrange
      let previousOwner = new Users({
        name: 'r', firstname: 'p', email: 'r@gmail.com', isVerified: true,
      });
      previousOwner = await previousOwner.save();

      let newOwner = new Users({
        name: 'g', firstname: 't', email: 'new@gmail.com', isVerified: true,
      });
      newOwner = await newOwner.save();

      const image1Path = `${previousOwner.getUserImageFolder()}/image1.jpeg`;
      const thumbnail1Path = `${previousOwner.getUserImageFolder()}/thumbnail1.jpeg`;

      fs.copyFileSync('tests/toUpload/image1.jpeg', image1Path);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', thumbnail1Path);

      let image1 = new Images({
        _uiId: 'image_01', description: 'image 1 description', name: 'image1', parentUiId: 'sailboat_01', path: image1Path, thumbnailPath: thumbnail1Path, title: 'image1',
      });
      image1 = await image1.save();

      // Act
      image1 = await image1.changePath(previousOwner._id, newOwner._id);

      // Assert
      expect(image1Path).to.not.be.a.path();
      expect(thumbnail1Path).to.not.be.a.path();
      expect(image1.path).to.containIgnoreCase(newOwner._id.toString());
      expect(image1.thumbnailPath).to.containIgnoreCase(newOwner._id.toString());
      expect(`${newOwner.getUserImageFolder()}/image1.jpeg`).to.be.a.file();
      expect(`${newOwner.getUserImageFolder()}/thumbnail1.jpeg`).to.be.a.file();
    });
  });

  describe('getImagesRelatedToAsset', () => {
    it('should return all the images related to an asset', async () => {
      // Arrange
      let user = new Users({
        name: 'r', firstname: 'p', email: 'r@gmail.com',
      });
      user.setPassword('test');
      user.isVerified = true;
      user = await user.save();

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const imageBoatPath = `${user.getUserImageFolder()}/boat_image1.jpeg`;
      const thumbnailBoatPath = `${user.getUserImageFolder()}/boat_thumbnail1.jpeg`;
      fs.copyFileSync('tests/toUpload/image1.jpeg', imageBoatPath);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', thumbnailBoatPath);
      let imageBoat = new Images({
        _uiId: 'image_01', description: 'image 1 description', name: 'image1', parentUiId: boat._uiId, path: imageBoatPath, thumbnailPath: thumbnailBoatPath, title: 'boat image',
      });
      imageBoat = await imageBoat.save();

      let assetUserLink = new AssetUser({ assetId: boat._id, userId: user._id });
      assetUserLink = await assetUserLink.save();

      let engine = new Equipments({
        name: 'Engine', brand: 'Nanni', model: 'N3.30', age: 1234, installation: '2018/01/20', _uiId: 'engine_01', assetId: boat._id,
      });
      engine = await engine.save();

      const engineImagePath = `${user.getUserImageFolder()}/engine_image1.jpeg`;
      const engineThumbnailPath = `${user.getUserImageFolder()}/engine_thumbnail1.jpeg`;
      fs.copyFileSync('tests/toUpload/image1.jpeg', engineImagePath);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', engineThumbnailPath);
      let engineImage = new Images({
        _uiId: 'image_02', description: 'image 1 description', name: 'image1', parentUiId: engine._uiId, path: engineImagePath, thumbnailPath: engineThumbnailPath, title: 'boat image',
      });
      engineImage = await engineImage.save();

      let orphanEntry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01', equipmentId: engine._id,
      });
      orphanEntry = await orphanEntry.save();

      const engine2ImagePath = `${user.getUserImageFolder()}/engine2_image1.jpeg`;
      const engine2ThumbnailPath = `${user.getUserImageFolder()}/engine2_thumbnail1.jpeg`;
      fs.copyFileSync('tests/toUpload/image1.jpeg', engine2ImagePath);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', engine2ThumbnailPath);
      let engine2Image = new Images({
        _uiId: 'image_03', description: 'image 1 description', name: 'image1', parentUiId: orphanEntry._uiId, path: engine2ImagePath, thumbnailPath: engine2ThumbnailPath, title: 'boat image',
      });
      engine2Image = await engine2Image.save();

      let task = new Tasks({
        name: 'Vidange', usagePeriodInHour: 200, periodMonth: 12, description: 'Faire la vidange', _uiId: 'task_01', equipmentId: engine._id,
      });
      task = await task.save();

      const engine3ImagePath = `${user.getUserImageFolder()}/engine3_image1.jpeg`;
      const engine3ThumbnailPath = `${user.getUserImageFolder()}/engine3_thumbnail1.jpeg`;
      fs.copyFileSync('tests/toUpload/image1.jpeg', engine3ImagePath);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', engine3ThumbnailPath);
      let engine3Image = new Images({
        _uiId: 'image_04', description: 'image 4 description', name: 'image4', parentUiId: task._uiId, path: engine3ImagePath, thumbnailPath: engine3ThumbnailPath, title: 'boat image',
      });
      engine3Image = await engine3Image.save();

      let entry = new Entries({
        name: 'My first entry', date: new Date().toString(), age: 12345, remarks: 'RAS', _uiId: 'entry_01', equipmentId: engine._id, taskId: task._id,
      });
      entry = await entry.save();

      const engine4ImagePath = `${user.getUserImageFolder()}/engine4_image1.jpeg`;
      const engine4ThumbnailPath = `${user.getUserImageFolder()}/engine4_thumbnail1.jpeg`;
      fs.copyFileSync('tests/toUpload/image1.jpeg', engine4ImagePath);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', engine4ThumbnailPath);
      let engine4Image = new Images({
        _uiId: 'image_05', description: 'image 5 description', name: 'image5', parentUiId: entry._uiId, path: engine4ImagePath, thumbnailPath: engine4ThumbnailPath, title: 'boat image',
      });
      engine4Image = await engine4Image.save();

      // Act
      const images = await getImagesRelatedToAsset(boat._id);

      // Assert
      expect(images.length).to.be.equal(5);
    });
  });
});
