const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authentication');

// const { route } = require('./reviewRoutes');

// const getAllUsers = (req, res) => {
//   console.log('trying to get all users');
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
// const addUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
// const getUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };
// const deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'this route is not yet defined',
//   });
// };

////////////////////////////////////////////

const router = express.Router();

// user authentication
router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// protect all routes that comes after this point in the doc
// It will not be applied to above routes as middleware runs in sequence
router.use(authController.protection);
router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deactivateMe', userController.deactivateMe);

/////////////////////////////////////////////////
// system administrator routes ------may be

// middleware to restrict below routes to admins
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers).post(userController.addUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
