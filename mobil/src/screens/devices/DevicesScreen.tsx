import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { getDevices } from '../../services/api/deviceService';

const DevicesScreen = () => {
  const { token } = useAuth();

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async () => {
    if (!token) return;

    const response = await getDevices(token);

    if (response.success) {
      setDevices(response.devices || []);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <Text style={styles.header}>Cihazlar</Text>

        {loading ? (
          <ActivityIndicator color="#3B82F6" size="large" />
        ) : devices.length === 0 ? (
          <Text style={styles.emptyText}>
            Kayıtlı cihaz bulunamadı.
          </Text>
        ) : (
          devices.map((device) => (
            <View key={device._id} style={styles.card}>
              <Text style={styles.deviceName}>
                {device.name}
              </Text>

              <Text style={styles.deviceId}>
                Cihaz ID: {device.deviceId}
              </Text>

              <Text
                style={
                  device.isActive
                    ? styles.status
                    : styles.offline
                }
              >
                {device.isActive ? 'Aktif' : 'Çevrimdışı'}
              </Text>

              <Text style={styles.lastSeen}>
                Son görülme:{' '}
                {device.lastSeen
                  ? new Date(device.lastSeen).toLocaleString()
                  : 'Henüz veri yok'}
              </Text>

              {device.assignedUser && (
                <Text style={styles.userText}>
                  Kullanıcı: {device.assignedUser.name}
                </Text>
              )}
            </View>
          ))
        )}
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

  deviceId: {
    color: '#94A3B8',
    marginTop: 8,
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

  lastSeen: {
    color: '#CBD5E1',
    marginTop: 8,
  },

  userText: {
    color: '#60A5FA',
    marginTop: 8,
    fontWeight: '600',
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 20,
  },
});