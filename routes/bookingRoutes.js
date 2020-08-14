const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authentication');

const router = express.Router();

router.use(authController.protection);

console.log('i am inside');
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// API ROUTES

router.use(authController.restrictTo('admin', 'lead-guide'));

router.post('/createABooking', bookingController.createABooking);
router.delete('/deleteABooking/:id', bookingController.deleteABooking);
router.patch('/updateABooking/:id', bookingController.updateABooking);
router.get('/findABooking/:id', bookingController.findABooking);
router.get('/findAllBookings', bookingController.findAllBookings);

module.exports = router;
