import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Image, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, issues: 0 });

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        setHistory(parsedHistory);
        
        // Calculate stats
        const total = parsedHistory.length;
        const issues = parsedHistory.filter(item => item.diagnosis.includes('Virus') || item.diagnosis.includes('Spot')).length;
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
    const isHealthy = item.diagnosis === 'Healthy';
    return (
      <TouchableOpacity 
        style={styles.recentItem}
        onPress={() => navigation.navigate('DiagnosisResult', { result: item })}
      >
        <Image source={{ uri: item.image }} style={styles.recentImage} />
        <View style={styles.recentInfo}>
          <Text style={styles.recentTitle}>{item.diagnosis}</Text>
          <Text style={styles.recentDate}>{new Date(item.date).toLocaleString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isHealthy ? '#e6f4ea' : '#fce8e6' }]}>
            <Text style={[styles.statusText, { color: isHealthy ? '#1e8e3e' : '#c5221f' }]}>
              {isHealthy ? 'Optimal' : 'Action Required'}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#dadce0" />
      </TouchableOpacity>
    );
  };

  const HeaderComponent = () => (
    <View>
      {/* Hero Section */}
      <View style={styles.heroCard}>
        <Image 
          source={require('../../assets/adaptive-icon.png')} 
          style={styles.heroBackground}
          blurRadius={10} 
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Instant Diagnosis</Text>
          <Text style={styles.heroSubtitle}>Keep your crops healthy and productive</Text>
        </View>
      </View>

      {/* Quick Scan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Scan</Text>
        <View style={styles.quickScanCard}>
          <Text style={styles.quickScanText}>Identify pests & diseases instantly</Text>
          <TouchableOpacity 
            style={styles.startScanButton}
            onPress={() => navigation.navigate('Diagnosis')}
          >
            <Text style={styles.startScanButtonText}>Start Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#e6f4ea' }]}>
             <MaterialIcons name="eco" size={24} color="#1e8e3e" />
          </View>
          <View>
            <Text style={styles.statLabel}>Total Scans</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fff7e0' }]}>
             <MaterialIcons name="warning" size={24} color="#f9ab00" />
          </View>
          <View>
            <Text style={styles.statLabel}>Issues Found</Text>
            <Text style={styles.statValue}>{stats.issues}</Text>
          </View>
        </View>
      </View>

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
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity>
           <MaterialIcons name="menu" size={24} color="#202124" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MaizeHealth</Text>
        <TouchableOpacity>
           <MaterialIcons name="account-circle" size={24} color="#202124" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={history.slice(0, 5)} // Show only recent 5
        renderItem={renderRecentItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={HeaderComponent}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recent scans.</Text>
            </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
  },
  listContent: {
    padding: 16,
  },
  heroCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#2d5a27', // Fallback color
    justifyContent: 'flex-end',
    position: 'relative',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroContent: {
    padding: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#e8eaed',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 12,
  },
  quickScanCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickScanText: {
    fontSize: 16,
    color: '#5f6368',
    marginBottom: 16,
  },
  startScanButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  startScanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#5f6368',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
  },
  viewAllText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  recentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 12,
    color: '#5f6368',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#5f6368',
  },
});

export default HomeScreen;
