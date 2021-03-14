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
import sinon from 'sinon';
import config from '../../src/utils/configUtils';
import timeService from '../../src/services/TimeService';

import { restoreLogger, mockLogger } from '../MockLogger';
import Images, { deleteExistingImages } from '../../src/models/Images';

const { app } = server;
chai.use(chaiFs);
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
      const image1Path = `${config.get('ImageFolder')}changePath/image1.jpeg`;
      const thumbnail1Path = `${config.get('ImageFolder')}changePath/thumbnail1.jpeg`;

      fs.mkdirSync(`${config.get('ImageFolder')}changedPath`);
      fs.mkdirSync(`${config.get('ImageFolder')}changePath`);
      fs.copyFileSync('tests/toUpload/image1.jpeg', image1Path);
      fs.copyFileSync('tests/toUpload/thumbnail1.jpeg', thumbnail1Path);

      let image1 = new Images({
        _uiId: 'image_01', description: 'image 1 description', name: 'image1', parentUiId: 'sailboat_01', path: image1Path, thumbnailPath: thumbnail1Path, title: 'image1',
      });
      image1 = (await image1.save());

      // Act
      image1 = await image1.changePath(`${config.get('ImageFolder')}changePath`, `${config.get('ImageFolder')}changedPath`);

      // Assert
      expect(image1Path).to.not.be.a.path();
      expect(thumbnail1Path).to.not.be.a.path();
      expect(image1.path).to.be.equal(`${config.get('ImageFolder')}changedPath/image1.jpeg`);
      expect(image1.thumbnailPath).to.be.equal(`${config.get('ImageFolder')}changedPath/thumbnail1.jpeg`);
      expect(`${config.get('ImageFolder')}changedPath/image1.jpeg`).to.be.a.file();
      expect(`${config.get('ImageFolder')}changedPath/thumbnail1.jpeg`).to.be.a.file();
    });
  });
});
