import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Platform, Modal, TouchableWithoutFeedback, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import CustomDatePicker from '../components/CustomDatePicker';

const AccountScreen = ({ navigation }) => {
  const [farmName, setFarmName] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [unit, setUnit] = useState('Acres');
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const units = ['Acres', 'Hectares', 'Sq Meters', 'Sq Miles'];

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setIsLocating(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      Alert.alert('Location updated successfully!');
    } catch (error) {
      Alert.alert('Error fetching location', error.message);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Profile Setup</Text>
        <View style={{ width: 32 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Farm Details</Text>
          <Text style={styles.subtitle}>
            Help us customize your disease detection experience.
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Farm Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sunny Valley Estates"
            placeholderTextColor="#999"
            value={farmName}
            onChangeText={setFarmName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Crop Variety</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Yellow Dent Maize"
            placeholderTextColor="#999"
            value={cropVariety}
            onChangeText={setCropVariety}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Planting Date</Text>
          <View style={styles.dateInputContainer}>
            <TouchableOpacity style={styles.dateInput} onPress={showDatepicker}>
                <Text style={[styles.datePlaceholder, { color: '#000' }]}>
                    {date.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#5f6368" />
            </TouchableOpacity>
            
            <CustomDatePicker
                visible={showDatePicker}
                initialDate={date}
                onClose={() => setShowDatePicker(false)}
                onSelect={handleDateSelect}
            />
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
             <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80' }} 
                style={styles.mapImage} 
             />
             <View style={styles.pinContainer}>
                <Ionicons name="location" size={32} color="#52d017" />
             </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.outlineButton, location && styles.activeOutlineButton]} 
            onPress={handleUseCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
                <ActivityIndicator size="small" color="#52d017" style={{ marginRight: 8 }} />
            ) : (
                <Ionicons name={location ? "checkmark-circle" : "navigate-outline"} size={20} color="#52d017" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.outlineButtonText}>
                {isLocating ? "Locating..." : (location ? "Location Updated" : "Use Current Location")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Farm Size Section */}
        <View style={styles.formGroup}>
            <Text style={styles.label}>Farm Size</Text>
            <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 2, marginRight: 12 }]}>
                     <TextInput
                        style={styles.inputNoBorder}
                        placeholder="0.00"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={farmSize}
                        onChangeText={setFarmSize}
                    />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                    <TouchableOpacity 
                        style={styles.dropdownSelector}
                        onPress={() => setUnitMenuVisible(true)}
                    >
                        <Text style={styles.dropdownText}>{unit}</Text>
                        <Ionicons name="chevron-down" size={20} color="#5f6368" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>

        <View style={{ height: 20 }} />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="save-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.saveButtonText}>Save Farm Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Unit Selection Modal */}
      <Modal
        visible={unitMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUnitMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setUnitMenuVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.menuContainer}>
                    <Text style={styles.menuTitle}>Select Unit</Text>
                    {units.map((item) => (
                        <TouchableOpacity 
                            key={item}
                            style={styles.menuItem}
                            onPress={() => {
                                setUnit(item);
                                setUnitMenuVisible(false);
                            }}
                        >
                            <Text style={[
                                styles.menuItemText, 
                                unit === item && { color: '#52d017', fontFamily: 'Roboto_700Bold' }
                            ]}>
                                {item}
                            </Text>
                            {unit === item && <Ionicons name="checkmark" size={20} color="#52d017" />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
  },
  headerButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#666',
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#000',
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  dateInputContainer: {
    position: 'relative',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  datePlaceholder: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
    marginBottom: 12,
  },
  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#52d017',
    borderRadius: 25,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  outlineButtonText: {
    color: '#52d017',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  activeOutlineButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#52d017',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  inputNoBorder: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#000',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#52d017',
    borderRadius: 25,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#333',
  },
});

export default AccountScreen;
