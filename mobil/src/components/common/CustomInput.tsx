import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import COLORS from '../../constants/colors';

interface Props extends TextInputProps {
  label: string;
}

const CustomInput = ({
  label,
  style,
  ...props
}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#8A93A5"
        {...props}
      />
    </View>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.white || '#FFFFFF',
    marginBottom: 8,
    fontSize: 15,
  },
  input: {
    backgroundColor: COLORS.input || '#2A2C3E',
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 56,
    color: COLORS.white || '#FFFFFF',
    fontSize: 16,
  },
});