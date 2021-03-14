/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// eslint-disable-next-line import/order
import server from '../../src/server';

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiFs from 'chai-fs';
import sinon from 'sinon';
import timeService from '../../src/services/TimeService';

import Users from '../../src/models/Users';

import { restoreLogger, mockLogger } from '../MockLogger';

const { app } = server;
chai.use(chaiHttp);
chai.use(chaiFs);
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
    await Users.deleteMany({});
    sinon.restore();
  });

  describe('new User', () => {
    it('should create the image folder', async () => {
      // Arrange

      // Act
      const user = new Users({
        name: 'r', firstname: 'p', email: 'rg@gmail.com', _uiId: 'test',
      });

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
});
