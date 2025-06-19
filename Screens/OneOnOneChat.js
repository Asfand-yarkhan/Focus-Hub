import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { ThemeContext } from '../App';

const OneOnOneChat = ({ route, navigation }) => {
  const { chatId, otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const flatListRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);
  const [refreshing, setRefreshing] = useState(false);
  const [callModalVisible, setCallModalVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: otherUser.name,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={
              otherUser.photoURL
                ? { uri: otherUser.photoURL }
                : require('../Assets/images/male.jpg')
            }
            style={styles.headerImage}
          />
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginLeft: 10 }}>
            <Icon name="more-vert" size={28} color={darkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: darkMode ? '#181818' : '#fff',
      },
      headerTintColor: darkMode ? '#fff' : '#333',
      headerTitleStyle: {
        color: darkMode ? '#fff' : '#333',
      },
    });

    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Remove current user's UID from unreadFor when chat is opened
    const chatRef = firestore().collection('chats').doc(chatId);
    chatRef.update({
      unreadFor: firestore.FieldValue.arrayRemove(currentUser.uid)
    }).catch(() => {});

    // Subscribe to messages
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          if (snapshot && !snapshot.empty) {
            const messagesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMessages(messagesList);
            
            // Mark messages as read
            const unreadMessages = snapshot.docs.filter(doc => {
              const data = doc.data();
              return data.senderId !== currentUser.uid && !data.read;
            });
            
            if (unreadMessages.length > 0) {
              const batch = firestore().batch();
              unreadMessages.forEach(doc => {
                batch.update(doc.ref, { read: true });
              });
              batch.commit().catch(err => {
                console.error('Error marking messages as read:', err);
              });
            }
          } else {
            setMessages([]);
          }
          setLoading(false);
        },
        error => {
          console.error('Error fetching messages:', error);
          Alert.alert('Error', 'Failed to load messages');
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [chatId, otherUser, navigation, darkMode]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to send messages');
        return;
      }

      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        createdAt: firestore.FieldValue.serverTimestamp(),
        read: false
      };

      // Add message to subcollection
      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      // Update last message in chat document and add recipient to unreadFor
      await firestore()
        .collection('chats')
        .doc(chatId)
        .update({
          lastMessage: newMessage.trim(),
          lastMessageTime: firestore.FieldValue.serverTimestamp(),
          unreadFor: firestore.FieldValue.arrayUnion(otherUser.id)
        });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = ({ item }) => {
    const currentUser = auth().currentUser;
    const isOwnMessage = item.senderId === currentUser?.uid;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage
            ? [styles.ownMessage, { backgroundColor: darkMode ? '#3949ab' : '#3949ab' }]
            : [styles.otherMessage, { backgroundColor: darkMode ? '#232323' : '#f0f0f0' }],
        ]}
      >
        <Text style={[styles.messageText, isOwnMessage ? { color: '#fff' } : { color: darkMode ? '#fff' : '#333' }]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwnMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: darkMode ? '#bbb' : '#666' }]}>
            {item.createdAt
              ? new Date(item.createdAt.toDate()).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </Text>
          {isOwnMessage && (
            <Icon
              name={item.read ? 'done-all' : 'done'}
              size={16}
              color={item.read ? '#4CAF50' : '#bbb'}
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    );
  };

  // Menu actions
  const handleMute = () => {
    setMenuVisible(false);
    Alert.alert('Muted', 'Notifications muted for this chat.');
  };
  const handleDeleteChat = async () => {
    setMenuVisible(false);
    try {
      await firestore().collection('chats').doc(chatId).delete();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete chat.');
    }
  };

  const handleStartCall = () => {
    setCallModalVisible(true);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: darkMode ? '#181818' : '#fff' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => {
                setRefreshing(false);
                setCallModalVisible(true);
              }, 1200);
            }}
            tintColor="transparent"
            colors={['transparent']}
            style={{ backgroundColor: 'transparent' }}
            progressBackgroundColor={darkMode ? '#232323' : '#fff'}
            progressViewOffset={40}
            title={refreshing ? 'Connecting…' : ''}
            titleColor={darkMode ? '#90caf9' : '#3949ab'}
          />
        }
      />
      {/* WhatsApp-style Connect Button Bottom Modal */}
      <Modal
        visible={callModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCallModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.10)' }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{ backgroundColor: '#232323', borderRadius: 32, paddingVertical: 18, paddingHorizontal: 48, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, elevation: 8, marginBottom: 10 }}
              onPress={() => setCallModalVisible(false)}
              onPressOut={() => setCallModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, letterSpacing: 1 }}>Connect</Text>
            </TouchableOpacity>
            <Text style={{ color: '#bbb', fontSize: 14, marginTop: 2 }}>Release to talk</Text>
          </View>
        </View>
      </Modal>
      {/* Three dots menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuModal, { backgroundColor: darkMode ? '#232323' : '#fff' }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleMute}>
              <Icon name="volume-off" size={22} color={darkMode ? '#90caf9' : '#3949ab'} />
              <Text style={[styles.menuText, { color: darkMode ? '#fff' : '#333' }]}>Mute Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteChat}>
              <Icon name="delete" size={22} color={darkMode ? '#ff5252' : '#FF3B30'} />
              <Text style={[styles.menuText, { color: darkMode ? '#fff' : '#333' }]}>Delete Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Icon name="close" size={22} color={darkMode ? '#bbb' : '#666'} />
              <Text style={[styles.menuText, { color: darkMode ? '#fff' : '#333' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={[styles.inputContainer, { backgroundColor: darkMode ? '#232323' : '#fff', borderTopColor: darkMode ? '#333' : '#eee' }]}>
        <TextInput
          style={[styles.input, { backgroundColor: darkMode ? '#181818' : '#f0f0f0', color: darkMode ? '#fff' : '#000' }]}
          placeholder="Type a message..."
          placeholderTextColor={darkMode ? '#bbb' : '#444'}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, newMessage.trim() ? styles.sendButtonActive : styles.sendButtonDisabled, { backgroundColor: newMessage.trim() ? (darkMode ? '#3949ab' : '#007AFF') : (darkMode ? '#333' : '#ccc') }]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Icon
            name="send"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3949ab',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 10,
    padding: 12,
    maxWidth: '80%',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 10,
    padding: 12,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readIcon: {
    marginLeft: 5,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 50,
    marginRight: 10,
    padding: 10,
    elevation: 5,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
});

export default OneOnOneChat; 