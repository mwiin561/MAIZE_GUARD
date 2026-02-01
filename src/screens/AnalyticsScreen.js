import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('diagnosisHistory');
      if (stored) {
        const history = JSON.parse(stored);
        const total = history.length;
        const infected = history.filter(item => item.diagnosis.includes('Virus')).length;
        const healthy = total - infected;

        if (total > 0) {
            const chartData = [
            {
                name: 'Infected',
                population: infected,
                color: '#c5221f',
                legendFontColor: '#7F7F7F',
                legendFontSize: 15,
                legendFontFamily: 'Roboto_400Regular',
            },
            {
                name: 'Healthy',
                population: healthy,
                color: '#1e8e3e',
                legendFontColor: '#7F7F7F',
                legendFontSize: 15,
                legendFontFamily: 'Roboto_400Regular',
            },
            ];
            setData(chartData);
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
      <Text style={styles.title}>Infection Analysis</Text>
      {data.length > 0 ? (
        <View style={styles.chartContainer}>
          <PieChart
            data={data}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
          <Text style={styles.summary}>
            Total Scans: {data.reduce((acc, curr) => acc + curr.population, 0)}
          </Text>
        </View>
      ) : (
        <Text style={styles.noData}>No data available yet.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 20,
    color: '#202124',
  },
  chartContainer: {
    alignItems: 'center',
  },
  summary: {
    marginTop: 20,
    fontSize: 18,
    color: '#5f6368',
    fontFamily: 'Roboto_400Regular',
  },
  noData: {
    fontSize: 16,
    color: '#5f6368',
    marginTop: 40,
    fontFamily: 'Roboto_400Regular',
  },
});

export default AnalyticsScreen;
