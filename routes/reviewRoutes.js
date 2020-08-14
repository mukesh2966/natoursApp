const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authentication');

// merging params for the use of nested routes in case of reviews inside tour
// merge params used to get access to tourId
const router = express.Router({ mergeParams: true });

// POST /tour/234425/reviews
// POST /reviews

// GET /tour/34235/reviews

// all routes regarding reviews require logging in
router.use(authController.protection);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
