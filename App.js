import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, AuthContext } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import DiagnosisScreen from './src/screens/DiagnosisScreen';
import DiagnosisResultScreen from './src/screens/DiagnosisResultScreen';
import ManagementAdviceScreen from './src/screens/ManagementAdviceScreen';
import FarmProfileScreen from './src/screens/FarmProfileScreen';
import OfflineDatabaseScreen from './src/screens/OfflineDatabaseScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const AppNav = () => {
  const { isLoading, userToken } = useContext(AuthContext);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Artificially delay for 2 seconds as requested for the logo splash
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && !isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, isLoading]);

  if (!appIsReady || isLoading) {
    if (Platform.OS === 'web') {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      );
    }
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="Diagnosis" component={DiagnosisScreen} />
              <Stack.Screen name="DiagnosisResult" component={DiagnosisResultScreen} />
              <Stack.Screen name="ManagementAdvice" component={ManagementAdviceScreen} />
              <Stack.Screen name="FarmProfile" component={FarmProfileScreen} />
              <Stack.Screen name="OfflineDatabase" component={OfflineDatabaseScreen} />
              <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNav />
    </AuthProvider>
  );
}
