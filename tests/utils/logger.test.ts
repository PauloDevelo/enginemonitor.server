/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-explicit-any */
process.env.NODE_ENV = 'test';

import chai from 'chai';
import { createAppLogger, default as logger } from '../../src/utils/logger';
import { getLogLevel } from '../../src/utils/configResolvers';

const { expect } = chai;

const consoleTransportLevel = (instance: any) => {
  const consoleTransport = instance.transports.find((transport) => transport.constructor.name === 'Console');

  return consoleTransport.level;
};

describe('createAppLogger', () => {
  it('should apply the given level to the logger and to the console transport', () => {
    // Act
    const instance = createAppLogger('warn');

    // Assert
    expect(instance.level).to.equal('warn');
    expect(consoleTransportLevel(instance)).to.equal('warn');
  });
});

describe('default logger', () => {
  it('should use the LogLevel value from the active configuration', () => {
    // Assert
    expect(logger.level).to.equal(getLogLevel());
    expect(consoleTransportLevel(logger)).to.equal(getLogLevel());
  });
});
