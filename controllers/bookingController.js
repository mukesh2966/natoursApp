// this stripe package only works for the back-end
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingModel');
// const Email = require('../utils/email');

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
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
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

/////////////////////---------------------------------
//----------this was just a workaround till we executed stripe webhooks(to save new bookings to database and also redirect us to the my-tours page)
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // this is temporary because this is unsecure, everyone can make bookings without paying, if they know the url structre of success_url of stripe for booking done.
//   const { tour, user, price } = req.query;

//   if (!tour || !user || !price) {
//     return next();
//   }
//   await Booking.create({
//     tour,
//     user,
//     price,
//   });

//   // res.redirect(`${req.protocol}://${req.get('host')}/`);
//   res.redirect(req.originalUrl.split('?')[0]);
// });

////////////////////------------------------------------
// this session data is sent by stripe via a post request at the webhook endpoint when the payment was successful.
// this is exactly the same session that we sent to stripe, while starting the payment
const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = Math.ceil(session.display_items[0].amount / (74.89 * 100));
  await Booking.create({
    tour,
    user,
    price,
  });
  // await new Email(
  //   user,
  //   `${req.protocol}://${req.get('host')}/my-tours`
  // ).sendBookingConfirmation();
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    // Error message for stripe---made-request
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({
    received: true,
  });
};

exports.deleteABooking = factory.deleteOne(Booking);
exports.findABooking = factory.getOne(Booking);
exports.createABooking = factory.createOne(Booking);
exports.updateABooking = factory.UpdateOne(Booking);
exports.findAllBookings = factory.getAll(Booking);
