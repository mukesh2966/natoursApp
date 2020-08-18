/* eslint-disable */

//- as eslint is configured only for nodejs, it is giving error for client-side js code

// axios will auto throw an error whenever our request throws an error.
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email: email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    // console.log(res);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    ////////////-----------IMPORTANT
    // force a reload from server and not from browser cache
    // true is set ---to avoid loading from browser cache, so our browser do not simply load the old data from the cache
    if (res.data.status === 'success') {
      location.reload(true);
    }
  } catch (error) {
    showAlert('error', 'Error logging out! Try Again.');
  }
};

//////-------------for signup
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signUp',
      data: {
        name: name,
        email: email,
        password,
        passwordConfirm,
        // role: 'admin',
      },
    });

    if (res.data.status === 'success') {
      document.getElementById('sign').textContent = 'SignUp Completed';
      showAlert('success', 'Signned in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    // console.log(res);
  } catch (error) {
    document.getElementById('sign').textContent = 'SIGN UP';
    // console.log('from login.js', error.response.data.message);
    showAlert('error', error.response.data.message);
  }
};
