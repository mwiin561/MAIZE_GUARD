import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = ({ navigation }) => {
  const [diseaseData, setDiseaseData] = useState([]);
  const [vectorData, setVectorData] = useState(null);
  const [totalScans, setTotalScans] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setTotalScans(history.length);

        if (history.length > 0) {
            // 1. Process Disease Breakdown
            const diseaseCounts = {};
            history.forEach(item => {
                const diagnosis = item.diagnosis || 'Unknown';
                diseaseCounts[diagnosis] = (diseaseCounts[diagnosis] || 0) + 1;
            });

            const processedDiseaseData = Object.keys(diseaseCounts).map(key => ({
                name: key,
                population: diseaseCounts[key],
                color: key === 'Healthy' ? '#2ecc71' : '#c0392b', // Green for Healthy, Red for MSV
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            }));
            
            setDiseaseData(processedDiseaseData);

            // 2. Process Leaf Hopper Data (Vector)
            const hopperCounts = { Yes: 0, No: 0, NotSure: 0 };
            history.forEach(item => {
                const obs = item.leafhopperObserved || 'Not Sure';
                if (obs === 'Yes') hopperCounts.Yes++;
                else if (obs === 'No') hopperCounts.No++;
                else hopperCounts.NotSure++;
            });

            setVectorData({
                labels: ["Observed", "Not Seen", "Unsure"],
                datasets: [{ data: [hopperCounts.Yes, hopperCounts.No, hopperCounts.NotSure] }]
            });
        }
      }
    } catch (e) {
      console.log('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Field Analytics</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Summary Card */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Scans</Text>
            <Text style={styles.bigNumber}>{totalScans}</Text>
            <Text style={styles.subtext}>Field Records Collected</Text>
        </View>

        {/* Disease Distribution Chart */}
        {diseaseData.length > 0 && (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Disease Distribution</Text>
                <PieChart
                    data={diseaseData}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={{
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />
            </View>
        )}

        {/* Vector Analysis Chart */}
        {vectorData && (
            <View style={styles.card}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom: 10}}>
                    <Ionicons name="bug-outline" size={24} color="#d35400" />
                    <Text style={[styles.cardTitle, {marginBottom:0, marginLeft: 10}]}>Leaf Hopper Presence</Text>
                </View>
                <Text style={styles.chartDesc}>Correlation with Maize Streak Virus</Text>
                
                <BarChart
                    data={vectorData}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(211, 84, 0, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: { borderRadius: 16 }
                    }}
                    style={{ marginVertical: 8, borderRadius: 16 }}
                />
            </View>
        )}

        {totalScans === 0 && (
            <Text style={styles.noData}>No data available yet. Start scanning to see analytics.</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    color: '#202124',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  subtext: {
    color: '#666',
    marginTop: 5,
  },
  chartDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  noData: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
  }
});

export default AnalyticsScreen;
