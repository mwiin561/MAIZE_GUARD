// src/api/client.js

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

// For Android Emulator, use 10.0.2.2
// For Physical Device, use your machine's LAN IP (e.g., 192.168.1.X)
// For Web, localhost is fine
const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5001/api' 
  : 'http://10.0.2.2:5001/api'; 


export const API_URL = BASE_URL;

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Login failed');
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (name, email, password, region, farmSize) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, region, farmSize }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Registration failed');
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (token) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to fetch profile');
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to update profile');
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const saveScan = async (scanData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${BASE_URL}/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(scanData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Failed to save scan');
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const syncScans = async (scans) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${BASE_URL}/scans/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(scans),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Sync failed');
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const uploadScanImage = async (imageUri) => {
  try {
    if (Platform.OS === 'web') {
      let imageData = imageUri;

      if (imageData.startsWith('blob:')) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch(`${BASE_URL}/scans/upload-image-web`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Image upload failed');
      }
      return data;
    } else {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'scan.jpg',
      });

      const response = await fetch(`${BASE_URL}/scans/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Image upload failed');
      }
      return data;
    }
  } catch (error) {
    throw error;
  }
};
