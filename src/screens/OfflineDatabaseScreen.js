import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

const OfflineDatabaseScreen = ({ navigation }) => {
  const [modelEnabled, setModelEnabled] = useState(true);
  const [libraryEnabled, setLibraryEnabled] = useState(true);
  const [mapsEnabled, setMapsEnabled] = useState(false);

  const ProgressBar = ({ progress, color }) => (
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Database</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Sync Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last synced: 2 hours ago</Text>
          <Text style={styles.cardSubtitle}>Keep your data up to date for reliable field use.</Text>
          <TouchableOpacity style={styles.syncButton}>
            <Ionicons name="sync" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Downloadable Data</Text>

        {/* Downloadable Data List */}
        <View style={styles.card}>
          {/* Disease Identification Model */}
          <View style={styles.dataItem}>
            <View style={styles.dataHeader}>
              <View style={styles.dataInfo}>
                <Text style={styles.dataTitle}>Disease Identification Model</Text>
                <Text style={styles.dataMeta}>25.4 MB • Current version</Text>
              </View>
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#4CAF50" }}
                thumbColor={"#fff"}
                ios_backgroundColor="#e0e0e0"
                onValueChange={setModelEnabled}
                value={modelEnabled}
              />
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>Ready for offline use</Text>
              <Text style={styles.percentageText}>100%</Text>
            </View>
            <ProgressBar progress={100} color="#4CAF50" />
          </View>

          <View style={styles.divider} />

          {/* Maize Disease Library */}
          <View style={styles.dataItem}>
            <View style={styles.dataHeader}>
              <View style={styles.dataInfo}>
                <Text style={styles.dataTitle}>Maize Disease Library</Text>
                <Text style={styles.dataMeta}>12.8 MB • High Resolution</Text>
              </View>
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#4CAF50" }}
                thumbColor={"#fff"}
                ios_backgroundColor="#e0e0e0"
                onValueChange={setLibraryEnabled}
                value={libraryEnabled}
              />
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>Downloading...</Text>
              <Text style={styles.percentageText}>65%</Text>
            </View>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '65%', backgroundColor: '#4CAF50' }]} />
                <View style={[styles.progressBarFill, { width: '35%', left: '65%', backgroundColor: '#e0e0e0' }]} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Regional Maps */}
          <View style={styles.dataItem}>
            <View style={styles.dataHeader}>
              <View style={styles.dataInfo}>
                <Text style={styles.dataTitle}>Regional Maps</Text>
                <Text style={styles.dataMeta}>45.0 MB • Nairobi & Surrounding</Text>
              </View>
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#4CAF50" }}
                thumbColor={"#fff"}
                ios_backgroundColor="#e0e0e0"
                onValueChange={setMapsEnabled}
                value={mapsEnabled}
              />
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>Not downloaded</Text>
              <Text style={styles.percentageText}>0%</Text>
            </View>
            <ProgressBar progress={0} color="#e0e0e0" />
          </View>
        </View>

        {/* Storage Used Section */}
        <View style={[styles.card, styles.storageCard]}>
          <View style={styles.storageHeader}>
            <View style={styles.storageTitleRow}>
              <Ionicons name="layers" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
              <Text style={styles.storageTitle}>Storage Used</Text>
            </View>
            <Text style={styles.storageValue}>83.2 MB / 512 MB</Text>
          </View>
          
          <View style={styles.storageBarContainer}>
            <View style={[styles.storageBarSegment, { flex: 0.2, backgroundColor: '#4CAF50', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
            <View style={[styles.storageBarSegment, { flex: 0.1, backgroundColor: '#C8E6C9' }]} />
            <View style={[styles.storageBarSegment, { flex: 0.7, backgroundColor: '#F5F5F5', borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Offline Models</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#C8E6C9' }]} />
              <Text style={styles.legendText}>System Cache</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F5F5F5' }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
          </View>
        </View>

        {/* Clear Cache Button */}
        <TouchableOpacity style={styles.clearCacheButton}>
          <Ionicons name="trash" size={18} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.clearCacheText}>Clear Cache</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    fontWeight: 'bold',
    color: '#000',
  },
  backButton: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  dataItem: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dataInfo: {
    flex: 1,
    marginRight: 16,
  },
  dataTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  dataMeta: {
    fontSize: 13,
    color: '#888',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  storageCard: {
    padding: 20,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  storageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storageTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  storageValue: {
    fontSize: 13,
    color: '#666',
  },
  storageBarContainer: {
    height: 12,
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 6,
    overflow: 'hidden',
  },
  storageBarSegment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', // Or slightly off-white/grey per design
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
  },
  clearCacheText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

export default OfflineDatabaseScreen;
