import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';

const HomeScreen = ({ navigation }: any) => {
  const { logout, user } = useAuth();

  const [systemStatus, setSystemStatus] = useState('AKTİF');
  const [riskLevel, setRiskLevel] = useState('DÜŞÜK');

  // DEMO VERİLER
  const liveData = {
    acceleration: '1.24 g',
    location: 'BTÜ Kampüsü',
    battery: '%82',
    network: 'WiFi',
    lastUpdate: '2 sn önce',
  };

  const alerts = [
    {
      id: 1,
      title: 'Ani Hareket Algılandı',
      time: '14:32',
      level: 'Orta',
    },
    {
      id: 2,
      title: 'GPS Konum Güncellendi',
      time: '14:28',
      level: 'Bilgi',
    },
  ];

  useEffect(() => {
    // İleride socket.io canlı veri burada çalışacak
  }, []);

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

        {/* HEADER */}
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

        {/* RİSK KARTI */}
        <View style={styles.riskCard}>
          <Text style={styles.cardTitle}>
            Güncel Risk Durumu
          </Text>

          <Text style={styles.riskLevel}>
            {riskLevel}
          </Text>

          <Text style={styles.cardSubText}>
            Son 24 saatlik analiz sonucu
          </Text>
        </View>

        {/* CANLI VERİLER */}
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

            <Text style={styles.dataValue}>
              {liveData.lastUpdate}
            </Text>
          </View>
        </View>

        {/* KONUM */}
        <View style={styles.locationCard}>
          <Text style={styles.cardTitle}>
            Son Konum
          </Text>

          <Text style={styles.locationText}>
            {liveData.location}
          </Text>
        </View>

        {/* ALARMLAR */}
        <View style={styles.alertHeader}>
          <Text style={styles.sectionTitle}>
            Son Alarm Kayıtları
          </Text>

          <TouchableOpacity>
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

        {/* HIZLI İŞLEMLER */}
        <Text style={styles.sectionTitle}>
          Hızlı İşlemler
        </Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('LiveData')}
          >
            <Text style={styles.actionButtonText}>
              Canlı İzleme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.actionButtonText}>
              Raporlar
            </Text>
          </TouchableOpacity>
        </View>

        {/* ÇIKIŞ */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>
            Çıkış Yap
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
    fontSize: 20,
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
    backgroundColor: '#3F1D1D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  alertBadgeText: {
    color: '#F87171',
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