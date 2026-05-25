import Config from 'react-native-config';

export const ENV = {
  mode: Config.MODE ?? 'dev',
  API_URL:
    Config.MODE === 'prod'
      ? Config.PROD_API_URL
      : Config.DEV_API_URL,
};