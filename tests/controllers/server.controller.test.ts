/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import chai from 'chai';
import chaiHttp from 'chai-http';

import { restoreLogger, mockLogger } from '../MockLogger';

import server from '../../src/server';

const { app } = server;

chai.use(chaiHttp);
const { expect } = chai;
const should = chai.should();

describe('Server', () => {
  before(() => {
    mockLogger();
  });

  after(() => {
    restoreLogger();
  });

  beforeEach(async () => {
  });

  afterEach(async () => {
  });

  describe('/GET ping', () => {
    it('it should GET a pong', async () => {
      // Arrange
      // Act
      const res = await chai.request(app).get('/api/server/ping');

      // Assert
      res.should.have.status(200);
      res.body.pong.should.be.eql(true);
    });
  });
});
