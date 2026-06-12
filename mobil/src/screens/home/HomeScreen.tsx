import React, {useCallback, useEffect, useRef, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {getDevices} from '../../services/api/deviceService';
import {
  getUsers,
  makeUserAdmin,
  makeUserWorker,
} from '../../services/api/authService';
import {sendSensorData} from '../../services/api/sensorService';
import {getSensorPayload} from '../../services/sensors/sensorService';

const HomeScreen = ({navigation}: any) => {
  const {user, token} = useAuth();

  const isAdmin = user?.role === 'admin';

  const [systemStatus] = useState('AKTİF');
  const [riskLevel, setRiskLevel] = useState('DÜŞÜK');
  const [activeDevice, setActiveDevice] = useState<any>(null);

  const [sending, setSending] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [lastSensorPayload, setLastSensorPayload] = useState<any>(null);
  const [lastAlarmCount, setLastAlarmCount] = useState(0);
  const [sensorError, setSensorError] = useState<string | null>(null);

  const sendingRef = useRef(false);

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [roleChangingUserId, setRoleChangingUserId] = useState<string | null>(
    null,
  );
  const [showAllUsers, setShowAllUsers] = useState(false);

  const [alerts, setAlerts] = useState<any[]>([
    {
      id: 'system-ready',
      title: 'Sistem hazır',
      time: 'Canlı',
      level: 'Bilgi',
    },
  ]);

  const formatSensorValue = (value: any) => {
    if (value === null || value === undefined) {
      return 'Veri bekleniyor';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'object') {
      if (
        value.x !== undefined &&
        value.y !== undefined &&
        value.z !== undefined
      ) {
        return `x:${Number(value.x).toFixed(2)} y:${Number(value.y).toFixed(
          2,
        )} z:${Number(value.z).toFixed(2)}`;
      }

      return JSON.stringify(value);
    }

    return String(value);
  };

  const getUserId = (item: any) => {
    return item?._id || item?.id;
  };

  const getCurrentUserId = () => {
    return (user as any)?._id || (user as any)?.id;
  };

  const normalizeUsersResponse = (response: any) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.success) {
      return response.users || [];
    }

    return [];
  };

  const fetchAdminPanelData = useCallback(async () => {
    if (!token || !isAdmin) {
      setAdminUsers([]);
      return;
    }

    try {
      setAdminLoading(true);

      const usersResponse = await getUsers(token);

      console.log('HOME ADMIN USERS RESPONSE:', usersResponse);

      const users = normalizeUsersResponse(usersResponse);

      setAdminUsers(users);
    } catch (error) {
      console.log('HOME ADMIN PANEL ERROR:', error);
      setAdminUsers([]);
    } finally {
      setAdminLoading(false);
    }
  }, [token, isAdmin]);

  const fetchActiveDevice = useCallback(async () => {
    if (!token) return;

    try {
      const response = await getDevices(token);

      if (response?.success) {
        const devices = response.devices || [];

        const device =
          devices.find((item: any) => item.isActive) || devices[0] || null;

        setActiveDevice(device);
      } else {
        setActiveDevice(null);
      }
    } catch (error) {
      console.log('ACTIVE DEVICE ERROR:', error);
      setActiveDevice(null);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchActiveDevice();

      if (isAdmin) {
        fetchAdminPanelData();
      }
    }, [fetchActiveDevice, fetchAdminPanelData, isAdmin]),
  );

  const changeUserRole = async (
    targetUserId: string,
    newRole: 'admin' | 'worker',
  ) => {
    if (!token) {
      Alert.alert('Hata', 'Token bulunamadı');
      return;
    }

    try {
      setRoleChangingUserId(targetUserId);

      const response =
        newRole === 'admin'
          ? await makeUserAdmin(token, targetUserId)
          : await makeUserWorker(token, targetUserId);

      if (response?.success === false) {
        Alert.alert('Hata', response.message || 'Rol değiştirilemedi');
        return;
      }

      setAdminUsers(previous =>
        previous.map(item =>
          getUserId(item) === targetUserId ? {...item, role: newRole} : item,
        ),
      );

      Alert.alert(
        'Başarılı',
        newRole === 'admin'
          ? 'Kullanıcı admin yapıldı'
          : 'Kullanıcı worker yapıldı',
      );
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Bağlantı hatası');
    } finally {
      setRoleChangingUserId(null);
    }
  };

  const handleChangeUserRole = (item: any) => {
    const targetUserId = getUserId(item);
    const currentUserId = getCurrentUserId();

    if (!targetUserId) {
      Alert.alert('Hata', 'Kullanıcı ID bulunamadı');
      return;
    }

    if (targetUserId === currentUserId) {
      Alert.alert('Uyarı', 'Kendi hesabının rolünü değiştiremezsin.');
      return;
    }

    const currentRole = item.role === 'admin' ? 'admin' : 'worker';
    const newRole = currentRole === 'worker' ? 'admin' : 'worker';

    Alert.alert(
      'Rol Değiştir',
      `${item.name || 'Bu kullanıcı'} ${
        newRole === 'admin' ? 'admin' : 'worker'
      } yapılacak. Emin misin?`,
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Onayla',
          onPress: () => changeUserRole(targetUserId, newRole),
        },
      ],
    );
  };

  const sendSensorSnapshot = useCallback(
    async (showAlert = false) => {
      if (!token) {
        if (showAlert) {
          Alert.alert('Hata', 'Token bulunamadı');
        }
        return;
      }

      if (!activeDevice) {
        setMonitoring(false);

        if (showAlert) {
          Alert.alert(
            'Hata',
            'Aktif cihaz bulunamadı. Önce cihaz kaydı oluşturulmalı.',
          );
        }
        return;
      }

      if (sendingRef.current) {
        return;
      }

      try {
        sendingRef.current = true;
        setSending(true);
        setSensorError(null);

        const payload = await getSensorPayload();

        setLastSensorPayload(payload);

        const deviceMongoId = activeDevice._id || activeDevice.id;

        const response = await sendSensorData(token, {
          deviceId: deviceMongoId,
          ...payload,
        });

        if (response?.success) {
          const alarmCount = response.alarms?.length || 0;

          setLastAlarmCount(alarmCount);

          if (alarmCount > 0) {
            setRiskLevel('YÜKSEK');

            const newAlarmItems = response.alarms.map(
              (alarm: any, index: number) => ({
                id: alarm._id || alarm.id || `${Date.now()}-${index}`,
                title:
                  alarm.description ||
                  alarm.title ||
                  'Riskli sensör durumu algılandı',
                time: new Date().toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                level: alarm.level || alarm.severity || 'Yüksek',
              }),
            );

            setAlerts(previous => [...newAlarmItems, ...previous].slice(0, 5));
          } else {
            setRiskLevel('DÜŞÜK');
          }

          fetchActiveDevice();

          if (showAlert) {
            Alert.alert(
              'Başarılı',
              `Sensör verisi kontrol edildi. Alarm sayısı: ${alarmCount}`,
            );
          }
        } else {
          const message = response?.message || 'Sensör verisi gönderilemedi';

          setSensorError(message);

          if (showAlert) {
            Alert.alert('Hata', message);
          }
        }
      } catch (error: any) {
        const message = error?.message || 'Sensör verisi alınamadı';

        setSensorError(message);

        if (showAlert) {
          Alert.alert('Sensör Hatası', message);
        }
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [token, activeDevice, fetchActiveDevice],
  );

  useEffect(() => {
    if (!token || !activeDevice) {
      setMonitoring(false);
      return;
    }

    setMonitoring(true);

    sendSensorSnapshot(false);

    const intervalId: ReturnType<typeof setInterval> = setInterval(() => {
      sendSensorSnapshot(false);
    }, 10000);

    return () => {
      clearInterval(intervalId);
      setMonitoring(false);
    };
  }, [token, activeDevice?._id, activeDevice?.id, sendSensorSnapshot]);

  const accelerationValue =
    lastSensorPayload?.acceleration ||
    lastSensorPayload?.accelerometer ||
    lastSensorPayload?.motion;

  const locationValue =
    lastSensorPayload?.location?.latitude &&
    lastSensorPayload?.location?.longitude
      ? `${lastSensorPayload.location.latitude}, ${lastSensorPayload.location.longitude}`
      : 'Konum bekleniyor';

  const batteryValue =
    lastSensorPayload?.batteryLevel !== undefined
      ? `%${lastSensorPayload.batteryLevel}`
      : lastSensorPayload?.battery !== undefined
      ? `%${lastSensorPayload.battery}`
      : 'Veri bekleniyor';

  const liveData = {
    acceleration: formatSensorValue(accelerationValue),
    location: locationValue,
    battery: batteryValue,
    network: monitoring ? 'Canlı izleme aktif' : 'İzleme beklemede',
    lastUpdate: activeDevice?.lastSeen
      ? new Date(activeDevice.lastSeen).toLocaleString('tr-TR')
      : lastSensorPayload
      ? new Date().toLocaleString('tr-TR')
      : 'Henüz veri yok',
  };

  const workerCount = adminUsers.filter(item => item.role === 'worker').length;
  const adminCount = adminUsers.filter(item => item.role === 'admin').length;
  const visibleAdminUsers = showAllUsers ? adminUsers : adminUsers.slice(0, 2);

  const renderAdminStatCard = (label: string, value: string | number) => {
    return (
      <View style={styles.adminStatCard}>
        <Text style={styles.adminStatLabel}>{label}</Text>
        <Text style={styles.adminStatValue}>{value}</Text>
      </View>
    );
  };

  const handleOpenLocationMap = () => {
    const deviceMongoId = activeDevice?._id || activeDevice?.id;

    const initialLocation = lastSensorPayload?.location || null;

    if (!deviceMongoId && !initialLocation) {
      Alert.alert(
        'Konum bulunamadı',
        'Haritada göstermek için önce cihazdan konum verisi gelmeli.',
      );
      return;
    }

    navigation.navigate('Konum', {
      deviceId: deviceMongoId,
      deviceName: activeDevice?.name || 'Aktif Cihaz',
      deviceCode: activeDevice?.deviceId || activeDevice?._id || '-',
      initialLocation,
      token,
    });
  };

  const renderAdminPanel = () => {
    if (!isAdmin) return null;

    return (
      <View style={styles.adminPanel}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.adminPanelHeader}
          onPress={() => navigation.navigate('YonetimPaneli')}>
          <View style={styles.adminPanelHeaderText}>
            <Text style={styles.adminPanelTitle}>Yönetim Paneli</Text>

            <Text style={styles.adminPanelSubTitle}>
              Kullanıcı, cihaz ve alarm yönetimi
            </Text>
          </View>

          <View style={styles.adminArrowBox}>
            <Text style={styles.adminPanelArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {adminLoading ? (
          <ActivityIndicator
            color="#F59E0B"
            size="small"
            style={styles.adminLoader}
          />
        ) : (
          <View style={styles.adminStatsRow}>
            <View style={styles.adminStatBox}>
              <Text style={styles.adminStatValue}>{adminUsers.length}</Text>
              <Text style={styles.adminStatLabel}>Kullanıcı</Text>
            </View>

            <View style={styles.adminStatDivider} />

            <View style={styles.adminStatBox}>
              <Text style={styles.adminStatValue}>{workerCount}</Text>
              <Text style={styles.adminStatLabel}>Worker</Text>
            </View>

            <View style={styles.adminStatDivider} />

            <View style={styles.adminStatBox}>
              <Text style={styles.adminStatValue}>{adminCount}</Text>
              <Text style={styles.adminStatLabel}>Admin</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.adminMapButton}
          onPress={handleOpenLocationMap}>
          <View style={styles.adminMapIconBox}>
            <Text style={styles.adminMapIcon}>⌖</Text>
          </View>

          <View style={styles.adminMapTextArea}>
            <Text style={styles.adminMapTitle}>Konum Haritası</Text>
            <Text style={styles.adminMapSubTitle}>
              {activeDevice
                ? `${activeDevice.name} konumunu görüntüle`
                : 'Aktif cihaz konumu bekleniyor'}
            </Text>
          </View>

          <Text style={styles.adminMapArrow}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Mobil Güvenlik Platformu</Text>

            <Text style={styles.subTitle}>Gerçek zamanlı izleme sistemi</Text>

            <Text style={styles.userText}>
              Hoş geldin {user?.name || 'Kullanıcı'}
            </Text>

            {isAdmin && (
              <Text style={styles.adminModeText}>Yönetici Görünümü</Text>
            )}
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{systemStatus}</Text>
          </View>
        </View>

        <View style={styles.adminPanelSlot}>{renderAdminPanel()}</View>

        <View style={styles.deviceCard}>
          <Text style={styles.cardTitle}>Aktif Cihaz</Text>

          <Text style={styles.deviceName}>
            {activeDevice ? activeDevice.name : 'Aktif cihaz bulunamadı'}
          </Text>

          {activeDevice && (
            <Text style={styles.deviceSubText}>
              Cihaz Kodu: {activeDevice.deviceId || activeDevice._id}
            </Text>
          )}
        </View>

        <View style={styles.riskCard}>
          <Text style={styles.cardTitle}>Güncel Risk Durumu</Text>

          <Text
            style={[
              styles.riskLevel,
              riskLevel === 'YÜKSEK' && styles.highRiskText,
            ]}>
            {riskLevel}
          </Text>

          <Text style={styles.cardSubText}>
            {monitoring
              ? `Otomatik izleme aktif. Son alarm sayısı: ${lastAlarmCount}`
              : 'Sensör izleme başlatılıyor'}
          </Text>

          {sensorError && <Text style={styles.errorText}>{sensorError}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Canlı Sensör Verileri</Text>

        <View style={styles.dataGrid}>
          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>İvme</Text>
            <Text style={styles.dataValue}>{liveData.acceleration}</Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Batarya</Text>
            <Text style={styles.dataValue}>{liveData.battery}</Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Ağ</Text>
            <Text style={styles.dataValue}>{liveData.network}</Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Güncelleme</Text>
            <Text style={styles.dataValueSmall}>{liveData.lastUpdate}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.locationCard}
          onPress={handleOpenLocationMap}>
          <View style={styles.locationCardHeader}>
            <Text style={styles.cardTitle}>Son Konum</Text>
            <Text style={styles.locationOpenText}>Haritada Aç ›</Text>
          </View>

          <Text style={styles.locationText}>{liveData.location}</Text>
        </TouchableOpacity>

        <View style={styles.alertHeader}>
          <Text style={styles.sectionTitle}>Son Alarm Kayıtları</Text>

          <TouchableOpacity onPress={() => navigation.navigate('Alarmlar')}>
            <Text style={styles.viewAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {alerts.map(item => (
          <View key={item.id} style={styles.alertCard}>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertTime}>{item.time}</Text>
            </View>

            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{item.level}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.actionButtonText}>Analiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cihazlar')}>
            <Text style={styles.actionButtonText}>Cihazlar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monitoringCard}>
          <Text style={styles.monitoringTitle}>Sensör İzleme Durumu</Text>

          <Text
            style={[
              styles.monitoringStatus,
              monitoring ? styles.monitoringActive : styles.monitoringPassive,
            ]}>
            {monitoring ? 'OTOMATİK İZLEME AKTİF' : 'İZLEME BEKLEMEDE'}
          </Text>

          <Text style={styles.monitoringDesc}>
            Sensör verileri belirli aralıklarla otomatik alınır. Olumsuz durum
            algılanırsa backend alarm oluşturur.
          </Text>

          {sending && (
            <Text style={styles.monitoringSending}>
              Sensör verisi kontrol ediliyor...
            </Text>
          )}

          <TouchableOpacity
            style={styles.manualCheckButton}
            onPress={() => sendSensorSnapshot(true)}
            disabled={sending}>
            <Text style={styles.manualCheckButtonText}>
              {sending ? 'Kontrol ediliyor...' : 'Manuel Kontrol Et'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 10,
    gap: 12,
  },

  headerLeft: {
    flex: 1,
  },

  welcomeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },

  subTitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 5,
  },

  userText: {
    color: '#38BDF8',
    marginTop: 8,
    fontWeight: '600',
  },

  adminModeText: {
    color: '#F59E0B',
    marginTop: 6,
    fontWeight: '700',
  },

  statusBadge: {
    backgroundColor: '#14532D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },

  statusText: {
    color: '#4ADE80',
    fontWeight: 'bold',
    fontSize: 12,
  },

  refreshButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  refreshButtonText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 12,
  },

  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  adminStatCard: {
    backgroundColor: '#0F172A',
    width: '48%',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },

  adminUsersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },

  adminSectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  adminUserCountText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },

  adminEmptyText: {
    color: '#94A3B8',
    marginBottom: 12,
  },

  adminListCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  adminListLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },

  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#CBD5E1',
    fontWeight: 'bold',
  },

  adminAvatarCircle: {
    backgroundColor: '#78350F',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  adminAvatarText: {
    color: '#F59E0B',
  },

  adminListInfo: {
    flex: 1,
  },

  adminListTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },

  adminListSubText: {
    color: '#94A3B8',
    marginTop: 4,
    fontSize: 12,
  },

  adminListRight: {
    alignItems: 'flex-end',
    gap: 8,
  },

  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  adminRoleBadge: {
    backgroundColor: '#92400E',
  },

  workerRoleBadge: {
    backgroundColor: '#14532D',
  },

  roleBadgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 10,
  },

  roleActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },

  makeAdminButton: {
    backgroundColor: '#451A03',
    borderColor: '#F59E0B',
  },

  makeWorkerButton: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
  },

  roleActionButtonDisabled: {
    opacity: 0.5,
  },

  roleActionButtonText: {
    fontSize: 11,
    fontWeight: '800',
  },

  makeAdminButtonText: {
    color: '#F59E0B',
  },

  makeWorkerButtonText: {
    color: '#FCA5A5',
  },

  currentUserText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },

  adminViewAllButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },

  adminViewAllText: {
    color: '#60A5FA',
    fontWeight: '700',
  },

  deviceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  deviceName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  deviceSubText: {
    color: '#94A3B8',
    marginTop: 8,
  },

  riskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },

  cardTitle: {
    color: '#CBD5E1',
    fontSize: 16,
    marginBottom: 12,
  },

  riskLevel: {
    color: '#22C55E',
    fontSize: 34,
    fontWeight: 'bold',
  },

  highRiskText: {
    color: '#EF4444',
  },

  cardSubText: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 13,
  },

  errorText: {
    color: '#FCA5A5',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },

  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 10,
  },

  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  dataCard: {
    backgroundColor: '#1E293B',
    width: '48%',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  dataLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 10,
  },

  dataValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  dataValueSmall: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },

  locationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },

  locationText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  viewAllText: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  alertCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  alertTime: {
    color: '#94A3B8',
    marginTop: 5,
  },

  alertBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  alertBadgeText: {
    color: '#BFDBFE',
    fontWeight: 'bold',
    fontSize: 12,
  },

  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  actionButton: {
    backgroundColor: '#2563EB',
    width: '48%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },

  monitoringCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },

  monitoringTitle: {
    color: '#CBD5E1',
    fontSize: 15,
    marginBottom: 10,
    fontWeight: '700',
  },

  monitoringStatus: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },

  monitoringActive: {
    color: '#22C55E',
  },

  monitoringPassive: {
    color: '#F59E0B',
  },

  monitoringDesc: {
    color: '#94A3B8',
    lineHeight: 20,
    fontSize: 13,
  },

  monitoringSending: {
    color: '#38BDF8',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
  },

  manualCheckButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },

  manualCheckButtonText: {
    color: '#CBD5E1',
    fontWeight: '800',
    fontSize: 13,
  },

  adminCompactRow: {
    flexDirection: 'row',
    gap: 8,
  },

  adminCompactItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: '#061B33',
    borderWidth: 1,
    borderColor: '#17314F',
  },

  adminCompactLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 5,
  },

  adminCompactValue: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  adminHintText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 10,
  },

  adminPanel: {
    marginHorizontal: 23,
    marginTop: 0,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#1E2C3A',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  adminPanelSlot: {
    marginTop: 18,
    marginBottom: 18,
  },

  adminPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  adminPanelHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  adminPanelTitle: {
    color: '#F59E0B',
    fontSize: 17,
    fontWeight: '800',
  },

  adminPanelSubTitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },

  adminArrowBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#061B33',
  },

  adminPanelArrow: {
    color: '#F59E0B',
    fontSize: 26,
    fontWeight: '800',
    marginTop: -3,
  },

  adminStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#061B33',
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#17314F',
  },

  adminStatBox: {
    flex: 1,
    alignItems: 'center',
  },

  adminStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  adminStatLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },

  adminStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#17314F',
  },

  adminLoader: {
    marginVertical: 10,
  },
  adminMapButton: {
    marginTop: 12,
    backgroundColor: '#061B33',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#17314F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  adminMapIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#172554',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },

  adminMapIcon: {
    color: '#60A5FA',
    fontSize: 20,
    fontWeight: '900',
  },

  adminMapTextArea: {
    flex: 1,
  },

  adminMapTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  adminMapSubTitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },

  adminMapArrow: {
    color: '#60A5FA',
    fontSize: 24,
    fontWeight: '900',
  },

  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  locationOpenText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
});
