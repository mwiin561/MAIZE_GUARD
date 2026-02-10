import 'react-native-gesture-handler';
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Platform, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import ModelService from './src/services/ModelService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DiagnosisScreen from './src/screens/DiagnosisScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import AccountScreen from './src/screens/AccountScreen';
import HelpScreen from './src/screens/HelpScreen';
import HistoryScreen from './src/screens/HistoryScreen';


// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>OPTIONS</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

const MainDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        drawerActiveTintColor: '#4CAF50',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: {
          fontFamily: 'Roboto_500Medium',
          fontSize: 14,
          marginLeft: -10,
        },
        drawerItemStyle: {
          marginHorizontal: 10,
          borderRadius: 8,
        },
        drawerIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeDrawer') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Help') {
            iconName = focused ? 'help-circle' : 'help-circle-outline';
          }
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Drawer.Screen name="HomeDrawer" component={HomeScreen} options={{ title: 'Home' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Drawer.Screen name="Help" component={HelpScreen} options={{ title: 'Help & Feedback' }} />
    </Drawer.Navigator>
  );
};

const AppNav = () => {
  const { isLoading, userToken } = useContext(AuthContext);
  const [appIsReady, setAppIsReady] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Model Service (Download offline model if needed)
        ModelService.init().catch(err => console.log('ModelService init silent fail:', err));

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
    if (appIsReady && !isLoading && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, isLoading, fontsLoaded]);

  if (!appIsReady || isLoading || !fontsLoaded) {
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
              <Stack.Screen name="Main" component={MainDrawer} />
              <Stack.Screen name="Account" component={AccountScreen} />
              <Stack.Screen name="Diagnosis" component={DiagnosisScreen} />
              <Stack.Screen name="Analytics" component={AnalyticsScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />

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

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    paddingTop: 40, // Extra padding for status bar area
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 5,
  },
  drawerTitle: {
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
    color: '#888',
    letterSpacing: 1,
  },
});
