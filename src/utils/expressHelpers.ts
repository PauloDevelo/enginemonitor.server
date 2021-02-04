import express from 'express';

// eslint-disable-next-line no-unused-vars
const wrapAsync = (fn: (_req: express.Request, _res: express.Response, _next: any) => Promise<any>) => {
  const asyncFuncWrapperHandler = (req: express.Request, res: express.Response, next) => {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next);
  };

  return asyncFuncWrapperHandler;
};

export default wrapAsync;
