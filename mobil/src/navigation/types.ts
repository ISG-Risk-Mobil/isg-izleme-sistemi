export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type BottomTabParamList = {
  AnaSayfa: undefined;
  Dashboard: undefined;
  Alarmlar: undefined;
  Cihazlar: undefined;
  Profil: undefined;
  YonetimPaneli: undefined;

  Konum: {
    deviceId?: string;
    deviceName?: string;
    deviceCode?: string;
    initialLocation?: any;
    token?: string;
  };
};