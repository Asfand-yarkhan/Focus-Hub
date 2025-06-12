import React, { useState, useEffect } from 'react';
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

const ChatList = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Fetch all users except current user
    const unsubscribeUsers = firestore()
      .collection('users')
      .where('uid', '!=', currentUser.uid)
      .onSnapshot(
        snapshot => {
          if (snapshot && !snapshot.empty) {
            const usersList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setUsers(usersList);
            setFilteredUsers(usersList);
          } else {
            setUsers([]);
            setFilteredUsers([]);
          }
        },
        error => {
          console.error('Error fetching users:', error);
          Alert.alert('Error', 'Failed to load users');
          setUsers([]);
          setFilteredUsers([]);
        }
      );

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
      unsubscribeUsers();
      unsubscribeChats();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

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

    return (
      <TouchableOpacity
        style={styles.chatItem}
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
          <Text style={styles.chatName}>{otherUserInfo.name || 'User'}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
        <Text style={styles.time}>
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
      style={styles.userItem}
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
      <Text style={styles.userName}>{item.name || 'User'}</Text>
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
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {searchQuery ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.usersList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="chat" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySubText}>
                Search for users to start a conversation
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
  userName: {
    fontSize: 16,
    color: '#333',
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
});

export default ChatList; 