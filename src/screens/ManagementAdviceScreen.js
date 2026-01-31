import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const ManagementAdviceScreen = ({ route, navigation }) => {
  const { diagnosis } = route.params || { diagnosis: 'Maize Streak Virus (MSV)' };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Management Advice</Text>
        <MaterialIcons name="share" size={24} color="#000" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Diagnosis Summary Card */}
        <View style={styles.summaryCard}>
            <Image 
                source={{ uri: 'https://via.placeholder.com/150' }} 
                style={styles.summaryImage} 
            />
            <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>DIAGNOSIS RESULTS</Text>
                <Text style={styles.summaryTitle}>{diagnosis} Detected</Text>
                <Text style={styles.summaryDesc} numberOfLines={3}>
                    A common viral disease in maize transmitted by leafhoppers. It causes significant yield loss if not managed early.
                </Text>
            </View>
        </View>

        <Text style={styles.sectionHeader}>Recommended Actions</Text>

        {/* Immediate Actions */}
        <View style={[styles.actionCard, { backgroundColor: '#fff8e1' }]}>
            <View style={styles.actionHeader}>
                <MaterialIcons name="warning" size={24} color="#f9ab00" />
                <Text style={styles.actionTitle}>Immediate Actions</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Isolate or remove heavily infected plants to stop spread.</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Control grass weeds in and around the field which may host the virus.</Text>
            </View>
        </View>

        {/* Long-term Prevention */}
        <View style={[styles.actionCard, { backgroundColor: '#fff' }]}>
            <View style={styles.actionHeader}>
                <MaterialIcons name="shield" size={24} color="#4CAF50" />
                <Text style={styles.actionTitle}>Long-term Prevention</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Practice 2-3 year crop rotation with non-host crops like soybeans.</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Select resistant hybrids (MSV resistant) for the next planting season.</Text>
            </View>
            <Image 
                source={{ uri: 'https://via.placeholder.com/100' }} 
                style={styles.actionImage} 
            />
        </View>

        {/* Chemical Control */}
        <View style={[styles.actionCard, { backgroundColor: '#fff5f5' }]}>
            <View style={styles.actionHeader}>
                <MaterialIcons name="science" size={24} color="#c5221f" />
                <Text style={styles.actionTitle}>Chemical Control</Text>
            </View>
            <Text style={styles.chemicalText}>
                If vector population is high, apply systemic insecticides like Imidacloprid as seed dressing or foliar spray. Consult local experts for regional recommendations.
            </Text>
        </View>

      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    elevation: 1,
  },
  summaryImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 4,
  },
  summaryDesc: {
    fontSize: 12,
    color: '#5f6368',
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 16,
  },
  actionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    position: 'relative',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202124',
    marginLeft: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 16,
  },
  bullet: {
    fontSize: 16,
    color: '#5f6368',
    marginRight: 8,
  },
  bulletText: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
  },
  chemicalText: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
  },
  actionImage: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 60,
    height: 60,
    borderRadius: 8,
    opacity: 0.8,
  },
});

export default ManagementAdviceScreen;
