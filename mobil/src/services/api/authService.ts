import { apiCall } from './api';

export const loginUser = (
  email: string,
  password: string,
) => {
  return apiCall({
    endpoint: '/auth/login',
    method: 'POST',
    data: {
      email,
      password,
    },
  });
};

export const registerUser = (
  userData: any,
) => {
  return apiCall({
    endpoint: '/auth/register',
    method: 'POST',
    data: userData,
  });
};

export const getUsers = (
  token: string,
) => {
  return apiCall({
    endpoint: '/auth/users',
    method: 'GET',
    token,
  });
}; 