import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../App';

const ChatList = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const { darkMode } = useContext(ThemeContext);

  // Create friends subcollection if it doesn't exist
  const createFriendsSubcollection = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      console.log('Creating friends subcollection for user:', currentUser.uid);
      
      // Create a dummy document to ensure the subcollection exists
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('friends')
        .doc('_init')
        .set({
          created: firestore.FieldValue.serverTimestamp(),
          type: 'initialization'
        });
      
      console.log('Friends subcollection created successfully');
    } catch (error) {
      console.error('Error creating friends subcollection:', error);
    }
  };

  // Fetch user's friends
  const fetchFriends = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No current user found');
        setFriends([]);
        setFilteredFriends([]);
        return [];
      }

      console.log('Fetching friends for user:', currentUser.uid);
      
      // First try to create the subcollection if it doesn't exist
      await createFriendsSubcollection();
      
      // Now fetch friends
      const friendsSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('friends')
        .get();

      const friendsList = friendsSnapshot.docs
        .filter(doc => doc.id !== '_init') // Exclude the initialization document
        .map(doc => doc.id);
      
      console.log('Found friends in subcollection:', friendsList.length);
      
      if (friendsList.length === 0) {
        console.log('No friends found in subcollection');
        setFriends([]);
        setFilteredFriends([]);
        return [];
      }

      // Fetch friends' user data - handle the case where some users might not exist
      try {
        const friendsData = await firestore()
          .collection('users')
          .where(firestore.FieldPath.documentId(), 'in', friendsList)
          .get();

        const friendsWithData = friendsData.docs.map(doc => {
          try {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.username || data.name || data.displayName || 'User',
              profilePicture: data.profilePicture || data.photoURL || null,
              email: data.email || '',
              ...data
            };
          } catch (docError) {
            console.error('Error processing friend document:', doc.id, docError);
            return null;
          }
        }).filter(friend => friend !== null); // Remove any null entries

        console.log('Successfully processed friends:', friendsWithData.length);
        setFriends(friendsWithData);
        setFilteredFriends(friendsWithData);
        return friendsList;
      } catch (queryError) {
        console.error('Error fetching friends data:', queryError);
        // If the 'in' query fails (too many items), fetch them individually
        console.log('Trying individual friend fetches...');
        const individualFriends = [];
        
        for (const friendId of friendsList) {
          try {
            const friendDoc = await firestore()
              .collection('users')
              .doc(friendId)
              .get();
            
            if (friendDoc.exists) {
              const data = friendDoc.data();
              individualFriends.push({
                id: friendId,
                name: data.username || data.name || data.displayName || 'User',
                profilePicture: data.profilePicture || data.photoURL || null,
                email: data.email || '',
                ...data
              });
            }
          } catch (individualError) {
            console.error('Error fetching individual friend:', friendId, individualError);
          }
        }
        
        console.log('Successfully fetched individual friends:', individualFriends.length);
        setFriends(individualFriends);
        setFilteredFriends(individualFriends);
        return friendsList;
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      console.error('Error details:', error.message, error.code);
      setFriends([]);
      setFilteredFriends([]);
      return [];
    }
  };

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Fetch friends first
    fetchFriends();

    // Fetch user's chats
    const unsubscribeChats = firestore()
      .collection('chats')
      .where('participants', 'array-contains', currentUser.uid)
      .orderBy('lastMessageTime', 'desc')
      .onSnapshot(
        snapshot => {
          if (snapshot && !snapshot.empty) {
            const chatsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setChats(chatsList);
          } else {
            setChats([]);
          }
          setLoading(false);
        },
        error => {
          console.error('Error fetching chats:', error);
          Alert.alert('Error', 'Failed to load chats');
          setChats([]);
          setLoading(false);
        }
      );

    return () => {
      unsubscribeChats();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.name && friend.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  // Refresh friends list when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchFriends();
    }, [])
  );

  const startNewChat = async (otherUser) => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to start a chat');
        return;
      }

      // Check if chat already exists
      const existingChat = await firestore()
        .collection('chats')
        .where('participants', 'array-contains', currentUser.uid)
        .where('type', '==', 'one-on-one')
        .get();

      let chatId;
      const existingChatDoc = existingChat.docs.find(doc => {
        const data = doc.data();
        return data.participants && data.participants.includes(otherUser.id);
      });

      if (existingChatDoc) {
        chatId = existingChatDoc.id;
      } else {
        // Create new chat
        const newChat = {
          participants: [currentUser.uid, otherUser.id],
          type: 'one-on-one',
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastMessageTime: firestore.FieldValue.serverTimestamp(),
          lastMessage: '',
          participantsInfo: {
            [currentUser.uid]: {
              name: currentUser.displayName || 'User',
              photoURL: currentUser.photoURL
            },
            [otherUser.id]: {
              name: otherUser.name || 'User',
              photoURL: otherUser.profilePicture
            }
          }
        };

        const chatRef = await firestore()
          .collection('chats')
          .add(newChat);
        chatId = chatRef.id;
      }

      navigation.navigate('OneOnOneChat', {
        chatId,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name || 'User',
          photoURL: otherUser.profilePicture
        }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const renderChatItem = ({ item }) => {
    const currentUser = auth().currentUser;
    if (!currentUser || !item.participants) return null;

    const otherUserId = item.participants.find(id => id !== currentUser.uid);
    const otherUserInfo = item.participantsInfo && item.participantsInfo[otherUserId];
    if (!otherUserInfo) return null;

    // Check for unread messages
    const hasUnread = item.unreadFor && item.unreadFor.includes(currentUser.uid);

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: darkMode ? '#232323' : '#fff' }]}
        onPress={() => navigation.navigate('OneOnOneChat', {
          chatId: item.id,
          otherUser: {
            id: otherUserId,
            name: otherUserInfo.name || 'User',
            photoURL: otherUserInfo.photoURL
          }
        })}
      >
        <Image
          source={
            otherUserInfo.photoURL
              ? { uri: otherUserInfo.photoURL }
              : require('../Assets/images/male.jpg')
          }
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <Text style={[styles.chatName, { color: hasUnread ? (darkMode ? '#90caf9' : '#3949ab') : (darkMode ? '#fff' : '#333'), fontWeight: hasUnread ? 'bold' : 'normal' }]}>{otherUserInfo.name || 'User'}</Text>
          <Text style={[styles.lastMessage, { color: hasUnread ? (darkMode ? '#90caf9' : '#3949ab') : (darkMode ? '#bbb' : '#666'), fontWeight: hasUnread ? 'bold' : 'normal' }]} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
        <Text style={[styles.time, { color: darkMode ? '#bbb' : '#999' }]}>
          {item.lastMessageTime
            ? new Date(item.lastMessageTime.toDate()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: darkMode ? '#232323' : '#fff' }]}
      onPress={() => startNewChat(item)}
    >
      <Image
        source={
          item.profilePicture
            ? { uri: item.profilePicture }
            : require('../Assets/images/male.jpg')
        }
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: darkMode ? '#fff' : '#333' }]}>{item.name || 'User'}</Text>
        <View style={styles.friendStatus}>
          <Icon name="person" size={16} color="#4CAF50" />
          <Text style={[styles.friendStatusText, { color: darkMode ? '#bbb' : '#666' }]}>Friend</Text>
        </View>
      </View>
      <Icon name="chat" size={24} color={darkMode ? '#90caf9' : '#007AFF'} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#181818' : '#fff' }]}>
      <View style={[styles.searchContainer, { backgroundColor: darkMode ? '#232323' : '#f5f5f5' }]}>
        <Icon name="search" size={24} color={darkMode ? '#bbb' : '#666'} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: darkMode ? '#fff' : '#000', fontSize: 16, paddingVertical: 10 }]}
          placeholder="Search friends..."
          placeholderTextColor={darkMode ? '#bbb' : '#666'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {searchQuery ? (
        <FlatList
          data={filteredFriends}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.usersList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No friends found</Text>
              <Text style={styles.emptySubText}>
                Add friends to start chatting with them
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatsList}
          ListHeaderComponent={
            friends.length > 0 ? (
              <View style={styles.recentFriendsSection}>
                <Text style={styles.sectionTitle}>Recent Friends</Text>
                <FlatList
                  data={friends.slice(0, 5)} // Show only first 5 friends
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.recentFriendItem}
                      onPress={() => startNewChat(item)}
                    >
                      <Image
                        source={
                          item.profilePicture
                            ? { uri: item.profilePicture }
                            : require('../Assets/images/male.jpg')
                        }
                        style={styles.recentFriendAvatar}
                      />
                      <Text style={styles.recentFriendName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item.id}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="chat" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySubText}>
                Search for your friends to start a conversation
              </Text>
            </View>
          }
        />
      )}
    </View>
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  chatsList: {
    padding: 10,
  },
  usersList: {
    padding: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#333',
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  friendStatusText: {
    fontSize: 14,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  recentFriendsSection: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  recentFriendItem: {
    alignItems: 'center',
    padding: 10,
    marginRight: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    minWidth: 80,
  },
  recentFriendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
  },
  recentFriendName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ChatList; 