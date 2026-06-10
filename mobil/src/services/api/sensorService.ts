import { apiCall } from './api';

export type SensorDataPayload = {
  deviceId: string;
  accelerometer?: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope?: {
    x: number;
    y: number;
    z: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  batteryLevel?: number;
};

export const sendSensorData = (
  token: string,
  sensorData: SensorDataPayload,
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