import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/** Expo Go — Google OAuth always uses an exp:// redirect, which Google rejects (Error 400: invalid_request). */
function isExpoGo() {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo'
  );
}
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { loginUser, registerUser, getUserProfile, updateUserProfile } from '../api/client';

// Required for Web support
WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Web client = only for OAuth in the browser (https/http redirect URIs in Cloud Console).
  // Android client = package name + SHA-1; no custom redirect URIs in Console — required for native app OAuth (not Expo Go).
  const webClientId = '955909588454-hbs154hg6r4iqoiog8cdj23a2pd5ra40.apps.googleusercontent.com';
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    '955909588454-kemhmvdqqhp2qipok6e53guahu5j0jnl.apps.googleusercontent.com';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: iosClientId || webClientId,
    androidClientId,
    webClientId,
  });

  useEffect(() => {
    if (!__DEV__) return;
    if (isExpoGo()) {
      console.warn(
        '[Google OAuth] You are in Expo Go — Google Sign-In will fail (exp://). Use a dev build: npx expo run:android. Clear Metro cache: npx expo start -c'
      );
    }
    if (request?.redirectUri) {
      console.log(
        '[Google OAuth] Redirect URI used in the auth request (Android client — do NOT add this to the Web client):',
        request.redirectUri
      );
      console.log(
        '[Google OAuth] In Google Cloud → Android OAuth client "Maize Guard Android": package com.maizeguard.app + your app signing SHA-1 (EAS: eas credentials / Play Console).'
      );
    }
  }, [request?.redirectUri]);

  useEffect(() => {
    if (!response) return;
    console.log('Auth response:', response);
    const err = response?.params?.error;
    const errDesc = response?.params?.error_description;
    if (err) {
      console.warn('Google OAuth error params:', err, errDesc);
      Alert.alert(
        'Google Sign In',
        errDesc || err || 'Authorization failed. If you use Expo Go, Google Sign-In is not supported — use a development build (see docs/GOOGLE_OAUTH_SETUP.md).'
      );
      setIsLoading(false);
      return;
    }
    if (response?.type === 'success') {
      const { authentication } = response;
      if (!authentication?.accessToken) {
        Alert.alert('Google Sign In', 'No access token returned.');
        setIsLoading(false);
        return;
      }
      handleGoogleSignIn(authentication.accessToken);
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign In Error', 'Authentication failed.');
      setIsLoading(false);
    } else if (response?.type === 'dismiss') {
      // Often after Error 400 in the browser, or user closed the sheet.
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (accessToken) => {
    setIsLoading(true);
    try {
        // 1. Fetch User Info from Google
        const userRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const googleUser = await userRes.json();
        
        const googleEmail = googleUser.email;
        const googleName = googleUser.name;
        // Use Google ID as part of password for consistency
        const googlePassword = `google_oauth_${googleUser.id}`; 

        // 2. Try to Login first
        let data;
        try {
            data = await loginUser(googleEmail, googlePassword);
        } catch (loginErr) {
            // 3. If login fails (user doesn't exist), Register automatically
            console.log('Google user not found, registering...', loginErr);
            try {
                data = await registerUser(googleName, googleEmail, googlePassword, 'Unknown', 'Unknown');
            } catch (regErr) {
                throw new Error('Could not create account with Google. Please try standard Sign Up.');
            }
        }
        
        if (data && data.token) {
            setUserToken(data.token);
            
            // Fetch User Profile
            try {
                const userProfile = await getUserProfile(data.token);
                setUserInfo(userProfile);
                await AsyncStorage.setItem('userInfo', JSON.stringify(userProfile));
            } catch (profileErr) {
                const info = { name: googleName, email: googleEmail }; 
                setUserInfo(info);
                await AsyncStorage.setItem('userInfo', JSON.stringify(info));
            }
            
            await AsyncStorage.setItem('userToken', data.token);
            return true;
        }

    } catch (e) {
        console.log('Google Auth Error', e);
        Alert.alert('Google Sign In Failed', e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const signup = async (name, email, password, region, farmSize) => {
    setIsLoading(true);
    try {
      const data = await registerUser(name, email, password, region, farmSize);
      
      // Auto login after signup (Backend returns token on register usually, but if not we login)
      // Our backend returns { token } on register
      if (data.token) {
        setUserToken(data.token);
        const info = { name, email, region, farmSize };
        setUserInfo(info);
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(info));
      }
      
      setIsLoading(false);
      return true;
    } catch (e) {
      console.log('Signup error', e);
      Alert.alert('Signup Failed', e.message);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await loginUser(email, password);
      
      if (data.token) {
        setUserToken(data.token);
        
        // Fetch User Profile
        try {
            const userProfile = await getUserProfile(data.token);
            setUserInfo(userProfile);
            await AsyncStorage.setItem('userInfo', JSON.stringify(userProfile));
        } catch (profileErr) {
            console.log('Profile fetch failed, using basic info', profileErr);
            const info = { email }; 
            setUserInfo(info);
            await AsyncStorage.setItem('userInfo', JSON.stringify(info));
        }
        
        await AsyncStorage.setItem('userToken', data.token);
        setIsLoading(false);
        return true;
      }
    } catch (e) {
      console.log('Login error', e);
      Alert.alert('Login Failed', e.message);
      setIsLoading(false);
      return false;
    }
  };

  const updateProfile = async (profileData) => {
    try {
        const updatedUser = await updateUserProfile(profileData);
        setUserInfo(updatedUser);
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
        return true;
    } catch (e) {
        console.log('Update profile error', e);
        throw e;
    }
  };

  const googleLogin = () => {
    if (isExpoGo()) {
      Alert.alert(
        'Google Sign-In won’t work in Expo Go',
        'Google returns Error 400 (invalid_request) because Expo Go uses an exp:// redirect, which this OAuth setup cannot use.\n\nUse a development build instead:\n• npx expo run:android\n• or eas build --profile development\n\nThen install that APK and connect to Metro (not the Expo Go app).\n\nIf you already updated code, restart with: npx expo start -c'
      );
      return;
    }
    if (request) {
      promptAsync();
    } else {
      Alert.alert('Not Ready', 'Google Sign In is initializing. Please try again in a moment.');
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUserInfo(null);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    } catch (e) {
      console.log('Logout error', e);
    }
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userToken = await AsyncStorage.getItem('userToken');
      let userInfo = await AsyncStorage.getItem('userInfo');
      
      if (userToken) {
        setUserToken(userToken);
        if (userInfo) setUserInfo(JSON.parse(userInfo));
      }
    } catch (e) {
      console.log(`isLoggedIn error ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, signup, googleLogin, logout, isLoading, userToken, userInfo, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
