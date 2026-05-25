import { apiCall } from './api';

export const getAlarms = (token: string) => {
  return apiCall({
    endpoint: '/alarms',
    method: 'GET',
    token,
  });
};

export const resolveAlarm = (
  token: string,
  alarmId: string,
) => {
  return apiCall({
    endpoint: `/alarms/${alarmId}/resolve`,
    method: 'PUT',
    token,
  });
};