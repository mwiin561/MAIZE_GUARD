import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { API_URL } from '../api/client';

const SERVER_URL = API_URL.replace('/api', '');

const HistoryItem = ({ item }) => {
    const [imageError, setImageError] = useState(false);
    const isInfected = item.diagnosis === 'Maize Streak Virus';

    // Resolve Image Source
    let imageSource = null;
    if (item.image && !item.image.startsWith('blob:')) {
        imageSource = { uri: item.image };
    } else if (item.remoteImage) {
        const uri = item.remoteImage.startsWith('http') 
            ? item.remoteImage 
            : `${SERVER_URL}${item.remoteImage}`;
        imageSource = { uri };
    }
    
    return (
      <TouchableOpacity style={styles.card}>
        {imageError || !imageSource ? (
            <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}>
                <Ionicons name="image-outline" size={24} color="#999" />
            </View>
        ) : (
            <Image 
                source={imageSource} 
                style={styles.cardImage} 
                onError={() => setImageError(true)}
            />
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.diagnosis}</Text>
          <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          {item.userEmail && (
            <Text style={styles.cardUser}>By {item.userEmail}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isInfected ? '#ffebee' : '#e8f5e9' }]}>
            <Text style={[styles.statusText, { color: isInfected ? '#c62828' : '#2e7d32' }]}>
                {isInfected ? 'Action Req' : 'Optimal'}
            </Text>
        </View>
      </TouchableOpacity>
    );
};

const HistoryScreen = ({ navigation, route }) => {
  const [history, setHistory] = useState([]);
  const filterType = route && route.params && route.params.filterType ? route.params.filterType : 'all';

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      if (stored) {
        let allHistory = JSON.parse(stored);
        let filtered = allHistory;
        if (filterType === 'issues') {
          filtered = allHistory.filter(item => item.diagnosis === 'Maize Streak Virus');
        }
        setHistory(filtered.slice(0, 50));
      }
    } catch (e) {
      console.log('Failed to load history');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [filterType])
  );

  const renderItem = ({ item }) => {
    return <HistoryItem item={item} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Scan History</Text>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No scans yet</Text>
            </View>
        }
      />
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
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#333',
  },
  cardDate: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    fontFamily: 'Roboto_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Roboto_700Bold',
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      color: '#888',
      fontSize: 16,
      fontFamily: 'Roboto_400Regular',
  }
});

export default HistoryScreen;
