import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { uploadScanImage, syncScans } from '../api/client';
import Ionicons from '@expo/vector-icons/Ionicons';

const SettingsScreen = ({ navigation }) => {
  const { logout, userInfo } = useContext(AuthContext);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportHistory = async () => {
    try {
      setIsExporting(true);
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      
      if (!stored) {
        Alert.alert('No History', 'There are no scan records to export.');
        setIsExporting(false);
        return;
      }

      let history = JSON.parse(stored);
      if (history.length === 0) {
        Alert.alert('No History', 'There are no scan records to export.');
        setIsExporting(false);
        return;
      }

      // Prepare data for sync
      let itemsToSync = [];
      let updatedHistory = [...history];
      let successCount = 0;

      for (let i = 0; i < updatedHistory.length; i++) {
        const item = updatedHistory[i];
        let remoteUrl = item.remoteImage;

        try {
            // 1. Upload Image if needed
            if (!remoteUrl && item.image) {
                // If it's a local file URI
                const uploadRes = await uploadScanImage(item.image);
                remoteUrl = uploadRes.imageUrl;
                updatedHistory[i].remoteImage = remoteUrl; // Update local record
            }

            // 2. Prepare Scan Data Object
            const scanData = {
                localId: item.id,
                timestamp: item.date, // Use the stored date
                imageMetadata: {
                  resolution: 'Unknown', 
                  orientation: 'Portrait'
                },
                location: item.location || {},
                environment: {
                    leafhopperObserved: item.leafhopperObserved || 'Not Sure'
                },
                diagnosis: {
                  modelPrediction: item.diagnosis, 
                  confidence: parseFloat(item.confidence || 0),
                  userVerified: true,
                  finalDiagnosis: item.diagnosis
                },
                imageUrl: remoteUrl
            };
            
            itemsToSync.push(scanData);
            successCount++;

        } catch (err) {
            console.log(`Failed to prepare item ${item.id}:`, err);
            // Continue with other items
        }
      }

      if (itemsToSync.length > 0) {
        // Send batch to backend
        await syncScans(itemsToSync);
        
        // Update local storage with new remote URLs
        await AsyncStorage.setItem('diagnosisHistory', JSON.stringify(updatedHistory));
        
        Alert.alert('Success', `Successfully exported ${itemsToSync.length} records to the database.`);
      } else {
        Alert.alert('Info', 'No valid records could be prepared for export.');
      }

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'An error occurred while exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const SettingItem = ({ icon, title, subtitle, hasSwitch, onPress, loading }) => (
    <TouchableOpacity 
        style={[styles.item, loading && { opacity: 0.7 }]} 
        onPress={onPress || (title === 'Log Out' ? logout : null)}
        disabled={loading}
    >
      <View style={styles.iconContainer}>
        {loading ? (
            <ActivityIndicator size="small" color="#555" />
        ) : (
            <Ionicons name={icon} size={24} color="#555" />
        )}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {!loading && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Settings</Text>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
                <View style={styles.userRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{userInfo?.email?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{userInfo?.email?.split('@')[0]}</Text>
                        <Text style={styles.userEmail}>{userInfo?.email}</Text>
                    </View>
                </View>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            <View style={styles.card}>
                <SettingItem 
                    icon="document-text-outline" 
                    title="Export Scan History" 
                    onPress={handleExportHistory}
                    loading={isExporting}
                />
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.card}>
                <SettingItem 
    icon="help-circle-outline" 
    title="Help & Feedback" 
    onPress={() => navigation.navigate('Help')}
/>
                <SettingItem icon="log-out-outline" title="Log Out" />
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    padding: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 32,
    marginRight: 12,
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Roboto_400Regular',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontFamily: 'Roboto_400Regular',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Roboto_400Regular',
  }
});

export default SettingsScreen;
