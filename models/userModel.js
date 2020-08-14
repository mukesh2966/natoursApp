const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const usersSchema = new mongoose.Schema(
  {
    // name,email,photo,password,passwordConfirm

    name: {
      type: String,
      required: [true, 'Name field is required'],
      //   unique: [true,''],
      trim: true,
      maxlength: [50, 'Name must be less than 50 characters'],
      minlength: [5, 'Name must be more than 5 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid Email',
      },
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: 0, // to hide data from user from schemea
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // this only works on create and save
        // so we need to update the user using save and not findoneandupdate
        validator: function (el) {
          console.log('rannn');
          return el === this.password;
        },
        message: 'PasswordConfirmation does not match Password',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    // mukesh: String,
    active: {
      type: Boolean,
      default: true,
      select: 0,
    },
  }
  // //   // SCHEMA OPTIONS
  // {
  //   toJSON: { virtuals: true },
  //   toObject: { virtuals: true },
  // }
);

/////-----------IMPORTANT
/////////////---------------------------
// document.pre("save") middleware runs after the validators, and then after the middleware no further validations, the data then is directly saved to the database.
// before saving to database
// for encrypting the password

//--------------------------------------------------
usersSchema.pre('save', async function (next) {
  // only run the function is password was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // hashing the password using bcrypt algorithm
  // 12 is the cost/cpu intensive salt that is added to the password.
  this.password = await bcrypt.hash(this.password, 12);
  // now removing passwordConfirm before saving it to the database
  this.passwordConfirm = undefined;
  // this.mukesh = 'mukesh';
  next();
});

// Updating passwordChangedAt property for the user after resetting password
usersSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // -1000ms is done as sometimes it happens that the jwtoken is created before the change to passwordChangedAt is saved in the database.
  // So, the problem occurs(it looks like password was reset after the creation of the token). So , to resolve that: -1000ms is used
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//-------------------------------------------------

////////////-------------------------------------
// this middleware runs before and query that starts with find, like- findOne,find,findByIdandUpdate etc.
usersSchema.pre(/^find/, function (next) {
  // this points to current query
  this.find({ active: { $ne: false } });
  next();
});

//////////////--------------------------------
// INSTANCE METHOD -- method available on all documents of a certain collection

// checking password for a user-entry document
usersSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //     this.password will not return the userPassword here as in password select is set to false
  return await bcrypt.compare(candidatePassword, userPassword);
};

// to see if password is changed after the jwtoken was issued
usersSchema.methods.changesPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // console.log(changedTimeStamp, JWTTimeStamp);
    return changedTimeStamp > JWTTimeStamp; //200>100
  }

  // false means password not changed since last jwtoken was issued
  return false;
};

//
usersSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  //                               // 32--no. of characters
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken, passwordResetToken: this.passwordResetToken });

  // sending unencrypted token to the user via mail
  return resetToken;
};

const User = mongoose.model('User', usersSchema);
module.exports = User;
