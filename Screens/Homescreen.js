import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feed from './Feed';
import Icon from 'react-native-vector-icons/FontAwesome';
// Import modular functions
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, serverTimestamp, getDoc } from '@react-native-firebase/firestore';
import { firestore } from '../firebase/config';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [activeScreen, setActiveScreen] = useState('Feed');
  const [postText, setPostText] = useState('');
  const [currentUserState, setCurrentUserState] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCache, setProfileCache] = useState({});

  const db = getFirestore();
  const auth = getAuth();

  // Cache user profile data
  const cacheUserProfile = useCallback((userId, profileData) => {
    setProfileCache(prev => ({
      ...prev,
      [userId]: {
        data: profileData,
        timestamp: Date.now()
      }
    }));
  }, []);

  // Get user profile with caching
  const getUserProfile = useCallback(async (userId) => {
    // Check cache first
    const cachedProfile = profileCache[userId];
    if (cachedProfile && Date.now() - cachedProfile.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cachedProfile.data;
    }

    // If not in cache or expired, fetch from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const profileData = userDoc.data();
      cacheUserProfile(userId, profileData);
      return profileData;
    }
    return null;
  }, [db, profileCache, cacheUserProfile]);

  // Listen for authentication state changes
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async user => {
      setCurrentUserState(user);
      if (user) {
        setIsLoading(true);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            // Set default profile if none exists
            setUserProfile({
              name: user.displayName || 'User',
              gender: 'male',
              profilePicture: null
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          Alert.alert('Error', 'Failed to load user profile');
        } finally {
          setIsLoading(false);
        }
      }
    });
    return subscriber;
  }, [auth, getUserProfile]);

  // Set Feed as active screen when HomeScreen mounts or returns
  useFocusEffect(
    useCallback(() => {
      setActiveScreen('Feed');
    }, [])
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
        createdAt: serverTimestamp(),
        likes: 0,
        comments: []
      };

      await addDoc(collection(db, 'posts'), postData);

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
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('NotificationScreen')}
            >
              <Icon name="bell" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome {currentUserState?.displayName}</Text>
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
          style={[styles.navButton, activeScreen === 'Chat' && styles.activeNavButton]}
          onPress={() => navigation.navigate('ChatScreen', { groupId: 'main', groupName: 'Main Chat' })}
        >
          <Icon
            name="comments"
            size={24}
            color={activeScreen === 'Chat' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.navText, activeScreen === 'Chat' && styles.activeNavText]}>
            Chat
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
    fontSize: 30,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
