import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const HistoryScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>History Screen</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default HistoryScreen;
