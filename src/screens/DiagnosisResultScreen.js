import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const DiagnosisResultScreen = ({ route, navigation }) => {
  const { result } = route.params || {};
  // Mock data if no result passed (for testing)
  const data = result || {
    image: 'https://via.placeholder.com/400x300',
    diagnosis: 'Maize Streak Virus (MSV)',
    confidence: 0.94,
    date: new Date().toISOString(),
  };

  const isHealthy = data.diagnosis === 'Healthy';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with Image */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Diagnosis Result</Text>
            <MaterialIcons name="share" size={24} color="#000" />
        </View>

        <Image source={{ uri: data.image }} style={styles.image} />

        {/* Captured Sample Info */}
        <View style={styles.sampleInfo}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.sampleTitle}>Captured Sample</Text>
        </View>
        <Text style={styles.sampleSubtitle}>Analyzed {new Date(data.date).toLocaleString()}</Text>

        {/* Critical Detection Card */}
        <View style={[styles.card, styles.alertCard, { backgroundColor: isHealthy ? '#e6f4ea' : '#fff0f0' }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: isHealthy ? '#1e8e3e' : '#c5221f' }]}>
                    {isHealthy ? 'HEALTHY CROP' : 'CRITICAL DETECTION'}
                </Text>
            </View>
            <View style={styles.detectionRow}>
                <View style={styles.detectionInfo}>
                    <Text style={styles.diseaseName}>{data.diagnosis}</Text>
                    <Text style={styles.diseaseDesc}>
                        {isHealthy 
                            ? 'Your crop looks healthy. Continue monitoring.' 
                            : 'Characterized by thin, yellow-to-white streaks parallel to leaf veins. Immediate management required.'}
                    </Text>
                    <View style={styles.tags}>
                        {!isHealthy && (
                            <View style={styles.tag}>
                                <MaterialIcons name="warning" size={16} color="#c5221f" />
                                <Text style={styles.tagText}>High Severity</Text>
                            </View>
                        )}
                        <View style={styles.tag}>
                            <MaterialIcons name="eco" size={16} color="#c5221f" />
                            <Text style={styles.tagText}>Leaf Sample</Text>
                        </View>
                    </View>
                </View>
                {/* Confidence Ring Mockup */}
                <View style={styles.confidenceRing}>
                    <Text style={styles.confidenceValue}>{Math.round(data.confidence * 100)}%</Text>
                    <Text style={styles.confidenceLabel}>MATCH</Text>
                </View>
            </View>
        </View>

        {/* Analysis Precision */}
        <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Analysis Precision</Text>
            <View style={styles.precisionRow}>
                <Text style={styles.precisionLabel}>Deep Learning Confidence</Text>
                <Text style={styles.precisionValue}>{Math.round(data.confidence * 100)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${data.confidence * 100}%` }]} />
            </View>
            <Text style={styles.precisionNote}>Result verified against 12,000+ localized maize leaf patterns.</Text>
        </View>

        {/* Diagnostic Details Grid */}
        <Text style={styles.sectionHeader}>Diagnostic Details</Text>
        <View style={styles.grid}>
            <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>CROP VARIETY</Text>
                <Text style={styles.gridValue}>Zea mays</Text>
                <Text style={styles.gridValue}>(Maize)</Text>
            </View>
            <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>PATHOGEN</Text>
                <Text style={styles.gridValue}>{isHealthy ? 'None' : 'Mastrevirus'}</Text>
            </View>
            <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>AREA IMPACT</Text>
                <Text style={styles.gridValue}>{isHealthy ? 'None' : 'Moderate'}</Text>
            </View>
            <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>INCUBATION</Text>
                <Text style={styles.gridValue}>{isHealthy ? 'N/A' : '3-7 Days'}</Text>
            </View>
        </View>

      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {!isHealthy && (
            <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('ManagementAdvice', { diagnosis: data.diagnosis })}
            >
                <MaterialIcons name="local-hospital" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>View Management Advice</Text>
            </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Save Result to Journal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingBottom: 100,
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
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  sampleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#202124',
  },
  sampleSubtitle: {
    fontSize: 14,
    color: '#5f6368',
    paddingHorizontal: 16,
    marginLeft: 28,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
  },
  alertCard: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  detectionRow: {
    flexDirection: 'row',
  },
  detectionInfo: {
    flex: 1,
    paddingRight: 16,
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 8,
  },
  diseaseDesc: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 12,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  tagText: {
    fontSize: 12,
    color: '#5f6368',
    marginLeft: 4,
  },
  confidenceRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#c5221f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c5221f',
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#c5221f',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#202124',
  },
  precisionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  precisionLabel: {
    fontSize: 14,
    color: '#202124',
  },
  precisionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f1f3f4',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  precisionNote: {
    fontSize: 12,
    color: '#9aa0a6',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#202124',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  gridItem: {
    width: '46%', // Approx half with margin
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: '2%',
    elevation: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#5f6368',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202124',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#202124',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DiagnosisResultScreen;
