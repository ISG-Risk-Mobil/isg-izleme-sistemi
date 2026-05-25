import React, {
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';

import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';

import COLORS from '../../constants/colors';

export default function ForgotPasswordScreen({
  navigation,
}: any) {

  const [email, setEmail] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const handleReset =
    async () => {

      if (!email) {

        Alert.alert(
          'Hata',
          'E-posta giriniz',
        );

        return;
      }

      setLoading(true);

      setTimeout(() => {

        setLoading(false);

        Alert.alert(
          'Bilgilendirme',
          'Şifre sıfırlama sistemi henüz aktif değil.',
        );

      }, 800);

    };

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >

      <View
        style={
          styles.card
        }
      >

        <Text
          style={
            styles.title
          }
        >
          Şifremi Unuttum
        </Text>

        <Text
          style={
            styles.desc
          }
        >
          Hesabınıza ait
          e-posta adresini girin.
        </Text>

        <CustomInput
          label="E-Posta"

          value={
            email
          }

          onChangeText={
            setEmail
          }
        />

        <CustomButton
          title={
            loading
              ? 'Gönderiliyor...'
              : 'Sıfırlama Talebi'
          }

          onPress={
            handleReset
          }
        />

        <Text
          style={
            styles.back
          }

          onPress={() =>
            navigation.goBack()
          }
        >
          Girişe Dön
        </Text>

      </View>

    </SafeAreaView>
  );
}

const styles =
StyleSheet.create({

container:{
flex:1,
justifyContent:
'center',
backgroundColor:
COLORS.background,
padding:20,
},

card:{
backgroundColor:
'#121E35',
padding:24,
borderRadius:24,
},

title:{
color:'white',
fontSize:28,
fontWeight:'700',
marginBottom:10,
},

desc:{
color:'#94A3B8',
marginBottom:20,
},

back:{
color:'#60A5FA',
textAlign:'center',
marginTop:20,
},

});