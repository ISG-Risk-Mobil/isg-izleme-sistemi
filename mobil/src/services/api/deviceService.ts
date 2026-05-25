import { apiCall } from './api';

export const getDevices = (token: string) => {
  return apiCall({
    endpoint: '/devices',
    method: 'GET',
    token,
  });
};