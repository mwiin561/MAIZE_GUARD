import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DiagnosisScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
            <Text style={styles.permText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setImage(photo.uri);
      } catch (e) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async () => {
    setAnalyzing(true);
    // Mock AI Analysis
    setTimeout(async () => {
      const isInfected = Math.random() > 0.5;
      const confidence = (Math.random() * (0.99 - 0.70) + 0.70).toFixed(2);
      
      const diagnosisResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image: image,
        diagnosis: isInfected ? 'Maize Streak Virus Detected' : 'Healthy Maize Leaf',
        confidence: confidence,
        details: isInfected 
          ? 'Visible streaks and discoloration consistent with Maize Streak Virus.' 
          : 'No visible signs of infection. Plant appears healthy.'
      };

      setResult(diagnosisResult);
      setAnalyzing(false);
      
      // Save to history
      await saveToHistory(diagnosisResult);
    }, 2000);
  };

  const saveToHistory = async (newDiagnosis) => {
    try {
      const existingHistory = await AsyncStorage.getItem('diagnosisHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(newDiagnosis);
      await AsyncStorage.setItem('diagnosisHistory', JSON.stringify(history));
    } catch (e) {
      console.log('Error saving history', e);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultScroll}>
            <Image source={{ uri: image }} style={styles.resultImage} />
            <View style={styles.resultCard}>
                <Text style={[styles.resultTitle, { color: result.diagnosis.includes('Virus') ? '#d32f2f' : '#388e3c' }]}>
                    {result.diagnosis}
                </Text>
                <Text style={styles.confidence}>Confidence: {(result.confidence * 100).toFixed(0)}%</Text>
                <Text style={styles.details}>{result.details}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.buttonText}>Back to Dashboard</Text>
            </TouchableOpacity>
             <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={reset}>
                <Text style={[styles.buttonText, styles.secondaryText]}>New Diagnosis</Text>
            </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          <View style={styles.actionButtons}>
             {analyzing ? (
                 <ActivityIndicator size="large" color="#4CAF50" />
             ) : (
                 <>
                    <TouchableOpacity style={styles.button} onPress={analyzeImage}>
                        <Text style={styles.buttonText}>Analyze Leaf</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setImage(null)}>
                        <Text style={[styles.buttonText, styles.secondaryText]}>Retake</Text>
                    </TouchableOpacity>
                 </>
             )}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
            <CameraView style={styles.camera} ref={cameraRef} facing="back">
                <View style={styles.cameraControls}>
                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                </View>
            </CameraView>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                <Text style={styles.galleryText}>Upload from Gallery</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  permButton: {
      backgroundColor: '#1a73e8',
      padding: 12,
      margin: 20,
      borderRadius: 8,
  },
  permText: {
      color: '#fff',
      textAlign: 'center',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  galleryButton: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  galleryText: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 8,
      borderRadius: 20,
  },
  closeText: {
      color: '#fff',
      fontSize: 14,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  preview: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
  },
  actionButtons: {
    width: '100%',
  },
  button: {
    backgroundColor: '#1a73e8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  secondaryText: {
    color: '#1a73e8',
  },
  resultScroll: {
      padding: 20,
      alignItems: 'center',
  },
  resultImage: {
      width: 200,
      height: 200,
      borderRadius: 12,
      marginBottom: 20,
  },
  resultCard: {
      backgroundColor: '#f8f9fa',
      padding: 20,
      borderRadius: 12,
      width: '100%',
      marginBottom: 30,
      borderWidth: 1,
      borderColor: '#e8eaed',
  },
  resultTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
  },
  confidence: {
      fontSize: 16,
      color: '#5f6368',
      marginBottom: 16,
      textAlign: 'center',
  },
  details: {
      fontSize: 16,
      color: '#202124',
      lineHeight: 24,
  },
});

export default DiagnosisScreen;
