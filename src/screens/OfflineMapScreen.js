import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const OfflineMapScreen = ({ navigation }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Field Map</Text>
      </View>

      {/* Map Content (Placeholder Image) */}
      <View style={styles.mapContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }} 
          style={styles.mapImage}
        />
        
        {/* Map Overlay Tint to match the light greenish look */}
        <View style={styles.mapOverlay} />

        {/* Map Markers */}
        <View style={[styles.markerContainer, { top: '30%', left: '30%' }]}>
            <View style={styles.markerLabelContainer}>
                <Text style={styles.markerLabel}>HEALTHY</Text>
            </View>
            <Ionicons name="location" size={40} color="#52d017" />
        </View>

        <View style={[styles.markerContainer, { top: '60%', left: '40%' }]}>
            <View style={styles.markerLabelContainer}>
                <Text style={styles.markerLabel}>HEALTHY</Text>
            </View>
            <Ionicons name="location" size={40} color="#52d017" />
        </View>

        <View style={[styles.markerContainer, { top: '50%', right: '20%' }]}>
            <View style={[styles.markerLabelContainer, { backgroundColor: '#FF5252' }]}>
                <Text style={styles.markerLabel}>MSV DETECTED</Text>
            </View>
            <Ionicons name="location" size={40} color="#FF5252" />
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" style={{ marginRight: 10 }} />
            <TextInput 
                placeholder="Search downloaded regions"
                placeholderTextColor="#888"
                style={styles.searchInput}
            />
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
            <View style={styles.zoomControls}>
                <TouchableOpacity style={styles.zoomButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.zoomDivider} />
                <TouchableOpacity style={styles.zoomButton}>
                    <Ionicons name="remove" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.locationButton}>
                <Ionicons name="locate" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.panelHandle} />
        
        <View style={styles.panelHeader}>
            <View>
                <Text style={styles.regionName}>Central Sector A-12</Text>
                <View style={styles.statusRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#52d017" style={{ marginRight: 4 }} />
                    <Text style={styles.statusText}>Available Offline (142 MB)</Text>
                </View>
            </View>
            <Text style={styles.syncStatus}>92% SYNCED</Text>
        </View>

        <View style={styles.actionRow}>
            <TouchableOpacity style={styles.downloadButton}>
                <Ionicons name="download-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.downloadButtonText}>Download New Region</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsButton}>
                <Ionicons name="settings-sharp" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3532', // Dark header background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2E3532',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButton: {
    padding: 4,
  },
  cloudButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#52d017',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E0F2F1',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(224, 242, 241, 0.4)',
  },
  searchBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2E3532',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLabelContainer: {
    backgroundColor: '#52d017',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  mapControls: {
    position: 'absolute',
    bottom: 180, // Above bottom panel
    right: 20,
    alignItems: 'center',
  },
  zoomControls: {
    backgroundColor: '#1E2320',
    borderRadius: 25,
    width: 50,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  zoomButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  zoomDivider: {
    height: 1,
    width: '60%',
    backgroundColor: '#333',
  },
  locationButton: {
    backgroundColor: '#1E2320',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  bottomPanel: {
    backgroundColor: '#121513', // Very dark green/black
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  regionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#888',
    fontSize: 14,
  },
  syncStatus: {
    color: '#8fa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#52d017',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginRight: 12,
  },
  downloadButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  settingsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2E3532',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OfflineMapScreen;
