import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Image, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feed from './Feed';
import Icon from 'react-native-vector-icons/FontAwesome';
import { auth, firestore } from '../firebase/config';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [activeScreen, setActiveScreen] = useState('Feed');
  const [postText, setPostText] = useState('');
  const [currentUserState, setCurrentUserState] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setCurrentUserState(user);
      if (user) {
        // Fetch user profile data
        const unsubscribe = firestore()
          .collection('users')
          .doc(user.uid)
          .onSnapshot(doc => {
            if (doc && doc.exists) {
              setUserProfile(doc.data());
            } else {
              // Set default profile if none exists
              setUserProfile({
                name: user.displayName || 'User',
                gender: 'male',
                profilePicture: null
              });
            }
          });
        return unsubscribe;
      }
    });
    return subscriber;
  }, []);

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
    if (screenName === 'Feed') {
      // If it's Feed, just update the active screen
      return;
    }
    // For other screens, navigate to them
    navigation.navigate(screenName);
  };

  const handlePost = async () => {
    if (!postText.trim() || !currentUserState) return;

    try {
      const postData = {
        content: postText.trim(),
        userId: currentUserState.uid,
        userName: currentUserState.displayName || userProfile?.name || 'User',
        userProfilePicture: userProfile?.profilePicture || null,
        userGender: userProfile?.gender || 'male',
        createdAt: firestore.FieldValue.serverTimestamp(),
        likes: 0,
        comments: []
      };

      await firestore()
        .collection('posts')
        .add(postData);

      setPostText(''); // Clear the input after posting
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
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
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="bell" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{currentUserState?.displayName}</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Post Creation Section */}
      <View style={styles.postCreationContainer}>
        <View style={styles.postInputContainer}>
          <View style={styles.postHeader}>
            <Image
              source={
                userProfile?.profilePicture
                  ? { uri: userProfile.profilePicture }
                  : userProfile?.gender === 'female'
                  ? require('../Assets/images/female.jpg')
                  : require('../Assets/images/male.jpg')
              }
              style={styles.postUserImage}
            />
            <TextInput
              style={styles.postInput}
              placeholder="Share your thoughts..."
              placeholderTextColor="#666"
              multiline
              value={postText}
              onChangeText={setPostText}
            />
          </View>
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

      {activeScreen === 'Feed' && <Feed />}
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
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  notificationButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postInput: {
    flex: 1,
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
