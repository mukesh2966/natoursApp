// this stripe package only works for the back-end
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingModel');

const factory = require('./handlerFactory');
// const AppError = require('../utils/AppError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // if (!tour) {
  //   console.log('no tour found');
  // } else {
  //   console.log('tour found: ', tour.name);
  // }

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: `${req.user.email}`,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: Math.ceil(tour.price * 74.89 * 100),
        currency: 'inr',
        quantity: 1,
      },
    ],
  });
  // 3) Create session as response and send it to the client

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // this is temporary because this is unsecure, everyone can make bookings withour paying
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) {
    return next();
  }
  await Booking.create({
    tour,
    user,
    price,
  });

  // res.redirect(`${req.protocol}://${req.get('host')}/`);
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.deleteABooking = factory.deleteOne(Booking);
exports.findABooking = factory.getOne(Booking);
exports.createABooking = factory.createOne(Booking);
exports.updateABooking = factory.UpdateOne(Booking);
exports.findAllBookings = factory.getAll(Booking);
