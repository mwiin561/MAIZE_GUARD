import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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
      const isInfected = Math.random() > 0.5; // Toggle for testing, or set to true to match design always
      const confidence = (Math.random() * (0.99 - 0.85) + 0.85).toFixed(2); // High confidence for demo
      
      const diagnosisResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image: image,
        title: isInfected ? 'Gray Leaf Spot Detected' : 'Healthy Maize Plant',
        diagnosis: isInfected ? 'Gray Leaf Spot' : 'Healthy',
        confidence: confidence,
        description: isInfected 
          ? 'A common fungal disease in maize caused by Cercospora zeae-maydis. It thrives in humid conditions and can significantly impact yield if not managed.' 
          : 'Your plant appears healthy and free from common diseases. Continue with regular care and monitoring.',
        immediateActions: isInfected ? [
          'Isolate or remove heavily infected plants to stop spread.',
          'Ensure proper spacing for air circulation.'
        ] : [
          'Continue regular watering schedule.',
          'Monitor for any changes in leaf color.'
        ],
        longTermPrevention: isInfected ? [
          'Practice 2-3 year crop rotation with non-host crops like soybeans.',
          'Select resistant hybrids (GLS resistant) for the next planting season.'
        ] : [
          'Rotate crops annually to maintain soil health.',
          'Use certified disease-free seeds.'
        ],
        chemicalControl: isInfected 
          ? 'If disease exceeds 5% of leaf area before pollination, apply strobilurin or triazole fungicides. Consult local experts for regional recommendations.'
          : 'No chemical control needed at this time.'
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
              
              <TouchableOpacity style={styles.galleryButton}>
                <Ionicons name="images-outline" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
                <Text style={styles.galleryButtonText}>View Comparison Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Recommended Actions</Text>

          {/* Immediate Actions */}
          <View style={[styles.actionCard, styles.immediateCard]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="warning" size={24} color="#D32F2F" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>Immediate Actions</Text>
            </View>
            <View style={styles.cardContentRow}>
                <View style={{ flex: 1 }}>
                    {result.immediateActions.map((action, index) => (
                        <View key={index} style={styles.bulletRow}>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={styles.bulletText}>{action}</Text>
                        </View>
                    ))}
                </View>
                {/* Placeholder for small side image if needed, or omitted for simplicity */}
            </View>
          </View>



          <TouchableOpacity style={styles.saveJournalButton}>
            <Text style={styles.saveJournalText}>Save Result to Journal</Text>
          </TouchableOpacity>

          {/* Long-term Prevention */}
          <View style={[styles.actionCard, styles.preventionCard]}>
             <View style={styles.cardHeaderRow}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>Long-term Prevention</Text>
            </View>
            <View style={styles.cardContentRow}>
                 <View style={{ flex: 1 }}>
                    {result.longTermPrevention.map((action, index) => (
                        <View key={index} style={styles.bulletRow}>
                            <Text style={[styles.bulletPoint, { color: '#4CAF50' }]}>•</Text>
                            <Text style={styles.bulletText}>{action}</Text>
                        </View>
                    ))}
                 </View>
                 {/* Placeholder for side image */}
                 <View style={styles.sideImagePlaceholder}>
                     <Ionicons name="leaf" size={30} color="#81C784" />
                 </View>
            </View>
          </View>

          {/* Chemical Control */}
          <View style={[styles.actionCard, styles.chemicalCard]}>
             <View style={styles.cardHeaderRow}>
              <Ionicons name="flask" size={24} color="#A1887F" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>Chemical Control</Text>
            </View>
             <View style={styles.cardContentRow}>
                <Text style={[styles.bulletText, { flex: 1 }]}>{result.chemicalControl}</Text>
                <View style={styles.sideImagePlaceholder}>
                     <Ionicons name="water" size={30} color="#FFCC80" />
                 </View>
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

  saveJournalButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#52d017',
  },
  saveJournalText: {
    color: '#52d017',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
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
});

export default DiagnosisScreen;
