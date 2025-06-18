import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Image, Alert, ActivityIndicator, Button } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feed from './Feed';
import Icon from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import InviteFriendsModal from './InviteFriendsModal';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [activeScreen, setActiveScreen] = useState('Feed');
  const [postText, setPostText] = useState('');
  const [currentUserState, setCurrentUserState] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCache, setProfileCache] = useState({});
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

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
    const userDoc = await firestore().collection('users').doc(userId).get();
    if (userDoc.exists) {
      const profileData = userDoc.data();
      cacheUserProfile(userId, profileData);
      return profileData;
    }
    return null;
  }, [profileCache, cacheUserProfile]);

  // Fetch friend count
  const fetchFriendCount = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No current user found for friend count');
        setFriendCount(0);
        return;
      }

      console.log('Fetching friend count for user:', currentUser.uid);
      
      const friendsSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('friends')
        .get();

      // Filter out the initialization document
      const count = friendsSnapshot.docs.filter(doc => doc.id !== '_init').length;
      console.log('Friend count:', count);
      setFriendCount(count);
    } catch (error) {
      console.error('Error fetching friend count:', error);
      console.error('Error details:', error.message, error.code);
      setFriendCount(0);
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async user => {
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
          fetchFriendCount();
        } catch (error) {
          console.error('Error fetching user profile:', error);
          Alert.alert('Error', 'Failed to load user profile');
        } finally {
          setIsLoading(false);
        }
      }
    });
    return subscriber;
  }, [auth, getUserProfile, fetchFriendCount]);

  // Listen for unread notifications
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('notifications')
      .where('userId', '==', currentUser.uid)
      .where('read', '==', false)
      .onSnapshot(snapshot => {
        setUnreadNotifications(snapshot.docs.length);
      }, error => {
        console.error('Error listening to notifications:', error);
        Alert.alert('Error', 'Error listening to notifications: ' + error.message);
      });

    return () => unsubscribe();
  }, []);

  // Set Feed as active screen when HomeScreen mounts or returns
  useFocusEffect(
    useCallback(() => {
      setActiveScreen('Feed');
    }, [])
  );

  // Debug function to test friends system
  const debugFriendsSystem = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No current user');
        return;
      }

      console.log('=== DEBUGGING FRIENDS SYSTEM ===');
      console.log('Current user:', currentUser.uid);

      // Test 1: Check if user document exists
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      console.log('User document exists:', userDoc.exists);

      // Test 2: Try to create friends subcollection
      try {
        await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .collection('friends')
          .doc('_test')
          .set({ test: true, timestamp: firestore.FieldValue.serverTimestamp() });
        console.log('✅ Successfully created test document in friends subcollection');
        
        // Clean up test document
        await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .collection('friends')
          .doc('_test')
          .delete();
        console.log('✅ Successfully deleted test document');
      } catch (error) {
        console.error('❌ Error creating test document:', error);
      }

      // Test 3: Check friends subcollection
      const friendsSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('friends')
        .get();
      
      console.log('Friends subcollection exists, count:', friendsSnapshot.docs.length);
      
      // List all friends
      friendsSnapshot.docs.forEach(doc => {
        console.log('Friend ID:', doc.id, 'Data:', doc.data());
      });

      // Test 4: Try to create a friend request
      try {
        const testRequest = await firestore().collection('friend_requests').add({
          from: currentUser.uid,
          to: 'test_user_id',
          status: 'pending',
          createdAt: firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Successfully created test friend request:', testRequest.id);
        
        // Clean up test request
        await firestore().collection('friend_requests').doc(testRequest.id).delete();
        console.log('✅ Successfully deleted test friend request');
      } catch (error) {
        console.error('❌ Error creating test friend request:', error);
      }

      // Test 5: Try to create a notification
      try {
        const testNotification = await firestore().collection('notifications').add({
          userId: currentUser.uid,
          senderId: 'test_sender',
          type: 'test',
          message: 'Test notification',
          timestamp: firestore.FieldValue.serverTimestamp(),
          read: false
        });
        console.log('✅ Successfully created test notification:', testNotification.id);
        
        // Clean up test notification
        await firestore().collection('notifications').doc(testNotification.id).delete();
        console.log('✅ Successfully deleted test notification');
      } catch (error) {
        console.error('❌ Error creating test notification:', error);
      }

      const actualFriendCount = friendsSnapshot.docs.filter(doc => doc.id !== '_init' && doc.id !== '_test').length;
      Alert.alert('Debug Info', 
        `✅ User exists: ${userDoc.exists}\n` +
        `✅ Friends count: ${actualFriendCount}\n` +
        `✅ Subcollection accessible\n` +
        `Check console for detailed results`
      );
    } catch (error) {
      console.error('Debug error:', error);
      Alert.alert('Debug Error', error.message);
    }
  };

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
    if (!postText.trim()) return;

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to post');
        return;
      }

      await firestore().collection('posts').add({
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        userPhotoURL: currentUser.photoURL || null,
        text: postText.trim(),
        timestamp: firestore.FieldValue.serverTimestamp(),
        likes: 0,
        comments: 0
      });

      setPostText('');
      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create post: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Temporary Debug Button */}
      <TouchableOpacity 
        style={{ 
          position: 'absolute', 
          top: 50, 
          right: 20, 
          backgroundColor: '#FF6B6B', 
          padding: 10, 
          borderRadius: 20,
          zIndex: 1000
        }}
        onPress={debugFriendsSystem}
      >
        <Text style={{ color: '#fff', fontSize: 12 }}>Debug</Text>
      </TouchableOpacity>
      
      <ImageBackground 
        source={require('../Assets/images/welcome.jpg')}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.headerContent}>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.inviteButton} onPress={() => setInviteModalVisible(true)}>
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('NotificationScreen')}
            >
              <Icon name="bell" size={24} color="#fff" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
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
          onPress={() => navigation.navigate('ChatList')}
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
          style={[styles.navButton, activeScreen === 'Friends' && styles.activeNavButton]}
          onPress={() => setInviteModalVisible(true)}
        >
          <Icon
            name="people"
            size={24}
            color={activeScreen === 'Friends' ? '#007AFF' : '#666'}
          />
          {friendCount > 0 && (
            <View style={styles.friendBadge}>
              <Text style={styles.friendBadgeText}>
                {friendCount > 99 ? '99+' : friendCount}
              </Text>
            </View>
          )}
          <Text style={[styles.navText, activeScreen === 'Friends' && styles.activeNavText]}>
            Friends
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
      <InviteFriendsModal 
        visible={inviteModalVisible} 
        onClose={() => {
          setInviteModalVisible(false);
          fetchFriendCount(); // Refresh friend count when modal closes
        }} 
      />
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
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 1,
    minWidth: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  friendBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 1,
    minWidth: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
