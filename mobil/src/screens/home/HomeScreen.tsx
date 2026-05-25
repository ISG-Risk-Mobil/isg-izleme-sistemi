import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { getDevices } from '../../services/api/deviceService';
import { sendSensorData } from '../../services/api/sensorService';
import { getSensorPayload } from '../../services/sensors/sensorService';

const HomeScreen = ({ navigation }: any) => {
  const { logout, user, token } = useAuth();

  const [systemStatus] = useState('AKTİF');
  const [riskLevel, setRiskLevel] = useState('DÜŞÜK');
  const [activeDevice, setActiveDevice] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const liveData = {
    acceleration: 'Gerçek veri hazır',
    location: 'BTÜ Kampüsü',
    battery: 'Sensörden alınacak',
    network: 'Aktif',
    lastUpdate: activeDevice?.lastSeen
      ? new Date(activeDevice.lastSeen).toLocaleString()
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
  }, [token]);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#0F172A"
        barStyle="light-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>
              Mobil Güvenlik Platformu
            </Text>

            <Text style={styles.subTitle}>
              Gerçek zamanlı izleme sistemi
            </Text>

            <Text style={styles.userText}>
              Hoş geldin {user?.name || 'Kullanıcı'}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {systemStatus}
            </Text>
          </View>
        </View>

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
            ]}
          >
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
            <Text style={styles.dataLabel}>İvme</Text>
            <Text style={styles.dataValue}>
              {liveData.acceleration}
            </Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Batarya</Text>
            <Text style={styles.dataValue}>
              {liveData.battery}
            </Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Ağ</Text>
            <Text style={styles.dataValue}>
              {liveData.network}
            </Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataLabel}>Güncelleme</Text>
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
            onPress={() => navigation.navigate('Alarmlar')}
          >
            <Text style={styles.viewAllText}>
              Tümünü Gör
            </Text>
          </TouchableOpacity>
        </View>

        {alerts.map((item) => (
          <View
            key={item.id}
            style={styles.alertCard}
          >
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
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.actionButtonText}>
              Analiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cihazlar')}
          >
            <Text style={styles.actionButtonText}>
              Cihazlar
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sensorButton}
          onPress={handleSendSensorData}
          disabled={sending}
        >
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
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
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

  logoutButton: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 30,
    alignItems: 'center',
  },

  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});