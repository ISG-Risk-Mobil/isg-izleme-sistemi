import { Platform } from 'react-native';

const getBaseURL = () => {
  // Buraya kendi IPv4 adresini yaz (Örnek: 192.168.1.109)
  const MY_IP = '192.168.1.109'; 
  
  return `http://${MY_IP}:5000/api`;
};

export const BASE_URL = getBaseURL();