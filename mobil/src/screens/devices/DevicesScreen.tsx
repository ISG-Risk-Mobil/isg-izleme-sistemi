import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const DevicesScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Cihazlar</Text>

        <View style={styles.card}>
          <Text style={styles.deviceName}>
            Sensör #A12
          </Text>

          <Text style={styles.status}>
            Aktif
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.deviceName}>
            Sensör #B44
          </Text>

          <Text style={styles.status}>
            Aktif
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.deviceName}>
            Sensör #C90
          </Text>

          <Text style={styles.offline}>
            Çevrimdışı
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DevicesScreen;

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

  deviceName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  status: {
    color: '#32D583',
    marginTop: 10,
    fontWeight: '700',
  },

  offline: {
    color: '#FF4D4D',
    marginTop: 10,
    fontWeight: '700',
  },
});