import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import { ThemeContext } from '../App';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting notification fetch...');
        
        // Test Firebase connection without authentication first
        console.log('Testing basic Firebase connection...');
        try {
          // Test if Firebase is properly initialized
          const firebaseApp = firebase.app();
          console.log('Firebase app initialized:', firebaseApp.name);
          
          // Test basic Firestore connection
          const testCollection = firestore().collection('test');
          console.log('Firestore collection reference created successfully');
          
        } catch (firebaseError) {
          console.error('Firebase initialization error:', firebaseError);
          setError('Firebase not properly initialized: ' + firebaseError.message);
          setLoading(false);
          return;
        }
        
        const currentUser = auth().currentUser;
        console.log('Current user:', currentUser ? currentUser.uid : 'No user');
        
        if (!currentUser) {
          setError('You are not logged in.');
          setLoading(false);
          return;
        }

        // Fetch user profile
        console.log('Fetching user profile...');
        const userDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();
        if (userDoc.exists) {
          setUserProfile(userDoc.data());
          console.log('User profile loaded');
        } else {
          console.log('User profile not found');
        }

        // Subscribe to real-time notifications
        console.log('Setting up notifications listener...');
        const unsubscribe = firestore()
          .collection('notifications')
          .where('userId', '==', currentUser.uid)
          .onSnapshot((snapshot) => {
            console.log('Notifications snapshot received:', snapshot.docs.length, 'notifications');
            const notificationList = snapshot.docs.map(docSnap => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                ...data,
                timestamp: data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : null,
              };
            }).filter(notification => notification.id !== currentUser.uid && !notification.isDeleted);
            setNotifications(notificationList);
            setLoading(false);
            
            // Mark all unread notifications as read
            try {
              const unreadNotifications = snapshot.docs.filter(docSnap => !docSnap.data().read);
              if (unreadNotifications.length > 0) {
                console.log('Marking', unreadNotifications.length, 'notifications as read');
                const batch = firestore().batch();
                unreadNotifications.forEach(docSnap => {
                  batch.update(docSnap.ref, { read: true });
                });
                batch.commit().catch(err => {
                  console.error('Error marking notifications as read:', err);
                });
              }
            } catch (err) {
              console.error('Error in marking notifications as read:', err);
            }
          }, (err) => {
            console.error('Error in notifications listener:', err);
            setError('Error fetching notifications: ' + err.message);
            setLoading(false);
          });
        
        return () => {
          console.log('Cleaning up notifications listener');
          unsubscribe();
        };
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Error: ' + err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return 'favorite';
      case 'comment':
        return 'comment';
      case 'follow':
        return 'person-add';
      case 'message':
        return 'message';
      case 'friend_request':
        return 'person-add';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return '#e91e63';
      case 'comment':
        return '#2196f3';
      case 'follow':
        return '#4caf50';
      case 'message':
        return '#9c27b0';
      case 'friend_request':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
      await firestore()
        .collection('notifications')
        .doc(notification.id)
        .update({ read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        navigation.navigate('Feed', { postId: notification.postId });
        break;
      case 'follow':
      case 'friend_request':
        navigation.navigate('Profile', { userId: notification.senderId });
        break;
      case 'message':
        navigation.navigate('ChatScreen', {
          groupId: notification.chatId,
          groupName: notification.chatName
        });
        break;
      default:
        break;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await firestore()
        .collection('notifications')
        .doc(notificationId)
        .delete();
      Alert.alert('Success', 'Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification: ' + (error.message || ''));
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to delete notifications');
        return;
      }

      Alert.alert(
        'Delete All Notifications',
        'Are you sure you want to delete all notifications? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete All', 
            style: 'destructive', 
            onPress: async () => {
              try {
                const batch = firestore().batch();
                notifications.forEach(notification => {
                  const docRef = firestore().collection('notifications').doc(notification.id);
                  batch.delete(docRef);
                });
                await batch.commit();
                Alert.alert('Success', 'All notifications deleted successfully');
              } catch (error) {
                console.error('Error deleting all notifications:', error);
                Alert.alert('Error', 'Failed to delete all notifications: ' + (error.message || ''));
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in deleteAllNotifications:', error);
      Alert.alert('Error', 'Failed to delete all notifications: ' + (error.message || ''));
    }
  };

  const renderNotification = ({ item }) => {
    console.log('Rendering notification:', item);
    return (
      <View style={[styles.notificationContainer, { backgroundColor: darkMode ? '#232323' : '#fff' }]}>
        <TouchableOpacity
          style={[styles.notificationItem, !item.read && styles.unreadNotification]}
          onPress={() => handleNotificationPress(item)}
        >
          <View style={styles.notificationIconContainer}>
            <Icon
              name={getNotificationIcon(item.type)}
              size={24}
              color={getNotificationColor(item.type)}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationText, { color: darkMode ? '#fff' : '#333' }]}>{item.message}</Text>
            <Text style={[styles.notificationTime, { color: darkMode ? '#bbb' : '#666' }]}>
              {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
            </Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
        
        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Notification',
              'Are you sure you want to delete this notification?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(item.id) }
              ]
            );
          }}
        >
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const acceptFriendRequest = async (requestId, fromUserId) => {
    try {
      console.log('Accepting friend request from notification:', requestId, 'from user:', fromUserId);
      
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

      Alert.alert('Success', 'Friend request accepted!');
      
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      console.error('Error details:', error.message, error.code);
      Alert.alert('Error', 'Failed to accept request: ' + (error.message || 'Unknown error'));
    }
  };

  const showMyFriends = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    await fetchFriends();
    if (friends.length === 0) {
      setFilteredUsers([]);
      return;
    }
    const usersSnapshot = await firestore()
      .collection('users')
      .where(firestore.FieldPath.documentId(), 'in', friends)
      .get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setFilteredUsers(users);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3949ab" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="error" size={48} color="#f44336" />
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center', marginTop: 16 }}>{error}</Text>
        
        <View style={styles.errorDetails}>
          <Text style={styles.errorDetailText}>Firebase Project: focus-hub-b58fe</Text>
          <Text style={styles.errorDetailText}>Package: com.focushub</Text>
          <Text style={styles.errorDetailText}>Check console logs for details</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            // Re-trigger the useEffect
            const fetchData = async () => {
              try {
                console.log('=== RETRYING FIREBASE CONNECTION ===');
                console.log('Testing basic Firebase connection...');
                
                // Test Firebase app
                const firebaseApp = firebase.app();
                console.log('Firebase app:', firebaseApp.name);
                
                // Test Firestore
                const testCollection = firestore().collection('test');
                console.log('Firestore collection created');
                
                // Test Auth
                const currentUser = auth().currentUser;
                console.log('Current user:', currentUser ? currentUser.uid : 'No user');
                
                if (!currentUser) {
                  setError('You are not logged in.');
                  setLoading(false);
                  return;
                }

                // Subscribe to real-time notifications
                const unsubscribe = firestore()
                  .collection('notifications')
                  .where('userId', '==', currentUser.uid)
                  .onSnapshot((snapshot) => {
                    const notificationList = snapshot.docs.map(docSnap => {
                      const data = docSnap.data();
                      return {
                        id: docSnap.id,
                        ...data,
                        timestamp: data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : null,
                      };
                    }).filter(notification => notification.id !== currentUser.uid && !notification.isDeleted);
                    setNotifications(notificationList);
                    setLoading(false);
                  }, (err) => {
                    console.error('Firestore listener error:', err);
                    setError('Firestore error: ' + err.message);
                    setLoading(false);
                  });
                
                return () => unsubscribe();
              } catch (err) {
                console.error('Retry error:', err);
                setError('Retry failed: ' + err.message);
                setLoading(false);
              }
            };
            fetchData();
          }}
        >
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#181818' : '#f5f5f5' }]}>
      {/* Header with Delete All Button */}
      <View style={[styles.header, { backgroundColor: darkMode ? '#232323' : '#fff', borderBottomColor: darkMode ? '#333' : '#eee' }]}>
        <Text style={[styles.headerTitle, { color: darkMode ? '#fff' : '#333' }]}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={deleteAllNotifications}
          >
            <Icon name="delete-sweep" size={24} color={darkMode ? '#ff5252' : '#f44336'} />
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notificationsList}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: darkMode ? '#232323' : '#fff' }]}>
            <Icon name="notifications-off" size={48} color={darkMode ? '#333' : '#ccc'} />
            <Text style={[styles.emptyText, { color: darkMode ? '#bbb' : '#666' }]}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    padding: 16,
  },
  notificationContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationItem: {
    flex: 1,
  },
  unreadNotification: {
    backgroundColor: '#f0f7ff',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3949ab',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#3949ab',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorDetails: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  errorDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteAllButton: {
    padding: 8,
  },
});

export default NotificationScreen; 