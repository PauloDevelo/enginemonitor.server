import jwt from 'express-jwt';
import { IncomingMessage } from 'http';
import config from '../utils/configUtils';

export const getTokenFromHeaders = (req: IncomingMessage): string => {
  const { headers: { authorization } } = req;

  if (!authorization) {
    return '';
  }

  const authorizationFields = authorization.split(' ');
  if (authorizationFields.length !== 2 || authorizationFields[0] !== 'Token') {
    return '';
  }

  return authorizationFields[1];
};

const auth = {
  optional: jwt({
    credentialsRequired: false,
    getToken: getTokenFromHeaders,
    secret: config.get('JWT_PrivateKey'),
    userProperty: 'body.payload',
  }),
  required: jwt({
    getToken: getTokenFromHeaders,
    secret: config.get('JWT_PrivateKey'),
    userProperty: 'body.payload',
  }),
};

export default auth;
