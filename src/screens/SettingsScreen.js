import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);

  const SettingItem = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <MaterialIcons name={icon} size={24} color="#5f6368" />
        <Text style={styles.itemText}>{title}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#dadce0" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <View style={styles.section}>
        <SettingItem 
            icon="person" 
            title="Profile & Farm Details" 
            onPress={() => navigation.navigate('FarmProfile')}
        />
        <SettingItem 
            icon="cloud-off" 
            title="Offline Database" 
            onPress={() => navigation.navigate('OfflineDatabase')}
        />
        <SettingItem 
            icon="file-download" 
            title="Export Data (CSV)" 
            onPress={() => {}}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202124',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f3f4',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#202124',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  logoutText: {
    color: '#d93025',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsScreen;
