import React, {useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import CustomButton from '../../components/common/CustomButton';
import CustomInput from '../../components/common/CustomInput';

import {loginUser} from '../../services/api/authService';
import {useAuth} from '../../context/AuthContext';

const LoginScreen = ({navigation}: any) => {
  const {login} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Eksik Bilgi', 'E-posta ve şifre zorunludur');
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(email, password);

      if (data?.token) {
        await login(data.token, data.user);

        Alert.alert('Başarılı', 'Sisteme giriş yapıldı');
      } else {
        Alert.alert('Hata', data?.message || 'Giriş başarısız');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Sunucu bağlantı hatası';

      Alert.alert('Giriş Başarısız', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      {/* ÜST ALAN */}
      <View style={styles.header}>
        <Text style={styles.logo}>VISIONGUARD</Text>

        <Text style={styles.subtitle}>
          Mobil Güvenlik ve Davranış Analizi Platformu
        </Text>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />

          <Text style={styles.liveText}>Sensör Sistemi Aktif</Text>
        </View>
      </View>

      {/* FORM */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kullanıcı Girişi</Text>

        <CustomInput
          label="E-Posta"
          placeholder="ornek@mail.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <CustomInput
          label="Şifre"
          placeholder="********"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <CustomButton
          title={loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          onPress={handleLogin}
          disabled={loading}
        />

        <View style={styles.linkContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Hesabın yok mu? Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ALT BİLGİ */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Gerçek zamanlı sensör analizi • Node.js Backend • JWT Security
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  header: {
    marginBottom: 35,
    alignItems: 'center',
  },

  logo: {
    color: 'white',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 1,
  },

  subtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  liveBadge: {
    marginTop: 18,
    backgroundColor: '#14532D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    marginRight: 10,
  },

  liveText: {
    color: '#4ADE80',
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#1E293B',
    borderRadius: 28,
    padding: 24,
  },

  cardTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  registerText: {
    color: '#60A5FA',
    fontWeight: '600',
  },

  footer: {
    marginTop: 28,
    alignItems: 'center',
  },

  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },

  forgotText: {
    color: '#94A3B8',
    fontSize: 14,
  },

  linkContainer: {
    marginTop: 22,
    alignItems: 'center',
    gap: 14,
  },
});
