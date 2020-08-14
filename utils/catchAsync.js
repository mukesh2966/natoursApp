const catchAsync = (fn) => {
  return (req, res, next) => {
    // fn(req, res, next).catch((error) => next(error));
    //-------same as above in ES6
    fn(req, res, next).catch(next);
  };
};
module.exports = catchAsync;
