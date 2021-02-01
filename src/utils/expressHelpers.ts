const wrapAsync = (fn) => {
  const asyncFuncWrapperHandler = (req, res, next) => {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next);
  };

  return asyncFuncWrapperHandler;
};

export default wrapAsync;
