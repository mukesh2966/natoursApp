/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alert';
// This Stripe object is coming from the frontEnd script that we included in our html
const stripe = Stripe(
  'pk_test_51HFrYdIqvZZHrC7NoGArvlZ9Ok6VX27la1dnN1e3Dhe4JrayslXhPksI5JUsPdKnEYf6pTxfoBwN4KcBXmyGr26r00dlBPAQFJ'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout Session from the api
    // for simply a get request
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log('this is checkout session: ', session);

    // 2) Create checout form + charge the credit card for us.
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
};
