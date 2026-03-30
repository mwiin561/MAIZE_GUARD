import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, Platform, InteractionManager, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { uploadScanImage, saveScan, API_URL } from '../api/client';
import ModelService from '../services/ModelService';
import { AuthContext } from '../context/AuthContext';
import RemoteLogger from '../services/RemoteLogger';

/** If Unknown softmax is high, the model is confident it is not Healthy/MSV — label clearly, not "Uncertain". */
const UNKNOWN_HIGH_CONFIDENCE = 0.7;
/** MSV argmax but weak evidence — tell user to rescan. */
const MSV_SOFTMAX_WEAK = 0.65;
const MSV_MARGIN_MIN = 0.15;
const RETRY_WINDOW_MS = 5 * 60 * 1000;
const RETRY_DIAGNOSES = new Set([
  'Invalid Image',
  'Not a Maize Leaf',
  'Uncertain Scan',
  'Service Error',
]);

/**
 * @param {number[]|undefined} scores [Healthy, MSV, Unknown]
 * @param {string} serverDiagnosis
 */
function presentationForUncertainPath(scores, serverDiagnosis) {
  if (serverDiagnosis !== 'Uncertain Scan' || !Array.isArray(scores) || scores.length !== 3) {
    return null;
  }
  const pUnknown = Number(scores[2]);
  if (!Number.isFinite(pUnknown)) return null;
  if (pUnknown >= UNKNOWN_HIGH_CONFIDENCE) {
    return {
      title: 'Not a Maize Leaf',
      description:
        'Sorry, this image is not identified as a maize leaf.\n\nPlease reupload an image of a maize leaf and try again.\n\nTips:\n- Use a clear, single leaf (fill most of the frame)\n- Use soft, even lighting (avoid glare and deep shadows)\n- Keep the camera angle steady and close\n- Use a simple background so the leaf stands out',
    };
  }
  return {
    title: 'Uncertain Scan',
    description:
      'We could not clearly identify this leaf from the photo.\n\nPlease take a clearer picture and try again.\n\nTips:\n- Fill the frame with one leaf\n- Use even lighting (avoid harsh sun or deep shadows)\n- Keep the leaf in focus and reduce glare',
  };
}

/**
 * Debug/technical copy for the long-press modal.
 * This intentionally contains the original "model is confident..." explanations.
 */
function presentationForUncertainPathDebug(scores, serverDiagnosis) {
  if (serverDiagnosis !== 'Uncertain Scan' || !Array.isArray(scores) || scores.length !== 3) {
    return null;
  }
  const pUnknown = Number(scores[2]);
  if (!Number.isFinite(pUnknown)) return null;
  if (pUnknown >= UNKNOWN_HIGH_CONFIDENCE) {
    return {
      title: 'Not a Maize Leaf',
      description:
        'The model is confident this image does not match a typical maize-leaf scan (wrong crop, strong glare, other species, or unusual lighting). For maize, use a single leaf filling the frame with soft, even light.',
    };
  }
  return {
    title: 'Uncertain Scan',
    description:
      'Healthy, MSV, and Unknown could not be separated clearly for this image. Move closer, fill the frame with one leaf, and avoid harsh sunlight or deep shadow.',
  };
}

function msvWeakEvidenceNote(scores) {
  if (!Array.isArray(scores) || scores.length !== 3) return null;
  const pH = Number(scores[0]);
  const pM = Number(scores[1]);
  const pU = Number(scores[2]);
  if (![pH, pM, pU].every((x) => Number.isFinite(x))) return null;
  const second = Math.max(pH, pU);
  const margin = pM - second;
  if (pM < MSV_SOFTMAX_WEAK || margin < MSV_MARGIN_MIN) {
    return `Model evidence for MSV is moderate (${Math.round(pM * 100)}% vs other classes). If the leaf looks healthy, rescan with even lighting and the leaf filling the frame.`;
  }
  return null;
}

