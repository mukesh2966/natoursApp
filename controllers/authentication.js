const crypto = require('crypto');
const jwt = require('jsonwebtoken');
// const util = require('util');
const { promisify } = require('util');

const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, // cookie will only be sent on a HTTPS connection
    httpOnly: true, // this will make it so that the cookie cannot be accessed/modified by browsers
  };

  if (process.env.NODE_ENV === 'prouction') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Removes the password from client output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOutDummy!', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  // SEND NEW USER EMAIL
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log('this is the url', url);

  await new Email(newUser, url).sendWelcome();

  /////////////---------------------------
  // document.pre("save") middleware runs after the validators, and then after the middleware no further validations, the data then is directly saved to the database.

  //---------loging in user just after sign up
  // here we have not done the verification process of checking email and password, as no need, user just signed up

  // header is automatically added into the JWT
  //                     //payload
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token: token, // sending valid token in response means user logged in
  //   data: {
  //     user: newUser,
  //   },
  // });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // destructering

  // checking credentials
  // 1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400)); // 400 -Bad Request
  }

  // 2) check if user exits && password is correct
  const user = await User.findOne({ email: email }).select('+password'); // to select password in result that by default is excluded
  //   console.log(user);
  //-----checking if password is correct
  //          // wrong password
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  // 3) if everything ok, send jwt to client
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token: token,
  // });
  createSendToken(user, 200, res);
});

// middleware function for protecting secured routes
// like getalltours route

exports.protection = catchAsync(async (req, res, next) => {
  // 1) get token & check if it exits
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //   console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in!. Please login to get access'),
      401
    );
  }

  //   console.log(X); this error is handled by global error controller due to catchAsync

  // 2) validate the token/ jwt signature verification
  // this gives two kinds of errors
  //     1) invalid token -- when payload modified
  //     2) token expired
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // console.log(decodedPayload);

  // 3) check if user still exists
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exist.', 401)
    );
  }

  // 4) check if user changed password after the jwtoken was issued
  if (currentUser.changesPasswordAfter(decodedPayload.iat)) {
    return next(
      new AppError(
        'User recently changed password! Please login again or try another password.',
        401
      )
    );
  }

  // if no problems above then the next() will be called
  // this means ----- grant access to protected ROUTE
  req.user = currentUser;
  // console.log(currentUser);
  // gives something like this structure
  // { _id: 5f27d4212232062d478d8cf9,
  //   name: 'muskangarg',
  //   email: 'm08@g.com',
  //   passwordChangedAt: 2020-08-03T00:00:00.000Z,
  //   __v: 0 }

  /////////////////--------------------this is later used as an avilable variable in the pug templates---in the view routes that use this protection middleware
  res.locals.user = currentUser;
  next();
});

/////////////////////////////////////////////////////////////
// we need a way to pass in arguments into the middleware function-------which usually do not work
//               // will create an array all the arguments
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // this function can use roles argument due to closure

    // roles is an array. e.g.-> ['admin','lead-guide']
    /////////---------IMPORTANT
    // current user role is retreived from the protection middleware req.user object
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  // 2) Generate a random token
  //-----------IMPORTANT---------------///////////////
  const resetToken = user.createPasswordResetToken();
  // changes done in createPasswordResetToken instance method have just modified the document, and not saved the changes in database. So, to save these changes. DOWN

  //------------------------------------------------
  // when i try to now save my user this user may not contain some required fields(of schema)
  // e.g. passwordConfirm not present as it was later set to undefined in usersSchema.pre("save") middleware
  // so, passwordConfirm was not saved to database
  // now, when we save then changes, mongoose schema validators run again and catch this error(some of the required fields are not set).
  // Thereby, we need to turn off the validators here below.

  /////////////---------------------------
  // document.pre("save") middleware runs after the validators, and then after the middleware no further validations, the data then is directly saved to the database.

  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email (using nodemailer packages)
  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/users/resetPassword/${resetToken}`;

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to : ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 mins)',
    //   message,
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    ////-------IMPORTANT
    /////////////---------------------------
    // document.pre("save") middleware runs after the validators, and then after the middleware no further validations, the data then is directly saved to the database.
    await user.save({ validateBeforeSave: false });

    // we are returning error here as the catchAsync will not catch this error.
    // As once we are inside a catch block, and when we exit it, it is believed that error is resolved.
    // So, no type of error is carried forward outside of the catch block
    // Therefore catchAsync function wrapper is not trigered.
    // Moreover, since response was meant to be sent from try block and now response is not sent and the req is not completed.
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

// if forget resetPassword
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired'), 400);
  }
  // setting new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  /////////////---------------------------
  // document.pre("save") middleware runs after the validators, and then after the middleware no further validations, the data then is directly saved to the database.
  await user.save();

  // 3) Update passwordChangedAt property for the user
  // done using usersSchema.pre("save") middleware

  // 4) Log the user in, send JWT
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token: token,
  // });
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const currentUser = await User.findById(req.user.id).select('+password');

  // 2) check if the posted current password is correct
  const correct = await currentUser.correctPassword(
    req.body.passwordCurrent,
    currentUser.password
  );
  if (!correct) {
    return next(
      new AppError('Current Password given by you is not correct!', 401)
    );
  }

  // 3) if the password is correct update the password
  // console.log('this is the old password: ', req.body.passwordCurrent);
  // console.log('this is the new password: ', req.body.password);
  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;
  await currentUser.save();

  // 4) log user in, send JWT
  // const token = signToken(currentUser._id);
  // res.status(200).json({
  //   status: 'success',
  //   token: token,
  // });
  createSendToken(currentUser, 200, res);
});

///////-------------------------------------------
// middleware to check if user is logged in or logged out in rendered pages
// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1) verifies the token
      const decodedPayload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 2) check if user still exists
      const currentUser = await User.findById(decodedPayload.id);
      if (!currentUser) {
        return next();
      }

      // 3) check if user changed password after the jwtoken was issued
      if (currentUser.changesPasswordAfter(decodedPayload.iat)) {
        return next();
      }

      // if no problems above then the next() will be called
      // this means ----there is a logged in user
      // to create a variable to be used by all pug templates
      res.locals.user = currentUser;
      return next();
    }
  } catch (error) {
    return next();
  }
  next();
};
