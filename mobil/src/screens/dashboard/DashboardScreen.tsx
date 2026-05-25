import React, {useEffect, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';

import {LineChart} from 'react-native-chart-kit';

import {useAuth} from '../../context/AuthContext';
import {getDashboardData} from '../../services/api/dashboardService';

const DashboardScreen = () => {
  const {token} = useAuth();

  const screenWidth = Dimensions.get('window').width;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [alarms, setAlarms] = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState(0);

  const [analytics, setAnalytics] = useState({
    totalAlerts: 0,
    safeStatus: 100,
    sensorAccuracy: 96,
    activeDevices: 0,
  });

  useEffect(() => {
    if (!token) return;

    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await getDashboardData(token);

      if (response.success) {
        const data = response.alarms || [];

        setAlarms(data);

        const critical = data.filter(
          (item: any) => item.severity === 'CRITICAL',
        ).length;

        const high = data.filter(
          (item: any) => item.severity === 'HIGH',
        ).length;

        const medium = data.filter(
          (item: any) => item.severity === 'MEDIUM',
        ).length;

        const risk = Math.min(
          critical * 25 + high * 15 + medium * 8,
          100,
        );

        setRiskScore(risk);

        setAnalytics({
          totalAlerts: data.length,
          safeStatus: Math.max(100 - risk, 0),
          sensorAccuracy: 96,
          activeDevices: new Set(
            data
              .map((item: any) => item.deviceId?._id || item.deviceId?.deviceId)
              .filter(Boolean),
          ).size,
        });
      }
    } catch (error) {
      console.log('Dashboard Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const chartData = alarms
    .slice(0, 7)
    .reverse()
    .map((item: any) => {
      if (item.severity === 'CRITICAL') return 100;
      if (item.severity === 'HIGH') return 70;
      if (item.severity === 'MEDIUM') return 40;
      return 10;
    });

  const getRiskColorText = () => {
    if (riskScore >= 70) return styles.highRiskText;
    if (riskScore >= 40) return styles.mediumRiskText;
    return styles.lowRiskText;
  };

  const getSeverityStyle = (severity: string) => {
    if (severity === 'CRITICAL') return styles.highRisk;
    if (severity === 'HIGH') return styles.mediumRisk;
    return styles.lowRisk;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analiz Dashboard</Text>

          <Text style={styles.headerSubTitle}>
            Backend verilerine göre risk analizi
          </Text>
        </View>

        <View style={styles.riskContainer}>
          <Text style={styles.riskTitle}>Risk Skoru</Text>

          {loading ? (
            <ActivityIndicator color="#3B82F6" size="large" />
          ) : (
            <Text style={[styles.riskValue, getRiskColorText()]}>
              %{riskScore}
            </Text>
          )}

          <Text style={styles.riskDescription}>
            Alarm kayıtlarına göre hesaplandı
          </Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Risk Trendi</Text>

          <LineChart
            data={{
              labels: chartData.length
                ? chartData.map((_, index) => `${index + 1}`)
                : ['0'],
              datasets: [
                {
                  data: chartData.length ? chartData : [0],
                },
              ],
            }}
            width={screenWidth - 60}
            height={220}
            yAxisSuffix="%"
            chartConfig={{
              backgroundGradientFrom: '#1E293B',
              backgroundGradientTo: '#1E293B',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) =>
                `rgba(255, 255, 255, ${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <Text style={styles.sectionTitle}>Sistem İstatistikleri</Text>

        <View style={styles.gridContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Toplam Alarm</Text>
            <Text style={styles.statValue}>{analytics.totalAlerts}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Güvenli Durum</Text>
            <Text style={styles.statValue}>%{analytics.safeStatus}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sensör Doğruluğu</Text>
            <Text style={styles.statValue}>%{analytics.sensorAccuracy}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Aktif Cihaz</Text>
            <Text style={styles.statValue}>{analytics.activeDevices}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Son Anomali Tespitleri</Text>

        {loading ? (
          <ActivityIndicator color="#3B82F6" size="large" />
        ) : alarms.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Alarm Kaydı Yok</Text>

            <Text style={styles.infoText}>
              Şu anda sistemde kayıtlı bir anomali veya alarm bulunmuyor.
            </Text>
          </View>
        ) : (
          alarms.slice(0, 5).map((item, index) => (
            <View key={item._id || index} style={styles.anomalyCard}>
              <View style={styles.anomalyContent}>
                <Text style={styles.anomalyTitle}>{item.type}</Text>

                <Text style={styles.anomalyValue}>
                  {item.description || 'Açıklama yok'}
                </Text>

                <Text style={styles.anomalyDate}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : ''}
                </Text>
              </View>

              <View style={[styles.riskBadge, getSeverityStyle(item.severity)]}>
                <Text style={styles.riskBadgeText}>{item.severity}</Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Analiz Motoru</Text>

          <Text style={styles.infoText}>
            Sistem; ivmeölçer, GPS, batarya ve cihaz durum verilerini Node.js
            backend üzerinde analiz ederek riskli durumları alarm kaydı olarak
            oluşturmaktadır.
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
    fontSize: 54,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  lowRiskText: {
    color: '#22C55E',
  },

  mediumRiskText: {
    color: '#F59E0B',
  },

  highRiskText: {
    color: '#EF4444',
  },

  riskDescription: {
    color: '#94A3B8',
    fontSize: 14,
  },

  chartCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
  },

  chartTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  chart: {
    borderRadius: 20,
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

  anomalyContent: {
    flex: 1,
    paddingRight: 12,
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

  anomalyDate: {
    color: '#64748B',
    marginTop: 6,
    fontSize: 12,
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