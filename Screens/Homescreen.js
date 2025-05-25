import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feed from './Feed';
import Icon from 'react-native-vector-icons/FontAwesome';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [activeScreen, setActiveScreen] = useState('Feed');
  const [postText, setPostText] = useState('');

  // Set Feed as active screen when HomeScreen mounts
  useEffect(() => {
    setActiveScreen('Feed');
  }, []);

  // Set Feed as active screen when returning to HomeScreen
  useFocusEffect(
    React.useCallback(() => {
      setActiveScreen('Feed');
    }, [])
  );

  const handleNavigation = (screenName) => {
    setActiveScreen(screenName);
    // Only navigate if it's not Feed
    if (screenName !== 'Feed') {
      navigation.navigate(screenName);
    }
  };

  const handlePost = () => {
    if (postText.trim()) {
      // Here you would typically handle the post submission
      console.log('Posting:', postText);
      setPostText(''); // Clear the input after posting
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../Assets/images/welcome.jpg')}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.inviteButton}>
            <Text style={styles.inviteButtonText}>Invite Friends</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Hey Asfand!</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Post Creation Section */}
      <View style={styles.postCreationContainer}>
        <View style={styles.postInputContainer}>
          <TextInput
            style={styles.postInput}
            placeholder="Share your thoughts..."
            placeholderTextColor="#666"
            multiline
            value={postText}
            onChangeText={setPostText}
          />
        </View>
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.postActionButton}>
            <Icon name="paperclip" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.postActionButton}>
            <Icon name="image" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.postButton, !postText.trim() && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!postText.trim()}
          >
            <Text style={[styles.postButtonText, !postText.trim() && styles.postButtonTextDisabled]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, activeScreen === 'Feed' && styles.activeNavButton]}
          onPress={() => handleNavigation('Feed')}
        >
          <Icon
            name="home"
            size={24}
            color={activeScreen === 'Feed' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.navText, activeScreen === 'Feed' && styles.activeNavText]}>
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeScreen === 'Explore' && styles.activeNavButton]}
          onPress={() => handleNavigation('Explore')}
        >
          <Icon
            name="compass"
            size={24}
            color={activeScreen === 'Explore' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.navText, activeScreen === 'Explore' && styles.activeNavText]}>
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeScreen === 'Profile' && styles.activeNavButton]}
          onPress={() => handleNavigation('Profile')}
        >
          <Icon
            name="user"
            size={24}
            color={activeScreen === 'Profile' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.navText, activeScreen === 'Profile' && styles.activeNavText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <Feed />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 200,
    width: '100%',
  },
  headerContent: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  postCreationContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postInputContainer: {
    marginBottom: 12,
  },
  postInput: {
    height: 40,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  postActionButton: {
    padding: 8,
    marginRight: 8,
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: '#666',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
  },
  activeNavButton: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  navText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  activeNavText: {
    color: '#007AFF',
  },
});

export default HomeScreen;
