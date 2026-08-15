import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import DownloaderScreen from './src/screens/DownloaderScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  TikTok: 'musical-notes',
  Instagram: 'camera',
  YouTube: 'logo-youtube',
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: '#0f0f0f', borderTopColor: '#222' },
          tabBarActiveTintColor: '#4f46e5',
          tabBarInactiveTintColor: '#666',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="TikTok">
          {() => <DownloaderScreen platform="tiktok" label="TikTok" accentColor="#4f46e5" />}
        </Tab.Screen>
        <Tab.Screen name="Instagram">
          {() => (
            <DownloaderScreen platform="instagram" label="Instagram" accentColor="#c026d3" />
          )}
        </Tab.Screen>
        <Tab.Screen name="YouTube">
          {() => <DownloaderScreen platform="youtube" label="YouTube" accentColor="#dc2626" />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
