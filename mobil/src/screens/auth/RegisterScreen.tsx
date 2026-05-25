import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
} from 'react-native';

import COLORS from '../../constants/colors';

const RegisterScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Register Screen</Text>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: COLORS.white,
  },
});