import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';

const ProfileScreen = () => {
  const {
    user,
    logout,
  } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) || 'U'}
          </Text>
        </View>

        <Text style={styles.name}>
          {user?.name || 'Kullanıcı'}
        </Text>

        <Text style={styles.email}>
          {user?.email || '-'}
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Yetki
          </Text>

          <Text style={styles.infoValue}>
            {user?.role || 'Personel'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Departman
          </Text>

          <Text style={styles.infoValue}>
            {user?.department || '-'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Kullanıcı ID
          </Text>

          <Text style={styles.idText}>
            {user?._id || '-'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>
            Çıkış Yap
          </Text>
        </TouchableOpacity>

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

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },

  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
  },

  name: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },

  email: {
    color: '#A8B0C0',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
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

  idText: {
    color: '#60A5FA',
    fontSize: 13,
  },

  logoutButton: {
    backgroundColor: '#B91C1C',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
  },

  logoutText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});