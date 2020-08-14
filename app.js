const path = require('path'); // for joining paths
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const express = require('express');
// const fs = require('fs');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

///////////-------SETTING UP PUG ENGINE----------------
// Using pug for template filling
app.set('view engine', 'pug');
// setting views folder--(folder containing templates)
app.set('views', path.join(__dirname, 'views')); // try to always use this path module to join to paths, as it reduces the chances of a bug.

console.log('this is a test path ::::', path.join(__dirname, 'views'));
///////////////////////////////////////////////////////
// 1) GLOBAL MIDDLEWARES
// SERVING STATIC FILES---all the static assests will be served from the public folder------used late in pug template
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// SET SECURITY HTTP HEADERS
// using HELMET package; //kinda mandatory in using express
// helmet() will return a function, that will be used in the middleware
app.use(helmet());

///////////////////////////////----------------------
// LIMIT REQUESTS FROM THE SAME API
// To limit number of requests from an IP in a limited time frame
const limiter = rateLimit({
  // 100 requests from a single ip allowed in 1hour
  max: 200, // no. of requests
  windowMs: 60 * 60 * 1000, // time in ms
  message: 'Too many requests from this IP,please try again in an hour!',
});
// To limit number of requests from an IP in a limited time frame
// to any route starting with /api
app.use('/api', limiter);

// DEVELOPMENT LOGGING
// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  // console.log(Xxxx); error inside non-async middleware are caught by the last net of error defense --- u know what i mean(in server.js file last sections)
}

// BODY PARSER, READING DATA FROM THE BODY INTO REQ.BODY
// using middleware --data from the body is added to the request
// using this middleware
// the 20kb limit is set for the max space that the req.body data can amount to, any bigger data will not be parsed
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
// ---------for parsing form data to the req.body(in the url encoded form)
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
);

// above middleware(body parser) reads the data from the user-end(body), so here after that we can perform sanitization

// DATA SANITIZATION AGAINST NOSQL QUERY INJECTION
app.use(mongoSanitize()); // what is does is just remove the $ sign from req.body , req.params,req.query and now the reamaining malicious mongoCommanda(if any) are useless without $.

// DATA SANITIZATION AGAINST XSS(CROSS SITE SCRIPTING) ATTACKS
app.use(xss()); // this will clean any user input from malicious html/js code, it converts the malicious html codes
// adding validator in mongoose Schemas is in itself a good way to protect against xss attacks on the server side.

// PREVENT PARAMETER POLLUTION -- it clears up the query string so should be used after bodyparser package

// There are 2 cases in our application
// 1) we do not want to go like this
// {{URL}}api/v1/tours?sort=duration&sort=price
// here, in our sort logic: sort = duration,price ; this is expected in place of above queryString(sort=duration&sort=price). Technically that is correct in mongodb but in our logic of implementing sort(ApiFeatures:line26) , it throws error.
// So, what this hpp package does is, it just removes the first sort=duration from the queryString, and not it becomes
// {{URL}}api/v1/tours?sort=price which works with our logic.

// 2) we want to go like this
// {{URL}}api/v1/tours?duration=5&duration=9
// here the queryString is duration=5&duration=9, which is both technically correct(that gets converted to)
// (---tour.find({"duration":["5","9"]})-----)
// (and is correct as a mongodb operation)
// and also works with our logic of finding queries with duration 5 and duration 9
// But hpp package, just removes duration 5 from the queryString and now it searchs for only this----
// {{URL}}api/v1/tours?duration=9
// which was not expected(as it was logically supposed to work)
// So, we whiteList it(duration) and also some other fields.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// our middleware function
// app.use((req, res, next) => {
//   console.log('this is middleware');

//   // important-- to continue the req-res cycle
//   next();
// });

// JUST SOME TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log('this is headers sent: ', req.headers);
  // console.log(req.cookies);
  next();
});

///////////////////////////////////////////////////////////////////////////////////////////////////
////////------------------- Accessing static files from the browser using express
// since we do not have any dedicated routes and route handlers for serving static file (e.g. html,css,images)
// we can use this built-in express middleware
//////////////////////////////////////////

// app.use(express.static(`${__dirname}/public`));

////////////////////////////////////////////////
// now we should be able to access all static files inside public folder
// from our browser--- by giving the appropriate route for the resource

// WHAT ACTUALLY HAPPENS
// is that when our browser cannot find any route/routeHandlers set for a particular resource, then it looks into this
// express-middleware and considers path specified here as root, for accessing any further resources.

