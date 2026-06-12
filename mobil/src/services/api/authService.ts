import {apiCall} from './api';

export const loginUser = (email: string, password: string) => {
  return apiCall({
    endpoint: '/auth/login',
    method: 'POST',
    data: {
      email,
      password,
    },
  });
};

export const registerUser = (userData: any) => {
  return apiCall({
    endpoint: '/auth/register',
    method: 'POST',
    data: userData,
  });
};

export const getUsers = (token: string) => {
  return apiCall({
    endpoint: '/auth/users',
    method: 'GET',
    token,
  });
};

export const makeUserAdmin = (token: string, userId: string) => {
  return apiCall({
    endpoint: `/auth/users/${userId}/make-admin`,
    method: 'PUT',
    token,
  });
};

export const makeUserWorker = (token: string, userId: string) => {
  return apiCall({
    endpoint: `/auth/users/${userId}/make-worker`,
    method: 'PUT',
    token,
  });
};

export const forgotPassword = async (email: string) => {
  return apiCall({
    endpoint: '/auth/forgot-password',
    method: 'POST',
    data: {
      email,
    },
  });
};

export const resetPassword = async (
  resetToken: string,
  newPassword: string,
) => {
  return apiCall({
    endpoint: '/auth/reset-password',
    method: 'POST',
    data: {
      resetToken,
      newPassword,
    },
  });
};
