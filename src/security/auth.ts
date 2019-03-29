import jwt from "express-jwt";
import { IncomingMessage } from "http";
import config from "../utils/configUtils";

const getTokenFromHeaders = (req: IncomingMessage): string => {
  const { headers: { authorization } } = req;

  if (authorization && authorization.split(" ")[0] === "Token") {
    return authorization.split(" ")[1];
  }

};

const auth = {
  optional: jwt({
    credentialsRequired: false,
    getToken: getTokenFromHeaders,
    secret: config.get("JWT_PrivateKey"),
    userProperty: "body.payload",
  }),
  required: jwt({
    getToken: getTokenFromHeaders,
    secret: config.get("JWT_PrivateKey"),
    userProperty: "body.payload",
  }),
};

export default auth;
