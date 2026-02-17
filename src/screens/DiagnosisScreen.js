import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { uploadScanImage, saveScan } from '../api/client';
import ModelService from '../services/ModelService';
import { AuthContext } from '../context/AuthContext';

const DiagnosisScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState(null); // URL from backend
  const [location, setLocation] = useState(null);
  const cameraRef = useRef(null);
  const { userInfo } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        console.log('Error fetching location:', error);
        // Fallback or just ignore, so it doesn't crash
      }
    })();
  }, []);

  

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

  const processImage = async (uri) => {
    try {
      // Low-End Device Optimization: Resize to 1024px width, Compress to 70%
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], 
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.log('Image processing failed:', error);
      return uri; // Fallback to original if optimization fails
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
            quality: 1,
            skipProcessing: true, // Speed up capture
        });
        
        const optimizedUri = await processImage(photo.uri);
        setImage(optimizedUri);
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
      const asset = result.assets[0];
      const optimizedUri = await processImage(asset.uri);
      setImage(optimizedUri);
    }
  };

  const analyzeImage = async () => {
    setAnalyzing(true);
    
    // Upload Image in background (Offline First approach: We save local first, then try upload)
    let remoteImageUrl = null;
    try {
      // Note: In a real app, we'd use NetInfo to check connectivity first
      console.log('Attempting to upload image...');
      const uploadResult = await uploadScanImage(image);
      remoteImageUrl = uploadResult.imageUrl;
      console.log('Image uploaded:', remoteImageUrl);
    } catch (e) {
      console.log('Offline or Upload failed, saving locally only for now:', e);
    }

    // Mock AI Analysis (Fallback if ModelService returns null)
    const runMockAnalysis = async () => {
       return new Promise((resolve) => {
         setTimeout(() => {
            const isInfected = Math.random() > 0.4; // 60% chance of infection for demo
            const confidence = (Math.random() * (0.99 - 0.85) + 0.85).toFixed(2);
            resolve({ isInfected, confidence });
         }, 2000);
       });
    };

    try {
      // 1. Try Local Offline Model
      let analysisResult = await ModelService.predict(image);
      
      // 2. Fallback to Mock if Model not ready
      if (!analysisResult) {
         analysisResult = await runMockAnalysis();
      }

      const { isInfected, confidence } = analysisResult;
      
      const diagnosisResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image: image,
        remoteImage: remoteImageUrl, // Save the remote URL if available
        title: isInfected ? 'Maize Streak Virus Detected' : 'Healthy Maize Plant',
        diagnosis: isInfected ? 'Maize Streak Virus' : 'Healthy',
        confidence: confidence,
        description: isInfected 
          ? 'A viral disease transmitted by leafhoppers (Cicadulina mbila). Characterized by yellow streaks running parallel to leaf veins, stunted growth, and potential yield loss.' 
          : 'Your plant appears healthy and free from Maize Streak Virus. Continue with regular care and monitoring.',
        immediateActions: isInfected ? [
          'Remove and destroy infected plants immediately to prevent spread.',
          'Control leafhopper populations using recommended insecticides.',
          'Clear grass weeds around the field which may host the virus.'
        ] : [
          'Continue regular watering schedule.',
          'Monitor for presence of leafhoppers.',
          'Keep field weed-free.'
        ],
        longTermPrevention: isInfected ? [
          'Plant MSV-resistant maize varieties.',
          'Plant early to avoid peak leafhopper populations.',
          'Practice crop rotation.'
        ] : [
          'Use certified disease-free seeds.',
          'Maintain field hygiene.'
        ],
        chemicalControl: isInfected 
          ? 'Use seed dressings (e.g., Imidacloprid) before planting to protect seedlings. Foliar sprays may be needed if vector population is high.'
          : 'No chemical control needed at this time.'
      };

      setResult(diagnosisResult);
      let historyItem = {
        ...diagnosisResult,
        userVerified: true,
        synced: false,
        leafhopperObserved: 'Not Sure',
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : null,
        userEmail: userInfo && userInfo.email ? userInfo.email : null
      };
      if (remoteImageUrl) {
        try {
          const scanData = {
            localId: diagnosisResult.id,
            imageMetadata: {
              resolution: 'Unknown', 
              orientation: 'Portrait'
            },
            location: location ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            } : null,
            environment: {
              leafhopperObserved: 'Not Sure'
            },
            diagnosis: {
              modelPrediction: diagnosisResult.diagnosis, 
              confidence: parseFloat(diagnosisResult.confidence),
              userVerified: true,
              finalDiagnosis: diagnosisResult.diagnosis
            },
            imageUrl: remoteImageUrl
          };
          await saveScan(scanData);
          historyItem.synced = true;
        } catch (e) {
        }
      }
      await saveToHistory(historyItem);
      setAnalyzing(false);

    } catch (e) {
      console.error('Analysis failed:', e);
      setAnalyzing(false);
      Alert.alert('Error', 'Analysis failed. Please try again.');
    }
  };

  const handleVerification = async (isCorrect, correctedLabel = null) => {
    try {
      if (!result) return;

      const finalDiagnosis = isCorrect ? result.diagnosis : correctedLabel;
      
      // Create full scan record for backend
      const scanData = {
        localId: result.id,
        imageMetadata: {
          resolution: 'Unknown', 
          orientation: 'Portrait'
        },
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : null,
        environment: {
            leafhopperObserved: leafhopperObserved
        },
        diagnosis: {
          modelPrediction: result.diagnosis,
          confidence: parseFloat(result.confidence),
          userVerified: true,
          finalDiagnosis: finalDiagnosis
        },
        imageUrl: remoteImageUrl // might be null if offline
      };

      // 1. Save Locally (History)
      const historyItem = {
        ...result,
        diagnosis: finalDiagnosis,
        userVerified: true,
        location: location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        } : null,
        leafhopperObserved: leafhopperObserved,
        synced: false // Default to false
      };

      // 2. Try to Sync with Backend (if online)
      if (remoteImageUrl) {
         try {
            await saveScan(scanData);
            historyItem.synced = true; // Mark as synced if successful
            Alert.alert('Thank You', 'Your feedback helps improve Maize Guard!');
         } catch (err) {
            console.log('Online save failed, saved locally:', err);
         }
      } else {
         Alert.alert('Saved', 'Result saved to history (Offline Mode)');
      }

      await saveToHistory(historyItem);
      
      setShowCorrectionModal(false);
    } catch (e) {
      console.log('Verification save failed:', e);
      Alert.alert('Error', 'Failed to save feedback.');
    }
  };

  const saveToHistory = async (newDiagnosis) => {
    try {
      // Fix for Web: Convert Blob URL to Base64 for persistence
      // Blob URLs are revoked on page reload, so we must store the actual image data
      if (Platform.OS === 'web' && newDiagnosis.image && newDiagnosis.image.startsWith('blob:')) {
          try {
              console.log('Converting Blob to Base64 for storage...');
              const response = await fetch(newDiagnosis.image);
              const blob = await response.blob();
              const base64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
              });
              newDiagnosis.image = base64;
              console.log('Conversion successful');
          } catch (err) {
              console.log('Failed to convert blob to base64', err);
          }
      }

      const existingHistory = await AsyncStorage.getItem('diagnosisHistory');
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Upsert by id to avoid duplicates when verification updates the pending draft
      const idx = history.findIndex(h => h.id === newDiagnosis.id);
      if (idx !== -1) {
        history[idx] = { ...history[idx], ...newDiagnosis };
      } else {
        history.unshift(newDiagnosis);
      }
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Management Advice</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-social-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.resultScroll}>
          {/* Main Card */}
          <View style={styles.mainCard}>
            <Image source={{ uri: result.image }} style={styles.mainImage} />
            <View style={styles.mainCardContent}>
              <View style={styles.diagnosisRow}>
                <Text style={styles.diagnosisLabel}>DIAGNOSIS RESULTS</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{(result.confidence * 100).toFixed(0)}% Confidence</Text>
                </View>
              </View>
              <Text style={styles.diseaseTitle}>{result.title}</Text>
              <Text style={styles.description}>{result.description}</Text>
              
            </View>
          </View>

          

          {/* New Diagnosis Button at bottom */}
          <TouchableOpacity style={[styles.button, styles.secondaryButton, { marginTop: 20 }]} onPress={reset}>
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
    backgroundColor: '#F5F5F5', // Light grey background for whole screen
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
  },
  headerButton: {
    padding: 4,
  },
  resultScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  mainCardContent: {
    padding: 16,
  },
  diagnosisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisLabel: {
    color: '#4CAF50',
    fontFamily: 'Roboto_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
  },
  diseaseTitle: {
    fontSize: 22,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
    fontFamily: 'Roboto_400Regular',
    marginBottom: 16,
  },
  galleryButton: {
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  galleryButtonText: {
    color: '#4CAF50',
    fontFamily: 'Roboto_700Bold',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
    marginBottom: 16,
  },
  actionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  immediateCard: {
    backgroundColor: '#FFFDE7', // Light yellow
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  preventionCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  chemicalCard: {
    backgroundColor: '#FFF3E0', // Light orange
    borderLeftWidth: 4,
    borderLeftColor: '#8D6E63',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 8,
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: 8,
    color: '#F9A825', // Darker yellow for bullets
  },
  bulletText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Roboto_400Regular',
    lineHeight: 20,
    flexShrink: 1,
  },
  sideImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  
  // Camera & Preview Styles (Preserved)
  permButton: {
      backgroundColor: '#1a73e8',
      padding: 12,
      margin: 20,
      borderRadius: 8,
  },
  permText: {
      color: '#fff',
      textAlign: 'center',
      fontFamily: 'Roboto_400Regular',
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
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
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
      fontFamily: 'Roboto_400Regular',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
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
    fontFamily: 'Roboto_500Medium',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  secondaryText: {
    color: '#1a73e8',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  diseaseOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  diseaseText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  galleryButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default DiagnosisScreen;
