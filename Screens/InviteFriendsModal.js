import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, Image, Alert, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const InviteFriendsModal = ({ visible, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showingFriends, setShowingFriends] = useState(false);

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No current user found');
        return [];
      }
      
      console.log('Fetching friends for user:', currentUser.uid);
      
      const friendsSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('friends')
        .get();
      
      const friendsList = friendsSnapshot.docs.map(doc => doc.id);
      console.log('Friends list fetched:', friendsList.length);
      setFriends(friendsList);
      return friendsList;
    } catch (error) {
      console.error('Error fetching friends:', error);
      console.error('Error details:', error.message, error.code);
      return [];
    }
  };

  // Ensure friends subcollection exists
  const ensureFriendsSubcollection = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      // Try to create a dummy document to ensure the subcollection exists
      const dummyDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('friends')
        .doc('_dummy')
        .get();

      if (!dummyDoc.exists) {
        // Create a dummy document and immediately delete it
        await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .collection('friends')
          .doc('_dummy')
          .set({ created: firestore.FieldValue.serverTimestamp() });
        
        await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .collection('friends')
          .doc('_dummy')
          .delete();
        
        console.log('Friends subcollection created');
      }
    } catch (error) {
      console.error('Error ensuring friends subcollection:', error);
    }
  };

  // Fetch suggestions (non-friends, non-deleted)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No current user found for fetching users');
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetching friends list...');
      const friendsList = await fetchFriends();
      
      console.log('Fetching all users from Firestore...');
      const snapshot = await firestore().collection('users').get();
      console.log('Total users in database:', snapshot.docs.length);
      
      const userList = snapshot.docs
        .map(doc => {
          try {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.username || data.name || data.displayName || 'Anonymous User',
              profilePicture: data.profilePicture || data.photoURL || null,
              email: data.email || '',
              isDeleted: data.isDeleted || false,
              isRegistered: data.email && data.email.trim() !== '', // Check if user has email (registered)
              ...data
            };
          } catch (docError) {
            console.error('Error processing user document:', doc.id, docError);
            return null;
          }
        })
        .filter(user => user !== null) // Remove any null entries from processing errors
        .filter(user => 
          user.id !== currentUser.uid && 
          !user.isDeleted && 
          !friendsList.includes(user.id) &&
          user.isRegistered && // Only show registered users
          user.name !== 'Anonymous User' // Don't show anonymous users
        );
      
      console.log('Found users:', userList.length, 'Registered users in suggestions');
      setUsers(userList);
      setFilteredUsers(userList);
      setShowingFriends(false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', error.message, error.code);
      setUsers([]);
      setFilteredUsers([]);
      setLoading(false);
    }
  };

  // Show only friends
  const showMyFriends = async () => {
    setLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No current user found for showing friends');
        setFilteredUsers([]);
        setLoading(false);
        setShowingFriends(true);
        return;
      }
      
      console.log('Fetching friends list for display...');
      const friendsList = await fetchFriends();
      
      if (friendsList.length === 0) {
        console.log('No friends found');
        setFilteredUsers([]);
        setLoading(false);
        setShowingFriends(true);
        return;
      }
      
      console.log('Fetching friends data from Firestore...');
      const usersSnapshot = await firestore()
        .collection('users')
        .where(firestore.FieldPath.documentId(), 'in', friendsList)
        .get();
      
      const usersData = usersSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.username || data.name || data.displayName || 'Anonymous User',
            profilePicture: data.profilePicture || data.photoURL || null,
            email: data.email || '',
            ...data
          };
        } catch (docError) {
          console.error('Error processing friend document:', doc.id, docError);
          return null;
        }
      }).filter(user => user !== null); // Remove any null entries
      
      console.log('Found friends:', usersData.length);
      setFilteredUsers(usersData);
      setLoading(false);
      setShowingFriends(true);
    } catch (error) {
      console.error('Error showing friends:', error);
      console.error('Error details:', error.message, error.code);
      setFilteredUsers([]);
      setLoading(false);
      setShowingFriends(true);
    }
  };

  useEffect(() => {
    if (!visible) return;
    ensureFriendsSubcollection(); // Ensure friends subcollection exists
    fetchUsers();
  }, [visible]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(showingFriends ? users.filter(user => friends.includes(user.id)) : users);
    } else {
      const list = showingFriends ? users.filter(user => friends.includes(user.id)) : users;
      const filtered = list.filter(user =>
        user.name && user.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [search, users, showingFriends, friends]);

  // Improved sendRequest with notification and error handling
  const sendRequest = async (user) => {
    setSending(user.id);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to send friend requests');
        setSending(null);
        return;
      }
      // Check if already requested
      const existingRequest = await firestore()
        .collection('friend_requests')
        .where('from', '==', currentUser.uid)
        .where('to', '==', user.id)
        .where('status', '==', 'pending')
        .get();
      if (!existingRequest.empty) {
        Alert.alert('Notice', 'You have already sent a friend request to this user');
        setSending(null);
        return;
      }
      // Create friend request
      const requestData = {
        from: currentUser.uid,
        to: user.id,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };
      const docRef = await firestore().collection('friend_requests').add(requestData);
      // Create notification for recipient
      await firestore().collection('notifications').add({
        userId: user.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous User',
        senderPhotoURL: currentUser.photoURL || null,
        type: 'friend_request',
        message: `${currentUser.displayName || 'Someone'} sent you a friend request`,
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
        requestId: docRef.id
      });
      Alert.alert('Success', `Friend request sent to ${user.name || 'User'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send request: ' + (error.message || ''));
    } finally {
      setSending(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite Friends</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={showingFriends ? showMyFriends : fetchUsers}>
            <Icon name="refresh" size={24} color="#3949ab" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#3949ab', padding: 10, borderRadius: 8, flex: 1, marginRight: 5 }}
            onPress={fetchUsers}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Suggestions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#3949ab', padding: 10, borderRadius: 8, flex: 1, marginLeft: 5 }}
            onPress={showMyFriends}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>My Friends</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#3949ab" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                <Image
                  source={item.profilePicture ? { uri: item.profilePicture } : require('../Assets/images/male.jpg')}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                {!showingFriends && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => sendRequest(item)}
                    disabled={sending === item.id}
                  >
                    <Icon name="person-add" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#666' }}>{showingFriends ? 'No friends found.' : 'No suggestions found.'}</Text>}
          />
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#3949ab',
    padding: 10,
    borderRadius: 24,
    marginLeft: 10,
  },
  closeButton: {
    backgroundColor: '#3949ab',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 24,
  },
});

export default InviteFriendsModal; 