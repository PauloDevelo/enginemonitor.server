/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'dev';
delete require.cache[require.resolve('../../src/utils/configUtils')];
delete require.cache[require.resolve('../../src/utils/mongoDb')];

import chai from 'chai';
import DbMetadatas from '../../src/models/Metadata';
import getDbVersion, { expectedVersion } from '../../src/utils/mongoDb';

import ignoredErrorMessages, { restoreLogger, mockLogger } from '../MockLogger';

const { expect } = chai;
const should = chai.should();

describe('Test of monDb utils', () => {
  before(async () => {
    await DbMetadatas.deleteMany({});
    mockLogger();
    ignoredErrorMessages.push('The current version');
  });

  afterEach(async () => {
    await DbMetadatas.deleteMany({});
  });

  after(async () => {
    const version = new DbMetadatas({ version: expectedVersion });
    await version.save();
    restoreLogger();
  });

  it('When the db release does not match with the current db release number, it should throw an excption', (done) => {
    // Arrange
    const version = new DbMetadatas({ version: expectedVersion + 1 });
    version.save().then(() => {
      // Act
      getDbVersion().catch(() => {
        // Assert
        done();
      });
    });
  });

  it('When the db release does match with the current db release number, it throw an exception', (done) => {
    // Arrange
    const version = new DbMetadatas({ version: expectedVersion });
    version.save().then(() => {
      getDbVersion().then(() => {
        // Assert
        done();
      });
    });
  });
});
