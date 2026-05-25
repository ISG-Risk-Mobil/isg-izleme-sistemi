import React from 'react';

import {
  View,
  ActivityIndicator,
  Text,
  StatusBar,
  StyleSheet,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';

import AuthNavigator from './AuthNavigator';
import BottomTabNavigator from './BottomTabNavigator';

import { useAuth } from '../context/AuthContext';

const AppNavigator = () => {
  const { token, isLoading } = useAuth();

  // LOADING SCREEN
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          backgroundColor="#0F172A"
          barStyle="light-content"
        />

        <ActivityIndicator
          size="large"
          color="#3B82F6"
        />

        <Text style={styles.loadingTitle}>
          VISIONGUARD
        </Text>

        <Text style={styles.loadingText}>
          Sistem yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? (
        <BottomTabNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    letterSpacing: 1,
  },

  loadingText: {
    color: '#94A3B8',
    marginTop: 10,
    fontSize: 15,
  },
});