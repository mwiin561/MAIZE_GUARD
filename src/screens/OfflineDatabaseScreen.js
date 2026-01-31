import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const OfflineDatabaseScreen = ({ navigation }) => {
  const [modelEnabled, setModelEnabled] = useState(true);
  const [libraryEnabled, setLibraryEnabled] = useState(true);
  const [mapsEnabled, setMapsEnabled] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Database</Text>
        <MaterialIcons name="more-horiz" size={24} color="#000" />
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Last synced: 2 hours ago</Text>
        <Text style={styles.statusDesc}>Keep your data up to date for reliable field use.</Text>
        <TouchableOpacity style={styles.syncButton}>
            <MaterialIcons name="sync" size={20} color="#fff" />
            <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Downloadable Data</Text>

      {/* Disease Model Item */}
      <View style={styles.item}>
        <View style={styles.itemHeader}>
            <View>
                <Text style={styles.itemTitle}>Disease Identification Model</Text>
                <Text style={styles.itemMeta}>25.4 MB • Current version</Text>
            </View>
            <Switch 
                value={modelEnabled} 
                onValueChange={setModelEnabled}
                trackColor={{ false: "#767577", true: "#4CAF50" }}
                thumbColor={"#fff"}
            />
        </View>
        <View style={styles.progressRow}>
            <Text style={styles.progressText}>Ready for offline use</Text>
            <Text style={styles.progressPercent}>100%</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: '#e6f4ea' }]}>
            <View style={[styles.progressBarFill, { width: '100%', backgroundColor: '#4CAF50' }]} />
        </View>
      </View>

      {/* Library Item */}
      <View style={styles.item}>
        <View style={styles.itemHeader}>
            <View>
                <Text style={styles.itemTitle}>Maize Disease Library</Text>
                <Text style={styles.itemMeta}>12.8 MB • High Resolution</Text>
            </View>
            <Switch 
                value={libraryEnabled} 
                onValueChange={setLibraryEnabled}
                trackColor={{ false: "#767577", true: "#4CAF50" }}
                thumbColor={"#fff"}
            />
        </View>
        <View style={styles.progressRow}>
            <Text style={styles.progressText}>Downloading...</Text>
            <Text style={styles.progressPercent}>65%</Text>
        </View>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '65%', backgroundColor: '#4CAF50' }]} />
        </View>
      </View>

      {/* Maps Item */}
      <View style={styles.item}>
        <View style={styles.itemHeader}>
            <View>
                <Text style={styles.itemTitle}>Regional Maps</Text>
                <Text style={styles.itemMeta}>45.0 MB • Nairobi & Surrounding</Text>
            </View>
            <Switch 
                value={mapsEnabled} 
                onValueChange={setMapsEnabled}
                trackColor={{ false: "#dadce0", true: "#4CAF50" }}
                thumbColor={"#fff"}
            />
        </View>
        <View style={styles.progressRow}>
            <Text style={styles.progressText}>Not downloaded</Text>
            <Text style={styles.progressPercent}>0%</Text>
        </View>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '0%' }]} />
        </View>
      </View>

      {/* Storage Card */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="storage" size={20} color="#4CAF50" />
                <Text style={styles.storageTitle}>Storage Used</Text>
            </View>
            <Text style={styles.storageValue}>83.2 MB / 512 MB</Text>
        </View>
        <View style={styles.storageBar}>
            <View style={{ flex: 0.16, backgroundColor: '#4CAF50' }} />
            <View style={{ flex: 0.08, backgroundColor: '#a5d6a7' }} />
            <View style={{ flex: 0.76, backgroundColor: '#f1f3f4' }} />
        </View>
        <View style={styles.legend}>
            <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Offline Models</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#a5d6a7' }]} />
                <Text style={styles.legendText}>System Cache</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#f1f3f4' }]} />
                <Text style={styles.legendText}>Available</Text>
            </View>
        </View>
      </View>

      <TouchableOpacity style={styles.clearButton}>
        <MaterialIcons name="delete-outline" size={20} color="#202124" />
        <Text style={styles.clearButtonText}>Clear Cache</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginLeft: 16,
    marginBottom: 12,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#5f6368',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#202124',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f1f3f4',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  storageCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202124',
    marginLeft: 8,
  },
  storageValue: {
    fontSize: 12,
    color: '#5f6368',
  },
  storageBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#5f6368',
  },
  clearButton: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    marginBottom: 32,
  },
  clearButtonText: {
    color: '#202124',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default OfflineDatabaseScreen;
