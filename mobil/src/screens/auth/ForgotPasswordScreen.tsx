import React, {useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';

import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';

import COLORS from '../../constants/colors';
import {
  forgotPassword,
  resetPassword,
} from '../../services/api/authService';

type StepType = 'email' | 'reset';

type MessageType = {
  type: 'success' | 'error';
  text: string;
} | null;

export default function ForgotPasswordScreen({navigation}: any) {
  const [step, setStep] = useState<StepType>('email');

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageType>(null);

  const isValidEmail = (value: string) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const clearResetForm = () => {
    setEmail('');
    setResetToken('');
    setNewPassword('');
    setNewPasswordAgain('');
    setMessage(null);
    setStep('email');
  };

  const handleSendResetEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setMessage({
        type: 'error',
        text: 'E-posta adresinizi girin.',
      });
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setMessage({
        type: 'error',
        text: 'Geçerli bir e-posta adresi girin.',
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await forgotPassword(trimmedEmail);

      const tokenFromBackend =
        response?.resetToken ||
        response?.token ||
        response?.data?.resetToken ||
        '';

      if (!tokenFromBackend) {
        setMessage({
          type: 'error',
          text:
            response?.message ||
            'Şifre sıfırlama tokenı alınamadı. Backend cevabını kontrol edin.',
        });
        return;
      }

      setResetToken(tokenFromBackend);
      setStep('reset');

      setMessage({
        type: 'success',
        text: 'Token alındı. Yeni şifrenizi belirleyin.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'E-posta bulunamadı veya sunucuya bağlanılamadı.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !newPasswordAgain) {
      setMessage({
        type: 'error',
        text: 'Tüm alanları doldurun.',
      });
      return;
    }

    if (newPassword !== newPasswordAgain) {
      setMessage({
        type: 'error',
        text: 'Şifreler eşleşmiyor.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Şifre en az 6 karakter olmalı.',
      });
      return;
    }

    if (!resetToken) {
      setMessage({
        type: 'error',
        text: 'Reset token bulunamadı. Lütfen e-posta adımına geri dönün.',
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await resetPassword(resetToken, newPassword);

      if (response?.success === false) {
        setMessage({
          type: 'error',
          text: response?.message || 'Şifre sıfırlanamadı.',
        });
        return;
      }

      Alert.alert(
        'Başarılı',
        response?.message || 'Şifre güncellendi. Giriş yapabilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              clearResetForm();
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'Şifre sıfırlanamadı. Lütfen tekrar deneyin.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = () => {
    if (!message) {
      return null;
    }

    return (
      <View
        style={[
          styles.messageBox,
          message.type === 'error'
            ? styles.errorMessageBox
            : styles.successMessageBox,
        ]}>
        <Text
          style={[
            styles.messageText,
            message.type === 'error'
              ? styles.errorMessageText
              : styles.successMessageText,
          ]}>
          {message.text}
        </Text>
      </View>
    );
  };

  const renderEmailStep = () => {
    return (
      <>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>@</Text>
        </View>

        <Text style={styles.title}>Şifre Sıfırla</Text>

        <Text style={styles.desc}>
          Kayıtlı e-posta adresinizi girin. Devam ettiğinizde yeni şifre
          belirleme ekranına geçeceksiniz.
        </Text>

        {renderMessage()}

        <CustomInput
          label="E-Posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <CustomButton
          title={loading ? 'Gönderiliyor...' : 'Devam Et'}
          onPress={handleSendResetEmail}
          disabled={loading}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Giriş sayfasına dön</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderResetStep = () => {
    return (
      <>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🔑</Text>
        </View>

        <Text style={styles.title}>Yeni Şifre</Text>

        <Text style={styles.desc}>
          Yeni şifrenizi belirleyin. Şifreniz en az 6 karakter olmalıdır.
        </Text>

        {renderMessage()}

        <CustomInput
          label="Yeni Şifre"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <CustomInput
          label="Yeni Şifre Tekrar"
          value={newPasswordAgain}
          onChangeText={setNewPasswordAgain}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <CustomButton
          title={loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
          onPress={handleResetPassword}
          disabled={loading}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setStep('email');
            setMessage(null);
            setNewPassword('');
            setNewPasswordAgain('');
          }}>
          <Text style={styles.back}>Geri</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          {step === 'email' ? renderEmailStep() : renderResetStep()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: '#121E35',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  iconText: {
    color: '#EAB308',
    fontSize: 28,
    fontWeight: '800',
  },

  title: {
    color: '#F1F5F9',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },

  desc: {
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },

  messageBox: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },

  errorMessageBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },

  successMessageBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },

  messageText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  errorMessageText: {
    color: '#FCA5A5',
  },

  successMessageText: {
    color: '#86EFAC',
  },

  back: {
    color: '#EAB308',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '700',
  },
});