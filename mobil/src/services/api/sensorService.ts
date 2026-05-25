import { apiCall } from './api';

export const sendSensorData = (
  token: string,
  sensorData: any,
) => {
  return apiCall({

    
    endpoint: '/sensor-data',
    method: 'POST',
    token,
    data: sensorData,
  });
};

export const getSensorDataByDevice = (
  token: string,
  deviceId: string,
) => {
  return apiCall({
    endpoint: `/sensor-data/${deviceId}`,
    method: 'GET',
    token,
  });
};