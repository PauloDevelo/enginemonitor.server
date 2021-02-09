/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import chai from 'chai';

import { IncomingMessage } from 'http';
import { restoreLogger, mockLogger } from '../MockLogger';

import { getTokenFromHeaders } from '../../src/security/auth';

const { expect } = chai;
const should = chai.should();

describe('auth', () => {
  before(() => {
    mockLogger();
  });

  after(() => {
    restoreLogger();
  });

  afterEach(() => {
  });

  describe('getTokenFromHeaders', () => {
    it('Should return the expected token when the authorization property is well formed', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Token abc',
        },
      };

      // Act
      const token = getTokenFromHeaders(req as IncomingMessage);

      // Assert
      token.should.eql('abc');
    });

    it('Should return an empty string when the authorization property is not well formed', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Token',
        },
      };

      // Act
      const token = getTokenFromHeaders(req as IncomingMessage);

      // Assert
      token.should.eql('');
    });

    it('Should return an empty string when the authorization property is not well formed', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'token abc',
        },
      };

      // Act
      const token = getTokenFromHeaders(req as IncomingMessage);

      // Assert
      token.should.eql('');
    });

    it('Should return an empty string when the authorization property is not well formed', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Token abc dd',
        },
      };

      // Act
      const token = getTokenFromHeaders(req as IncomingMessage);

      // Assert
      token.should.eql('');
    });

    it('Should return an empty string when the authorization property is not well formed', async () => {
      // Arrange
      const req = {
        headers: {
          authorization: undefined,
        },
      };

      // Act
      const token = getTokenFromHeaders(req as IncomingMessage);

      // Assert
      token.should.eql('');
    });
  });
});