function imageMetaFromDimensions(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { resolution: 'Unknown', orientation: 'Portrait' };
  }
  const orientation = h >= w ? 'Portrait' : 'Landscape';
  return { resolution: `${Math.round(w)}x${Math.round(h)}`, orientation };
}

function getDeviceInfo() {
  const constants = Platform.constants || {};
  const model =
    constants.Model ||
    constants.model ||
    constants.Device ||
    constants.deviceName ||
    'Unknown';
  const osVersion =
    Platform.Version != null
      ? `${Platform.OS} ${Platform.Version}`
      : Platform.OS || 'Unknown';
  return {
    deviceModel: String(model),
    osVersion: String(osVersion),
  };
}

async function computeRetryCountFromHistory() {
  try {
    const raw = await AsyncStorage.getItem('diagnosisHistory');
    if (!raw) return 0;
    const history = JSON.parse(raw);
    if (!Array.isArray(history) || history.length === 0) return 0;
    const now = Date.now();
    const recent = history.find((item) => {
      const t = Date.parse(item?.date || '');
      return Number.isFinite(t) && now - t <= RETRY_WINDOW_MS;
    });
    if (!recent) return 0;
    if (RETRY_DIAGNOSES.has(String(recent.diagnosis || ''))) {
      return (Number(recent.retries) || 0) + 1;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

function severityFromDiagnosis(label, fallbackStage = 'Unknown') {
  const value = String(label || '').toLowerCase();
  if (value.includes('healthy')) return 'Healthy';
  if (value.includes('maize streak') || value === 'msv') return fallbackStage || 'Unknown';
  if (value.includes('not a maize')) return 'Not a Maize Leaf';
  return fallbackStage || 'Unknown';
}

const DiagnosisScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [retakeCount, setRetakeCount] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState(null); // URL from backend
  const [location, setLocation] = useState(null);
  const cameraRef = useRef(null);
  const { userInfo } = useContext(AuthContext);
  const [showDebugModal, setShowDebugModal] = useState(false);

  const { width: winW, height: winH } = Dimensions.get('window');
  const cameraGuideSize = Math.max(280, Math.min(Math.round(Math.min(winW, winH) * 0.78), 380));

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
        // skipProcessing:true often breaks on Android (missing width/height or OEM bugs). Prefer processed JPEG.
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.92,
          skipProcessing: false,
        });

        RemoteLogger.log('--- PHOTO CAPTURED ---');
        RemoteLogger.log(`Original URI: ${photo.uri}`);
        RemoteLogger.log(`Original Resolution: ${photo.width}x${photo.height}`);

        const width = photo.width || 1024;
        const height = photo.height || 1024;
        const rawW = photo.width;
        const rawH = photo.height;
        setImageMeta(
          rawW && rawH ? imageMetaFromDimensions(rawW, rawH) : { resolution: 'Unknown', orientation: 'Portrait' }
        );
        const size = Math.min(width, height);
        const originX = (width - size) / 2;
        const originY = (height - size) / 2;

        RemoteLogger.log(`Cropping Square: ${size}x${size} at (${originX}, ${originY})`);

        const manipResult = await manipulateAsync(
          photo.uri,
          [
            { crop: { originX, originY, width: size, height: size } },
            { resize: { width: 1024, height: 1024 } },
          ],
          { compress: 0.8, format: SaveFormat.JPEG }
        );

        RemoteLogger.log(`Final Optimized URI: ${manipResult.uri}`);
        RemoteLogger.log(`Final Resolution: ${manipResult.width}x${manipResult.height}`);
        setImage(manipResult.uri);
      } catch (e) {
        RemoteLogger.error(`Capture error: ${e.message}`);
        Alert.alert(
          'Camera error',
          e?.message
            ? `${e.message}\n\nTip: try "Upload from Gallery" if the camera keeps failing.`
            : 'Could not capture the photo. Try again or use Upload from Gallery.'
        );
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImageMeta(
        asset?.width && asset?.height
          ? imageMetaFromDimensions(asset.width, asset.height)
          : { resolution: 'Unknown', orientation: 'Portrait' }
      );
      const optimizedUri = await processImage(asset.uri);
      setImage(optimizedUri);
    }
  };

  const analyzeImage = async () => {
    setAnalyzing(true);
    const startedAtMs = Date.now();

    let serverAiResult = null;

    // 1. On-device / offline AI first (no network required)
    let analysisResult = null;
    try {
      RemoteLogger.log('Running on-device (offline) analysis...');
      analysisResult = await ModelService.predict(image);
      if (analysisResult) {
        RemoteLogger.log(`Local analysis result: ${analysisResult.source} ${analysisResult.diagnosis}`);
      }
    } catch (e) {
      RemoteLogger.warn(`On-device analysis error: ${e?.message || e}`);
    }

    // 2. Upload in parallel with inference above; we await it after predict so we always get imageUrl for history/Neon
    const startBackgroundUpload = async () => {
      try {
        console.log('Uploading scan in background...');
        const uploadResult = await uploadScanImage(image);
        setRemoteImageUrl(uploadResult.imageUrl);
        return { imageUrl: uploadResult.imageUrl, aiResult: uploadResult.aiResult };
      } catch (e) {
        console.log('Background upload skipped:', e?.message || e);
        return { imageUrl: null, aiResult: null };
      }
    };

    const backgroundUploadPromise = startBackgroundUpload();

    try {
      let uploadData = { imageUrl: null, aiResult: null };
      try {
        uploadData = await backgroundUploadPromise;
      } catch (e) {
        RemoteLogger.warn(`Upload failed: ${e?.message || e}`);
      }

      if (!analysisResult && uploadData.aiResult) {
        RemoteLogger.log('Using Server AI Result as primary diagnosis.');
        serverAiResult = uploadData.aiResult;
        analysisResult = uploadData.aiResult;
      }

      const remoteImageUrl = uploadData.imageUrl;
      const safeImageMeta = imageMeta || { resolution: 'Unknown', orientation: 'Portrait' };
      const heuristicRetries = await computeRetryCountFromHistory();
      const retries = retakeCount > 0 ? retakeCount : heuristicRetries;
      const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startedAtMs) / 1000));
      const deviceInfo = getDeviceInfo();

      if (!analysisResult) {
        RemoteLogger.error('CRITICAL: AI Model Failure. No result from local ONNX or Remote Server.');
        setAnalyzing(false);
        const releaseHelp =
          'The on-device AI model did not produce a result, and the cloud scan did not return one either.\n\n' +
          'That can happen with no or unstable internet, or if the server is busy — even when the phone shows a signal.\n\n' +
          '• Try again on Wi‑Fi or with mobile data.\n' +
          '• If this keeps happening, the built-in model may not have loaded (check for an ONNX error in logs); try force-closing the app or reinstalling the APK.';
        const devHelp =
          'Local ONNX did not return a result, and the upload/dev backend did not return AI either.\n\n' +
          '• Run the backend on your PC and set EXPO_PUBLIC_BACKEND_HOST to an IP this device can reach.\n' +
          '• Watch Metro/device logs for "ONNX INIT FAILED" or upload errors.';
        Alert.alert(
          'AI Diagnosis Failed',
          typeof __DEV__ !== 'undefined' && __DEV__ ? devHelp : releaseHelp
        );
        return;
      }

      RemoteLogger.log(`--- FINAL DIAGNOSIS DATA --- ${JSON.stringify(analysisResult, null, 2)}`);

      const { isInfected, confidence, isInvalid, isMaize, diagnosis: serverDiagnosis } = analysisResult;
      const isBackendAiMock =
        typeof serverDiagnosis === 'string' &&
        (serverDiagnosis.includes('Mock') ||
          serverDiagnosis.includes('Unreachable') ||
          serverDiagnosis.includes('AI Service Unreachable'));
      
      // Calculate MSV Stage if infected
      let diseaseStage = '';
      if (isInfected || serverDiagnosis === 'MSV' || serverDiagnosis === 'Maize Streak Virus' || (serverDiagnosis && serverDiagnosis.includes('Virus'))) {
        if (confidence > 0.64) {
          diseaseStage = 'Late Stage';
        } else if (confidence < 0.46) {
          diseaseStage = 'Early Stage';
        } else {
          diseaseStage = 'Intermediate Stage';
        }
      }

      // Handle Invalid Image / Not a Maize Leaf Case
      if (
        isInvalid ||
        isMaize === false ||
        serverDiagnosis === 'Not a Maize Leaf' ||
        serverDiagnosis === 'Uncertain Scan' ||
        serverDiagnosis === 'Invalid Image' ||
        isBackendAiMock
      ) {
        const confNum = Number(confidence);
        const confPct = Number.isFinite(confNum) ? Math.round(confNum * 100) : 0;
        const notMaizeStrong =
          serverDiagnosis === 'Not a Maize Leaf' && confNum >= 0.65;
        const uncertainPresent = presentationForUncertainPath(
          analysisResult.scores,
          serverDiagnosis
        );
        const uncertainPresentDebug = presentationForUncertainPathDebug(
          analysisResult.scores,
          serverDiagnosis
        );
        let invalidTitle = 'Not a Maize Leaf';
        if (isBackendAiMock) {
          invalidTitle = 'AI service unavailable';
        } else if (serverDiagnosis === 'Uncertain Scan' && uncertainPresent) {
          invalidTitle = uncertainPresent.title;
        } else if (serverDiagnosis === 'Uncertain Scan') {
          invalidTitle = 'Uncertain Scan';
        } else if (serverDiagnosis === 'Invalid Image') {
          invalidTitle = 'Image too dark';
        }
        const invalidResult = {
          id: Date.now().toString(),
          source: analysisResult.source || 'unknown',
          date: new Date().toISOString(),
          image: image,
          remoteImage: remoteImageUrl,
          logits: analysisResult.logits,
          scores: analysisResult.scores,
          title: invalidTitle,
          diagnosis: isBackendAiMock ? 'Service Error' : 'Not a Maize Leaf',
          severity: isBackendAiMock ? 'Unknown' : 'Not a Maize Leaf',
          retries,
          timeSpentSeconds,
          resultAccepted: true,
          deviceModel: deviceInfo.deviceModel,
          osVersion: deviceInfo.osVersion,
          confidence: confidence,
          description: isBackendAiMock
            ? 'The cloud AI service could not run this scan (often the Python model worker is not reachable from the backend). On-device ONNX should still work when the model loads; check debug logs. Try again later or use a dev build with a working AI backend.'
            : serverDiagnosis === 'Invalid Image'
              ? 'The image is too dark or unclear. Please scan in good lighting with the leaf visible.'
              : serverDiagnosis === 'Uncertain Scan' && uncertainPresent
                ? uncertainPresent.description
                : serverDiagnosis === 'Uncertain Scan'
                  ? 'Sorry, we could not clearly identify the leaf from this photo. Please reupload an image of a maize leaf and try again.\n\nTips:\n- Fill the frame with one leaf\n- Use soft, even lighting (avoid glare and deep shadows)\n- Keep the leaf close and in focus'
                  : notMaizeStrong
                    ? 'Sorry, this image is not identified as a maize leaf.\n\nPlease reupload an image of a maize leaf and try again.\n\nTips:\n- Use a clear, single leaf (fill most of the frame)\n- Use soft, even lighting (avoid glare and deep shadows)\n- Keep the camera angle steady and close\n- Use a simple background so the leaf stands out'
                    : 'Sorry, we could not confidently identify this as a maize leaf. Please reupload an image of a maize leaf and try again.\n\nTips:\n- Fill the frame with one leaf\n- Use even lighting and avoid glare\n- Keep the leaf in focus',
          debugDescription: isBackendAiMock
            ? 'The cloud AI service could not run this scan (often the Python model worker is not reachable from the backend).'
            : serverDiagnosis === 'Invalid Image'
              ? 'The image is too dark or unclear.'
              : serverDiagnosis === 'Uncertain Scan' && uncertainPresentDebug
                ? uncertainPresentDebug.description
                : serverDiagnosis === 'Uncertain Scan'
                  ? 'The model is not confident enough about this image. Please take a clearer, well-lit photo with the leaf filling the frame.'
                  : notMaizeStrong
                    ? `The model is about ${confPct}% confident this is not a maize leaf. Try scanning a clear maize leaf in good lighting.`
                    : `Low confidence (${confPct}%). The model is not sure this is maize — use a clearer photo or rescan.`,
          imageMetadata: safeImageMeta,
          immediateActions: [
            'Take a new photo in good lighting.',
            'Ensure the leaf fills most of the frame.',
            'Avoid blurry or dark images.'
          ],
          longTermPrevention: [],
          chemicalControl: 'No action required.'
        };
        setResult(invalidResult);

        let historyItemInvalid = {
          ...invalidResult,
          userVerified: true,
          synced: false,
          leafhopperObserved: 'Not Sure',
          location: location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }
            : null,
          userEmail: userInfo && userInfo.email ? userInfo.email : null
        };
        if (remoteImageUrl) {
          try {
            const scanData = {
              localId: invalidResult.id,
              imageMetadata: safeImageMeta,
              location: location
                ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                  }
                : null,
              environment: {
                leafhopperObserved: 'Not Sure'
              },
              diagnosis: {
                modelPrediction: invalidResult.diagnosis,
                confidence: parseFloat(invalidResult.confidence),
                severity: invalidResult.severity,
                userVerified: true,
                finalDiagnosis: invalidResult.diagnosis
              },
              appUsage: {
                retries,
                timeSpentSeconds,
                resultAccepted: true
              },
              deviceInfo: {
                deviceModel: deviceInfo.deviceModel,
                osVersion: deviceInfo.osVersion
              },
              imageUrl: remoteImageUrl
            };
            await saveScan(scanData);
            historyItemInvalid.synced = true;
          } catch (e) {
            RemoteLogger.warn(`saveScan (invalid path): ${e?.message || e}`);
          }
        }
        await saveToHistory(historyItemInvalid);
        setAnalyzing(false);
        return;
      }

      const isMsv = Boolean(diseaseStage);
      const msvWeakNote = serverDiagnosis === 'MSV' ? msvWeakEvidenceNote(analysisResult.scores) : null;

      // User-facing copy: farmer-friendly (no logits/softmax shown here).
      let baseDescription = isMsv
        ? 'MSV detected.\n\nRecommendations:\n- Remove and destroy affected plants to limit spread\n- Control leafhoppers and keep the field weed-free\n- Monitor nearby plants and rescan if you see symptoms'
        : 'Your plant appears healthy and free from Maize Streak Virus.\n\nCare tips:\n- Keep weeds under control\n- Monitor regularly for early signs of disease\n- Maintain good crop hygiene and proper watering';

      if (isMsv && msvWeakNote) {
        // Keep this generic (no percentages) and avoid stage mention.
        baseDescription += '\n\nIf the leaf looks healthy, please rescan with a clearer photo (even lighting, one leaf filling the frame).';
      }

      // Technical/debug copy for the long-press modal.
      // Do not use this in the main UI.
      const debugDescription = isMsv
        ? (msvWeakNote || 'Model evidence indicates MSV. See softmax/logits in “More Details”.')
        : 'Model evidence indicates Healthy. See softmax/logits in “More Details”.';

      const diagnosisResult = {
        id: Date.now().toString(),
        source: analysisResult.source || 'unknown',
        date: new Date().toISOString(),
        image: image,
        remoteImage: remoteImageUrl,
        logits: analysisResult.logits,
        scores: analysisResult.scores,
        // Do not show MSV stage in the main UI; keep it for long-press details only.
        title: isMsv ? 'MSV Detected' : 'Healthy Maize Plant',
        diagnosis: serverDiagnosis || (isInfected ? 'Maize Streak Virus' : 'Healthy'),
        diseaseStage: diseaseStage, // Save the stage
        severity: isMsv ? diseaseStage : 'Healthy',
        retries,
        timeSpentSeconds,
        resultAccepted: true,
        deviceModel: deviceInfo.deviceModel,
        osVersion: deviceInfo.osVersion,
        confidence: confidence,
        description: baseDescription,
        debugDescription,
        imageMetadata: safeImageMeta,
        immediateActions: (serverAiResult?.diagnosis === 'Not a Maize Leaf') ? [
          'Take a new photo in good lighting.',
          'Ensure only the leaf is in the frame.',
          'Avoid blurry or dark images.'
        ] : isMsv ? [
          'Remove and destroy infected plants immediately to prevent spread.',
          'Control leafhopper populations using recommended insecticides.',
          'Clear grass weeds around the field which may host the virus.'
        ] : [
          'Continue regular watering schedule.',
          'Monitor for presence of leafhoppers.',
          'Keep field weed-free.'
        ],
        longTermPrevention: isMsv ? [
          'Plant MSV-resistant maize varieties.',
          'Plant early to avoid peak leafhopper populations.',
          'Practice crop rotation.'
        ] : [
          'Use certified disease-free seeds.',
          'Maintain field hygiene.'
        ],
        chemicalControl: isMsv 
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
            imageMetadata: safeImageMeta,
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
              severity: diagnosisResult.severity,
              userVerified: true,
              finalDiagnosis: diagnosisResult.diagnosis
            },
            appUsage: {
              retries: diagnosisResult.retries,
              timeSpentSeconds: diagnosisResult.timeSpentSeconds,
              resultAccepted: diagnosisResult.resultAccepted
            },
            deviceInfo: {
              deviceModel: diagnosisResult.deviceModel,
              osVersion: diagnosisResult.osVersion
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

      const safeImageMeta =
        result.imageMetadata ||
        imageMeta || { resolution: 'Unknown', orientation: 'Portrait' };

      const finalDiagnosis = isCorrect ? result.diagnosis : correctedLabel;
      const resultAccepted = Boolean(isCorrect);
      const finalSeverity = isCorrect
        ? (result.severity || severityFromDiagnosis(result.diagnosis, result.diseaseStage))
        : severityFromDiagnosis(finalDiagnosis, result.diseaseStage);
      
      // Create full scan record for backend
      const scanData = {
        localId: result.id,
        imageMetadata: safeImageMeta,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : null,
        environment: {
            leafhopperObserved: 'Not Sure'
        },
        diagnosis: {
          modelPrediction: result.diagnosis,
          confidence: parseFloat(result.confidence),
          severity: finalSeverity,
          userVerified: true,
          finalDiagnosis: finalDiagnosis
        },
        appUsage: {
          retries: Number(result.retries) || 0,
          timeSpentSeconds: Number(result.timeSpentSeconds) || null,
          resultAccepted
        },
        deviceInfo: {
          deviceModel: result.deviceModel || 'Unknown',
          osVersion: result.osVersion || 'Unknown'
        },
        imageUrl: remoteImageUrl // might be null if offline
      };

      // 1. Save Locally (History)
      const historyItem = {
        ...result,
        diagnosis: finalDiagnosis,
        severity: finalSeverity,
        resultAccepted,
        userVerified: true,
        location: location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        } : null,
        leafhopperObserved: 'Not Sure',
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
    setImageMeta(null);
    setRetakeCount(0);
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onLongPress={() => setShowDebugModal(true)}>
            <Text style={styles.headerTitle}>Management Advice</Text>
          </TouchableOpacity>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.resultScroll}>
          {/* Main Card */}
          <View style={styles.mainCard}>
            <Image source={{ uri: result.image }} style={styles.mainImage} resizeMode="cover" />
            <View style={styles.mainCardContent}>
              <View style={styles.diagnosisRow}>
                <Text style={styles.diagnosisLabel}>DIAGNOSIS RESULTS</Text>
              </View>
              <Text style={styles.diseaseTitle}>{result.title}</Text>
              <Text style={styles.description}>{result.description}</Text>
            </View>
          </View>

          

          {/* Raw Debug Data Button */}
          <TouchableOpacity 
            style={{ marginTop: 10, padding: 10, opacity: 0.5 }} 
            onLongPress={() => setShowDebugModal(true)}
          >
            <Text style={{ textAlign: 'center', fontSize: 10, color: '#999' }}>
              Long-press for More Details
            </Text>
          </TouchableOpacity>

          {/* New Diagnosis Button at bottom */}
          <TouchableOpacity style={[styles.button, styles.secondaryButton, { marginTop: 20 }]} onPress={reset}>
                <Text style={[styles.buttonText, styles.secondaryText]}>New Diagnosis</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Debug Modal */}
        {showDebugModal && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, padding: 20, justifyContent: 'center' }]}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>More Details</Text>
              <Text style={{ fontSize: 10, color: '#666', marginBottom: 10 }}>Version: March 27 - 5:55 PM (Take 7)</Text>
              <ScrollView>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{result.title}</Text>
                  <Text style={{ fontSize: 12, marginBottom: 10 }}>
                    {result.debugDescription || result.description}
                  </Text>

                  {Array.isArray(result.logits) &&
                    result.logits.length === 3 &&
                    Array.isArray(result.scores) &&
                    result.scores.length === 3 && (
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ fontWeight: '600', marginBottom: 4 }}>Model output (debug)</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 12 }} selectable>
                          Logits [Healthy, MSV, Unknown]:{'\n'}
                          [{result.logits.map((v) => Number(v).toFixed(4)).join(', ')}]
                        </Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 12 }} selectable>
                          Softmax: Healthy {(result.scores[0] * 100).toFixed(2)}% · MSV {(result.scores[1] * 100).toFixed(2)}% · Unknown {(result.scores[2] * 100).toFixed(2)}%
                        </Text>
                      </View>
                    )}

                  {!!result.diseaseStage && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontWeight: '600', marginBottom: 4 }}>MSV stage logic (debug)</Text>
                      <Text style={{ fontSize: 12 }}>
                        If confidence &gt; 0.64 => Late Stage, if confidence &lt; 0.46 => Early Stage, otherwise => Intermediate Stage.
                      </Text>
                      <Text style={{ fontSize: 12, marginTop: 4 }}>Computed stage: {result.diseaseStage}</Text>
                    </View>
                  )}

                  <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {JSON.stringify({
                      id: result.id,
                      source: result.source || 'unknown',
                      confidence: result.confidence,
                      diagnosis: result.diagnosis,
                      logits: result.logits,
                      scores_softmax: result.scores,
                      diseaseStage: result.diseaseStage,
                      title: result.title,
                      debugDescription: result.debugDescription || result.description
                    }, null, 2)}
                  </Text>
                </View>
              </ScrollView>
              <TouchableOpacity 
                style={[styles.button, { marginTop: 20, marginBottom: 10, backgroundColor: '#4CAF50' }]} 
                onPress={async () => {
                   const testUrl = `${API_URL}/debug/log`;
                   const isCloud = /onrender\.com|render\.com/i.test(API_URL || '');
                   RemoteLogger.log(`🔔 CONNECTION TEST: Attempting to reach ${testUrl}`);
                   try {
                     const controller = new AbortController();
                     const timeoutId = setTimeout(() => controller.abort(), 8000);
                     const resp = await fetch(testUrl, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       signal: controller.signal,
                       body: JSON.stringify({ message: 'Ping from Debug Modal', level: 'info' })
                     });
                     clearTimeout(timeoutId);
                     const showAlert = (title, msg) =>
                       InteractionManager.runAfterInteractions(() => Alert.alert(title, msg));
                     if (resp.ok) {
                       showAlert(
                         'Backend reachable',
                         isCloud
                           ? `POST succeeded:\n${testUrl}\n\n(Release builds use the cloud API, not your PC.)`
                           : `POST succeeded:\n${testUrl}\n\nIf you run the backend locally, check that terminal for debug lines.`
                       );
                     } else {
                       showAlert(
                         'Server responded with an error',
                         `HTTP ${resp.status}\n${testUrl}`
                       );
                     }
                   } catch (err) {
                     InteractionManager.runAfterInteractions(() =>
                       Alert.alert(
                         'Request failed',
                         `${err?.message || err}\n\nURL: ${testUrl}\n\n${isCloud ? 'Check phone data/Wi‑Fi and that the Render service is up.' : 'Use the same Wi‑Fi as your PC and confirm EXPO_PUBLIC_BACKEND_HOST in .env matches your PC IP.'}`
                       )
                     );
                   }
                }}
              >
                <Text style={styles.buttonText}>Test backend connection</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { marginTop: 0, marginBottom: 0 }]} 
                onPress={() => setShowDebugModal(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          <Text style={styles.previewHint}>
            Tip: even lighting and a leaf filling the frame give more reliable results.
          </Text>
          <View style={styles.actionButtons}>
             {analyzing ? (
                 <ActivityIndicator size="large" color="#4CAF50" />
             ) : (
                 <>
                    <TouchableOpacity style={styles.button} onPress={analyzeImage}>
                        <Text style={styles.buttonText}>Analyze Leaf</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={() => {
                        setRetakeCount((v) => v + 1);
                        setImage(null);
                      }}
                    >
                        <Text style={[styles.buttonText, styles.secondaryText]}>Retake</Text>
                    </TouchableOpacity>
                 </>
             )}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
            <View style={styles.camera}>
                <CameraView style={StyleSheet.absoluteFillObject} ref={cameraRef} facing="back" />

                <View style={styles.captureTipBanner} pointerEvents="none">
                  <Text style={styles.captureTipText}>
                    Hold the leaf close, fill the frame, and avoid harsh sunlight on the leaf.
                  </Text>
                </View>
                
                {/* Square Scanning Overlay — large guide helps framing before square crop */}
                <View style={styles.overlayContainer} pointerEvents="none">
                  <View style={styles.blurArea} />
                  <View style={[styles.middleRow, { height: cameraGuideSize }]}>
                    <View style={styles.blurArea} />
                    <View style={[styles.focusSquare, { width: cameraGuideSize, height: cameraGuideSize }]}>
                      <View style={[styles.corner, styles.topLeft]} />
                      <View style={[styles.corner, styles.topRight]} />
                      <View style={[styles.corner, styles.bottomLeft]} />
                      <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <View style={styles.blurArea} />
                  </View>
                  <View style={styles.blurArea}>
                    <Text style={styles.hintText}>Place one maize leaf in the square — most of the frame</Text>
                  </View>
                </View>

                <View style={styles.cameraControls}>
                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                <Text style={styles.galleryText}>Upload from Gallery</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
            {/* Hidden Long-Press on Header or this indicator for More Details */}
            <TouchableOpacity 
              style={{ position: 'absolute', top: 50, left: 20, zIndex: 100, padding: 10, opacity: 0.2 }}
              onLongPress={() => setShowDebugModal(true)}
            >
              <Text style={{ fontSize: 8, color: '#999' }}>MORE DETAILS</Text>
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
  inferenceDebugBox: {
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inferenceDebugTitle: {
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
    color: '#333',
    marginBottom: 8,
  },
  inferenceDebugLine: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#424242',
    lineHeight: 18,
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleRow: {
    flexDirection: 'row',
  },
  focusSquare: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#4CAF50',
    borderWidth: 4,
  },
  topLeft: { top: -2, left: -2, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: -2, right: -2, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: -2, right: -2, borderTopWidth: 0, borderLeftWidth: 0 },
  hintText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Roboto_500Medium',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  captureTipBanner: {
    position: 'absolute',
    top: 48,
    left: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  captureTipText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    lineHeight: 18,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  previewHint: {
    fontSize: 13,
    color: '#5f6368',
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
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
