import * as express from 'express';

interface IController {
    getRouter(): express.Router;
}

export default IController;
