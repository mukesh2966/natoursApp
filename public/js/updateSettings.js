/* eslint-disable */

//- as eslint is configured only for nodejs, it is giving error for client-side js code

// axios will auto throw an error whenever our request throws an error.
import axios from 'axios';
import { showAlert } from './alert';

// type is either 'password' or 'data'
// data is the data object containing either {name:name,email:email} or the password data
export const updateSettings = async (data, type) => {
  console.log('from updateUserData js');
  try {
    const url =
      type === 'data'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMe'
        : 'http://127.0.0.1:3000/api/v1/users/updateMyPassword';

    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `User ${type.toUpperCase()} Changed Successfully`);
    }

    console.log(res);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
