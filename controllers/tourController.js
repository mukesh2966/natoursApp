// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
// const ApiFeatures = require('../utils/ApiFeatures');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');
const AppError = require('../utils/AppError');

//------------for storing in memoryBuffer+ImageProcessing+Disc+database
// done like this for image processing operations before storing to database
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new AppError('Not an image! Please upload only images', 404),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
/////////////////////--------------------------------------

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

// for one only--------upload.single('image');-----will produce req.file
// for multiple-----------upload.array('images', 5);----will produce req.files

/////////-----------PHOTO PROCESSING MIDDLEWARE
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // checking if imageCover and images both are available
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  // 1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Other Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

/////////////--------------------------------------------
// const x = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// param middlewares
// exports.checkID = (req, res, next, value) => {
//   console.log('Tour id is: ' + value);
//   const id = req.params.id * 1;
//   // if (id > x.length) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'invalid id',
//   //   });
//   // }
//   next();
// };

// creating a checkBody middleware
// exports.checkBody = (req, res, next) => {
//   // check if body sent by post request contains name and price property
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'bad request',
//       message: 'missing name or price',
//     });
//   }
//   next();
// };

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // try {
//   //   console.log(req.query);

//   //   // destructing as simplying assigning will only refer to the original one

//   //   // 1-A) Filtering-----------------------------------------
//   //   // const queryObj = { ...req.query };
//   //   // const excludeFields = ['page', 'sort', 'limit', 'fields'];
//   //   // excludeFields.forEach((el) => {
//   //   //   delete queryObj[el];
//   //   // });

//   //   // console.log(req.query);
//   //   // console.log(queryObj);

//   //   //////////////////////////////////////////////////////////////
//   //   // Filtering ------Very Easy

//   //   // // MONGODB way of querying
//   //   // const tours = await Tour.find({
//   //   //   duration: 5,
//   //   //   difficulty: 'easy',
//   //   // });

//   //   // 1-B) Advanced Filtering
//   //   // BUILDING A QUERY

//   //   //{difficulty : 'easy,duration:{$gte:5}}
//   //   //{difficulty: 'easy', duration: { gte: '5' } }
//   //   // want to replace gte with $gte
//   //   // and same with lte,lt,gt
//   //   // using regular expression for the same

//   //   // let queryString = JSON.stringify(queryObj);
//   //   // queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => {
//   //   //   return `$${match}`;
//   //   // });
//   //   // // console.log(JSON.parse(queryString));

//   //   // let query = Tour.find(JSON.parse(queryString));

//   //   // 2) SORTING----------------------------------------
//   //   // if (req.query.sort) {
//   //   //   // query = query.sort(req.query.sort); // sort('price')
//   //   //   // // for sorting with respect to multiple criterias
//   //   //   // sort('price ratingsAverage')

//   //   //   ///////////////////////////////////////////
//   //   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   //   query = query.sort(sortBy); // here sortBy is actually 'price ratingsAverage' -----somethings of this sort
//   //   //   // console.log(sortBy);
//   //   // } else {
//   //   //   query = query.sort('-createdAt');
//   //   // }

//   //   // // 3) FIELD LIMITING/Projecting -------------------------------
//   //   // if (req.query.fields) {
//   //   //   const fields = req.query.fields.split(',').join(' ');
//   //   //   query = query.select(fields);
//   //   // } else {
//   //   //   query = query.select('-__v');
//   //   // }

//   //   // // 4) PAGINATION ---------------------------------------------

//   //   // const page = req.query.page * 1 || 1;
//   //   // const limit = req.query.limit * 1 || 100;
//   //   // const skip = (page - 1) * limit;
//   //   // // skip is the number of documents to skip before reading this page
//   //   // // limit the no. of documents on one page
//   //   // query = query.skip(skip).limit(limit);

//   //   // if (req.query.page) {
//   //   //   const numTours = await Tour.countDocuments();

//   //   //   if (skip >= numTours) {
//   //   //     throw new Error('This page does not exist');
//   //   //   }
//   //   // }

//   //   // EXECUTE QUERY
//   //   const features = new ApiFeatures(Tour.find(), req.query)
//   //     .filter()
//   //     .sort()
//   //     .limitFields()
//   //     .paginate();
//   //   const tours = await features.query;
//   //   // query.sort().select().skip().limit()

