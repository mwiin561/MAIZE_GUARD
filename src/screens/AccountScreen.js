import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Platform, Modal, TouchableWithoutFeedback, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const AccountScreen = ({ navigation }) => {
  const { userInfo, updateProfile } = useContext(AuthContext);

  const [name, setName] = useState(userInfo?.name || '');
  const [region, setRegion] = useState(userInfo?.region || '');
  const [farmSize, setFarmSize] = useState(userInfo?.farmSize || '');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || '');
      setRegion(userInfo.region || '');
      setFarmSize(userInfo.farmSize || '');
    }
  }, [userInfo]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await updateProfile({
            name,
            region,
            farmSize
        });
        Alert.alert('Success', 'Profile updated successfully');
    } catch (e) {
        Alert.alert('Error', 'Failed to update profile');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account & Farm Profile</Text>
        <View style={{ width: 32 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Your Profile</Text>
          <Text style={styles.subtitle}>
            Manage your account and farm details.
          </Text>
        </View>

        {/* Email Field (Read-only) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.input, { backgroundColor: '#f0f0f0', justifyContent: 'center' }]}>
            <Text style={{ color: '#555' }}>{userInfo?.email}</Text>
          </View>
        </View>

        {/* Name Field */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Doe"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Region Field */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Region / Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rift Valley"
            placeholderTextColor="#999"
            value={region}
            onChangeText={setRegion}
          />
        </View>

        {/* Farm Size Field */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Farm Size (Acres)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5.5"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={farmSize}
            onChangeText={setFarmSize}
          />
        </View>

        <View style={{ height: 20 }} />

        {/* Save Button */}
        <TouchableOpacity 
            style={[styles.saveButton, isSaving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSaving}
        >
          {isSaving ? (
              <ActivityIndicator color="#fff" />
          ) : (
              <>
                  <Ionicons name="save-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#333',
  },
  headerButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollContent: {
    padding: 24,
  },
  titleSection: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Roboto_700Bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  saveButton: {
    height: 56,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#fff',
  },
});

export default AccountScreen;