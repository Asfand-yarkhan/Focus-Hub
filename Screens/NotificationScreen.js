import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import { firestore } from '../firebase/config';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    // Fetch user profile
    const fetchUserProfile = async () => {
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();
      
      if (userDoc.exists) {
        setUserProfile(userDoc.data());
      }
    };

    fetchUserProfile();

    // Subscribe to real-time notifications
    const unsubscribe = firestore()
      .collection('notifications')
      .where('userId', '==', currentUser.uid)
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        const notificationList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationList);
        setLoading(false);
      });

    return () => unsubscribe();
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
      default:
        return '#757575';
    }
  };

  const handleNotificationPress = (notification) => {
    // Mark notification as read
    firestore()
      .collection('notifications')
      .doc(notification.id)
      .update({ read: true });

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        navigation.navigate('Feed', { postId: notification.postId });
        break;
      case 'follow':
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

  const renderNotification = ({ item }) => (
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
        <Text style={styles.notificationText}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : ''}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3949ab" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notificationsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
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
});

export default NotificationScreen; 