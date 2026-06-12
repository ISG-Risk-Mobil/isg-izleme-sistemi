import React, {useEffect, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';

import {useAuth} from '../../context/AuthContext';
import {getDevices} from '../../services/api/deviceService';

const DevicesScreen = ({navigation}: any) => {
  const {token} = useAuth();

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await getDevices(token);

      if (response.success) {
        setDevices(response.devices || []);
      }
    } catch (error) {
      console.log('DEVICES ERROR:', error);
      Alert.alert('Hata', 'Cihazlar alınırken bir sorun oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  const normalizeDeviceLocation = (device: any) => {
    const raw =
      device?.location ||
      device?.lastLocation ||
      device?.lastKnownLocation ||
      device?.sensorData?.location ||
      device?.latestSensorData?.location ||
      null;

    if (!raw) {
      return null;
    }

    const latitude = Number(raw.latitude ?? raw.lat);
    const longitude = Number(raw.longitude ?? raw.lng ?? raw.lon);
    const accuracy = raw.accuracy;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
      accuracy,
      timestamp: raw.timestamp || device.lastSeen || device.updatedAt || null,
    };
  };

  const handleOpenDeviceLocationMap = (device: any) => {
    const deviceMongoId = device?._id || device?.id;
    const initialLocation = normalizeDeviceLocation(device);

    if (!deviceMongoId && !initialLocation) {
      Alert.alert(
        'Konum bulunamadı',
        'Bu cihaz için haritada gösterilecek konum verisi yok.',
      );
      return;
    }

    navigation.navigate('Konum', {
      deviceId: deviceMongoId,
      deviceName: device?.name || 'Cihaz Konumu',
      deviceCode: device?.deviceId || device?._id || '-',
      initialLocation,
      token,
    });
  };

  const renderLocationText = (device: any) => {
    const location = normalizeDeviceLocation(device);

    if (!location) {
      return 'Son sensör kaydından alınacak';
    }

    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Text style={styles.header}>Cihazlar</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#3B82F6" size="large" />
            <Text style={styles.loadingText}>Cihazlar yükleniyor...</Text>
          </View>
        ) : devices.length === 0 ? (
          <Text style={styles.emptyText}>Kayıtlı cihaz bulunamadı.</Text>
        ) : (
          devices.map(device => (
            <View key={device._id || device.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.deviceInfoArea}>
                  <Text style={styles.deviceName}>{device.name}</Text>

                  <Text style={styles.deviceId}>
                    Cihaz ID: {device.deviceId || '-'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    device.isActive
                      ? styles.statusBadgeActive
                      : styles.statusBadgeOffline,
                  ]}>
                  <Text
                    style={
                      device.isActive
                        ? styles.statusBadgeTextActive
                        : styles.statusBadgeTextOffline
                    }>
                    {device.isActive ? 'Aktif' : 'Çevrimdışı'}
                  </Text>
                </View>
              </View>

              <Text style={styles.lastSeen}>
                Son görülme:{' '}
                {device.lastSeen
                  ? new Date(device.lastSeen).toLocaleString('tr-TR')
                  : 'Henüz veri yok'}
              </Text>

              {device.assignedUser && (
                <Text style={styles.userText}>
                  Kullanıcı: {device.assignedUser.name}
                </Text>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.deviceLocationButton}
                onPress={() => handleOpenDeviceLocationMap(device)}>
                <View style={styles.deviceLocationTextArea}>
                  <Text style={styles.deviceLocationTitle}>Cihaz Konumu</Text>

                  <Text style={styles.deviceLocationText}>
                    {renderLocationText(device)}
                  </Text>
                </View>

                <Text style={styles.deviceLocationAction}>Haritada Aç ›</Text>
              </TouchableOpacity>
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

  loadingBox: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },

  card: {
    backgroundColor: '#121E35',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  deviceInfoArea: {
    flex: 1,
  },

  deviceName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  deviceId: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 13,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusBadgeActive: {
    backgroundColor: '#052E1A',
    borderColor: '#166534',
  },

  statusBadgeOffline: {
    backgroundColor: '#450A0A',
    borderColor: '#991B1B',
  },

  statusBadgeTextActive: {
    color: '#32D583',
    fontSize: 12,
    fontWeight: '800',
  },

  statusBadgeTextOffline: {
    color: '#FF4D4D',
    fontSize: 12,
    fontWeight: '800',
  },

  lastSeen: {
    color: '#CBD5E1',
    marginTop: 12,
    fontSize: 13,
  },

  userText: {
    color: '#60A5FA',
    marginTop: 8,
    fontWeight: '600',
    fontSize: 13,
  },

  deviceLocationButton: {
    marginTop: 14,
    backgroundColor: '#061B33',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#17314F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  deviceLocationTextArea: {
    flex: 1,
  },

  deviceLocationTitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 5,
  },

  deviceLocationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  deviceLocationAction: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '800',
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 20,
  },
});