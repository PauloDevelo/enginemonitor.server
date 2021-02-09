import winston from 'winston';

if (process.env.NODE_ENV === undefined) {
  winston.log('warn', 'Please, consider setting the environment variable NODE_ENV.');
  winston.log('warn', 'As NODE_ENV is undefined, the value dev will be used.');
  process.env.NODE_ENV = 'dev';
}

if (process.env.NODE_ENV === 'production') {
  process.env.NODE_ENV = 'prod';
}

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_ENV = 'dev';
}

if (process.env.NODE_ENV !== 'prod'
    && process.env.NODE_ENV !== 'test'
    && process.env.NODE_ENV !== 'dev') {
  winston.log('error', 'Please, consider setting the environment variable NODE_ENV with one of these values: test|dev|prod');
  winston.log('error', 'As NODE_ENV is not set correctly, the value dev will be used.');
  process.env.NODE_ENV = 'dev';
}
export const isProd = process.env.NODE_ENV === 'prod';
export const isDev = process.env.NODE_ENV === 'dev';
export const isTest = process.env.NODE_ENV === 'test';

// eslint-disable-next-line import/first
import config from 'config';

export default config;
