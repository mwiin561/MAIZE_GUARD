import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Helper to get all users
  const getUsers = async () => {
    try {
      const users = await AsyncStorage.getItem('registeredUsers');
      return users ? JSON.parse(users) : {};
    } catch (e) {
      console.log('Error getting users', e);
      return {};
    }
  };

  const signup = async (email, password) => {
    setIsLoading(true);
    try {
      const users = await getUsers();
      if (users[email]) {
        Alert.alert('Error', 'User already exists. Please login.');
        setIsLoading(false);
        return false;
      }

      // Create new user
      users[email] = { password };
      await AsyncStorage.setItem('registeredUsers', JSON.stringify(users));
      
      // Auto login after signup
      await login(email, password);
      return true;
    } catch (e) {
      console.log('Signup error', e);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const users = await getUsers();
      
      if (users[email] && users[email].password === password) {
        const token = 'dummy-auth-token-' + Date.now();
        const info = { email };
        
        setUserToken(token);
        setUserInfo(info);
        
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(info));
        setIsLoading(false);
        return true;
      } else {
        Alert.alert('Error', 'Invalid email or password. Please check your credentials or sign up.');
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      console.log('Login error', e);
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
