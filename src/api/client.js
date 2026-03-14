// src/api/client.js

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

// On the phone, localhost is the phone itself — use your PC's LAN IP so the device can reach the backend.
// Replace with your PC's IP if different (see Metro "Network" URL, e.g. 192.168.x.x).
const DEV_BACKEND_HOST = process.env.EXPO_PUBLIC_BACKEND_HOST || '192.168.110.211';
const PRODUCTION_URL = 'https://maizeguard-backend-1.onrender.com/api';

const BASE_URL = PRODUCTION_URL;

export const API_URL = BASE_URL;

function handleAuthError(response, data) {
  return response.status === 401 && (data && (data.msg === 'Token is not valid' || data.msg === 'No token, authorization denied'));
}

export const loginUser = async (email, password) => {
  try {
    console.log('Attempting login to:', `${BASE_URL}/auth/login`);
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Login failed');
      }
      return data;
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 50)}`);
    }
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

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Registration failed');
      }
      return data;
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 50)}`);
    }
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
      if (handleAuthError(response, data)) {
        await AsyncStorage.removeItem('userToken');
        throw new Error('Your session has expired. Please log out and log in again.');
      }
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
      if (handleAuthError(response, data)) {
        await AsyncStorage.removeItem('userToken');
        throw new Error('Your session has expired. Please log out and log in again.');
      }
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

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (response.status === 413) {
        throw new Error('Request too large. Try exporting fewer items at a time.');
      }
      throw new Error('Server error. Please try again.');
    }
    if (!response.ok) {
      if (handleAuthError(response, data)) {
        await AsyncStorage.removeItem('userToken');
        throw new Error('Your session has expired. Please log out and log in again, then try exporting.');
      }
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

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      let data;
      try {
        data = text && contentType.includes('application/json') ? JSON.parse(text) : {};
      } catch {
        if (response.status === 413) {
          throw new Error('Image too large. Skipping image for this item.');
        }
        throw new Error('Upload failed. Try a smaller image.');
      }
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Image too large. Skipping image for this item.');
        }
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
