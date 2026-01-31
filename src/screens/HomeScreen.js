import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Image, ScrollView, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, issues: 0 });

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
        <View style={styles.heroBackground}>
             {/* Using a color placeholder or local image if available. 
                 Ideally this would be a real image of a corn field */}
             <View style={styles.heroOverlay} />
        </View>
        <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Instant Diagnosis</Text>
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
        <TouchableOpacity>
            <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.appName}>MaizeHealth</Text>
        <TouchableOpacity>
            <Ionicons name="person-circle-outline" size={32} color="#333" />
        </TouchableOpacity>
      </View>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    paddingBottom: 80,
  },
  heroContainer: {
    height: 200,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2e7d32', // Fallback color
    position: 'relative',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1b5e20', // Darker green for contrast
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroContent: {
    padding: 24,
    justifyContent: 'center',
    height: '100%',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
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
    fontWeight: 'bold',
    color: '#333',
  },
  quickScanSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    maxWidth: 150,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    color: '#4CAF50',
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#333',
  },
  recentDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
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
