// src/api/client.js

import AsyncStorage from '@react-native-async-storage/async-storage';

// For Android Emulator, use 10.0.2.2
// For Physical Device, use your machine's LAN IP (e.g., 192.168.1.X)
// For Web, localhost is fine
const BASE_URL = 'http://10.0.2.2:5001/api'; 

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
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'scan.jpg',
    });

    const response = await fetch(`${BASE_URL}/scans/upload-image`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Image upload failed');
    }
    return data; // Returns { imageUrl: ... }
  } catch (error) {
    throw error;
  }
};
