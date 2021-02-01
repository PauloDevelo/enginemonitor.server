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

import GuestLinks from '../../src/models/GuestLinks';
import Users, { IUser } from '../../src/models/Users';
import Assets, { IAssets } from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';

const { app } = server;

chai.use(chaiHttp);
const { expect } = chai;
const should = chai.should();

describe('GuestLinks', () => {
  before(() => {
    mockLogger();
    ignoredErrorMessages.push('No authorization token was found');
  });

  after(() => {
    restoreLogger();
  });

  afterEach(async () => {
    await GuestLinks.deleteMany({});
    await Users.deleteMany({});
    await Assets.deleteMany({});
    await AssetUser.deleteMany({});
  });

  describe('/GET guest user from a nice key', () => {
    it('it should GET a 400 http code as a result because the niceKey cannot be find', async () => {
      // Arrange

      // Act
      const res = await chai.request(app).get('/api/guestlinks/nicekey/mysupernicekeythatcannnotbefound');

      // Assert
      res.status.should.be.eql(400);
      res.body.errors.niceKey.should.be.eql('isinvalid');
    });

    it('it should GET a 400 http error code as a result because the guest user cannot be found', async () => {
      // Arrange
      // eslint-disable-next-line global-require
      const mongoose = require('mongoose');

      const guest = new GuestLinks({
        niceKey: 'thisisanicekey', name: 'name of the link created by the owner', guestUserId: new mongoose.Types.ObjectId(), _uiId: 'an_id_generated_by_the_front_end',
      });
      await guest.save();

      // Act
      const res = await chai.request(app).get('/api/guestlinks/nicekey/thisisanicekey');

      // Assert
      res.should.have.status(400);
      res.body.errors.guestUserId.should.be.eql('isinvalid');
    });

    it('it should GET a guest user', async () => {
      // Arrange
      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const guestUser = new Users({
        name: 'Guest', firstname: 'Guest', email: '', _uiId: 'asdfu;;kdfireruiwelloewr857fas', isVerified: true,
      });
      guestUser.setPassword('guest');
      await guestUser.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: guestUser._id });
      await userAssetLink.save();

      const guest = new GuestLinks({
        _uiId: 'an_id_generated_by_the_front_end', name: 'Invitation for LeBonCoin', guestUserId: guestUser._id, niceKey: 'thisisanicekey',
      });
      await guest.save();

      // Act
      const res = await chai.request(app).get('/api/guestlinks/nicekey/thisisanicekey');

      // Assert
      res.should.have.status(200);
      res.body.user._uiId.should.be.eql(guestUser._uiId);
      res.body.user.name.should.be.eql(guestUser.name);
      res.body.user.firstname.should.be.eql(guestUser.firstname);
    });
  });

  describe('/GET guest user link from an asset ui id', () => {
    it('it should GET a 400 http code as a result because the asset cannot be find', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      // Act
      const res = await chai.request(app).get('/api/guestlinks/asset/an_assed_ui_id_not_found').set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.status.should.be.eql(400);
      res.body.errors.assetUiId.should.be.eql('isinvalid');
    });

    it('it should GET zero guest links for an asset which is not shared', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: user._id });
      await userAssetLink.save();

      // Act
      const res = await chai.request(app).get(`/api/guestlinks/asset/${boat._uiId}`).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(200);
      res.body.guestlinks.length.should.be.eql(0);
    });

    it('it should GET one guest links', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: user._id });
      await userAssetLink.save();

      const guestUser = new Users({
        name: 'Guest', firstname: 'Guest', email: '', _uiId: 'asdfu;;kdfireruiwelloewr857fas', isVerified: true,
      });
      guestUser.setPassword('guest');
      await guestUser.save();

      const guestAssetLink = new AssetUser({ assetId: boat._id, userId: guestUser._id });
      await guestAssetLink.save();

      const guest = new GuestLinks({
        _uiId: 'an_id_generated_by_the_front_end', name: 'Invitation for LeBonCoin', guestUserId: guestUser._id, niceKey: 'thisisanicekey',
      });
      await guest.save();

      // Act
      const res = await chai.request(app).get(`/api/guestlinks/asset/${boat._uiId}`).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(200);
      res.body.guestlinks.length.should.be.eql(1);
      res.body.guestlinks[0]._uiId.should.be.eql(guest._uiId);
      res.body.guestlinks[0].name.should.be.eql(guest.name);
      res.body.guestlinks[0].niceKey.should.be.eql(guest.niceKey);
      res.body.guestlinks[0].should.not.have.property('guestUserId');
    });

    it('it should GET a 401 http code as a result because the request does not have the token', async () => {
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: user._id });
      await userAssetLink.save();

      // Act
      const res = await chai.request(app).get(`/api/guestlinks/asset/${boat._uiId}`);

      // Assert
      res.status.should.be.eql(401);
      res.body.errors.message.should.be.eql('No authorization token was found');
      res.body.errors.error.name.should.be.eql('UnauthorizedError');
      res.body.errors.error.code.should.be.eql('credentials_required');
      res.body.errors.error.status.should.be.eql(401);
    });

    it('it should GET a 400 http code as a result because the asset is not own by the user requesting the guest links', async () => {
      // Arrange
      const anotherUser = new Users({ name: 'another', firstname: 'user', email: 'another.user@gmail.com' });
      anotherUser.setPassword('test');
      await anotherUser.save();

      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: user._id });
      await userAssetLink.save();

      // Act
      const res = await chai.request(app).get(`/api/guestlinks/asset/${boat._uiId}`).set('Authorization', `Token ${anotherUser.generateJWT()}`);

      // Assert
      res.status.should.be.eql(400);
      res.body.errors.assetUiId.should.be.eql('isinvalid');
    });
  });

  describe('/POST guestlink Create a Guest link', () => {
    it('it should GET a 401 http code as a result because the request does not have the token', async () => {
      // Arrange

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({
        guestUiId: 'lsdfhguroqwfh', nameGuestLink: 'Guest link for Le Bon Coin', guestLinkUiId: 'asfephwg', assetUiId: 'sdfgs',
      });

      // Assert
      res.status.should.be.eql(401);
      res.body.errors.message.should.be.eql('No authorization token was found');
      res.body.errors.error.name.should.be.eql('UnauthorizedError');
      res.body.errors.error.code.should.be.eql('credentials_required');
      res.body.errors.error.status.should.be.eql(401);
    });

    it('it should GET a 422 http code as a result because the request is missing guestUiId', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({
        guestUiId: undefined, nameGuestLink: 'Guest link for Le Bon Coin', guestLinkUiId: 'asfephwg', assetUiId: 'sdfgs',
      }).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('guestUiId');
      res.body.errors.guestUiId.should.be.eql('isrequired');
    });

    it('it should GET a 422 http code as a result because the request is missing nameGuestLink', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({ guestUiId: undefined, guestLinkUiId: 'asfephwg', assetUiId: 'sdfgs' }).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('nameGuestLink');
      res.body.errors.nameGuestLink.should.be.eql('isrequired');
    });

    it('it should GET a 422 http code as a result because the request is missing assetUiId', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({ guestUiId: 'asdasdb', guestLinkUiId: 'asfephwg', assetUiId: undefined }).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('assetUiId');
      res.body.errors.assetUiId.should.be.eql('isrequired');
    });

    it('it should GET a 422 http code as a result because the request is missing guestLinkUiId', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({ guestUiId: 'asdasdb', guestLinkUiId: undefined, assetUiId: 'asfephwg' }).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('guestLinkUiId');
      res.body.errors.guestLinkUiId.should.be.eql('isrequired');
    });

    it('it should GET a 400 http code as a result because the asset does not exist', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({
        guestUiId: 'asdaein', nameGuestLink: 'Guest link for Le Bon Coin', guestLinkUiId: 'asfephwg', assetUiId: 'sdfgs',
      }).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('assetUiId');
      res.body.errors.assetUiId.should.be.eql('isinvalid');
    });

    it('it should GET a 400 http code as a result because the asset does not belong to the current user', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({
        guestUiId: 'asdaein', nameGuestLink: 'Guest link for Le Bon Coin', guestLinkUiId: 'asfephwg', assetUiId: boat._uiId,
      }).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('assetUiId');
      res.body.errors.assetUiId.should.be.eql('isinvalid');
    });

    it('it should GET a 200 http code as a result', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: user._id });
      await userAssetLink.save();

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({
        guestUiId: 'asdaein', nameGuestLink: 'Guest link for Le Bon Coin', guestLinkUiId: 'asfephwg', assetUiId: boat._uiId,
      }).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('guestlink');
      res.body.guestlink.should.be.a('object');
      res.body.guestlink.should.have.property('_uiId');
      res.body.guestlink.should.have.property('name');
      res.body.guestlink.should.have.property('niceKey');

      res.body.guestlink._uiId.should.be.eql('asfephwg');
      res.body.guestlink.name.should.be.eql('Guest link for Le Bon Coin');
    });

    it('it should GET a 400 http code credential error as a result because the user is readonly', async () => {
      // Arrange
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: user._id, readonly: true });
      await userAssetLink.save();

      // Act
      const res = await chai.request(app).post('/api/guestlinks/').send({
        guestUiId: 'asdaein', nameGuestLink: 'Guest link for Le Bon Coin', guestLinkUiId: 'asfephwg', assetUiId: boat._uiId,
      }).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(400);
      res.body.errors.should.be.eql('credentialError');
    });
  });

  describe('/DELETE guestLink', () => {
    let user: IUser;
    let boat: IAssets;
    let guestLink;

    beforeEach(async () => {
      user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: user._id });
      await userAssetLink.save();

      const res = await chai.request(app).post('/api/guestlinks/').send({
        guestUiId: 'asdaein', nameGuestLink: 'Guest link for Le Bon Coin', guestLinkUiId: 'asfephwg', assetUiId: boat._uiId,
      }).set('Authorization', `Token ${user.generateJWT()}`);
      guestLink = res.body.guestlink;
    });

    it('should remove the guestLink and return the deleted guest link and a 200 http code', async () => {
      // Arrange

      // Act
      const res = await chai.request(app).delete(`/api/guestlinks/${guestLink._uiId}`).set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(200);
      res.body.should.have.property('guestlink');
      res.body.guestlink.should.be.a('object');
      res.body.guestlink.should.have.property('_uiId');
      res.body.guestlink.should.have.property('name');
      res.body.guestlink.should.have.property('niceKey');

      res.body.guestlink._uiId.should.be.eql('asfephwg');
      res.body.guestlink.name.should.be.eql('Guest link for Le Bon Coin');
    });

    it('should get a 400 http code and a credential error', async () => {
      // Arrange
      let roUser = new Users({ name: 'read', firstname: 'only', email: 'read.only@gmail.com' });
      roUser.setPassword('test');
      roUser = await roUser.save();

      const userAssetLink = new AssetUser({ assetId: boat._id, userId: roUser._id, readonly: true });
      await userAssetLink.save();

      // Act
      const res = await chai.request(app).delete(`/api/guestlinks/${guestLink._uiId}`).set('Authorization', `Token ${roUser.generateJWT()}`);

      // Assert
      res.should.have.status(400);
      res.body.errors.should.be.eql('credentialError');
    });

    it('should send a 400 http code because the guestLinkUiId is invalid', async () => {
      // Arrange

      // Act
      const res = await chai.request(app).delete('/api/guestlinks/fdfd').set('Authorization', `Token ${user.generateJWT()}`);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('entity');
      res.body.errors.entity.should.be.eql('notfound');
    });

    it('it should GET a 401 http code as a result because the delete request does not have the token', async () => {
      // Arrange

      // Act
      const res = await chai.request(app).delete(`/api/guestlinks/${guestLink._uiId}`);

      // Assert
      res.status.should.be.eql(401);
      res.body.errors.message.should.be.eql('No authorization token was found');
      res.body.errors.error.name.should.be.eql('UnauthorizedError');
      res.body.errors.error.code.should.be.eql('credentials_required');
      res.body.errors.error.status.should.be.eql(401);
    });

    it('should send a 400 http code because the asset related to the guestLink is not owned by the current user', async () => {
      // Arrange
      let anotherUser = new Users({ name: 'rp', firstname: 'pp', email: 'rp@gmail.com' });
      anotherUser.setPassword('test');
      anotherUser = await anotherUser.save();

      // Act
      const res = await chai.request(app).delete(`/api/guestlinks/${guestLink._uiId}`).set('Authorization', `Token ${anotherUser.generateJWT()}`);

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('object');
      res.body.errors.should.have.property('guestLinkUiId');
      res.body.errors.guestLinkUiId.should.be.eql('isinvalid');
    });
  });
});
