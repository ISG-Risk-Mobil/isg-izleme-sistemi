import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';

const DashboardScreen = () => {
  const [riskScore] = useState(24);

  // DEMO ANALİZ VERİLERİ
  const analytics = {
    totalAlerts: 12,
    safeStatus: 87,
    sensorAccuracy: 96,
    activeDevices: 4,
  };

  const anomalyData = [
    {
      id: 1,
      title: 'Ani Fren Tespiti',
      risk: 'Orta Risk',
      value: '2.8 g',
    },
    {
      id: 2,
      title: 'Uzun Süre Hareketsizlik',
      risk: 'Düşük Risk',
      value: '14 dk',
    },
    {
      id: 3,
      title: 'GPS Sapması',
      risk: 'Yüksek Risk',
      value: '42 m',
    },
  ];

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
          <Text style={styles.headerTitle}>
            Analiz Dashboard
          </Text>

          <Text style={styles.headerSubTitle}>
            Gerçek zamanlı risk analizi
          </Text>
        </View>

        {/* RISK SCORE */}
        <View style={styles.riskContainer}>
          <Text style={styles.riskTitle}>
            Risk Skoru
          </Text>

          <Text style={styles.riskValue}>
            %{riskScore}
          </Text>

          <Text style={styles.riskDescription}>
            Sistem genel güvenlik durumu
          </Text>
        </View>

        {/* İSTATİSTİKLER */}
        <Text style={styles.sectionTitle}>
          Sistem İstatistikleri
        </Text>

        <View style={styles.gridContainer}>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Toplam Alarm
            </Text>

            <Text style={styles.statValue}>
              {analytics.totalAlerts}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Güvenli Durum
            </Text>

            <Text style={styles.statValue}>
              %{analytics.safeStatus}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Sensör Doğruluğu
            </Text>

            <Text style={styles.statValue}>
              %{analytics.sensorAccuracy}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Aktif Cihaz
            </Text>

            <Text style={styles.statValue}>
              {analytics.activeDevices}
            </Text>
          </View>

        </View>

        {/* ANOMALİLER */}
        <Text style={styles.sectionTitle}>
          Anomali Tespitleri
        </Text>

        {anomalyData.map((item) => (
          <View
            key={item.id}
            style={styles.anomalyCard}
          >
            <View>
              <Text style={styles.anomalyTitle}>
                {item.title}
              </Text>

              <Text style={styles.anomalyValue}>
                Veri: {item.value}
              </Text>
            </View>

            <View
              style={[
                styles.riskBadge,

                item.risk === 'Yüksek Risk'
                  ? styles.highRisk
                  : item.risk === 'Orta Risk'
                  ? styles.mediumRisk
                  : styles.lowRisk,
              ]}
            >
              <Text style={styles.riskBadgeText}>
                {item.risk}
              </Text>
            </View>
          </View>
        ))}

        {/* ANALİZ AÇIKLAMASI */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Analiz Motoru
          </Text>

          <Text style={styles.infoText}>
            Sistem; ivmeölçer, GPS ve hareket
            verilerini analiz ederek anormal
            durumları eşik tabanlı yöntemlerle
            tespit etmektedir.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

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
    marginTop: 10,
    marginBottom: 25,
  },

  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },

  headerSubTitle: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 15,
  },

  riskContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },

  riskTitle: {
    color: '#CBD5E1',
    fontSize: 18,
  },

  riskValue: {
    color: '#22C55E',
    fontSize: 54,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  riskDescription: {
    color: '#94A3B8',
    fontSize: 14,
  },

  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  statCard: {
    backgroundColor: '#1E293B',
    width: '48%',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },

  statLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 10,
  },

  statValue: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },

  anomalyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  anomalyTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  anomalyValue: {
    color: '#94A3B8',
    marginTop: 6,
  },

  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  highRisk: {
    backgroundColor: '#7F1D1D',
  },

  mediumRisk: {
    backgroundColor: '#78350F',
  },

  lowRisk: {
    backgroundColor: '#14532D',
  },

  riskBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 22,
    marginTop: 15,
  },

  infoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  infoText: {
    color: '#CBD5E1',
    lineHeight: 24,
    fontSize: 15,
  },
});