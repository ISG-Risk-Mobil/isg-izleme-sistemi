import React from 'react';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/home/HomeScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AlarmScreen from '../screens/alarms/AlarmScreen';
import DevicesScreen from '../screens/devices/DevicesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AdminManagementScreen from '../screens/admin/AdminManagementScreen';
import LocationScreen from '../screens/location/LocationScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopWidth: 0,
          height: 75,
          paddingBottom: 10,
          paddingTop: 10,
        },

        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        tabBarIcon: ({color, focused}) => {
          let iconName: string = 'home';

          if (route.name === 'AnaSayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Alarmlar') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Cihazlar') {
            iconName = focused ? 'phone-portrait' : 'phone-portrait-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'YonetimPaneli') {
            iconName = focused
              ? 'shield-checkmark'
              : 'shield-checkmark-outline';
          } else if (route.name === 'Konum') {
            iconName = focused ? 'location' : 'location-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}>
      <Tab.Screen
        name="AnaSayfa"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
        }}
      />

      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Analiz',
        }}
      />

      <Tab.Screen
        name="Alarmlar"
        component={AlarmScreen}
        options={{
          tabBarLabel: 'Alarmlar',
        }}
      />

      <Tab.Screen
        name="Cihazlar"
        component={DevicesScreen}
        options={{
          tabBarLabel: 'Cihazlar',
        }}
      />

      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
        }}
      />

      <Tab.Screen
        name="YonetimPaneli"
        component={AdminManagementScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: {
            display: 'none',
          },
          tabBarStyle: {
            display: 'none',
          },
        }}
      />

      <Tab.Screen
        name="Konum"
        component={LocationScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: {
            display: 'none',
          },
          tabBarStyle: {
            display: 'none',
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;