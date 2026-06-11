import React, {useState} from 'react';

import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import COLORS from '../../constants/colors';

import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';

import {registerUser} from '../../services/api/authService';

const DEPARTMENTS = [
  'Üretim',
  'Bakım',
  'Depo',
  'Elektrik',
  'Kimyasal Depo',
  'Lojistik',
  'Kalite Kontrol',
  'Yönetim',
  'Diğer',
];

const RegisterScreen = ({navigation}: any) => {
  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [department, setDepartment] = useState('');

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !department) {
      Alert.alert('Hata', 'Alanları doldur');

      return;
    }

    setLoading(true);

    const response = await registerUser({
      name,
      email,
      password,

      role: 'worker',

      department,
    });

    setLoading(false);

    if (response.success) {
      Alert.alert('Başarılı', 'Kayıt oluşturuldu');

      navigation.goBack();
    } else {
      Alert.alert('Hata', response.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Kayıt Ol</Text>

          <CustomInput label="Ad Soyad" value={name} onChangeText={setName} />

          <CustomInput label="E-Posta" value={email} onChangeText={setEmail} />

          <CustomInput
            label="Şifre"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Departman</Text>

          <View style={styles.departmentList}>
            {DEPARTMENTS.map(item => {
              const selected = department === item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.departmentButton,
                    selected && styles.departmentButtonSelected,
                  ]}
                  onPress={() => setDepartment(item)}>
                  <Text
                    style={[
                      styles.departmentText,
                      selected && styles.departmentTextSelected,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <CustomInput
            label="Departman yoksa elle yaz"
            value={department}
            onChangeText={setDepartment}
          />

          <CustomButton
            title={loading ? 'Oluşturuluyor...' : 'Kayıt Ol'}
            onPress={handleRegister}
          />

          <Text style={styles.link} onPress={() => navigation.goBack()}>
            Giriş Yap
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },

  card: {
    backgroundColor: '#121E35',
    padding: 24,
    borderRadius: 24,
  },

  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },

  link: {
    color: '#60A5FA',
    textAlign: 'center',
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  label: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 8,
  },

  departmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  departmentButton: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#0F172A',
  },

  departmentButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },

  departmentText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
  },

  departmentTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
