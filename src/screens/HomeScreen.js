import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const { logout, userInfo } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [isGrid, setIsGrid] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      if (stored) {
        setHistory(JSON.parse(stored));
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

  const renderItem = ({ item }) => {
    const isVirus = item.diagnosis.includes('Virus');
    return (
      <TouchableOpacity 
        style={[styles.card, isGrid ? styles.cardGrid : styles.cardList]}
        onPress={() => alert('Detail view coming soon')}
      >
        <Image source={{ uri: item.image }} style={isGrid ? styles.cardImageGrid : styles.cardImageList} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.diagnosis}</Text>
          <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isVirus ? '#fce8e6' : '#e6f4ea' }]}>
            <Text style={[styles.statusText, { color: isVirus ? '#c5221f' : '#1e8e3e' }]}>
              {isVirus ? 'Infected' : 'Healthy'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
             <Text style={styles.title}>Maize Guard</Text>
             <Text style={styles.welcome}>Welcome, {userInfo?.email?.split('@')[0]}</Text>
        </View>
        <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={() => navigation.navigate('Analytics')} style={styles.iconButton}>
                <Text style={styles.iconText}>Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsGrid(!isGrid)} style={styles.iconButton}>
                <Text style={styles.iconText}>{isGrid ? 'List' : 'Grid'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.iconButton}>
                <Text style={styles.iconText}>Logout</Text>
            </TouchableOpacity>
        </View>
      </View>

      <FlatList
        key={isGrid ? 'grid' : 'list'}
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={isGrid ? 2 : 1}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No diagnoses yet.</Text>
            <Text style={styles.emptySubtext}>Tap the + button to start.</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('Diagnosis')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202124',
  },
  welcome: {
      fontSize: 14,
      color: '#5f6368',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  iconText: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  cardGrid: {
    flex: 1,
    margin: 4,
    maxWidth: '48%',
  },
  cardList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImageGrid: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardImageList: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#5f6368',
    marginBottom: 6,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    marginTop: -4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#202124',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#5f6368',
  },
});

export default HomeScreen;
