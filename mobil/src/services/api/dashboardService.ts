import { apiCall } from './api';

export const getDashboardData = (
  token: string,
) => {
  return apiCall({
    endpoint: '/alarms',
    method: 'GET',
    token,
  });
};