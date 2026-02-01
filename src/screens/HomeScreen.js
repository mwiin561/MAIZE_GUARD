import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Image, ScrollView, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, issues: 0 });
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      if (stored) {
        const data = JSON.parse(stored);
        setHistory(data);
        
        // Calculate stats
        const total = data.length;
        const issues = data.filter(item => 
          item.diagnosis.toLowerCase().includes('virus') || 
          item.diagnosis.toLowerCase().includes('spot')
        ).length;
        
        setStats({ total, issues });
      }
    } catch (e) {
      console.log('Failed to load history');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadHistory().then(() => setRefreshing(false));
  }, []);

  const renderRecentItem = ({ item }) => {
    const isIssue = item.diagnosis.toLowerCase().includes('virus') || item.diagnosis.toLowerCase().includes('spot');
    return (
      <TouchableOpacity style={styles.recentItem}>
        <Image source={{ uri: item.image }} style={styles.recentImage} />
        <View style={styles.recentInfo}>
          <Text style={styles.recentTitle}>{item.diagnosis}</Text>
          <Text style={styles.recentDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isIssue ? '#ffebee' : '#e8f5e9' }]}>
            <Text style={[styles.statusText, { color: isIssue ? '#c62828' : '#2e7d32' }]}>
                {isIssue ? 'Action Req' : 'Optimal'}
            </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <LinearGradient
          colors={['#1b5e20', '#2e7d32', '#43a047']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBackground}
        >
            {/* Overlay Leaf Accents - simulated with absolute positioned views or icons for now since we don't have assets */}
            <View style={styles.leafAccentRight} />
            <View style={styles.leafAccentLeft} />
        </LinearGradient>
        <View style={styles.heroContent}>
            <View style={styles.brandHeader}>
                <Ionicons name="leaf" size={16} color="#fff" />
                <Text style={styles.brandText}>MAIZE GUARD</Text>
            </View>
            <Text style={styles.heroTitle}>Instant{'\n'}Diagnosis</Text>
            <Text style={styles.heroSubtitle}>Keep your crops healthy and productive</Text>
        </View>
      </View>

      {/* Quick Scan Card */}
      <View style={styles.quickScanCard}>
        <View>
            <Text style={styles.quickScanTitle}>Quick Scan</Text>
            <Text style={styles.quickScanSubtitle}>Identify pests & diseases instantly</Text>
        </View>
        <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => navigation.navigate('Diagnosis')}
        >
            <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="scan" size={24} color="#2e7d32" />
            </View>
            <View>
                <Text style={styles.statLabel}>Total Scans</Text>
                <Text style={styles.statValue}>{stats.total}</Text>
            </View>
        </View>
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="warning-outline" size={24} color="#f57c00" />
            </View>
            <View>
                <Text style={styles.statLabel}>Issues Found</Text>
                <Text style={styles.statValue}>{stats.issues}</Text>
            </View>
        </View>
      </View>

      {/* Recent Scans Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>MaizeHealth</Text>

        <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setProfileMenuVisible(true)}
        >
            <Ionicons name="person-outline" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      {/* Profile Popup Menu */}
      <Modal
        visible={profileMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setProfileMenuVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.menuContainer}>
                    <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => {
                            setProfileMenuVisible(false);
                            navigation.navigate('Account');
                        }}
                    >
                        <Ionicons name="person-circle-outline" size={22} color="#555" />
                        <Text style={styles.menuItemText}>Account & Farm Info</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.menuDivider} />
                    
                    <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => {
                            setProfileMenuVisible(false);
                            logout();
                        }}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#d32f2f" />
                        <Text style={[styles.menuItemText, { color: '#d32f2f' }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

      <FlatList
        data={history.slice(0, 5)} // Show only recent 5
        renderItem={renderRecentItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recent scans.</Text>
            </View>
        }
      />
      
      {/* Floating Action Button for quick access */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('Diagnosis')}
      >
        <Ionicons name="camera" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    elevation: 2, // Slight shadow for the top bar itself
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9', // Light green background
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  heroContainer: {
    height: 280,
    margin: 16,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1b5e20',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 70, // Below the header
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 16,
    color: '#444',
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 0,
  },position: 'relative',
    // Make it span full width if desired, or keep margins. 
    // The image implies a full card or banner look.
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    padding: 24,
    justifyContent: 'center',
    height: '100%',
    zIndex: 10,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    left: 24,
  },
  brandText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    marginLeft: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 48,
    fontFamily: 'Roboto_700Bold',
    lineHeight: 52,
    marginBottom: 16,
    marginTop: 20,
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    opacity: 0.9,
  },
  // Simulated organic shapes for "leaves" if no image
  leafAccentRight: {
    position: 'absolute',
    bottom: -50,
    right: -20,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 200,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    transform: [{ rotate: '-10deg' }],
  },
  leafAccentLeft: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopRightRadius: 180,
    transform: [{ rotate: '20deg' }],
  },
  quickScanCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -40, // Overlap
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickScanTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#333',
  },
  quickScanSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    maxWidth: 150,
    fontFamily: 'Roboto_400Regular',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  scanButtonText: {
    color: '#fff',
    fontFamily: 'Roboto_700Bold',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Roboto_400Regular',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#333',
  },
  viewAllText: {
    color: '#4CAF50',
    fontFamily: 'Roboto_500Medium',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#333',
  },
  recentDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontFamily: 'Roboto_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Roboto_700Bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    fontFamily: 'Roboto_400Regular',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});

export default HomeScreen;
