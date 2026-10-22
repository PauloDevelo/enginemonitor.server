process.env.NODE_ENV = 'test';

import chai from 'chai';
import {
  DEFAULT_LISTEN_HOST,
  DEFAULT_LOG_LEVEL,
  getListenHost,
  getLogLevel,
} from '../../src/utils/configResolvers';

const { expect } = chai;

const fakeConfig = (values: Record<string, unknown>) => ({
  has: (key: string) => Object.prototype.hasOwnProperty.call(values, key),
  get: <T>(key: string) => values[key] as T,
});

describe('getListenHost', () => {
  it('should default to loopback when the host key is absent', () => {
    // Act & Assert
    expect(getListenHost(fakeConfig({}))).to.equal('127.0.0.1');
    expect(DEFAULT_LISTEN_HOST).to.equal('127.0.0.1');
  });

  it('should default to loopback when the host key is blank', () => {
    // Act & Assert
    expect(getListenHost(fakeConfig({ host: '' }))).to.equal('127.0.0.1');
    expect(getListenHost(fakeConfig({ host: '   ' }))).to.equal('127.0.0.1');
  });

  it('should pass an explicit override through, trimmed', () => {
    // Act & Assert
    expect(getListenHost(fakeConfig({ host: '0.0.0.0' }))).to.equal('0.0.0.0');
    expect(getListenHost(fakeConfig({ host: '::1' }))).to.equal('::1');
    expect(getListenHost(fakeConfig({ host: ' 10.0.0.5 ' }))).to.equal('10.0.0.5');
  });
});

describe('getLogLevel', () => {
  it('should default to info when the key is absent or blank', () => {
    // Act & Assert
    expect(getLogLevel(fakeConfig({}))).to.equal('info');
    expect(getLogLevel(fakeConfig({ LogLevel: '  ' }))).to.equal('info');
    expect(DEFAULT_LOG_LEVEL).to.equal('info');
  });

  it('should return the configured level, trimmed', () => {
    // Act & Assert
    expect(getLogLevel(fakeConfig({ LogLevel: 'debug' }))).to.equal('debug');
    expect(getLogLevel(fakeConfig({ LogLevel: ' warn ' }))).to.equal('warn');
  });
});
