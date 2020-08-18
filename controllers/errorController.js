const AppError = require('../utils/AppError');

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again!', 401);
};

const handleJWTError = () => {
  // return new AppError('Invalid token. Please log in again', 401);
  return new AppError(
    'You are not Logged In! Please log in and try again',
    401
  );
};

const handleCastErrorDB = (error1) => {
  const message = `Invalid--> ${error1.path}: ${error1.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (error1) => {
  const arr = Object.entries(error1.keyValue);
  // arr has this kind of structure
  // [ [ 'error field', 'error field value' ] ]
  const message = `${arr[0][0]}: ${arr[0][1]} already exits.`;
  // const { message } = error1;
  console.log(message);
  return new AppError(message, 400);
};

const handleValidationDB = (error1) => {
  const errors = Object.values(error1.errors).map(
    (element) => element.properties.message
  );
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (error, req, res) => {
  // originalUrl is the complete url without the host
  if (req.originalUrl.startsWith('/api')) {
    ////////////////////////////////////////////////////
    // 1---------------------------For API
    return res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
  /////////////////////////////////////////////////////////
  // 2-----------------FOR Rendering Website
  console.error('ERROR :', error);
  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: error.message,
  });
};

const sendErrorProd = (error, req, res) => {
  ///////////////////////////////////////////////////////
  // 1----------------------------- FOR API
  if (req.originalUrl.startsWith('/api')) {
    // 1A----- operational, trusted error: send msg to client
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }

    // 1B-------- programming or other unknown error: don't leak error details

    // 1) log error
    console.error('ERROR :', error);

    //2) Send general message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      //   operational: error.isOperational,
    });
  }
  ///////////////////////////////////////////////////////////
  // 2------------------- FOR RENDERED WEBSITE
  // 2A----------- operational, trusted error: send msg to client
  // eslint-disable-next-line no-lonely-if
  if (error.isOperational) {
    // console.log(error);
    return res.status(error.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: error.message,
    });
  } //2B----------- programming or other unknown error: don't leak error details

  // 1) log error
  console.error('ERROR :', error);

  //2) Send general message
  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again',
  });
};

module.exports = (error, req, res, next) => {
  //   console.log(error.stack);
  error.statusCode = error.statusCode || 500; //internal server err
  error.status = error.status || 'error';

  console.log(process.env.NODE_ENV);
  //////////---------Development
  if (process.env.NODE_ENV === 'development') {
    console.log('this is error:\n', error);
    sendErrorDev(error, req, res);
  } ////////////-------Production
  else if (process.env.NODE_ENV === 'production') {
    let error1 = { ...error };
    console.log('this is error:\n', error);
    error1.message = error.message;

    console.log('this is error1:\n', error1);

    // here i dont know why but error object has the name field but does not include it when copied to error1/or can be said that the name of error is not visible to be copied to error1
    if (error.name === 'CastError') {
      error1 = handleCastErrorDB(error1);
      //   console.log('went inside');
    }
    // console.log(error1.name);

    if (error.code === 11000) error1 = handleDuplicateFieldsDB(error1);

    // this error is coming from mongooose librara=y
    if (error.name === 'ValidationError') error1 = handleValidationDB(error1);

    if (error.name === 'JsonWebTokenError') error1 = handleJWTError();

    if (error.name === 'TokenExpiredError') error1 = handleJWTExpiredError();

    sendErrorProd(error1, req, res);
  }
  //   next();
};
