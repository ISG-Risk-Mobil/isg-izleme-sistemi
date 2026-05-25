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
import {getAlarms, resolveAlarm} from '../../services/api/alarmService';

const AlarmScreen = () => {
  const {token} = useAuth();

  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlarms = async () => {
    if (!token) return;

    const response = await getAlarms(token);

    if (response.success) {
      setAlarms(response.alarms || []);
    }

    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);

    fetchAlarms();
  };

  useEffect(() => {
    if (!token) return;

    fetchAlarms();
  }, [token]);

  const handleResolve = async (alarmId: string) => {
    if (!token) return;

    const response = await resolveAlarm(token, alarmId);

    if (response.success) {
      Alert.alert('Başarılı', 'Alarm çözüldü');
      fetchAlarms();
    } else {
      Alert.alert('Hata', response.message || 'Alarm çözülemedi');
    }
  };

  const getSeverityStyle = (severity: string) => {
    if (severity === 'CRITICAL') return styles.critical;
    if (severity === 'HIGH') return styles.high;
    if (severity === 'MEDIUM') return styles.medium;
    return styles.low;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Text style={styles.header}>Alarm Listesi</Text>

        {loading ? (
          <ActivityIndicator color="#3B82F6" size="large" />
        ) : alarms.length === 0 ? (
          <Text style={styles.emptyText}>Alarm kaydı bulunamadı.</Text>
        ) : (
          alarms.map(alarm => (
            <View key={alarm._id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.title}>{alarm.type}</Text>

                <View style={[styles.badge, getSeverityStyle(alarm.severity)]}>
                  <Text style={styles.badgeText}>{alarm.severity}</Text>
                </View>
              </View>

              <Text style={styles.value}>
                {alarm.description || 'Açıklama yok'}
              </Text>

              <Text style={styles.deviceText}>
                Cihaz:{' '}
                {alarm.deviceId?.name ||
                  alarm.deviceId?.deviceId ||
                  'Bilinmiyor'}
              </Text>

              <Text style={styles.time}>
                {new Date(alarm.createdAt).toLocaleString()}
              </Text>

              <Text
                style={alarm.resolved ? styles.resolved : styles.unresolved}>
                {alarm.resolved ? 'Çözüldü' : 'Aktif'}
              </Text>

              {!alarm.resolved && (
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => handleResolve(alarm._id)}>
                  <Text style={styles.resolveButtonText}>Alarmı Çöz</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
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

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    color: '#F7A600',
    fontSize: 16,
    fontWeight: '700',
  },

  value: {
    color: '#fff',
    fontSize: 18,
    marginTop: 12,
    lineHeight: 25,
  },

  deviceText: {
    color: '#60A5FA',
    marginTop: 12,
    fontWeight: '600',
  },

  time: {
    color: '#A8B0C0',
    marginTop: 12,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },

  critical: {
    backgroundColor: '#7F1D1D',
  },

  high: {
    backgroundColor: '#B91C1C',
  },

  medium: {
    backgroundColor: '#92400E',
  },

  low: {
    backgroundColor: '#14532D',
  },

  resolved: {
    color: '#32D583',
    marginTop: 12,
    fontWeight: '700',
  },

  unresolved: {
    color: '#FF4D4D',
    marginTop: 12,
    fontWeight: '700',
  },

  resolveButton: {
    backgroundColor: '#2563EB',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },

  resolveButtonText: {
    color: 'white',
    fontWeight: '700',
  },

  emptyText: {
    color: '#A8B0C0',
    fontSize: 16,
    marginTop: 20,
  },
});
