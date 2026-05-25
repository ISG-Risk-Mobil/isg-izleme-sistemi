import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const AlarmScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Alarm Listesi</Text>

        <View style={styles.card}>
          <Text style={styles.title}>Gaz Seviyesi</Text>

          <Text style={styles.value}>
            Kritik Değer Aşıldı
          </Text>

          <Text style={styles.time}>
            23 Mayıs 2026 - 20:30
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Sıcaklık</Text>

          <Text style={styles.value}>
            Yüksek Sıcaklık
          </Text>

          <Text style={styles.time}>
            23 Mayıs 2026 - 18:12
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AlarmScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081120',
    padding: 20,
  },

  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#121E35',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  title: {
    color: '#F7A600',
    fontSize: 16,
    fontWeight: '700',
  },

  value: {
    color: '#fff',
    fontSize: 20,
    marginTop: 10,
  },

  time: {
    color: '#A8B0C0',
    marginTop: 12,
  },
});