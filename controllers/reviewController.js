const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

exports.getAllReviews = factory.getAll(Review);

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) {
//     filter = { tourBelong: req.params.tourId };
//   }

//   const reviews = await Review.find(filter);

//   //   if (!reviews) {
//   //     return next(new AppError('No reviews yet', 401));
//   //   }

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

// before using the generalized createOne factory function
// We need to implement a middleware that runs before createOne to add the additional functionalities that we have here inside the custom one

// this middleware will be added before  createReview middleware in the route
exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tourBelong) req.body.tourBelong = req.params.tourId;

  // req.user comes from protection middleware
  if (!req.body.userBelong) req.body.userBelong = req.user.id;
  next();
};
exports.createReview = factory.createOne(Review);
// exports.createReview = catchAsync(async (req, res, next) => {
//   const review = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review,
//     },
//   });
// });

exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.UpdateOne(Review);
