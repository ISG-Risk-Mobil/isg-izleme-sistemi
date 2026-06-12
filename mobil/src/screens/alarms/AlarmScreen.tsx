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
  Modal,
} from 'react-native';

import {useAuth} from '../../context/AuthContext';
import {getAlarms, resolveAlarm} from '../../services/api/alarmService';

const AlarmScreen = () => {
  const {token} = useAuth();

  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);

  const fetchAlarms = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await getAlarms(token);

      if (response.success) {
        setAlarms(response.alarms || []);
      } else {
        Alert.alert('Hata', response.message || 'Alarmlar alınamadı');
      }
    } catch (error) {
      console.log('ALARM FETCH ERROR:', error);
      Alert.alert('Hata', 'Alarm listesi alınırken hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlarms();
  };

  useEffect(() => {
    fetchAlarms();
  }, [token]);

  const handleResolve = async (alarmId: string) => {
    if (!token) return;

    try {
      const response = await resolveAlarm(token, alarmId);

      if (response.success) {
        Alert.alert('Başarılı', 'Alarm çözüldü');
        setSelectedAlarm(null);
        fetchAlarms();
      } else {
        Alert.alert('Hata', response.message || 'Alarm çözülemedi');
      }
    } catch (error) {
      console.log('RESOLVE ALARM ERROR:', error);
      Alert.alert('Hata', 'Alarm çözülürken hata oluştu');
    }
  };

  const getSeverityStyle = (severity?: string) => {
    if (severity === 'CRITICAL') return styles.critical;
    if (severity === 'HIGH') return styles.high;
    if (severity === 'MEDIUM') return styles.medium;
    return styles.low;
  };

  const getDeviceName = (alarm: any) => {
    return (
      alarm?.deviceId?.name ||
      alarm?.deviceId?.deviceId ||
      alarm?.deviceName ||
      'Bilinmiyor'
    );
  };

  const getDeviceCode = (alarm: any) => {
    return alarm?.deviceId?.deviceId || 'Bilinmiyor';
  };

  const getUser = (alarm: any) => {
    return alarm?.userId || alarm?.user || alarm?.deviceId?.userId || null;
  };

  const getUserName = (user: any) => {
    if (!user) return 'Bilinmiyor';

    if (user.name && user.surname) {
      return `${user.name} ${user.surname}`;
    }

    return user.name || user.fullName || user.email || 'Bilinmiyor';
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return 'Bilinmiyor';
    if (role === 'admin') return 'Admin';
    if (role === 'worker') return 'Çalışan';
    return role;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Tarih yok';

    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderAlarmDetailModal = () => {
    if (!selectedAlarm) return null;

    const user = getUser(selectedAlarm);

    return (
      <Modal
        visible={!!selectedAlarm}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAlarm(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alarm Detayı</Text>

              <TouchableOpacity onPress={() => setSelectedAlarm(null)}>
                <Text style={styles.closeText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailTopRow}>
                <Text style={styles.detailAlarmType}>
                  {selectedAlarm.type || 'ALARM'}
                </Text>

                <View
                  style={[
                    styles.badge,
                    getSeverityStyle(selectedAlarm.severity),
                  ]}>
                  <Text style={styles.badgeText}>
                    {selectedAlarm.severity || 'LOW'}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailDescription}>
                {selectedAlarm.description || 'Açıklama yok'}
              </Text>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Cihaz Bilgileri</Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Cihaz Adı: </Text>
                  {getDeviceName(selectedAlarm)}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Cihaz ID: </Text>
                  {getDeviceCode(selectedAlarm)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Kullanıcı Bilgileri</Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Ad Soyad: </Text>
                  {getUserName(user)}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>E-posta: </Text>
                  {user?.email || 'Bilinmiyor'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Departman: </Text>
                  {user?.department || 'Bilinmiyor'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Rol: </Text>
                  {getRoleLabel(user?.role)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Alarm Durumu</Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Tarih: </Text>
                  {formatDate(selectedAlarm.createdAt)}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Durum: </Text>
                  {selectedAlarm.resolved ? 'Çözüldü' : 'Aktif'}
                </Text>
              </View>

              {!selectedAlarm.resolved && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.modalResolveButton}
                  onPress={() => handleResolve(selectedAlarm._id)}>
                  <Text style={styles.resolveButtonText}>Alarmı Çöz</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }>
        <Text style={styles.header}>Alarm Listesi</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#3B82F6" size="large" />
            <Text style={styles.loadingText}>Alarmlar yükleniyor...</Text>
          </View>
        ) : alarms.length === 0 ? (
          <Text style={styles.emptyText}>Alarm kaydı bulunamadı.</Text>
        ) : (
          alarms.map(alarm => {
            const user = getUser(alarm);

            return (
              <TouchableOpacity
                key={alarm._id}
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => setSelectedAlarm(alarm)}>
                <View style={styles.row}>
                  <View style={styles.cardTitleArea}>
                    <Text style={styles.title}>{alarm.type || 'ALARM'}</Text>

                    <Text style={styles.shortDescription} numberOfLines={1}>
                      {alarm.description || 'Açıklama yok'}
                    </Text>
                  </View>

                  <View style={[styles.badge, getSeverityStyle(alarm.severity)]}>
                    <Text style={styles.badgeText}>
                      {alarm.severity || 'LOW'}
                    </Text>
                  </View>
                </View>

                <View style={styles.shortInfoRow}>
                  <Text style={styles.shortInfoText} numberOfLines={1}>
                    Cihaz: {getDeviceName(alarm)}
                  </Text>
                </View>

                <View style={styles.shortInfoRow}>
                  <Text style={styles.shortInfoText} numberOfLines={1}>
                    Kullanıcı: {getUserName(user)}
                  </Text>
                </View>

                <View style={styles.bottomRow}>
                  <Text style={styles.time}>{formatDate(alarm.createdAt)}</Text>

                  <Text
                    style={alarm.resolved ? styles.resolved : styles.unresolved}>
                    {alarm.resolved ? 'Çözüldü' : 'Aktif'}
                  </Text>
                </View>

                <Text style={styles.tapHint}>Detay için dokun</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {renderAlarmDetailModal()}
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

  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },

  loadingText: {
    color: '#A8B0C0',
    marginTop: 12,
    fontSize: 15,
  },

  card: {
    backgroundColor: '#121E35',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  cardTitleArea: {
    flex: 1,
  },

  title: {
    color: '#F7A600',
    fontSize: 16,
    fontWeight: '700',
  },

  shortDescription: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '600',
  },

  shortInfoRow: {
    marginTop: 8,
  },

  shortInfoText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
  },

  bottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  time: {
    color: '#A8B0C0',
    fontSize: 13,
  },

  tapHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 10,
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
    fontWeight: '700',
    fontSize: 13,
  },

  unresolved: {
    color: '#FF4D4D',
    fontWeight: '700',
    fontSize: 13,
  },

  emptyText: {
    color: '#A8B0C0',
    fontSize: 16,
    marginTop: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#101B2E',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: '82%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  closeText: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: '700',
  },

  detailTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailAlarmType: {
    color: '#F7A600',
    fontSize: 18,
    fontWeight: '800',
  },

  detailDescription: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 26,
    marginTop: 14,
    fontWeight: '600',
  },

  detailSection: {
    backgroundColor: '#0B1628',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1E2B44',
  },

  sectionTitle: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },

  detailText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },

  detailLabel: {
    color: '#9CA3AF',
    fontWeight: '800',
  },

  modalResolveButton: {
    backgroundColor: '#2563EB',
    marginTop: 20,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  resolveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});