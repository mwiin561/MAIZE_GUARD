import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const FarmProfileScreen = ({ navigation }) => {
  const [farmName, setFarmName] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [farmSize, setFarmSize] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Profile Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Farm Details</Text>
        <Text style={styles.sectionDesc}>Help us customize your disease detection experience.</Text>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Farm Name</Text>
            <TextInput 
                style={styles.input} 
                placeholder="e.g. Sunny Valley Estates" 
                value={farmName}
                onChangeText={setFarmName}
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Crop Variety</Text>
            <TextInput 
                style={styles.input} 
                placeholder="e.g. Yellow Dent Maize" 
                value={cropVariety}
                onChangeText={setCropVariety}
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Planting Date</Text>
            <TouchableOpacity style={styles.dateInput}>
                <Text style={styles.datePlaceholder}>{plantingDate || 'Select date'}</Text>
                <MaterialIcons name="event" size={24} color="#5f6368" />
            </TouchableOpacity>
        </View>

        <Text style={styles.label}>Farm Size</Text>
        <View style={styles.row}>
            <TextInput 
                style={[styles.input, { flex: 1, marginRight: 12 }]} 
                placeholder="0.00" 
                value={farmSize}
                onChangeText={setFarmSize}
                keyboardType="numeric"
            />
            <View style={styles.unitSelector}>
                <Text style={styles.unitText}>Acres</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#5f6368" />
            </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="save" size={24} color="#fff" />
            <Text style={styles.saveButtonText}>Save Farm Profile</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#202124',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    padding: 12,
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#9aa0a6',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    width: 100,
  },
  unitText: {
    fontSize: 16,
    color: '#202124',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default FarmProfileScreen;
