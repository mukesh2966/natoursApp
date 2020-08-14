const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

/////////////////-------------------------------------------
// Configuring multer upload-----for file/photo upload

// ----------for storing in disc+database
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users');
//   },
//   filename: (req, file, callback) => {
//     // user-id-timestamp.jpg
//     const extension = file.mimetype.split('/')[1];
//     callback(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

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

// here photo is the name of the filed, where the file/image is picked from
exports.uploadUserPhoto = upload.single('photo');

/////////-----------PHOTO PROCESSING MIDDLEWARE to be used before after uploadUserPhoto Middleware
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  //-----------------IMPORTANT---------------------
  //-----------------------------------------------
  // while saving file to memoryBuffer and not the discStorage
  // req.file.filename is not set by auto
  // And also we need this req.file.filename later on in the updateMe function where photo: req.file.filename is set for updating image to database.

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   // Send response
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users: users,
//     },
//   });
// });
exports.addUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'this route is not defined! Please use signUp instead.',
  });
};
exports.getUser = factory.getOne(User);

////////////////////////////////////////////////////////
////////---------------- for admins--- so do not change password using this
// as the pre-save middleware will not work(as UpdateOne is implemented by findById and update).So, password Encryption, passwordChangedAt will not work.
exports.updateUser = factory.UpdateOne(User);
exports.deleteUser = factory.deleteOne(User);

//////////////////////////////////////////////////////

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
  // then after this middleware use getOne middleware
};
exports.updateMe = catchAsync(async (req, res, next) => {
  ////////////////////////////------------------------------
  /////////----------STUFF RELATED TO MULTER
  // console.log('file attached to req due to multer pack.', req.file);
  // To show that body parser cannot handle files(like images), that it can only handle text
  // So, req.body will only contain fields containing text.
  // console.log('request body>>>>>>', req.body);
  /////////////////////------------------------------------

  // 1) Create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword route',
        400
      )
    );
  }

  // 2) update the user document
  // here we are not using user.save() functinality and rather are going with User.findbyIdandUpdate() as we are not working with passwords and hence do not want to/noNeed to go through document.pre("save") middleware.

  // we are placing filteredBody as what fields to update, and not req.body there.
  // As, if the user places role='admin' in req.body then it will be updated. and we cannot allow everyone to become an admin.

  // Filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // adding photo to filterBody
  if (req.file) filteredBody.photo = req.file.filename;

  /////////////////-------------------------------
  // run validators here will only run on the fields that we updated
  // so validator will now not run on passwordConfirm, hence that will not give an error(since passwordConfirm is undefined in database)
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  // console.log('passwordConfirm: ', updatedUser.passwordConfirm);

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deactivateMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'successs',
    data: null,
  });
});
