import {PermissionsAndroid, Platform} from 'react-native';

import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';

import Geolocation from 'react-native-geolocation-service';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';

import {firstValueFrom} from 'rxjs';

setUpdateIntervalForType(SensorTypes.accelerometer, 1000);

const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Konum İzni',
      message: 'Sensör verisi göndermek için konum bilgisi gerekiyor.',
      buttonPositive: 'İzin Ver',
      buttonNegative: 'Reddet',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const getSensorPayload = async () => {
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    throw new Error('Konum izni verilmedi');
  }

  const accel = await firstValueFrom(accelerometer);

  const location = await new Promise<any>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error),
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
      },
    );
  });

  const battery = await DeviceInfo.getBatteryLevel();
  const network = await NetInfo.fetch();

  const magnitudeMs2 = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);

  const magnitude = Math.abs(magnitudeMs2 - 9.81) / 9.81;

  return {
    accelerometer: {
      x: accel.x,
      y: accel.y,
      z: accel.z,
      magnitude,
    },

    location: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    },

    batteryLevel: Math.round(battery * 100),

    network: network.type,

    timestamp: new Date(),
  };
};
