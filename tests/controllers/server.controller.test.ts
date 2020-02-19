//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
import ignoredErrorMessages, {restoreLogger, mockLogger} from '../MockLogger';

import server from '../../src/server';
const app = server.app;

import mongoose from 'mongoose';

const chai = require('chai')
  , chaiHttp = require('chai-http');
 
chai.use(chaiHttp);
const expect = chai.expect;
const should = chai.should();

describe('Server', () => {
    before(() => {
        mockLogger();
    });

    after(() => {
        restoreLogger();
    });

    beforeEach(async() => {
    })

    afterEach(async () => {
    });

    describe('/GET ping', () => {
        it('it should GET a pong', async () => {
            // Arrange
            // Act
            let res = await chai.request(app).get(`/api/server/ping`);

            // Assert
            res.should.have.status(200);
            res.body.pong.should.be.eql(true);
        });
    });
});