////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////
// 2) ROUTE HANDLERS
// const x = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

// const getAllTours = (req, res) => {
//   console.log(req.requestTime);
//   console.log(req.body);
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: x.length,
//     data: {
//       tours: x,
//     },
//   });
// };

// const getTour = (req, res) => {
//   console.log(req.params); // gives {id :'5'}
//   // does the same for all such parameters in the request made
//   // all the parameters must be defined, unless made optional.
//   // /api/v1/tours/:id?/:yankei
//   // id is optional here, yankei is required.

//   const id = req.params.id * 1;

//   // find will create an array where this comparison is true.
//   const tour = x.find((current) => {
//     return current.id === id;
//   });

//   // tour will be undefined when no such id is present
//   // if(!tour)
//   if (id > x.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid id',
//     });
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// };

// const addTour = (req, res) => {
//   // console.log(req.body);

//   const newId = x[x.length - 1].id + 1;
//   // create new object -- by merging two objects together
//   const newTour = Object.assign({ id: newId }, req.body);

//   // pushing newTour in the datastructure
//   x.push(newTour);

//   // adding new tour to the file/database
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(x),
//     (error) => {
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour,
//         },
//       });
//     }
//   );

//   // cannot send two responses
//   // res.send('Done');
// };

// const updateTour = (req, res) => {
//   const id = req.params.id * 1;
//   if (id > x.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid id',
//     });
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: 'tour should be updated by now.',
//     },
//   });
// };

// const deleteTour = (req, res) => {
//   const id = req.params.id * 1;
//   if (id > x.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid id',
//     });
//   }

//   // 204 means -- no content
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// };

// route handlers for users resource
// const getAllUsers = (req, res) => {
//   console.log('trying to get all users');
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
// const addUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
// const getUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
// const deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
///////////////////////////////////////////////////
// 3) ROUTES

const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
// mounting routers on 2 differnet routes that we implemented
app.use('/api/v1/tours', tourRouter); // applying tourRouter middle ware for this route
app.use('/api/v1/users', userRouter); // applying userRouter middleware for this route
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

///////////////////////////////////////////////////////////////
//------middleware for handling NOT FOUND PAGE
// the idea is that if we are able to reach this point in our code, it means that the req-res cycle is not finished.
// (since, the middleware is added into the middleware stack, in the order it is written in our code file).
// So, not since above two urlpaths were not taken, then this path will be considered for response sending.

// ----- .all handles all -- get/post/patch/delete/.....etc paths
app.all('*', (req, res, next) => {
  ////////////////////////-----Way1
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cannot find ${req.originalUrl} on this server!`,
  // });
  ///////////////////////////---Way2
  // const error = new Error(`Cannot find ${req.originalUrl} on this server!`);
  // error.status = 'fail';
  // error.statusCode = 404;
  // // express assumes that whatever we pass into next is an error object
  // // then it will skip all the intermediate middlewares and directly pass the error to global error handling middleware
  // next(error);
  ////////////////////----Way3
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

///////////////////////////////////////////////////////////////
//----------------------------------------------------------------
// ERROR HANDLING MIDDLEWARE----------------for operational errors
app.use(globalErrorHandler);
///////////////////////////////////////////////////////////////

// Method 1

// const tourRouter = express.Router();
// app.use('/api/v1/tours', tourRouter);

// tourRouter.get('/', getAllTours);
// tourRouter.post('/', addTour);

// // creating a variable called id, in a variable route
// tourRouter.get('/:id', getTour);
// tourRouter.patch('/:id', updateTour);
// tourRouter.delete('/:id', deleteTour);

// Method 2
// this method2 is not working, do not know why
// app.route('api/v1/tours').get(getAllTours).post(addTour);

// app.route('api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour);

// users resource

// const userRouter = express.Router();
// app.use('/api/v1/users', userRouter); // mounting router

// app.get('/api/v1/users', getAllUsers);
// app.post('/api/v1/users', addUser);
// app.get('/api/v1/users/:id', getUser);
// app.patch('/api/v1/users/:id', updateUser);
// app.delete('/api/v1/users/:id', deleteUser);

// userRouter.route('/').get(getAllUsers).post(addUser);

// userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

// ////////////////////////////////////////////////////////
// // 4) START SERVER
// const port = 3000;
// app.listen(port, () => {
//   console.log(`app running on port ${port}`);
// });

module.exports = app;

// Express app implemented
