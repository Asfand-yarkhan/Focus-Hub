import React, { useState, useEffect, useCallback, memo, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { userStorage } from '../utils/userStorage';
import { ThemeContext } from '../App';

const Profile = ({ route }) => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [friendRequestStatus, setFriendRequestStatus] = useState(null); // 'pending', 'accepted', 'none'
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestId, setRequestId] = useState(null); // Add this to track the request ID
  const { darkMode } = useContext(ThemeContext);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      const currentUser = auth().currentUser;
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if we're viewing another user's profile
      const targetUserId = route?.params?.userId;
      if (targetUserId && targetUserId !== currentUser.uid) {
        setIsOwnProfile(false);
        
        // Fetch other user's data
        const userDoc = await firestore()
          .collection('users')
          .doc(targetUserId)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          setUser({
            id: targetUserId,
            name: userData.username || userData.name || 'User',
            email: userData.email || '',
            photoURL: userData.profilePicture || userData.photoURL || null,
            gender: userData.gender || 'male',
            phone: userData.phone || '',
            dateOfBirth: userData.dateOfBirth || '',
            university: userData.university || '',
            degree: userData.degree || '',
            semester: userData.semester || '',
          });

          // Check friend request status
          await checkFriendRequestStatus(currentUser.uid, targetUserId);
        } else {
          setError('User not found');
        }
      } else {
        // Viewing own profile
        setIsOwnProfile(true);
        
        // Try to get cached data first
        if (!forceRefresh) {
          const cachedProfile = await userStorage.getUserProfile();
          if (cachedProfile) {
            setUser(cachedProfile);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const userDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();

        const userData = userDoc.exists ? userDoc.data() : {};
        const newUserData = {
          name: currentUser.displayName || userData.name || 'User',
          email: currentUser.email || userData.email,
          photoURL: currentUser.photoURL || userData.profilePicture || null,
          gender: userData.gender || 'male',
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth || '',
          university: userData.university || '',
          degree: userData.degree || '',
          semester: userData.semester || '',
          lastUpdated: new Date().toISOString()
        };

        // Cache the new data
        await userStorage.saveUserProfile(newUserData);
        setUser(newUserData);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route?.params?.userId]);

  const checkFriendRequestStatus = async (currentUserId, targetUserId) => {
    try {
      console.log('Checking friend request status between:', currentUserId, 'and', targetUserId);
      
      // Check if there's a pending request from current user to target user
      const outgoingRequest = await firestore()
        .collection('friend_requests')
        .where('from', '==', currentUserId)
        .where('to', '==', targetUserId)
        .where('status', '==', 'pending')
        .get();

      if (!outgoingRequest.empty) {
        console.log('Found outgoing pending request');
        setFriendRequestStatus('pending');
        setRequestId(outgoingRequest.docs[0].id);
        return;
      }

      // Check if there's a pending request from target user to current user
      const incomingRequest = await firestore()
        .collection('friend_requests')
        .where('from', '==', targetUserId)
        .where('to', '==', currentUserId)
        .where('status', '==', 'pending')
        .get();

      if (!incomingRequest.empty) {
        console.log('Found incoming pending request');
        setFriendRequestStatus('received');
        setRequestId(incomingRequest.docs[0].id);
        return;
      }

      // Check if they're already friends (accepted requests)
      const acceptedRequests = await firestore()
        .collection('friend_requests')
        .where('status', '==', 'accepted')
        .get();

      const isFriend = acceptedRequests.docs.some(doc => {
        const data = doc.data();
        return (data.from === currentUserId && data.to === targetUserId) ||
               (data.from === targetUserId && data.to === currentUserId);
      });

      if (isFriend) {
        console.log('Users are already friends');
        setFriendRequestStatus('accepted');
        setRequestId(null);
      } else {
        console.log('No friend request found');
        setFriendRequestStatus('none');
        setRequestId(null);
      }
    } catch (error) {
      console.error('Error checking friend request status:', error);
      setFriendRequestStatus('none');
      setRequestId(null);
    }
  };

  const sendFriendRequest = async () => {
    if (!user || isOwnProfile) return;
    
    setRequestLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to send friend requests');
        return;
      }

      // Create friend request
      const requestData = {
        from: currentUser.uid,
        to: user.id,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        fromName: currentUser.displayName || 'Anonymous User',
        toName: user.name || 'Anonymous User',
        fromPhotoURL: currentUser.photoURL || null,
        toPhotoURL: user.photoURL || null
      };

      // Get the document reference to store the request ID
      const requestRef = await firestore().collection('friend_requests').add(requestData);
      setRequestId(requestRef.id); // Store the request ID

      // Create notification
      try {
        if (!user.id) throw new Error('Recipient userId missing');
        await firestore().collection('notifications').add({
          userId: user.id,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Anonymous User',
          senderPhotoURL: currentUser.photoURL || null,
          type: 'friend_request',
          message: `${currentUser.displayName || 'Someone'} sent you a friend request`,
          timestamp: firestore.FieldValue.serverTimestamp(),
          read: false
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        Alert.alert('Error', 'Failed to create notification: ' + notificationError.message);
      }

      setFriendRequestStatus('pending');
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setRequestLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId, fromUserId) => {
    try {
      console.log('Accepting friend request:', requestId, 'from user:', fromUserId);
      
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to accept friend requests');
        return;
      }

      if (!requestId || !fromUserId) {
        Alert.alert('Error', 'Invalid request data');
        return;
      }

      // Update friend request status
      await firestore().collection('friend_requests').doc(requestId).update({
        status: 'accepted',
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      console.log('Friend request status updated');

      // Add to current user's friends subcollection
      await firestore().collection('users').doc(currentUser.uid)
        .collection('friends').doc(fromUserId).set({ 
          since: firestore.FieldValue.serverTimestamp(),
          addedAt: new Date()
        });
      console.log('Added to current user friends');

      // Add current user to the other user's friends subcollection
      await firestore().collection('users').doc(fromUserId)
        .collection('friends').doc(currentUser.uid).set({ 
          since: firestore.FieldValue.serverTimestamp(),
          addedAt: new Date()
        });
      console.log('Added to other user friends');

      // Send notification to sender
      await firestore().collection('notifications').add({
        userId: fromUserId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous User',
        type: 'friend_accept',
        message: `${currentUser.displayName || 'Someone'} accepted your friend request`,
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false
      });
      console.log('Notification sent');

      setFriendRequestStatus('accepted');
      setRequestId(null); // Clear the request ID after accepting
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      console.error('Error details:', error.message, error.code);
      Alert.alert('Error', 'Failed to accept request: ' + (error.message || 'Unknown error'));
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await firestore().collection('friend_requests').doc(requestId).update({
        status: 'rejected',
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      setFriendRequestStatus('none');
      setRequestId(null); // Clear the request ID after rejecting
      Alert.alert('Success', 'Friend request rejected.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request: ' + (error.message || ''));
    }
  };

  // Initial load
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData(true);
    }, [fetchUserData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData(true);
  }, [fetchUserData]);

  const menuItems = [
    { icon: 'user', title: 'Edit Profile', screen: 'EditProfile' },
    { icon: 'lock', title: 'Privacy', screen: 'Privacy' },
    { icon: 'question-circle', title: 'Help & Support', screen: 'Support' },
    { icon: 'info-circle', title: 'About', screen: 'About' },
  ];

  const handleLogout = async () => {
    try {
      await userStorage.clearUserData();
      await auth().signOut();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <Image
        source={
          user.photoURL 
            ? { uri: user.photoURL } 
            : (user.gender === 'female' 
                ? require('../Assets/images/female.jpg') 
                : require('../Assets/images/male.jpg'))
        }
        style={styles.profileImage}
      />
      <Text style={[styles.userName, { color: darkMode ? '#fff' : '#333' }]}>{user.name}</Text>
      <Text style={[styles.userEmail, { color: darkMode ? '#bbb' : '#666' }]}>{user.email}</Text>
      
      {isOwnProfile ? (
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile', { user })}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.friendRequestContainer}>
          {friendRequestStatus === 'none' && (
            <TouchableOpacity 
              style={styles.sendRequestButton}
              onPress={sendFriendRequest}
              disabled={requestLoading}>
              {requestLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendRequestText}>Send Friend Request</Text>
              )}
            </TouchableOpacity>
          )}
          
          {friendRequestStatus === 'pending' && (
            <View style={styles.requestStatusContainer}>
              <Text style={styles.requestStatusText}>Friend Request Sent</Text>
            </View>
          )}
          
          {friendRequestStatus === 'received' && (
            <View style={styles.requestActionsContainer}>
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => acceptFriendRequest(requestId, user.id)}
                disabled={requestLoading}>
                {requestLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => rejectFriendRequest(requestId)}
                disabled={requestLoading}>
                {requestLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.rejectButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {friendRequestStatus === 'accepted' && (
            <View style={styles.requestStatusContainer}>
              <Text style={styles.requestStatusText}>Friends</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderMenuItem = ({ item, index }) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={styles.menuItemLeft}>
        <Icon name={item.icon} size={24} color="#333" />
        <Text style={[styles.menuItemText, { color: darkMode ? '#fff' : '#333' }]}>{item.title}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#333" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: darkMode ? '#ff5252' : '#FF3B30' }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchUserData(true)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: darkMode ? '#181818' : '#fff' }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[darkMode ? '#fff' : '#007AFF']}
          tintColor={darkMode ? '#fff' : '#007AFF'}
        />
      }
    >
      <View style={[styles.header, { borderBottomColor: darkMode ? '#333' : '#eee' }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={darkMode ? '#fff' : '#333'} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.headerTitle, { color: darkMode ? '#fff' : '#333', textAlign: 'center' }]}>Profile</Text>
        </View>
        <TouchableOpacity
          style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
          onPress={() => navigation.navigate('SettingsScreen')}
        >
          <Icon name="cog" size={28} color={darkMode ? '#90caf9' : '#3949ab'} />
        </TouchableOpacity>
      </View>
      {user && renderProfileSection()}
      {isOwnProfile && (
        <View style={[styles.menuContainer, { backgroundColor: darkMode ? '#232323' : '#fff' }]}> 
          {menuItems.map((item, index) => renderMenuItem({ item, index }))}
        </View>
      )}
      {isOwnProfile && (
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: darkMode ? '#ff5252' : '#FF3B30' }]} 
          onPress={handleLogout}>
          <Icon name="sign-out" size={24} color="#fff" />
          <Text style={[styles.logoutText, { color: '#fff' }]}>Logout</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  friendRequestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  sendRequestButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendRequestText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  requestStatusContainer: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  requestStatusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default memo(Profile);