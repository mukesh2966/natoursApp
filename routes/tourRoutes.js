const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authentication');
const reviewRouter = require('./reviewRoutes');
// const { route } = require('./userRoutes');

// const fs = require('fs');

// const x = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
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

/////////////////////////////////////

const router = express.Router();

/////////////////--------------------------
/////////////////// Review inside tour
// POST /tour/2345dfg/reviews-->nested route
// are used when there is a clear parent-child relationship
// between routes
// accessing the review resource on the tour resource

// GET /tour/2345dfg/reviews-->nested route
// this will get all the reviews for this tour

// POST /tour/2345dfg/reviews/fsdfsdf34-->nested route
// we will get review with id and on tour with id

// same can be done with queryString but gets messy messy there.

// INSTEAD of using this, we are going to use express mergeParams
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protection,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

// use reviewRouter for this route---> this is actually just mounting a router
// if we encounter such a route
// we go from app.js(tourRouter)-->here-->reviewRouter
router.use('/:tourId/reviews', reviewRouter);
////////////////////////////////////////////////////////

// param middleware --- middleware that only runs with a certain parameter present in the url
// router.param('id', tourController.checkID);

//////////////////////////////////////////////////////////////////
///-------get 5 cheapest tours
// router.get('/cheapestTours', tourController.getCheapestTours);

// -----------------------------------------------------------------
// ------or use middle ware on tourController.getAllTours route

router.get(
  '/get-5-cheapest',
  tourController.aliasTopTours,
  tourController.getAllTours
);

/////////////////////////////////////////////////////////////
// ----------Aggregation pipeline Route

router.get('/tour-stats', tourController.getTourStats);
router.get(
  '/monthly-plan/:year',
  authController.protection,
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlan
);

router.get(
  '/tours-within/:distance/center/:latlng/unit/:unit',
  tourController.getToursWithin
);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

// get the distance of start location of all tours from a certain point
router.get('/distances/:latlng/unit/:unit', tourController.getDistances);
///////////////////////////////////////////////////////////////
router.get('/', tourController.getAllTours);
router.post(
  '/',
  authController.protection,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.addTour
); ////////////////////////////// chaining multiple middlewares

// creating a variable called id, in a variable route
router.get('/:id', tourController.getTour);
router.patch(
  '/:id',
  authController.protection,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.uploadTourImages,
  tourController.resizeTourImages,
  tourController.updateTour
);
router.delete(
  '/:id',
  authController.protection,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.deleteTour
);

module.exports = router;