//   //   ////////////////////////////////////////////////
//   //   // // Querying using MONGOOSE  -- building a query
//   //   // const query =  Tour.find()
//   //   //   .where('duration')
//   //   //   .equals(5)
//   //   //   .where('difficulty')
//   //   //   .equals('easy');

//   //   // SEND RESPONSE
//   //   res.status(200).json({
//   //     status: 'success',
//   //     results: tours.length,
//   //     data: {
//   //       tours,
//   //     },
//   //   });
//   // } catch (error) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: error,
//   //   });
//   // }
//   // EXECUTE QUERY
//   const features = new ApiFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   // query.sort().select().skip().limit()

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

/////////////////////////////////////////////////////////
/////----------Get cheapest
// exports.getCheapestTours = async (req, res) => {
//   try {
//     let query = Tour.find();
//     query = query.sort('price -ratingsAverage').limit(5);
//     const tours = await query;
//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours,
//       },
//     });
//   } catch (error) {
//     res.status(404).json({
//       status: 'fail',
//       message: error,
//     });
//   }
// };
// ------------------------or-------------------------
// ------------------USE a MIDDLEWARE on getAllTours Route

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////
// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     // fn(req, res, next).catch((error) => next(error));
//     //-------same as above in ES6
//     fn(req, res, next).catch(next);
//   };
// };
//////////////////////////////////////////////////
/////////////////////////////////////////////////////

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.getTour = catchAsync(async (req, res, next) => {
//   // findById==== findOne({_id:req.params.id});
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // LATER moved populate functionality to query MIDDLEWARE
//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAt',
//   // });
//   // Behind the scene using populate will also create a query
//   // thereby, affecting performance.
//   // Only for getTour route and not getAllTours route
//   // There guides-- will only show array of objectIds
//   // there guides are not populated.
//   // fill up the field called guides. Takes the references and fill the relevant data there.
//   // these will only show up in the query and not in the database.

//   if (!tour) {
//     return next(
//       new AppError(`No tour found with the ID: ${req.params.id}`, 404)
//     );
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
//   // try {
//   //   // findById==== findOne({_id:req.params.id});
//   //   const tour = await Tour.findById(req.params.id);
//   //   res.status(200).json({
//   //     status: 'success',
//   //     data: {
//   //       tour: tour,
//   //     },
//   //   });
//   // } catch (error) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: error,
//   //   });
//   // }
//   // // console.log(req.params); // gives {id :'5'}
//   // // does the same for all such parameters in the request made
//   // // all the parameters must be defined, unless made optional.
//   // // /api/v1/tours/:id?/:yankei
//   // // id is optional here, yankei is required.

//   // // const id = req.params.id * 1;

//   // // find will create an array where this comparison is true.
//   // // const tour = x.find((current) => {
//   // //   return current.id === id;
//   // // });

//   // // tour will be undefined when no such id is present
//   // // if(!tour)
//   // // if (id > x.length) {
//   // //   return res.status(404).json({
//   // //     status: 'fail',
//   // //     message: 'invalid id',
//   // //   });
//   // // }
// });

exports.addTour = factory.createOne(Tour);
// exports.addTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// // const newTour = new Tour({});
// // newTour.save()
// try {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// } catch (error) {
//   res.status(400).json({
//     status: 'fail',
//     message: error,
//   });
// }

// // // console.log(req.body);

// // const newId = x[x.length - 1].id + 1;
// // // create new object -- by merging two objects together
// // const newTour = Object.assign({ id: newId }, req.body);

// // // pushing newTour in the datastructure
// // x.push(newTour);

// // // adding new tour to the file/database
// // fs.writeFile(
// //   `${__dirname}/dev-data/data/tours-simple.json`,
// //   JSON.stringify(x),
// //   (error) => {
// //     res.status(201).json({
// //       status: 'success',
// //       data: {
// //         tour: newTour,
// //       },
// //     });
// //   }
// // );

// cannot send two responses
// res.send('Done');
// });

exports.updateTour = factory.UpdateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, // for returning the updated document
//     runValidators: true, // for again running the validators(which were set in the schema for each field verification) during updating a field/doc
//   });
//   if (!tour) {
//     return next(
//       new AppError(`No tour found with the ID: ${req.params.id}`, 404)
//     );
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// try {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, // for returning the updated document
//     runValidators: true, // for again running the validators(which were set in the schema for each field verification) during updating a field/doc
//   });

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// } catch (error) {
//   res.status(400).json({
//     status: 'fail',
//     message: 'invalid data sent!',
//   });
// }
// });

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   // 204 means -- no content
//   // in restful apis to not send any data to client after delete
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(
//       new AppError(`No tour found with the ID: ${req.params.id}`, 404)
//     );
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });

// try {
//   // in restful apis to not send any data to client after delete
//   await Tour.findByIdAndDelete(req.params.id);
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// } catch (error) {
//   res.status(400).json({
//     status: 'fail',
//     message: error,
//   });
// }
// });

//////////////////////////////////////////////////////////////
// aggregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 1 } },
    },
    {
      $group: {
        // _id: null, // to group every document in a single group
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // helps to sort the result by above defined field names, not the original field names(as they are already gone)
      $sort: { avgPrice: 1 }, // 1 for ascending
    },
    // we can also repeat stages
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' },
    //   },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
  // try {
  //   const stats = await Tour.aggregate([
  //     {
  //       $match: { ratingsAverage: { $gte: 1 } },
  //     },
  //     {
  //       $group: {
  //         // _id: null, // to group every document in a single group
  //         _id: { $toUpper: '$difficulty' },
  //         // _id: '$ratingsAverage',
  //         numTours: { $sum: 1 },
  //         numRatings: { $sum: '$ratingsQuantity' },
  //         avgRating: { $avg: '$ratingsAverage' },
  //         avgPrice: { $avg: '$price' },
  //         minPrice: { $min: '$price' },
  //         maxPrice: { $max: '$price' },
  //       },
  //     },
  //     {
  //       // helps to sort the result by above defined field names, not the original field names(as they are already gone)
  //       $sort: { avgPrice: 1 }, // 1 for ascending
  //     },
  //     // we can also repeat stages
  //     // {
  //     //   $match: {
  //     //     _id: { $ne: 'EASY' },
  //     //   },
  //     // },
  //   ]);
  //   res.status(200).json({
  //     status: 'success',
  //     data: stats,
  //   });
  // } catch (error) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: error,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tourName: { $push: '$name' },
      },
    },
    // {
    //   $sort: { _id: 1 },
    // },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    // limits the no. of output documents
    // {
    //   $limit: 6,
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
  // try {
  //   const year = req.params.year * 1; //2021
  //   const plan = await Tour.aggregate([
  //     {
  //       $unwind: '$startDates',
  //     },
  //     {
  //       $match: {
  //         startDates: {
  //           $gte: new Date(`${year}-01-01`),
  //           $lte: new Date(`${year}-12-31`),
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: { $month: '$startDates' },
  //         numTourStarts: { $sum: 1 },
  //         tourName: { $push: '$name' },
  //       },
  //     },
  //     // {
  //     //   $sort: { _id: 1 },
  //     // },
  //     {
  //       $addFields: { month: '$_id' },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //       },
  //     },
  //     {
  //       $sort: { numTourStarts: -1 },
  //     },
  //     // limits the no. of output documents
  //     // {
  //     //   $limit: 6,
  //     // },
  //   ]);

  //   res.status(200).json({
  //     status: 'success',
  //     data: plan,
  //   });
  // } catch (error) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: error,
  //   });
  // }
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }
  // mongodb expects the radius in radians-->not the actual distance
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // GEO SPATIAL Query
  // inorder for geospatial queries, we need to index the field where the geospatial data we searching for is stored
  // So, here we need to add an index to startLocation
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  console.log(distance, lat, lng, unit);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // In order to do calc..------Aggregation Pipeline
  const distances = await Tour.aggregate([
    // for geospatial aggregation, there is just one calc. stage defined
    // and also it needs to be placed first within the pipeline
    {
      // geoNear requires that atleast one of our fields have a geospatial index.
      // if only one field is with geoSpatial index, then geoNear will automatically use that index -- in order to perform the calculation
      // In case of multiple fields with geoSpa. index -- we need to use the keys parameter in order to specify the field to be used.
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        }, //origin point
        distanceField: 'distance', // calculated distances will be stored in the field with this name
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
