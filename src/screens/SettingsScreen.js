import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TouchableWithoutFeedback, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { uploadScanImage, syncScans } from '../api/client';
import ModelService from '../services/ModelService';
import Ionicons from '@expo/vector-icons/Ionicons';

const SettingsScreen = ({ navigation }) => {
  const { logout, userInfo } = useContext(AuthContext);
  const [onnxStatus, setOnnxStatus] = useState(null);
  const [onnxRefreshing, setOnnxRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [exportStatus, setExportStatus] = useState('');

  const refreshOnnxStatus = useCallback(async () => {
    try {
      setOnnxRefreshing(true);
      await ModelService.init();
    } catch (e) {
      // init catches internally; still refresh snapshot
    } finally {
      setOnnxStatus(ModelService.getOnnxStatus());
      setOnnxRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setOnnxStatus(ModelService.getOnnxStatus());
    }, [])
  );

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
      // Only show scans that haven't been synced yet
      const unsynced = history.filter(item => !item.synced);
      setPreviewItems(unsynced);
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
        setIsExporting(false);
        return;
      }

      let history = JSON.parse(stored);
      // Filter to only items that need syncing
      let itemsToSync = [];
      let unsyncedIndices = [];

      history.forEach((item, index) => {
        if (!item.synced) {
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
            imageUrl: item.remoteImage || null
          };
          itemsToSync.push(scanData);
          unsyncedIndices.push(index);
        }
      });

      if (itemsToSync.length === 0) {
        setExportStatus('All records are already synced.');
        setIsExporting(false);
        return;
      }

      // Perform the sync
      const response = await syncScans(itemsToSync);

      const hasInsertList = response && Array.isArray(response.insertedLocalIds);
      const inserted = hasInsertList ? response.insertedLocalIds.map(String) : [];
      const skipped =
        response && Array.isArray(response.skippedDuplicates)
          ? response.skippedDuplicates.map(String)
          : [];
      const syncErrors = response && Array.isArray(response.errors) ? response.errors : [];

      const syncedCount =
        response && typeof response.syncedCount === 'number'
          ? response.syncedCount
          : inserted.length;

      if (hasInsertList) {
        unsyncedIndices.forEach((idx) => {
          const idStr = String(history[idx].id);
          if (inserted.includes(idStr)) {
            history[idx].synced = true;
          }
        });
      } else {
        // Older API: treat whole batch as synced on success (less accurate)
        unsyncedIndices.forEach((idx) => {
          history[idx].synced = true;
        });
      }

      await AsyncStorage.setItem('diagnosisHistory', JSON.stringify(history));

      let msg = `Exported ${syncedCount} new record${syncedCount === 1 ? '' : 's'} to the database.`;
      if (skipped.length > 0) {
        msg += ` ${skipped.length} skipped (already in database — same scan id).`;
      }
      if (syncErrors.length > 0) {
        msg += ` ${syncErrors.length} failed — check login / network.`;
      }
      setExportStatus(msg);
      
      // Update the preview list to hide the newly synced items
      setPreviewItems(history.filter(item => !item.synced));

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
            <Text style={styles.sectionTitle}>On-device AI</Text>
            <View style={styles.card}>
                <View style={styles.onnxRow}>
                    <Ionicons name="hardware-chip-outline" size={22} color="#555" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>
                            {Platform.OS === 'web'
                              ? 'Model (browser)'
                              : 'ONNX (offline)'}
                        </Text>
                        <Text style={styles.itemSubtitle}>
                            {onnxStatus == null
                              ? 'Loading…'
                              : onnxStatus.platform === 'web'
                                ? onnxStatus.ready
                                  ? `Ready${onnxStatus.usesTfjsModel ? ' (TF.js model)' : ''}`
                                  : 'Not ready'
                                : onnxStatus.ready
                                  ? `Ready — input: ${onnxStatus.inputName || 'input'}`
                                  : onnxStatus.lastInitError
                                    ? `Not ready: ${onnxStatus.lastInitError}`
                                    : 'Not ready yet (init may still be running)'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.onnxRefreshBtn}
                    onPress={refreshOnnxStatus}
                    disabled={onnxRefreshing}
                >
                    {onnxRefreshing ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                    ) : (
                        <Text style={styles.onnxRefreshText}>Refresh status</Text>
                    )}
                </TouchableOpacity>
                {Platform.OS !== 'web' ? (
                <Text style={styles.onnxHint}>
                    With USB debugging: adb logcat -s ReactNativeJS:I — search output for Offline ONNX or ONNX INIT
                </Text>
                ) : null}
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
  onnxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  onnxRefreshBtn: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  onnxRefreshText: {
    color: '#4CAF50',
    fontFamily: 'Roboto_500Medium',
    fontSize: 15,
  },
  onnxHint: {
    fontSize: 11,
    color: '#aaa',
    paddingHorizontal: 16,
    paddingBottom: 14,
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
