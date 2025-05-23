import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';

const Feed = () => {
  return (
    <ScrollView style={styles.feedContainer}>
      {/* Sample Feed Items */}
      <View style={styles.feedItem}>
        <View style={styles.feedHeader}>
          <ImageBackground 
            source={require('../Assets/images/welcome.jpg')}
            style={styles.feedUserImage}
          >
            <View style={styles.feedUserImageOverlay} />
          </ImageBackground>
          <View style={styles.feedUserInfo}>
            <Text style={styles.feedUserName}>John Doe</Text>
            <Text style={styles.feedTime}>2 hours ago</Text>
          </View>
        </View>
        <Text style={styles.feedContent}>
          Just completed a 2-hour study session! Feeling productive and motivated. #StudyGoals
        </Text>
        <View style={styles.feedActions}>
          <TouchableOpacity style={styles.feedActionButton}>
            <Text style={styles.feedActionText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedActionButton}>
            <Text style={styles.feedActionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedActionButton}>
            <Text style={styles.feedActionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.feedItem}>
        <View style={styles.feedHeader}>
          <ImageBackground 
            source={require('../Assets/images/welcome.jpg')}
            style={styles.feedUserImage}
          >
            <View style={styles.feedUserImageOverlay} />
          </ImageBackground>
          <View style={styles.feedUserInfo}>
            <Text style={styles.feedUserName}>Jane Smith</Text>
            <Text style={styles.feedTime}>4 hours ago</Text>
          </View>
        </View>
        <Text style={styles.feedContent}>
          Working on my final project. The deadline is approaching but I'm making good progress! 💪
        </Text>
        <View style={styles.feedActions}>
          <TouchableOpacity style={styles.feedActionButton}>
            <Text style={styles.feedActionText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedActionButton}>
            <Text style={styles.feedActionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedActionButton}>
            <Text style={styles.feedActionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    flex: 1,
    padding: 15,
  },
  feedItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  feedUserImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feedTime: {
    fontSize: 12,
    color: '#666',
  },
  feedContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
  },
  feedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  feedActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  feedActionText: {
    color: '#666',
    fontSize: 14,
  },
});

export default Feed;