import React, {
  useState,
} from 'react';

import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Alert,
} from 'react-native';

import COLORS from '../../constants/colors';

import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';

import {
  registerUser,
} from '../../services/api/authService';

const RegisterScreen = ({
  navigation,
}: any) => {

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [department, setDepartment] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const handleRegister =
    async () => {

      if (
        !name ||
        !email ||
        !password
      ) {
        Alert.alert(
          'Hata',
          'Alanları doldur',
        );

        return;
      }

      setLoading(true);

      const response =
        await registerUser(
          {
            name,
            email,
            password,

            role:
              'worker',

            department,
          },
        );

      setLoading(false);

      if (
        response.success
      ) {

        Alert.alert(
          'Başarılı',
          'Kayıt oluşturuldu',
        );

        navigation.goBack();

      } else {

        Alert.alert(
          'Hata',
          response.message,
        );

      }

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
          Kayıt Ol
        </Text>

        <CustomInput
          label="Ad Soyad"
          value={name}
          onChangeText={
            setName
          }
        />

        <CustomInput
          label="E-Posta"
          value={email}
          onChangeText={
            setEmail
          }
        />

        <CustomInput
          label="Şifre"
          secureTextEntry
          value={
            password
          }
          onChangeText={
            setPassword
          }
        />

        <CustomInput
          label="Departman"
          value={
            department
          }
          onChangeText={
            setDepartment
          }
        />

        <CustomButton
          title={
            loading
              ? 'Oluşturuluyor...'
              : 'Kayıt Ol'
          }

          onPress={
            handleRegister
          }
        />

        <Text
          style={
            styles.link
          }

          onPress={() =>
            navigation.goBack()
          }
        >
          Giriş Yap
        </Text>

      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles =
StyleSheet.create({

container:{
flex:1,
backgroundColor:
COLORS.background,
justifyContent:
'center',
padding:20,
},

card:{
backgroundColor:
'#121E35',
padding:24,
borderRadius:24,
},

title:{
color:
COLORS.white,
fontSize:28,
fontWeight:'700',
marginBottom:20,
},

link:{
color:'#60A5FA',
textAlign:'center',
marginTop:20,
},

});