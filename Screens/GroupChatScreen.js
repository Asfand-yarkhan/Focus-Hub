import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const GroupChatScreen = ({ route, navigation }) => {
  const { groupId, groupName, groupImage } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [members, setMembers] = useState([]);
  const [infoVisible, setInfoVisible] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={styles.header}>
          <Image source={groupImage ? { uri: groupImage } : require('../Assets/images/group.jpeg')} style={styles.headerImage} />
          <Text style={styles.headerTitle}>{groupName}</Text>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
            <Icon name="more-vert" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, groupName, groupImage]);

  useEffect(() => {
    // Fetch group members
    const fetchMembers = async () => {
      const groupDoc = await firestore().collection('groups').doc(groupId).get();
      setMembers(groupDoc.data()?.members || []);
    };
    fetchMembers();
    // Subscribe to messages
    const unsubscribe = firestore()
      .collection('groups')
      .doc(groupId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        if (snapshot && !snapshot.empty) {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(msgs);
        } else {
          setMessages([]);
        }
        setLoading(false);
      }, error => {
        setLoading(false);
      });
    return () => unsubscribe();
  }, [groupId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      const userProfile = userDoc.data();
      const msg = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: userProfile?.username || userProfile?.name || 'Anonymous',
        userProfilePicture: userProfile?.profilePicture || null,
        userGender: userProfile?.gender || 'male',
        timestamp: firestore.FieldValue.serverTimestamp(),
      };
      await firestore().collection('groups').doc(groupId).collection('messages').add(msg);
      setNewMessage('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Menu actions
  const handleMute = () => {
    setMenuVisible(false);
    Alert.alert('Muted', 'Notifications muted for this group.');
  };
  const handleLeaveGroup = async () => {
    setMenuVisible(false);
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    await firestore().collection('groups').doc(groupId).update({
      members: firestore.FieldValue.arrayRemove(currentUser.uid)
    });
    navigation.goBack();
  };

  const renderMessage = ({ item }) => {
    const currentUser = auth().currentUser;
    const isOwnMessage = item.senderId === currentUser?.uid;
    return (
      <View style={[isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <View style={styles.messageHeader}>
          <Image
            source={item.userProfilePicture ? { uri: item.userProfilePicture } : item.userGender === 'female' ? require('../Assets/images/female.jpg') : require('../Assets/images/male.jpg')}
            style={styles.avatar}
          />
          <Text style={styles.senderName}>{item.senderName}</Text>
        </View>
        <Text style={isOwnMessage ? styles.ownMessageText : styles.otherMessageText}>{item.text}</Text>
        <Text style={styles.messageTime}>
          {item.timestamp && item.timestamp.toDate ? new Date(item.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Three dots menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuModal}>
            <TouchableOpacity style={styles.menuItem} onPress={handleMute}>
              <Icon name="volume-off" size={22} color="#3949ab" />
              <Text style={styles.menuText}>Mute Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLeaveGroup}>
              <Icon name="exit-to-app" size={22} color="#FF3B30" />
              <Text style={styles.menuText}>Leave Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setInfoVisible(true); }}>
              <Icon name="info" size={22} color="#3949ab" />
              <Text style={styles.menuText}>Group Info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Icon name="close" size={22} color="#666" />
              <Text style={styles.menuText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Group Info Modal */}
      <Modal visible={infoVisible} transparent animationType="slide" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.infoOverlay}>
          <View style={styles.infoModal}>
            <Text style={styles.infoTitle}>Group Members</Text>
            <FlatList
              data={members}
              keyExtractor={item => item}
              renderItem={({ item }) => <Text style={styles.infoMember}>{item}</Text>}
              ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center' }}>No members</Text>}
            />
            <TouchableOpacity style={styles.infoCloseButton} onPress={() => setInfoVisible(false)}>
              <Text style={styles.infoCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3949ab" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#444"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, newMessage.trim() ? styles.sendButtonActive : styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1 },
  menuButton: { padding: 6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 10, paddingBottom: 8 },
  ownMessage: { alignSelf: 'flex-end', backgroundColor: '#3949ab', borderRadius: 18, marginBottom: 10, padding: 12, maxWidth: '80%' },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0', borderRadius: 18, marginBottom: 10, padding: 12, maxWidth: '80%' },
  ownMessageText: { color: '#fff', fontSize: 16 },
  otherMessageText: { color: '#333', fontSize: 16 },
  messageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  senderName: { fontWeight: 'bold', color: '#3949ab', fontSize: 13 },
  messageTime: { fontSize: 11, color: '#888', marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, maxHeight: 100, fontSize: 16 },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  sendButtonActive: { backgroundColor: '#007AFF' },
  sendButtonDisabled: { backgroundColor: '#ccc' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menuModal: { backgroundColor: '#fff', borderRadius: 10, marginTop: 50, marginRight: 10, padding: 10, elevation: 5, minWidth: 180 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10 },
  menuText: { fontSize: 16, marginLeft: 12, color: '#333' },
  infoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  infoModal: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '85%' },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#3949ab', marginBottom: 12 },
  infoMember: { fontSize: 15, color: '#333', marginBottom: 6 },
  infoCloseButton: { marginTop: 16, alignItems: 'center' },
  infoCloseText: { color: '#3949ab', fontWeight: 'bold', fontSize: 16 },
});

export default GroupChatScreen; 