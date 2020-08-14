// contains all bussiness logic and not application logic
const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// const User = require('./userModel');

// ------------VALIDATION -----------------------
// validator.js is a great library for only string validation and sanitation
//--------------------

////////////////////////////////////////////////////////
//////--------------SCHEMA
// simple schema for tours
const toursSchema = new mongoose.Schema(
  {
    // feild : scheme type option object
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // validator
      unique: true,
      trim: true, // remove all white spaces in the beginning and the end will get cut.
      maxlength: [40, 'Word limit for name field has exceeded 40'], // only for strings
      minlength: [10, 'name field must have 10 characters'],
      // // using validator.js
      // validate: {
      //   validator: validator.isAlpha, // this will not even allow spaces between words
      //   message: 'Name field should only contain characters',
      // },
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a groupSize'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty level'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can only be set to easy/medium/difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be >=1.0'], // works for numbers and Date
      max: [5, 'Rating must be <=5.0'],
      set: (val) => Math.round(val * 10) / 10, // it runs each time the value of ratingsAverage is assigned to a new value or itself again.
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // CUSTOM VALIDATOR ----returns true or false from this validator
      validate: {
        validator: function (valuePriceDiscount) {
          // this keyword only point to current document when a new document is created
          // so this function will not work for updating document
          //----------
          // this only points to current doc on the NEW document creation
          return this.price >= valuePriceDiscount;
        },
        message: 'Discount({VALUE}) is getting bigger than the price  itself',
      },
    },
    summary: {
      type: String,
      trim: true, // remove all white spaces in the beginning and the end will get cut.
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, // name of the image
      required: [true, 'A tour must have a cover image'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // to hide the field from the user, from inside the schema
    },
    startDates: {
      type: [Date],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // mongodb uses GeoJSON for specifying geospatial data
      // This object is not for schema-type options rather
      // Actually its an embedded object
      type: {
        // schema type options
        type: String,
        default: 'Point', // usually can be many others like lines, polygons etc. in mongo db
        enum: ['Point'],
      },
      coordinates: {
        // schema type options
        type: [Number], // [longitude,latitude]
        // in google maps it is [latitude,logitude]
      },
      address: String,
      description: String,
    },
    // so the above was not an embedded document, for an embedded document you need to create an array and then define the object inside there
    // creating an array of objects
    // just like done below, below is an embedded document--
    locations: [
      {
        // Just like for startLocations
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, // For embedding tour-guides
    // now implementing referencing
    guides: [
      // Schema type definition
      { type: mongoose.Schema.ObjectId, ref: 'User' },
      // for ref we do not even need the User schema imported
      // it also works without importing (here).
    ],
  },
  // SCHEMA OPTIONS
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/////////////------------------------------------------
// indexing the data by price field
// as it is often queryed for, e.g. 3 most cheap tours

// single field index
// toursSchema.index({ price: 1 }); // 1 means sorting in ascending order
//----------to delete an index, need to delete it from database

// compound index
toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });
//------- For GEO SPATIAL -data, we need a 2-D sphere index for a point of surface of earth
// or 2-d index for a point on a 2-D surface
// We will be using 2-D sphere index
toursSchema.index({ startLocation: '2dsphere' });
/////////////------------------------------------------

//------------------defining virtual properties
// these properties are not saved in database
// its created when we fetch the data
// we used an actual function instead of arrow function, as the arrow function does not gets its own this keyword
// but we needed this keyword to point to the current document
//------- querying will not work on virtual properties as this property is not actually part of the database
toursSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// to connect a tour to its reviews, without actually using child referencing
// virtual populating each tour-document
toursSchema.virtual('reviews', {
  ref: 'Reviews', // this here is the given name to the model by us, for using in the database
  // for example
  //const Review = mongoose.model('Reviews', reviewsSchema);
  // It should be Reviews for the above example
  foreignField: 'tourBelong', // where id is stored in reviewModel
  localField: '_id', // where id is stored in tourModel
});

// in mongoose we can define middleware for work before or after the event
// before/after hooks
// 4 type of middlewares-----------------------
// document,query,aggregate,model
//---------------------------------------------------------------
// DOCUMENT MIDDLEWARE : runs before .save() and .create()
// .insertMany()--- will not trigger the middleware
//-------preSaveHook
toursSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// toursSchema.pre('save', function (next) {
//   console.log('Will save document.....');
//   next();
// });

// toursSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });
//

////////////---------------EMBEDDING-----------
// // For embedding user(tour-guides) in the tour document
// toursSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => {
//     return await User.findById(id);
//   });
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// // now we also need additional logic for updating/deleting the tour-guide user, according to the changes they make.
// // Not doing that as we are not going to use embedding in this case.

// ------------------------------------------------------------------// QUERY MIDDLEWARE : runs before or after a query is executed
///--------------Way1
// toursSchema.pre('find', function (next) {
//   // this keyword will point at the query, and not the document
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

// toursSchema.pre('findOne', function (next) {
//   // this keyword will point at the query, and not the document
//   this.find({ secretTour: { $ne: true } });
//   next();
// });
//-------------------------Way2
toursSchema.pre(/^find/, function (next) {
  // this keyword will point at the query, and not the document

  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

toursSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// ----------------postQuery
// toursSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   console.log(docs);
//   next();
// });

// AGGREGATION MIDDLEWARE----had to do this to make geoNear the first stage of our aggregation pipeline
// toursSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this);
//   next();
// });

////////////------- Creating model out of a Schema
const Tour = mongoose.model('Tour', toursSchema);

// // new document out of Tour model
// const testTour = new Tour({
//   name: 'The Park Camper',
//   rating: 4.1,
//   price: 105,
// });

// // for saving testTour document in database
// testTour
//   .save()
//   .then((document) => {
//     console.log(document);
//   })
//   .catch((error) => {
//     console.log('Error in saving document: ', error);
//   });

module.exports = Tour;
