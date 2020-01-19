//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
import ignoredErrorMessages, {restoreLogger, mockLogger} from '../MockLogger';

import server from '../../src/server';
const app = server.app;

const chai = require('chai')
  , chaiHttp = require('chai-http');
 
chai.use(chaiHttp);
const expect = chai.expect;
const should = chai.should();

import sinon from 'sinon';

import Guests from '../../src/models/Guests';
import Users from '../../src/models/Users';

describe('Guests', () => {
    before(() => {
        mockLogger();
        ignoredErrorMessages.push("No authorization token was found");
    });

    after(() => {
        restoreLogger();
    });

    afterEach(async () => {
        await Guests.deleteMany({});
        await Users.deleteMany({});
        sinon.restore();        
    });

    describe('/GET guest', () => {
        it('it should GET a 400 http code as a result because the niceKey cannot be find', async () => {
          // Arrange

          // Act
          const res = await chai.request(app).get('/api/guests/mysupernicekeythatcannnotbefound')
          
          // Assert
          res.status.should.be.eql(400);
          res.body.errors.niceKey.should.be.eql("isinvalid");
        });

        it('it should GET a 400 http error code as a result because the owner user cannot be found', async () => {
          // Arrange
          const mongoose = require('mongoose');
          const guestUserId = new mongoose.Types.ObjectId();
          const ownerUserId = new mongoose.Types.ObjectId();
          const guest = new Guests({ niceKey: 'thisisanicekey', name:'name of the link created by the owner', guestUserId, ownerUserId });
          await guest.save();

          // Act
          const res = await chai.request(app).get('/api/guests/thisisanicekey');
          
          // Assert
          res.should.have.status(400);
          res.body.errors.ownerUserId.should.be.eql("isinvalid");
        });

        it('it should GET a 400 http error code as a result because the guest user cannot be found', async () => {
          var mongoose = require('mongoose');
          const ownerUser = new Users({ name: "r", firstname: "p", email: "r@gmail.com", _uiId: "lsdifhoe8ryfq" });
          ownerUser.setPassword("test");
          await ownerUser.save();

          const guest = new Guests({ niceKey: 'thisisanicekey', name:'name of the link created by the owner', guestUserId: new mongoose.Types.ObjectId(), ownerUserId: ownerUser._id});
          await guest.save();

          const res = await chai.request(app).get('/api/guests/thisisanicekey');
          
          res.should.have.status(400);
          res.body.errors.guestUserId.should.be.eql("isinvalid");
        });

        it('it should GET a guest user', async () => {
          const ownerUser = new Users({ name: "r", firstname: "p", email: "r@gmail.com", _uiId: "lsdifhoe8ryfq", isVerified: true });
          ownerUser.setPassword("test");
          await ownerUser.save();

          const guestUser = new Users({ name: "Guest", firstname: "Guest", email: "", _uiId: "asdfu;;kdfireruiwelloewr857fas", isVerified: true });
          guestUser.setPassword("guest");
          await guestUser.save();

          const guest = new Guests({ name: 'Invitation for LeBonCoin', ownerUserId: ownerUser._id, guestUserId: guestUser._id, niceKey: 'thisisanicekey'});
          await guest.save();

          const res = await chai.request(app).get('/api/guests/thisisanicekey');
          
          res.should.have.status(200);
          res.body.user._uiId.should.be.eql(guestUser._uiId);
          res.body.user.name.should.be.eql(guestUser.name);
          res.body.user.firstname.should.be.eql(guestUser.firstname);
        });
      });

      describe('/POST guest Create a Guest link with the current owner', () => {
        it('it should GET a 401 http code as a result because the request does not have the token', async () => {
          // Arrange

          // Act
          const res = await chai.request(app).post('/api/guests/', ).send({ guestUiId: 'lsdfhguroqwfh', nameGuestLink: 'Guest link for Le Bon Coin' });
          
          // Assert
          res.status.should.be.eql(401);
          res.body.errors.message.should.be.eql("No authorization token was found");
          res.body.errors.error.name.should.be.eql("UnauthorizedError");
          res.body.errors.error.code.should.be.eql("credentials_required");
          res.body.errors.error.status.should.be.eql(401);
        });

        it('it should GET a 422 http code as a result because the request is missing guestUiId', async () => {
          // Arrange
          const user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
          user.setPassword("test");
          await user.save();

          // Act
          const res = await chai.request(app).post('/api/guests/', ).send({ guestUiId: undefined, nameGuestLink: 'Guest link for Le Bon Coin' }).set("Authorization", "Token " + user.generateJWT());
          
          // Assert
          res.should.have.status(422);
          res.body.should.have.property("errors");
          res.body.errors.should.be.a("object");
          res.body.errors.should.have.property("guestUiId");
          res.body.errors.guestUiId.should.be.eql("isrequired");
        });

        it('it should GET a 422 http code as a result because the request is missing nameGuestLink', async () => {
          // Arrange
          const user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
          user.setPassword("test");
          await user.save();

          // Act
          const res = await chai.request(app).post('/api/guests/', ).send({ guestUiId: 'ldsihflasihfd;asidf', nameGuestLink: undefined }).set("Authorization", "Token " + user.generateJWT());
          
          // Assert
          res.should.have.status(422);
          res.body.should.have.property("errors");
          res.body.errors.should.be.a("object");
          res.body.errors.should.have.property("nameGuestLink");
          res.body.errors.nameGuestLink.should.be.eql("isrequired");
        });

        it('it should GET a 200 http code as a result because the Guest link succeed', async () => {
          // Arrange
          const user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
          user.setPassword("test");
          await user.save();

          // Act
          const res = await chai.request(app).post('/api/guests/', ).send({ guestUiId: 'ldsihflasihfd;asidf', nameGuestLink: 'A Guest link for LeBonCoin' }).set("Authorization", "Token " + user.generateJWT());
          
          // Assert
          res.should.have.status(200);
          res.body.should.have.property("guest");
          res.body.guest.should.be.a("object");

          res.body.guest.should.have.property("name");
          res.body.guest.name.should.be.eql('A Guest link for LeBonCoin');

          res.body.guest.should.have.property("niceKey");
        });
    });
});