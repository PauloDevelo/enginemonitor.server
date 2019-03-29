import * as express from "express";

export default interface IController {
    getRouter(): express.Router;
}
