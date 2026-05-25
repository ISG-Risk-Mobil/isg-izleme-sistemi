import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>
          Ahmet Yılmaz
        </Text>

        <Text style={styles.email}>
          ahmet@gmail.com
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Yetki
          </Text>

          <Text style={styles.infoValue}>
            Admin
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Departman
          </Text>

          <Text style={styles.infoValue}>
            İş Güvenliği
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081120',
    padding: 20,
  },

  card: {
    backgroundColor: '#121E35',
    borderRadius: 24,
    padding: 24,
  },

  name: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },

  email: {
    color: '#A8B0C0',
    marginTop: 8,
    marginBottom: 24,
  },

  infoBox: {
    backgroundColor: '#1D2942',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  infoTitle: {
    color: '#A8B0C0',
    marginBottom: 6,
  },

  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});