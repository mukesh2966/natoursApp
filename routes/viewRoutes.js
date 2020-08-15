const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authentication');
// const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use(authController.isLoggedIn);
router.use(viewsController.alerts);

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/me', authController.protection, viewsController.getAccount);

// /login ---------route
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

router.get(
  '/my-tours',
  // bookingController.createBookingCheckout, // temperoray
  authController.protection,
  viewsController.getMyTours
);

/////Do not need this route as we implemented this by using API, and this below is for data submission/collection through form submit.
// router.post(
//   '/submit-user-data',
//   authController.protection,
//   viewsController.updateUserData
// );

module.exports = router;
