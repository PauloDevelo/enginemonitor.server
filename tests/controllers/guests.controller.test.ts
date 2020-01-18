//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import server from '../../src/server';
const app = server.app;

import config from '../../src/utils/configUtils';

const chai = require('chai')
  , chaiHttp = require('chai-http');
 
chai.use(chaiHttp);
const expect = chai.expect;
const should = chai.should();

import sinon from 'sinon';

import Guests from '../../src/models/Guests';
import Users from '../../src/models/Users';

import ignoredErrorMessages, {restoreLogger, mockLogger} from '../MockLogger';
import GuestsController from '../../src/controllers/guests.controller';

describe('Guests', () => {
    before(() => {
        mockLogger();
        //ignoredErrorMessages.push("Sending a message");
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
});