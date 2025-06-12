import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ChatScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || { groupId: 'default', groupName: 'Group Chat' };
  const [message, setMessage] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const userDoc = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .get();
          
          if (userDoc.exists) {
            setUserProfile(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();

    // Subscribe to real-time messages
    const unsubscribe = firestore()
      .collection('chats')
      .doc(groupId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(
        (snapshot) => {
          if (snapshot && !snapshot.empty) {
            const messageList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMessages(messageList);
          } else {
            setMessages([]);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching messages:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: groupName,
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="info" size={24} color="#3949ab" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, groupName]);

  const sendMessage = async () => {
    if (message.trim() === '') return;

    const currentUser = auth().currentUser;
    if (!currentUser) return;

    try {
      // First, ensure the chat document exists
      const chatRef = firestore().collection('chats').doc(groupId);
      const chatDoc = await chatRef.get();
      
      if (!chatDoc.exists) {
        // Create the chat document if it doesn't exist
        await chatRef.set({
          name: groupName,
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastMessage: message.trim(),
          lastMessageTime: firestore.FieldValue.serverTimestamp()
        });
      }

      const newMessage = {
        text: message.trim(),
        senderId: currentUser.uid,
        senderName: userProfile?.username || 'Anonymous',
        userProfilePicture: userProfile?.profilePicture || null,
        userGender: userProfile?.gender || 'male',
        timestamp: firestore.FieldValue.serverTimestamp(),
      };

      await chatRef.collection('messages').add(newMessage);

      // Update the last message in the chat document
      await chatRef.update({
        lastMessage: message.trim(),
        lastMessageTime: firestore.FieldValue.serverTimestamp()
      });

      setMessage('');
      // Scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const currentUser = auth().currentUser;
    const isYou = item.senderId === currentUser?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isYou ? styles.yourMessage : styles.otherMessage
      ]}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              item.userProfilePicture
                ? { uri: item.userProfilePicture }
                : item.userGender === 'female'
                ? require('../Assets/images/female.jpg')
                : require('../Assets/images/male.jpg')
            }
            style={styles.avatar}
          />
        </View>
        <View style={styles.messageContent}>
          <Text style={styles.senderName}>{item.senderName}</Text>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

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
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="attach-file" size={24} color="#3949ab" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Icon name="send" size={24} color={message.trim() ? '#3949ab' : '#ccc'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  yourMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  messageContent: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  attachButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  headerButton: {
    padding: 8,
  },
});

export default ChatScreen; 