/*eslint-disable*/

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alert';

// DOM Elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserDataForm = document.querySelector('.form-user-data');
const updateUserPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// for mapbox
// DELEGation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  console.log(locations);
  displayMap(locations);
}

console.log('printtttttttttttttttttttttttttttttt');
console.log('this will see if login form is selected', loginForm);
// for login
if (loginForm) {
  console.log(
    'log in.........\nlog in.........\nlog in.........\nlog in.........\nlog in.........\nlog in.........\nlog in.........\nlog in.........\nlog in.........\nlog in.........\nlog in.........\nlog in.........\n'
  );
  loginForm.addEventListener('submit', (e) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    e.preventDefault();
    login(email, password);
  });
}

// for logout and reload from server not cache
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

/////--------Without upload image functionality
// if (updateUserDataForm) {
//   updateUserDataForm.addEventListener('submit', (e) => {
//     const email = document.getElementById('email').value;
//     const name = document.getElementById('name').value;
//     e.preventDefault();
//     updateSettings({ name, email }, 'data');
//   });
// }

// ------------With upload image functionalilty
if (updateUserDataForm) {
  updateUserDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //----RECREATING MULTIPART FORM DATA FUNCTIONALITY of a form enctype attribute
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log('this is a form', form);
    updateSettings(form, 'data');
  });
}

if (updateUserPasswordForm) {
  console.log('i rached here in password if block');
  updateUserPasswordForm.addEventListener('submit', async (e) => {
    console.log('password change button clicked.');
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';
    await updateSettings(
      { password, passwordConfirm, passwordCurrent },
      'password'
    );
    document.querySelector('.btn--save-password').textContent = 'Save Password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
// Be sure to send the same variable names that the API expects
// {
//   "passwordCurrent":"mukeshSingh1234567",
//   "password":"mukeshSingh123456788",
//   "passwordConfirm":"mukeshSingh123456788"
// }

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = `Processing...`;
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}
