import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {WebView} from 'react-native-webview';

import {useAuth} from '../../context/AuthContext';
import {getSensorDataByDevice} from '../../services/api/sensorService';

type LocationData = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: string | Date | null;
};

const toNumber = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeLocation = (value: any): LocationData | null => {
  const raw =
    value?.location ||
    value?.coords ||
    value?.sensorData?.location ||
    value?.sensorData?.triggerData?.location ||
    value;

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const latitude = toNumber(raw.latitude ?? raw.lat);
  const longitude = toNumber(raw.longitude ?? raw.lng ?? raw.lon);
  const accuracy = toNumber(raw.accuracy);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy,
    timestamp:
      value?.timestamp ||
      value?.createdAt ||
      value?.lastSeen ||
      raw?.timestamp ||
      raw?.createdAt ||
      null,
  };
};

const getLatestLocationFromLogs = (logs: any[]): LocationData | null => {
  for (const log of logs) {
    const location = normalizeLocation(log);

    if (location) {
      return {
        ...location,
        timestamp: log.timestamp || log.createdAt || location.timestamp,
      };
    }
  }

  return null;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return 'Henüz veri yok';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Geçersiz tarih';
  }

  return date.toLocaleString('tr-TR');
};

const buildMapHtml = (
  location: LocationData,
  deviceName: string,
  deviceCode: string,
) => {
  const lat = location.latitude;
  const lng = location.longitude;
  const accuracy = location.accuracy || 0;

  const safeDeviceName = JSON.stringify(deviceName || 'Cihaz Konumu');
  const safeDeviceCode = JSON.stringify(deviceCode || '');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      padding: 0;
      margin: 0;
      background: #0f172a;
      overflow: hidden;
    }

    .leaflet-container {
      background: #0f172a;
      font-family: Arial, sans-serif;
    }

    .leaflet-popup-content-wrapper {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,.6) !important;
    }

    .leaflet-popup-content {
      color: #e2e8f0 !important;
      font-size: 13px;
    }

    .leaflet-popup-tip {
      background: #1e293b !important;
    }

    .leaflet-control-zoom a {
      background: #1e293b !important;
      border-color: #334155 !important;
      color: #94a3b8 !important;
    }

    @keyframes gps-pulse {
      0%, 100% {
        box-shadow: 0 0 0 4px rgba(245,158,11,.35), 0 4px 16px rgba(0,0,0,.5);
      }

      50% {
        box-shadow: 0 0 0 13px rgba(245,158,11,.08), 0 4px 16px rgba(0,0,0,.5);
      }
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    const lat = ${lat};
    const lng = ${lng};
    const accuracy = ${accuracy};
    const deviceName = ${safeDeviceName};
    const deviceCode = ${safeDeviceCode};

    const map = L.map('map', {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);

    const icon = L.divIcon({
      className: '',
      html: \`
        <div style="
          width:42px;
          height:42px;
          border-radius:50%;
          background:linear-gradient(135deg,#f59e0b,#ef4444);
          border:3px solid #ffffff;
          display:flex;
          align-items:center;
          justify-content:center;
          animation:gps-pulse 2s infinite;
        ">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>
        </div>
      \`,
      iconSize: [42, 42],
      iconAnchor: [21, 42],
      popupAnchor: [0, -38]
    });

    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(
        '<b>' + deviceName + '</b><br/>' +
        '<span style="color:#94a3b8;font-size:12px;">' + deviceCode + '</span><br/>' +
        '<span style="color:#94a3b8;font-size:12px;">' +
        lat.toFixed(6) + ', ' + lng.toFixed(6) +
        '</span>'
      )
      .openPopup();

    if (accuracy && accuracy > 0) {
      L.circle([lat, lng], {
        radius: accuracy,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.08,
        weight: 1
      }).addTo(map);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  </script>
</body>
</html>
`;
};

const LocationScreen = ({navigation}: any) => {
  const route = useRoute<any>();
  const params = route.params || {};

  const {token: authToken} = useAuth();

  const token = params.token || authToken;
  const deviceId = params.deviceId;
  const deviceName = params.deviceName || 'Aktif Cihaz';
  const deviceCode = params.deviceCode || deviceId || '-';

  const initialLocation = useMemo(
    () => normalizeLocation(params.initialLocation),
    [params.initialLocation],
  );

  const [location, setLocation] = useState<LocationData | null>(
    initialLocation,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!token) {
      setError('Token bulunamadı. Tekrar giriş yapmayı dene.');
      return;
    }

    if (!deviceId) {
      if (!initialLocation) {
        setError('Cihaz ID bulunamadı. Önce aktif cihaz seçilmeli.');
      }

      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getSensorDataByDevice(token, deviceId);

      if (response?.success === false) {
        throw new Error(response.message || 'Konum verisi alınamadı');
      }

      const logs = Array.isArray(response)
        ? response
        : response?.logs || response?.data?.logs || [];

      const latestLocation = getLatestLocationFromLogs(logs);

      if (!latestLocation) {
        if (initialLocation) {
          setLocation(initialLocation);
          return;
        }

        throw new Error('Bu cihaz için konum içeren sensör kaydı bulunamadı.');
      }

      setLocation(latestLocation);
    } catch (err: any) {
      setError(err?.message || 'Konum verisi alınamadı');
    } finally {
      setLoading(false);
    }
  }, [deviceId, initialLocation, token]);

  useFocusEffect(
    useCallback(() => {
      fetchLocation();
    }, [fetchLocation]),
  );

  const mapHtml = useMemo(() => {
    if (!location) {
      return '';
    }

    return buildMapHtml(location, deviceName, deviceCode);
  }, [location, deviceName, deviceCode]);

  const openGoogleMaps = async () => {
    if (!location) {
      Alert.alert('Konum yok', 'Açılacak konum bulunamadı.');
      return;
    }

    const lat = location.latitude;
    const lng = location.longitude;

    const googleUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    const nativeUrl =
      Platform.OS === 'android'
        ? `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(deviceName)})`
        : `maps://?q=${encodeURIComponent(deviceName)}&ll=${lat},${lng}`;

    try {
      await Linking.openURL(nativeUrl);
    } catch {
      await Linking.openURL(googleUrl);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Konum Haritası</Text>
          <Text style={styles.subtitle}>{deviceName}</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={fetchLocation}>
          <Text style={styles.refreshButtonText}>Yenile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchLocation}
            tintColor="#F59E0B"
          />
        }>
        {loading && !location && (
          <View style={styles.centerCard}>
            <ActivityIndicator color="#F59E0B" size="large" />
            <Text style={styles.centerText}>Konum yükleniyor...</Text>
          </View>
        )}

        {!loading && error && !location && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorTitle}>Konum alınamadı</Text>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchLocation}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {location && (
          <>
            <View style={styles.mapCard}>
              <WebView
                key={`${location.latitude}-${location.longitude}-${location.timestamp}`}
                originWhitelist={['*']}
                source={{html: mapHtml}}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.webLoading}>
                    <ActivityIndicator color="#F59E0B" size="large" />
                  </View>
                )}
                style={styles.webView}
              />
            </View>

            {error && (
              <Text style={styles.warningText}>
                Güncel veri alınamadı, son bilinen konum gösteriliyor.
              </Text>
            )}

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Enlem</Text>
                <Text style={styles.infoValue}>
                  {location.latitude.toFixed(6)}°
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Boylam</Text>
                <Text style={styles.infoValue}>
                  {location.longitude.toFixed(6)}°
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Doğruluk</Text>
                <Text style={styles.infoValue}>
                  {location.accuracy
                    ? `±${Math.round(location.accuracy)}m`
                    : '—'}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Son Veri</Text>
                <Text style={styles.infoValueSmall}>
                  {formatDate(location.timestamp)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={openGoogleMaps}>
              <Text style={styles.googleButtonText}>Google Maps’te Aç</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 34,
    marginTop: -3,
  },

  headerTextArea: {
    flex: 1,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 3,
  },

  refreshButton: {
    backgroundColor: '#061B33',
    borderWidth: 1,
    borderColor: '#17314F',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },

  refreshButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
  },

  centerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  centerText: {
    color: '#94A3B8',
    marginTop: 14,
    fontSize: 14,
  },

  errorCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },

  errorIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7F1D1D',
    color: '#FCA5A5',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },

  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },

  errorText: {
    color: '#FCA5A5',
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },

  retryButtonText: {
    color: '#FCA5A5',
    fontWeight: '800',
  },

  mapCard: {
    height: 390,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 14,
  },

  webView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  webLoading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  warningText: {
    color: '#F59E0B',
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  infoCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },

  infoLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },

  infoValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  infoValueSmall: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },

  googleButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 30,
  },

  googleButtonText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 15,
  },
});
