// review-text/rating/createdAt/ref to tour/ ref to user/

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewsSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'You cannot leave the review empty.'],
    },
    rating: {
      type: Number,
      required: [true, 'Please rate the application.'],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // to hide the field from the user, from inside the schema
    },
    tourBelong: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour'],
    },
    userBelong: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user.'],
    },
  },
  {
    // for showing vitual properties to the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Each combination of tourBelong and userBelong should always be unique
reviewsSchema.index({ tourBelong: 1, userBelong: 1 }, { unique: true });

// // Query Middleware for populating tourBelong and userBelong
reviewsSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tourBelong',
  //   select: 'name',
  // }).populate({
  //   path: 'userBelong',
  //   select: 'name photo',
  // });
  // here it was not so imprtant to have tourBelong populate inside reviews, So we deleted that part also minimizing the chaining of populates.
  // for examples-> one tour --> reviews--> tour
  // which is not that useful anyway
  this.populate({
    path: 'userBelong',
    select: 'name photo',
  });
  next();
});

//--------------------------------------------------------
// STATIC METHODS--- these are called directly like this
// Review.calcStats

reviewsSchema.statics.calcAverageRatings = async function (tourId) {
  // in order to do the calculation we will use aggregation pipeline
  // this keyword points to the current model
  // console.log(tourId);
  const stats = await this.aggregate([
    {
      $match: { tourBelong: tourId },
    },
    {
      $group: {
        _id: `$tourBelong`,
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log('this is stats: ', stats);

  // updating the tour document with the updated stats
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// reviewsSchema.pre('save', function (next) {
// .pre() will not work properly as when .pre() middleware is run, the review is not yet saved in the database.
// Hence, inside the aggregate method
// $match does not yield current review, but all previous reviews that matched.
//-------this is for when review is created
reviewsSchema.post('save', function () {
  // this keyword here points to current review

  // this.constructor points to the model who created this document
  // we cannot directly use Review, as the Review model is yet not defined.
  // we also cannot move this code below the Review model definition as then reviewsSchema was already used to create the Review model, so finally this middleware will not be contained in the reviewsSchema(that we used), hence will not be used.
  this.constructor.calcAverageRatings(this.tourBelong);
  // Review.calcAverageRatings(this.tourBelong);
  // next();-----> post middleware does not get access to next
});

//-------this is for when review is deleted or updated
// findByIdAndUpdate - behind the second this is only a shorthand for findOneAndUpdate with the current Id.
// So, we can use findOneAnd for regex
// findByIdAndDelete
//----------these only have access to query middleware
// but we will use a trick where we can get tourId from current Review, using query middleware only
reviewsSchema.pre(/^findOneAnd/, async function (next) {
  // this keyword is the current query
  // we can just execute the query then that will give us access to the document currently being processed

  this.review = await this.findOne(); // this is executed before the query ends, and not at the start of the query

  // the above review property is attached to the query, to pass the data from pre to post query middleware

  // .post() cannot give us access to query as the query was already executed and ended.
  // so .findOne() cannot be called with .post() and, therby, review cannot be obtained in .post("<query>") middleware.
  // console.log(this.review);
  next();
});

reviewsSchema.post(/^findOneAnd/, async function () {
  // await this.findOne()-- Does not work here as the query is already executed

  // So, now after the query is finished and review is updated
  await this.review.constructor.calcAverageRatings(this.review.tourBelong);
  // Review.constructor.calcAverageRatings(tourId)
});

const Review = mongoose.model('Reviews', reviewsSchema);

module.exports = Review;

// POST /tour/2345dfg/reviews-->nested route
// are used when there is a clear parent-child relationship
// between routes
// accessing the review resource on the tour resource

// GET /tour/2345dfg/reviews-->nested route
// this will get all the reviews for this tour

// POST /tour/2345dfg/reviews/fsdfsdf34-->nested route
// we will get review with id and on tour with id

// same can be done with queryString but gets messy messy there.
