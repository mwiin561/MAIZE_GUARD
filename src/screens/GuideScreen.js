import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Mock Data matching the user's design image
const DISEASES = [
  {
    id: '1',
    name: 'Gray Leaf Spot',
    description: 'Rectangular lesions on leaves between veins',
    category: 'Fungal',
    image: 'https://placehold.co/300x300/2e7d32/white?text=Gray+Leaf+Spot'
  },
  {
    id: '2',
    name: 'Northern Blight',
    description: 'Cigar-shaped grayish-green lesions',
    category: 'Fungal',
    image: 'https://placehold.co/300x300/2e7d32/white?text=Northern+Blight'
  },
  {
    id: '3',
    name: 'Maize Streak',
    description: 'Stippled chlorotic streaks along leaf veins',
    category: 'Viral',
    image: 'https://placehold.co/300x300/2e7d32/white?text=Maize+Streak'
  },
  {
    id: '4',
    name: 'Common Smut',
    description: 'Large white galls on ears and tassels',
    category: 'Fungal',
    image: 'https://placehold.co/300x300/2e7d32/white?text=Common+Smut'
  },
  {
    id: '5',
    name: 'Southern Rust',
    description: 'Small, circular orange-red pustules',
    category: 'Fungal',
    image: 'https://placehold.co/300x300/2e7d32/white?text=Southern+Rust'
  },
  {
    id: '6',
    name: 'Mosaic Virus',
    description: 'Mottled or mosaic pattern on young leaves',
    category: 'Viral',
    image: 'https://placehold.co/300x300/2e7d32/white?text=Mosaic+Virus'
  },
];

const FILTERS = ['All', 'Fungal', 'Viral', 'Bacterial'];

const GuideScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filteredDiseases = DISEASES.filter(disease => {
    const matchesSearch = disease.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || disease.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={3}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maize Disease Library</Text>
        <View style={{ width: 28 }} /> 
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search diseases (e.g. Leaf Spot)..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.filterChip, 
                selectedFilter === item && styles.activeFilterChip
              ]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text style={[
                styles.filterText, 
                selectedFilter === item && styles.activeFilterText
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Grid */}
      <FlatList
        data={filteredDiseases}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#333',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  filterContainer: {
    marginBottom: 20,
    height: 40,
  },
  filterChip: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#4CAF50', // Green
    borderColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for FAB
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: (width - 56) / 2, // 20px padding * 2 + 16px gap = 56
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#eee',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 4,
    color: '#000',
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: '#888',
    lineHeight: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#52d017', // Brighter green from image
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default GuideScreen;
