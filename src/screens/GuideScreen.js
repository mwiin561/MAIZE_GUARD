import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GuideScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Maize Disease Library</Text>
      <View style={styles.content}>
        <Text style={styles.text}>Library content coming soon...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Roboto_400Regular',
  }
});

export default GuideScreen;
