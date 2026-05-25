import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import COLORS from '../../constants/colors';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const CustomButton = ({ title, onPress, disabled, loading }: Props) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        (disabled || loading) && styles.disabledButton
      ]} 
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: COLORS.textGray || '#ccc',
  },
  text: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});