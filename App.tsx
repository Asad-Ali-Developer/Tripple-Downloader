import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import DownloaderScreen from "./src/screens/DownloaderScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  TikTok: "musical-notes",
  Instagram: "camera",
  YouTube: "logo-youtube",
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0a0a0f",
            borderTopColor: "#1c1c22",
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#55555e",
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="TikTok">
          {() => (
            <DownloaderScreen
              platform="tiktok"
              label="TikTok"
              accentColor="#6d5ef5"
              accentColorDark="#4338ca"
              icon="musical-notes"
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Instagram">
          {() => (
            <DownloaderScreen
              platform="instagram"
              label="Instagram"
              accentColor="#e0409a"
              accentColorDark="#9333ea"
              icon="camera"
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="YouTube">
          {() => (
            <DownloaderScreen
              platform="youtube"
              label="YouTube"
              accentColor="#f4463f"
              accentColorDark="#b91c1c"
              icon="logo-youtube"
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
