import React, {useEffect, useState} from 'react';

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

import {useAuth} from '../../context/AuthContext';
import {getDevices} from '../../services/api/deviceService';
import {getUsers} from '../../services/api/authService';
import {sendSensorData} from '../../services/api/sensorService';
import {getSensorPayload} from '../../services/sensors/sensorService';

const HomeScreen = ({navigation}: any) => {
  const {user, token} = useAuth();

  const isAdmin = user?.role === 'admin';

  const [systemStatus] = useState('AKTİF');
  const [riskLevel, setRiskLevel] = useState('DÜŞÜK');
  const [activeDevice, setActiveDevice] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const liveData = {
    acceleration: 'Gerçek veri hazır',
    location: 'BTÜ Kampüsü',
    battery: 'Sensörden alınacak',
    network: 'Aktif',
    lastUpdate: activeDevice?.lastSeen
      ? new Date(activeDevice.lastSeen).toLocaleString('tr-TR')
      : 'Henüz veri yok',
  };

  const alerts = [
    {
      id: 1,
      title: 'Sistem hazır',
      time: 'Canlı',
      level: 'Bilgi',
    },
  ];

  useEffect(() => {
    fetchActiveDevice();

    if (isAdmin) {
      fetchAdminPanelData();
    }
  }, [token, isAdmin]);

  const normalizeUsersResponse = (response: any) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.success) {
      return response.users || [];
    }

    return [];
  };

  const fetchAdminPanelData = async () => {
    if (!token) return;

    try {
      setAdminLoading(true);

      const usersResponse = await getUsers(token);
      const users = normalizeUsersResponse(usersResponse);

      setAdminUsers(users);
    } catch (error) {
      console.log('ADMIN PANEL ERROR:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchActiveDevice = async () => {
    if (!token) return;

    const response = await getDevices(token);

    if (response.success) {
      const device = response.devices?.find(
        (item: any) => item.isActive,
      );

      setActiveDevice(device || null);
    }
  };

  const handleSendSensorData = async () => {
    if (!token) {
      Alert.alert('Hata', 'Token bulunamadı');
      return;
    }

    if (!activeDevice) {
      Alert.alert(
        'Hata',
        'Aktif cihaz bulunamadı. Önce cihaz kaydı oluşturulmalı.',
      );
      return;
    }

    try {
      setSending(true);

      const payload = await getSensorPayload();

      const response = await sendSensorData(token, {
        deviceId: activeDevice._id,
        ...payload,
      });

      if (response.success) {
        if (response.alarms?.length > 0) {
          setRiskLevel('YÜKSEK');
        } else {
          setRiskLevel('DÜŞÜK');
        }

        Alert.alert(
          'Başarılı',
          `Sensör verisi gönderildi. Alarm sayısı: ${
            response.alarms?.length || 0
          }`,
        );

        fetchActiveDevice();

        if (isAdmin) {
          fetchAdminPanelData();
        }
      } else {
        Alert.alert(
          'Hata',
          response.message || 'Sensör verisi gönderilemedi',
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Sensör Hatası',
        error.message || 'Sensör verisi alınamadı',
      );
    } finally {
      setSending(false);
    }
  };

  const workerCount = adminUsers.filter(
    item => item.role === 'worker',
  ).length;

  const adminCount = adminUsers.filter(
    item => item.role === 'admin',
  ).length;

  const visibleAdminUsers = showAllUsers
    ? adminUsers
    : adminUsers.slice(0, 2);

  const renderAdminStatCard = (
    label: string,
    value: string | number,
  ) => {
    return (
      <View style={styles.adminStatCard}>
        <Text style={styles.adminStatLabel}>
          {label}
        </Text>

        <Text style={styles.adminStatValue}>
          {value}
        </Text>
      </View>
    );
  };

  const renderAdminPanel = () => {
    if (!isAdmin) return null;

    return (
      <View style={styles.adminPanel}>
        <View style={styles.adminPanelHeader}>
          <View>
            <Text style={styles.adminPanelTitle}>
              Yönetim Paneli
            </Text>

            <Text style={styles.adminPanelSubTitle}>
              Admin hesabı — kullanıcı yönetimi
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchAdminPanelData}>
            <Text style={styles.refreshButtonText}>
              Yenile
            </Text>
          </TouchableOpacity>
        </View>

        {adminLoading ? (
          <ActivityIndicator
            color="#F59E0B"
            size="large"
            style={styles.adminLoader}
          />
        ) : (
          <>
            <View style={styles.adminGrid}>
              {renderAdminStatCard(
                'Toplam Kullanıcı',
                adminUsers.length,
              )}

              {renderAdminStatCard(
                'Worker',
                workerCount,
              )}

              {renderAdminStatCard(
                'Admin',
                adminCount,
              )}
            </View>

            <View style={styles.adminUsersHeader}>
              <Text style={styles.adminSectionTitle}>
                Kullanıcılar
              </Text>

              <Text style={styles.adminUserCountText}>
                {adminUsers.length} kişi
              </Text>
            </View>

            {adminUsers.length === 0 ? (
              <Text style={styles.adminEmptyText}>
                Kullanıcı bulunamadı.
              </Text>
            ) : (
              visibleAdminUsers.map((item, index) => (
                <View
                  key={item._id || item.id || index}
                  style={styles.adminListCard}>
                  <View style={styles.adminListLeft}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(item.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.adminListInfo}>
                      <Text style={styles.adminListTitle}>
                        {item.name || 'İsimsiz Kullanıcı'}
                      </Text>

                      <Text style={styles.adminListSubText}>
                        {item.email || 'E-posta yok'}
                      </Text>

                      <Text style={styles.adminListSubText}>
                        Departman: {item.department || 'Genel'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.roleBadge,
                      item.role === 'admin'
                        ? styles.adminRoleBadge
                        : styles.workerRoleBadge,
                    ]}>
                    <Text style={styles.roleBadgeText}>
                      {item.role || 'worker'}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {adminUsers.length > 2 && (
              <TouchableOpacity
                style={styles.adminViewAllButton}
                onPress={() => setShowAllUsers(previous => !previous)}>
                <Text style={styles.adminViewAllText}>
                  {showAllUsers
                    ? 'Daha az göster'
                    : `Tüm kullanıcıları göster (${adminUsers.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#0F172A"
        barStyle="light-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>
              Mobil Güvenlik Platformu
            </Text>

            <Text style={styles.subTitle}>
              Gerçek zamanlı izleme sistemi
            </Text>

            <Text style={styles.userText}>
              Hoş geldin {user?.name || 'Kullanıcı'}
            </Text>

            {isAdmin && (
              <Text style={styles.adminModeText}>
                Yönetici Görünümü
              </Text>
            )}
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {systemStatus}
            </Text>
          </View>
        </View>

        {renderAdminPanel()}

        <View style={styles.deviceCard}>
          <Text style={styles.cardTitle}>
            Aktif Cihaz
          </Text>

          <Text style={styles.deviceName}>
            {activeDevice
              ? activeDevice.name
              : 'Aktif cihaz bulunamadı'}
          </Text>

          {activeDevice && (
            <Text style={styles.deviceSubText}>
              Cihaz Kodu: {activeDevice.deviceId}
            </Text>
          )}
        </View>

        <View style={styles.riskCard}>
          <Text style={styles.cardTitle}>
            Güncel Risk Durumu
          </Text>

          <Text
            style={[
              styles.riskLevel,
              riskLevel === 'YÜKSEK' && styles.highRiskText,
            ]}>
            {riskLevel}
          </Text>

          <Text style={styles.cardSubText}>
            Son gönderilen sensör verisine göre
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Canlı Sensör Verileri
        </Text>

        <View style={styles.dataGrid}>
          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>
              İvme
            </Text>

            <Text style={styles.dataValue}>
              {liveData.acceleration}
            </Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>
              Batarya
            </Text>

            <Text style={styles.dataValue}>
              {liveData.battery}
            </Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>
              Ağ
            </Text>

            <Text style={styles.dataValue}>
              {liveData.network}
            </Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>
              Güncelleme
            </Text>

            <Text style={styles.dataValueSmall}>
              {liveData.lastUpdate}
            </Text>
          </View>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.cardTitle}>
            Son Konum
          </Text>

          <Text style={styles.locationText}>
            {liveData.location}
          </Text>
        </View>

        <View style={styles.alertHeader}>
          <Text style={styles.sectionTitle}>
            Son Alarm Kayıtları
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Alarmlar')}>
            <Text style={styles.viewAllText}>
              Tümünü Gör
            </Text>
          </TouchableOpacity>
        </View>

        {alerts.map(item => (
          <View
            key={item.id}
            style={styles.alertCard}>
            <View>
              <Text style={styles.alertTitle}>
                {item.title}
              </Text>

              <Text style={styles.alertTime}>
                {item.time}
              </Text>
            </View>

            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>
                {item.level}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>
          Hızlı İşlemler
        </Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.actionButtonText}>
              Analiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cihazlar')}>
            <Text style={styles.actionButtonText}>
              Cihazlar
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sensorButton}
          onPress={handleSendSensorData}
          disabled={sending}>
          <Text style={styles.actionButtonText}>
            {sending
              ? 'Gönderiliyor...'
              : 'Sensör Verisi Gönder'}
          </Text>
        </TouchableOpacity>
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
    marginBottom: 25,
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

  adminPanel: {
    backgroundColor: '#1E293B',
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  adminPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },

  adminPanelTitle: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: 'bold',
  },

  adminPanelSubTitle: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 5,
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

  adminLoader: {
    marginVertical: 20,
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

  adminStatLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },

  adminStatValue: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
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
    fontSize: 18,
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

  sensorButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    alignItems: 'center',
  },

  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});