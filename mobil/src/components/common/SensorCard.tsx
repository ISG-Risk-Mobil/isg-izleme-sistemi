import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import COLORS from '../../constants/colors';

interface Props {
  title: string;
  value: string;
  status: string;
  danger?: boolean;
}

const SensorCard = ({
  title,
  value,
  status,
  danger,
}: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.value}>{value}</Text>

      <Text
        style={[
          styles.status,
          {
            color: danger
              ? COLORS.danger
              : COLORS.success,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

export default SensorCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    color: COLORS.textGray,
    fontSize: 15,
  },
  value: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '700',
    marginTop: 10,
  },
  status: {
    marginTop: 10,
    fontWeight: '700',
  },
});