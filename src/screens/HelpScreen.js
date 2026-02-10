import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const HelpScreen = ({ navigation }) => {
  const guides = [
    {
      id: '1',
      title: 'App User Guide',
      description: 'Read the PDF-style manual for all features.',
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    },
  ];

  const localSupport = [
    {
      id: '1',
      title: 'Regional Agricultural Officer',
      subtitle: 'Central District Extension Office',
      phone: '+254 700 000 000',
      address: '123 Harvest Road, North Sector',
    },
    {
      id: '2',
      title: 'Maize Health Specialist',
      subtitle: 'Crop Protection Bureau',
      phone: '+254 711 222 333',
      address: '45 Field Street, South Sector',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="cloud-offline-outline" size={24} color="#52d017" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Guides & Handbooks Section */}
        <Text style={styles.sectionTitle}>Guides & Handbooks</Text>
        <View style={styles.sectionContainer}>
          {guides.map((item) => (
            <TouchableOpacity key={item.id} style={styles.guideCard}>
              <View style={styles.guideContent}>
                <Text style={styles.guideTitle}>{item.title}</Text>
                <Text style={styles.guideDescription}>{item.description}</Text>
              </View>
              <Image source={{ uri: item.image }} style={styles.guideImage} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Local Support Section */}
        <Text style={styles.sectionTitle}>Local Support</Text>
        <View style={styles.sectionContainer}>
          {localSupport.map((item) => (
            <View key={item.id} style={styles.supportCard}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={24} color="#52d017" />
              </View>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>{item.title}</Text>
                <Text style={styles.supportSubtitle}>{item.subtitle}</Text>
                
                <TouchableOpacity style={styles.contactRow}>
                    <Ionicons name="call" size={16} color="#52d017" style={{ marginRight: 8 }} />
                    <Text style={styles.phoneText}>{item.phone}</Text>
                </TouchableOpacity>
                
                <View style={styles.contactRow}>
                    <Ionicons name="location" size={16} color="#aaa" style={{ marginRight: 8 }} />
                    <Text style={styles.addressText}>{item.address}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Feedback Section */}
        <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
                <Ionicons name="chatbox-ellipses" size={24} color="#52d017" style={{ marginRight: 12 }} />
                <Text style={styles.feedbackTitle}>Feedback</Text>
            </View>
            <Text style={styles.feedbackDescription}>
                Your feedback will be saved and sent automatically when you are next online.
            </Text>
            <TouchableOpacity style={styles.feedbackButton}>
                <Text style={styles.feedbackButtonText}>Give Feedback</Text>
            </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a211d', // Dark green/black background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  guideCard: {
    flexDirection: 'row',
    backgroundColor: '#25332a', // Slightly lighter dark background
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideContent: {
    flex: 1,
    paddingRight: 16,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  guideDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  guideImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  supportCard: {
    flexDirection: 'row',
    backgroundColor: '#25332a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a211d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  phoneText: {
    color: '#52d017',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addressText: {
    color: '#aaa',
    fontSize: 14,
  },
  feedbackCard: {
    backgroundColor: '#1a211d',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#52d017',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
    marginBottom: 20,
  },
  feedbackButton: {
    backgroundColor: '#52d017',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HelpScreen;
