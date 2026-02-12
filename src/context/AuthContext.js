import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
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

  // Google Auth Request Hook
  // IMPORTANT: You must replace these Client IDs with your own from Google Cloud Console
  // https://console.cloud.google.com/apis/credentials
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'PASTE_ANDROID_ID_HERE.apps.googleusercontent.com',
    iosClientId: 'PASTE_IOS_ID_HERE.apps.googleusercontent.com',
    webClientId: '747089128906-vtlv4op6bf8l8k120slqk4a2s889n93j.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleSignIn(authentication.accessToken);
    } else if (response?.type === 'error') {
        Alert.alert('Google Sign In Error', 'Authentication failed.');
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
