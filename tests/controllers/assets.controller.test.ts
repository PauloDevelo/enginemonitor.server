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
import Assets from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';

const { app } = server;

chai.use(chaiHttp);
const { expect } = chai;
const should = chai.should();

describe('Assets', () => {
  let user: IUser;
  let userJWT: string;

  let readonlyUser: IUser;
  let roUserJWT: string;

  before(() => {
    mockLogger();
    ignoredErrorMessages.push('No authorization token was found');
    ignoredErrorMessages.push('jwt expired');
    ignoredErrorMessages.push('invalid signature');
  });

  after(() => {
    restoreLogger();
  });

  beforeEach(async () => {
    user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
    user.setPassword('test');
    user = await user.save();

    userJWT = `Token ${user.generateJWT()}`;

    readonlyUser = new Users({
      name: 'read', firstname: 'only', email: 'read.only@gmail.com', forbidCreatingAsset: true,
    });
    readonlyUser.setPassword('test');
    readonlyUser = await readonlyUser.save();

    roUserJWT = `Token ${readonlyUser.generateJWT()}`;
  });

  afterEach(async () => {
    await Assets.deleteMany({});
    await AssetUser.deleteMany({});
    await Users.deleteMany({});
  });

  describe('/GET assets', () => {
    it('it should GET a 401 http code as a result because the request does not have the token', async () => {
      // Act
      const res = await chai.request(app).get('/api/assets');

      // Assert
      res.should.have.status(401);
      res.body.errors.message.should.be.eql('No authorization token was found');
      res.body.errors.error.name.should.be.eql('UnauthorizedError');
      res.body.errors.error.code.should.be.eql('credentials_required');
      res.body.errors.error.status.should.be.eql(401);
    });

    it('it should get a 400 http code as a result because the token is invalid', async () => {
      // Arrange
      await user.remove();

      // Act
      const res = await chai.request(app).get('/api/assets').set('Authorization', userJWT);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('authentication');
      res.body.errors.authentication.should.be.eql('error');
    });

    it('it should get a 401 http code as a result because the token is expired', async () => {
      // Arrange
      const expiredToken = 'Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdWwudG9ycnVlbGxhQGdtYWlsLmNvbSIsImlkIjoiNWMyNWJmYmY1NDE4ZTM0ZGJjN2I5ZTkzIiwiZXhwIjoxNTUxMTYxNzkxLCJpYXQiOjE1NDU5Nzc3OTF9.uBge-2VvmJiweF-jCPOcLonn0ewBlNjy9wm6mFdSVQo';

      // Act
      const res = await chai.request(app).get('/api/assets').set('Authorization', expiredToken);

      // Assert
      res.should.have.status(401);
    });

    it("it should GET a 200 http code as a result and an equipment because we set a readonly user's token", async () => {
      // Arrange
      let arbutus = new Assets({
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      });
      arbutus = await arbutus.save();

      let readOnlyUserAssetLink = new AssetUser({ assetId: arbutus._id, userId: readonlyUser._id, readonly: true });
      readOnlyUserAssetLink = await readOnlyUserAssetLink.save();

      // Act
      const res = await chai.request(app).get('/api/assets').set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('assets');
      res.body.assets.should.be.a('array');
      res.body.assets.length.should.be.eql(1);

      res.body.assets[0].should.have.property('name');
      res.body.assets[0].should.have.property('brand');
      res.body.assets[0].should.have.property('modelBrand');
      res.body.assets[0].should.have.property('manufactureDate');
      res.body.assets[0].should.have.property('_uiId');

      res.body.assets[0].name.should.be.eql('Arbutus');
      res.body.assets[0].brand.should.be.eql('Aluminum & Technics');
      res.body.assets[0].modelBrand.should.be.eql('Heliotrope');
      res.body.assets[0].manufactureDate.should.be.eql('1979-01-01T00:00:00.000Z');
      res.body.assets[0]._uiId.should.be.eql('sailboat_01');
    });

    it('it should GET a 200 http code as a result and an equipment because we set the correct token', async () => {
      // Arrange
      let arbutus = new Assets({
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      });
      arbutus = await arbutus.save();

      let userAssetLink = new AssetUser({ assetId: arbutus._id, userId: user._id });
      userAssetLink = await userAssetLink.save();

      // Act
      const res = await chai.request(app).get('/api/assets').set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('assets');
      res.body.assets.should.be.a('array');
      res.body.assets.length.should.be.eql(1);

      res.body.assets[0].should.have.property('name');
      res.body.assets[0].should.have.property('brand');
      res.body.assets[0].should.have.property('modelBrand');
      res.body.assets[0].should.have.property('manufactureDate');
      res.body.assets[0].should.have.property('_uiId');

      res.body.assets[0].name.should.be.eql('Arbutus');
      res.body.assets[0].brand.should.be.eql('Aluminum & Technics');
      res.body.assets[0].modelBrand.should.be.eql('Heliotrope');
      res.body.assets[0].manufactureDate.should.be.eql('1979-01-01T00:00:00.000Z');
      res.body.assets[0]._uiId.should.be.eql('sailboat_01');
    });
  });

  describe('POST assets', () => {
    it('it should get a 401 http code as a result because the request does not have the token', async () => {
      // Act
      const res = await chai.request(app).post('/api/assets');

      // Assert
      res.should.have.status(401);
      res.body.errors.message.should.be.eql('No authorization token was found');
      res.body.errors.error.name.should.be.eql('UnauthorizedError');
      res.body.errors.error.code.should.be.eql('credentials_required');
      res.body.errors.error.status.should.be.eql(401);
    });

    it('it should get a 400 http code as a result because the token is invalid', async () => {
      // Arrange
      await user.remove();

      const asset = {
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      };

      // Act
      const res = await chai.request(app).post('/api/assets').send({ asset }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('authentication');
      res.body.errors.authentication.should.be.eql('error');
    });

    it('it should get a 200 http code as a result because the asset was successfully created', async () => {
      // Arrange
      const asset = {
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      };

      // Act
      const res = await chai.request(app).post(`/api/assets/${asset._uiId}`).send({ asset }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('asset');
      res.body.asset.should.have.property('name');
      res.body.asset.should.have.property('brand');
      res.body.asset.should.have.property('modelBrand');
      res.body.asset.should.have.property('manufactureDate');
      res.body.asset.should.have.property('_uiId');
      res.body.asset.should.not.have.property('_id');

      res.body.asset.name.should.be.eql('Arbutus');
      res.body.asset.brand.should.be.eql('Aluminum & Technics');
      res.body.asset.modelBrand.should.be.eql('Heliotrope');
      res.body.asset.manufactureDate.should.be.eql('1979-01-01T00:00:00.000Z');
      res.body.asset._uiId.should.be.eql('sailboat_01');
    });

    it('it should get a 400 http code with credential error as a result because a user without the asset creation credential tried to create an asset', async () => {
      // Arrange
      const asset = {
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      };

      // Act
      const res = await chai.request(app).post(`/api/assets/${asset._uiId}`).send({ asset }).set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.eql('credentialError');
    });

    it('it should get a 422 http error code because there is already an asset with the same name', async () => {
      // Arrange
      const asset = {
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      };
      await chai.request(app).post(`/api/assets/${asset._uiId}`).send({ asset }).set('Authorization', userJWT);

      const asset2 = {
        _uiId: 'sailboat_02', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      };

      // Act
      const res = await chai.request(app).post(`/api/assets/${asset2._uiId}`).send({ asset }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('name');
      res.body.errors.name.should.be.eql('alreadyexisting');
    });

    it('it should get a 200 http code as a result because the asset with an existing name was created by another user', async () => {
      // Arrange
      let anotherUser = new Users({ name: 'r', firstname: 'p', email: 'rp@gmail.com' });
      anotherUser.setPassword('test');
      anotherUser = await anotherUser.save();

      const anotherUserJWT = `Token ${anotherUser.generateJWT()}`;

      const asset = {
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      };
      await chai.request(app).post(`/api/assets/${asset._uiId}`).send({ asset }).set('Authorization', anotherUserJWT);

      const asset2 = {
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      };

      // Act
      const res = await chai.request(app).post(`/api/assets/${asset2._uiId}`).send({ asset }).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('asset');

      const resGetUser = await chai.request(app).get('/api/assets').set('Authorization', userJWT);
      const resGetAnotherUser = await chai.request(app).get('/api/assets').set('Authorization', anotherUserJWT);

      resGetUser.body.assets.length.should.be.eql(resGetAnotherUser.body.assets.length);
      resGetUser.body.assets[0].should.be.eql(resGetAnotherUser.body.assets[0]);
    });
  });

  describe('POST/:assetUiId asset', () => {
    const sailboat = {
      _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
    };

    beforeEach(async () => {
      await chai.request(app).post(`/api/assets/${sailboat._uiId}`).send({ asset: sailboat }).set('Authorization', userJWT);
    });

    it('it should get a 200 http code as a result because the asset brand was successfully modified', async () => {
      // Arrange
      const modifications = { asset: { brand: 'beneteau' } };

      // Act
      const res = await chai.request(app).post(`/api/assets/${sailboat._uiId}`).send(modifications).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('asset');
      res.body.asset.should.be.a('object');
      res.body.asset.should.have.property('brand');
      res.body.asset.brand.should.be.eql('beneteau');
    });

    it('it should get a 400 http code with credential error as a result because a readonly user tried to modified an asset', async () => {
      // Arrange
      const asset = await Assets.findOne({ _uiId: sailboat._uiId });
      let roUserAssetLink = new AssetUser({ assetId: asset._id, userId: readonlyUser._id, readonly: true });
      roUserAssetLink = await roUserAssetLink.save();

      const modifications = { asset: { brand: 'beneteau' } };

      // Act
      const res = await chai.request(app).post(`/api/assets/${sailboat._uiId}`).send(modifications).set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.eql('credentialError');
    });

    it('it should get a 200 http code as a result because the asset manufactureDate was successfully modified', async () => {
      // Arrange
      const modifications = { asset: { manufactureDate: new Date('1989-01-01T00:00:00.000Z') } };

      // Act
      const res = await chai.request(app).post(`/api/assets/${sailboat._uiId}`).send(modifications).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('asset');
      res.body.asset.should.be.a('object');
      res.body.asset.should.have.property('manufactureDate');
      res.body.asset.manufactureDate.should.be.eql('1989-01-01T00:00:00.000Z');
    });

    it('it should get a 200 http code as a result because the asset modelBrand was successfully modified', async () => {
      // Arrange
      const modifications = { asset: { modelBrand: 'Fleur des Tropiques' } };

      // Act
      const res = await chai.request(app).post(`/api/assets/${sailboat._uiId}`).send(modifications).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('asset');
      res.body.asset.should.be.a('object');
      res.body.asset.should.have.property('modelBrand');
      res.body.asset.modelBrand.should.be.eql('Fleur des Tropiques');
    });

    it('it should get a 200 http code as a result because the asset name was successfully modified', async () => {
      // Arrange
      const modifications = { asset: { name: 'Toto' } };

      // Act
      const res = await chai.request(app).post(`/api/assets/${sailboat._uiId}`).send(modifications).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('asset');
      res.body.asset.should.be.a('object');
      res.body.asset.should.have.property('name');
      res.body.asset.name.should.be.eql('Toto');
    });

    it('it should get a 422 http error code because there is already an asset with the same name', async () => {
      // Arrange
      const sailboatToto = {
        _uiId: 'sailboat_02', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Toto',
      };
      await chai.request(app).post(`/api/assets/${sailboatToto._uiId}`).send({ asset: sailboatToto }).set('Authorization', userJWT);

      const modifications = { asset: { name: 'Toto' } };

      // Act
      const res = await chai.request(app).post(`/api/assets/${sailboat._uiId}`).send(modifications).set('Authorization', userJWT);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('name');
      res.body.errors.name.should.be.eql('alreadyexisting');
    });
  });

  describe('DELETE/:assetUiId asset', () => {
    const sailboat = {
      _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
    };

    beforeEach(async () => {
      await chai.request(app).post(`/api/assets/${sailboat._uiId}`).send({ asset: sailboat }).set('Authorization', userJWT);
    });

    it('it should get a 200 http code as a result because the asset was successfully deleted', async () => {
      // Arrange

      // Act
      let res = await chai.request(app).delete(`/api/assets/${sailboat._uiId}`).set('Authorization', userJWT);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('asset');
      res.body.asset.should.be.a('object');

      res = await chai.request(app).get('/api/assets').set('Authorization', userJWT);
      res.should.have.status(200);
      res.body.should.have.property('assets');
      res.body.assets.should.be.a('array');
      res.body.assets.length.should.be.eql(0);
    });

    it('it should get a 400 http code as a result because the asset does not exist', async () => {
      // Act
      const res = await chai.request(app).delete('/api/assets/5c27912a9bc7e61fdcd2e82c').set('Authorization', userJWT);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('entity');
      res.body.errors.entity.should.be.eql('notfound');
    });

    it('it should get a 400 http code as a result because the asset requested is not own by the user', async () => {
      // Arrange
      let anotherUser = new Users({ name: 'rs', firstname: 'ps', email: 'rs@gmail.com' });
      anotherUser.setPassword('test');
      anotherUser = await anotherUser.save();

      // Act
      const res = await chai.request(app).delete(`/api/assets/${sailboat._uiId}`).set('Authorization', `Token ${anotherUser.generateJWT()}`);

      // Assert
      res.should.have.status(400);
    });

    it('it should get a 400 http code as a result because the asset requested is not own by the user', async () => {
      // Arrange
      const asset = await Assets.findOne({ _uiId: sailboat._uiId });

      let readOnlyUserAssetLink = new AssetUser({ assetId: asset._id, userId: readonlyUser._id, readonly: true });
      readOnlyUserAssetLink = await readOnlyUserAssetLink.save();

      // Act
      const res = await chai.request(app).delete(`/api/assets/${sailboat._uiId}`).set('Authorization', roUserJWT);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.eql('credentialError');
    });
  });
});
