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
  const {token, user} = useAuth();

  const isAdmin = user?.role === 'admin';

  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getUserId = () => {
    return user?._id || (user as any)?.id;
  };

  const isMyAlarm = (alarm: any) => {
    const currentUserId = getUserId();

    if (!currentUserId) {
      return false;
    }

    const alarmUserId =
      alarm?.userId?._id ||
      alarm?.userId?.id ||
      alarm?.userId;

    return String(alarmUserId) === String(currentUserId);
  };

  const fetchAlarms = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const response = await getAlarms(token);

    if (response.success) {
      const allAlarms = response.alarms || [];

      const myAlarms = allAlarms.filter(isMyAlarm);

      setAlarms(myAlarms);
    } else {
      Alert.alert(
        'Hata',
        response.message || 'Alarmlar alınamadı',
      );
    }

    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlarms();
  };

  useEffect(() => {
    fetchAlarms();
  }, [token, user]);

  const handleResolve = async (alarmId: string) => {
    if (!token) return;

    if (!isAdmin) {
      Alert.alert(
        'Yetkisiz İşlem',
        'Alarm çözme işlemi sadece yöneticiler tarafından yapılabilir.',
      );
      return;
    }

    const response = await resolveAlarm(token, alarmId);

    if (response.success) {
      Alert.alert('Başarılı', 'Alarm çözüldü');
      fetchAlarms();
    } else {
      Alert.alert(
        'Hata',
        response.message || 'Alarm çözülemedi',
      );
    }
  };

  const getSeverityStyle = (severity: string) => {
    if (severity === 'CRITICAL') {
      return styles.critical;
    }

    if (severity === 'HIGH') {
      return styles.high;
    }

    if (severity === 'MEDIUM') {
      return styles.medium;
    }

    return styles.low;
  };

  const getSeverityText = (severity: string) => {
    if (severity === 'CRITICAL') return 'KRİTİK';
    if (severity === 'HIGH') return 'YÜKSEK';
    if (severity === 'MEDIUM') return 'ORTA';
    if (severity === 'LOW') return 'DÜŞÜK';

    return severity || 'BİLİNMİYOR';
  };

  const getAlarmTypeText = (type: string) => {
    if (type === 'HARD_IMPACT') return 'Sert Darbe';
    if (type === 'FALL_DETECTED') return 'Düşme Algılandı';
    if (type === 'INACTIVITY') return 'Hareketsizlik';
    if (type === 'DANGEROUS_ZONE') return 'Tehlikeli Bölge';
    if (type === 'HIGH_RISK_SCORE') return 'Yüksek Risk Skoru';
    if (type === 'LOW_BATTERY') return 'Düşük Batarya';
    if (type === 'PPE_VIOLATION') return 'Ekipman İhlali';

    return type || 'Alarm';
  };

  const getDeviceName = (alarm: any) => {
    return (
      alarm?.deviceId?.name ||
      alarm?.deviceId?.deviceId ||
      'Bilinmiyor'
    );
  };

  const getResolvedByName = (alarm: any) => {
    return (
      alarm?.resolvedBy?.name ||
      alarm?.resolvedBy?.email ||
      'Bilinmiyor'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }>
        <Text style={styles.header}>
          Alarm Listesi
        </Text>

        <Text style={styles.subHeader}>
          Bu ekranda sadece hesabına ait alarmlar gösterilir.
        </Text>

        {loading ? (
          <ActivityIndicator
            color="#3B82F6"
            size="large"
            style={styles.loader}
          />
        ) : alarms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Alarm kaydı bulunamadı
            </Text>

            <Text style={styles.emptyText}>
              Şu anda hesabına ait kayıtlı alarm yok.
            </Text>
          </View>
        ) : (
          alarms.map(alarm => (
            <View
              key={alarm._id || alarm.id}
              style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.title}>
                  {getAlarmTypeText(alarm.type)}
                </Text>

                <View
                  style={[
                    styles.badge,
                    getSeverityStyle(alarm.severity),
                  ]}>
                  <Text style={styles.badgeText}>
                    {getSeverityText(alarm.severity)}
                  </Text>
                </View>
              </View>

              <Text style={styles.value}>
                {alarm.description || 'Açıklama yok'}
              </Text>

              <Text style={styles.deviceText}>
                Cihaz: {getDeviceName(alarm)}
              </Text>

              <Text style={styles.time}>
                {alarm.createdAt
                  ? new Date(alarm.createdAt).toLocaleString('tr-TR')
                  : 'Tarih yok'}
              </Text>

              <Text
                style={
                  alarm.resolved
                    ? styles.resolved
                    : styles.unresolved
                }>
                {alarm.resolved ? 'Çözüldü' : 'Aktif'}
              </Text>

              {alarm.resolved && (
                <>
                  <Text style={styles.resolvedInfoText}>
                    Çözen yönetici: {getResolvedByName(alarm)}
                  </Text>

                  <Text style={styles.resolvedInfoText}>
                    Çözülme zamanı:{' '}
                    {alarm.resolvedAt
                      ? new Date(alarm.resolvedAt).toLocaleString('tr-TR')
                      : 'Bilinmiyor'}
                  </Text>
                </>
              )}

              {!alarm.resolved && isAdmin && (
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() =>
                    handleResolve(alarm._id || alarm.id)
                  }>
                  <Text style={styles.resolveButtonText}>
                    Alarmı Çöz
                  </Text>
                </TouchableOpacity>
              )}

              {!alarm.resolved && !isAdmin && (
                <Text style={styles.workerInfoText}>
                  Bu alarm yalnızca yönetici tarafından çözülebilir.
                </Text>
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
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },

  subHeader: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 20,
  },

  loader: {
    marginTop: 40,
  },

  card: {
    backgroundColor: '#121E35',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  title: {
    color: '#F7A600',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },

  value: {
    color: '#fff',
    fontSize: 17,
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

  resolvedInfoText: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },

  workerInfoText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
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

  emptyCard: {
    backgroundColor: '#121E35',
    borderRadius: 20,
    padding: 22,
    marginTop: 20,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  emptyText: {
    color: '#A8B0C0',
    fontSize: 15,
    lineHeight: 22,
  },
});