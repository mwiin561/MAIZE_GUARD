import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { uploadScanImage, syncScans } from '../api/client';
import Ionicons from '@expo/vector-icons/Ionicons';

const SettingsScreen = ({ navigation }) => {
  const { logout, userInfo } = useContext(AuthContext);
  const [isExporting, setIsExporting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [exportStatus, setExportStatus] = useState('');

  const openExportPreview = async () => {
    try {
      setExportStatus('');
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      if (!stored) {
        setPreviewItems([]);
        setPreviewVisible(true);
        return;
      }
      let history = JSON.parse(stored);
      setPreviewItems(history.slice(0, 20));
      setPreviewVisible(true);
    } catch (e) {
      setPreviewItems([]);
      setPreviewVisible(true);
    }
  };

  const handleExportHistory = async () => {
    try {
      setIsExporting(true);
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      
      if (!stored) {
        setExportStatus('No history found to export.');
        Alert.alert('No History', 'There are no scan records to export.');
        setIsExporting(false);
        return;
      }

      let history = JSON.parse(stored);
      if (history.length === 0) {
        setExportStatus('No history found to export.');
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

        if (!remoteUrl && item.image) {
          try {
            const uploadRes = await uploadScanImage(item.image);
            remoteUrl = uploadRes.imageUrl;
            updatedHistory[i].remoteImage = remoteUrl;
          } catch (err) {
            console.log(`Image upload failed for item ${item.id}, exporting without imageUrl:`, err);
          }
        }

        const scanData = {
          localId: item.id,
          timestamp: item.date,
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
          imageUrl: remoteUrl || null
        };

        itemsToSync.push(scanData);
        successCount++;
      }

      if (itemsToSync.length > 0) {
        const response = await syncScans(itemsToSync);
        
        await AsyncStorage.setItem('diagnosisHistory', JSON.stringify(updatedHistory));
        
        const syncedCount = response && typeof response.syncedCount === 'number'
          ? response.syncedCount
          : itemsToSync.length;
        const msg = `Successfully exported ${syncedCount} record${syncedCount === 1 ? '' : 's'} to the database.`;
        setExportStatus(msg);
        Alert.alert('Success', msg);
      } else {
        setExportStatus('No valid records could be prepared for export.');
        Alert.alert('Info', 'No valid records could be prepared for export.');
      }

    } catch (error) {
      console.error('Export error:', error);
      const message = error && error.message ? error.message : 'An error occurred while exporting data. Please try again.';
      setExportStatus(`Export failed: ${message}`);
      Alert.alert('Export Failed', message);
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
                    onPress={openExportPreview}
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

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPreviewVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Export Scan History</Text>
                  <TouchableOpacity onPress={() => setPreviewVisible(false)} style={styles.modalClose}>
                    <Ionicons name="close" size={22} color="#666" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  {previewItems.length > 0 ? `${previewItems.length} records ready` : 'No records found'}
                </Text>
                {exportStatus ? (
                  <Text style={styles.statusText}>{exportStatus}</Text>
                ) : null}
                <View style={styles.previewList}>
                  {previewItems.length > 0 ? (
                    <FlatList
                      data={previewItems}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item }) => (
                        <View style={styles.previewRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.previewTitle}>{item.diagnosis || 'Unknown'}</Text>
                            <Text style={styles.previewMeta}>
                              {new Date(item.date).toLocaleDateString()} • {Math.round((item.confidence || 0) * 100)}%
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#bbb" />
                        </View>
                      )}
                    />
                  ) : (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <Text style={styles.emptyText}>No scans to export</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.exportButton, isExporting && { opacity: 0.7 }]}
                  onPress={handleExportHistory}
                  disabled={isExporting || previewItems.length === 0}
                >
                  {isExporting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.exportButtonText}>Export to Database</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setPreviewVisible(false)}
                >
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#333',
  },
  modalClose: {
    padding: 6,
  },
  modalSubtitle: {
    marginTop: 4,
    color: '#666',
    fontFamily: 'Roboto_400Regular',
  },
  statusText: {
    marginTop: 8,
    color: '#333',
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
  },
  previewList: {
    maxHeight: 300,
    marginTop: 12,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewTitle: {
    fontSize: 15,
    color: '#222',
    fontFamily: 'Roboto_700Bold',
  },
  previewMeta: {
    marginTop: 2,
    color: '#777',
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
  },
});

export default SettingsScreen;
