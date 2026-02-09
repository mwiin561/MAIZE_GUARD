import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { loginUser, registerUser } from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

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
        // We might want to fetch user profile here if backend supported it
        const info = { email }; 
        setUserInfo(info);
        
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(info));
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

  const googleLogin = async () => {
    setIsLoading(true);
    // Simulate Google Login delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock Google User Data
    const googleEmail = `google_user_${Math.floor(Math.random() * 1000)}@gmail.com`;
    const googlePassword = 'google_secure_password_placeholder'; // Internal use only

    try {
      const users = await getUsers();
      
      // If user doesn't exist, create account automatically (Exception rule)
      if (!users[googleEmail]) {
        users[googleEmail] = { password: googlePassword, isGoogle: true };
        await AsyncStorage.setItem('registeredUsers', JSON.stringify(users));
        console.log('New Google user created automatically');
      }

      // Login
      const token = 'google-auth-token-' + Date.now();
      const info = { email: googleEmail, isGoogle: true };
      
      setUserToken(token);
      setUserInfo(info);
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(info));
      
      setIsLoading(false);
      return true;

    } catch (e) {
      console.log('Google Login error', e);
      Alert.alert('Error', 'Google Sign In failed');
      setIsLoading(false);
      return false;
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
    <AuthContext.Provider value={{ login, signup, googleLogin, logout, isLoading, userToken, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
