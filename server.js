// will contain config of the server/application
// everything except the express manipulations

const mongoose = require('mongoose');
const dotenv = require('dotenv');

////////////////////////////////////////////////////////////////
// this safe-net should be before any code as it needs to start listening for uncaught exceptions from the start
// for synchronous code
// uncaught exception/bugs in our code
// e.g. console.log(x) where x is not defined gives an error
// watching out the process to emit uncaughtException object
process.on('uncaughtException', (error) => {
  console.log('UNCAUGHT EXCEPTION!!, SHUTTING DOWN');
  console.log(error.name, error.message);
  // shut down our application as a promise is left unhandled
  process.exit(1); // 0-- success     1 -- uncaught exception
  // here should be a tool in place to again start
});

/////////////////////////////////////////////////////////////////

dotenv.config({ path: './config.env' });
const app = require('./app');

//////////////////////////////////////////////////////////
///////-----------Environment Variables------------//////

// console.log(app.get('env')); // this environment variable is set by express
// node js also sets a lot of env variables
// console.log(process.env);

/////////////////////////////////////////////////////////////
// connecting to database

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    // deprecation warnings
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((connection) => {
    // console.log(connection.connections);
    console.log('DB connection succesful');
  });

////////////////////////////////////////////////////////
// 4) START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

////////////////////////////////////////////////////////

// for asynchronous code
// a good example here is failing of mongo database connection we haven't handled it anywhere yet. So, it will be handled here.
// unhandled promise rejection
// watching out the process to emit unhandledRejection object
process.on('unhandledRejection', (error) => {
  console.log('UNHANDLED REJECTION!!, SHUTTING DOWN');
  console.log(error.name, error.message);
  // shut down our application as a promise is left unhandled
  server.close(() => {
    process.exit(1); // 0-- success     1 -- uncaught exception
  });
  // here should be a tool in place to again start
});

// For heroku specific shutdowns
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED, Shutting down gracefully!!!!!!!!!!!!!!!!!');
  server.close(() => {
    console.log(
      'Process terminated after SIGTERM graceful shutdown!!!!!!!!!!!!!!!!!!'
    );
  });
});

////////////////////////////////////////////////////////////////

// ERROR inside a middleware, directly triggers the global error handling middleware
//
