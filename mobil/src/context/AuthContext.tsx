import React, {createContext, useContext, useEffect, useState} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

type UserType = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
};

type AuthContextType = {
  user: UserType | null;
  token: string | null;

  login: (token: string, user: UserType) => Promise<void>;

  logout: () => Promise<void>;

  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({children}: any) => {
  const [user, setUser] = useState<UserType | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // APP AÇILDIĞINDA TOKEN KONTROL
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      setIsLoading(true);

      const storedToken = await AsyncStorage.getItem('token');

      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('SESSION RESTORE ERROR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIN
  const login = async (newToken: string, newUser: UserType) => {
    try {
      setToken(newToken);
      setUser(newUser);

      await AsyncStorage.setItem('token', newToken);

      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.log('LOGIN STORAGE ERROR:', error);
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      setToken(null);
      setUser(null);

      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.log('LOGOUT ERROR:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!token,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
