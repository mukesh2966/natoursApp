class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    // so later can test if error is operational, as we only send operational errors to the user
    ////////-------------stacktrace
    Error.captureStackTrace(this, this.constructor);
    // this way when a new object of AppError class is created, its not gonna appear in stacktrace, thereby,will not pollute the stacktrace
  }
}

module.exports = AppError;
