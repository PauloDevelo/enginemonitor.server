/* eslint-disable no-unused-vars */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';

const { expect } = chai;
const should = chai.should();

describe('Import of configUtils', () => {
  beforeEach(() => {
    delete require.cache[require.resolve('../../src/utils/configUtils')];
  });

  it('should be dev because NODE_ENV is not defined', () => {
    // Arrange
    process.env.NODE_ENV = undefined;

    // Act
    const config = require('../../src/utils/configUtils');

    // Assert
    config.isDev.should.be.true;
    config.isProd.should.be.false;
    process.env.NODE_ENV.should.be.eq('dev');
  });

  it('should be dev because NODE_ENV is dev', () => {
    // Arrange
    process.env.NODE_ENV = 'dev';

    // Act
    const config = require('../../src/utils/configUtils');

    // Assert
    config.isDev.should.be.true;
    config.isProd.should.be.false;
    process.env.NODE_ENV.should.be.eq('dev');
  });

  it('should be dev because NODE_ENV is development', () => {
    // Arrange
    process.env.NODE_ENV = 'development';

    // Act
    const config = require('../../src/utils/configUtils');

    // Assert
    config.isDev.should.be.true;
    config.isProd.should.be.false;
    process.env.NODE_ENV.should.be.eq('dev');
  });

  it('should be dev because NODE_ENV is not recognized', () => {
    // Arrange
    process.env.NODE_ENV = 'tr';

    // Act
    const config = require('../../src/utils/configUtils');

    // Assert
    config.isDev.should.be.true;
    config.isProd.should.be.false;
    process.env.NODE_ENV.should.be.eq('dev');
  });

  it('should be prod because NODE_ENV is prod', () => {
    // Arrange
    process.env.NODE_ENV = 'prod';

    // Act
    const config = require('../../src/utils/configUtils');

    // Assert
    config.isDev.should.be.false;
    config.isProd.should.be.true;
    process.env.NODE_ENV.should.be.eq('prod');
  });

  it('should be prod because NODE_ENV is production', () => {
    // Arrange
    process.env.NODE_ENV = 'production';

    // Act
    const config = require('../../src/utils/configUtils');

    // Assert
    config.isDev.should.be.false;
    config.isProd.should.be.true;
    process.env.NODE_ENV.should.be.eq('prod');
  });

  it('should be test because NODE_ENV is test', () => {
    // Arrange
    process.env.NODE_ENV = 'test';

    // Act
    const config = require('../../src/utils/configUtils');

    // Assert
    config.isDev.should.be.false;
    config.isProd.should.be.false;
    process.env.NODE_ENV.should.be.eq('test');
  });
});
