import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line no-unused-vars
const wrapAsync = (fn: (_req: Request, _res: Response, _next: NextFunction) => Promise<any>) => {
  const asyncFuncWrapperHandler = (req: Request, res: Response, next: NextFunction): any => {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next);
  };

  return asyncFuncWrapperHandler;
};

export default wrapAsync;
