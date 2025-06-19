import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, SafeAreaView, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as ImagePicker from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import { ThemeContext } from '../App';

const Explore = () => {
  const navigation = useNavigation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [step, setStep] = useState(1);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [search, setSearch] = useState('');
  const { darkMode } = useContext(ThemeContext);

  // Fetch all groups from Firestore
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const snapshot = await firestore().collection('groups').get();
      const groupList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupList);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // Fetch groups user is a member of
  const fetchMyGroups = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    const snapshot = await firestore().collection('groups').where('members', 'array-contains', currentUser.uid).get();
    setMyGroups(snapshot.docs.map(doc => doc.id));
  };

  // Fetch friends for group creation
  const fetchFriends = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    const friendsSnapshot = await firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('friends')
      .get();
    const friendIds = friendsSnapshot.docs.map(doc => doc.id);
    let friendsData = [];
    const batchSize = 10;
    for (let i = 0; i < friendIds.length; i += batchSize) {
      const batchIds = friendIds.slice(i, i + batchSize);
      const usersSnapshot = await firestore()
        .collection('users')
        .where(firestore.FieldPath.documentId(), 'in', batchIds)
        .get();
      friendsData = friendsData.concat(usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.username || data.name || data.displayName || 'Anonymous User',
          profilePicture: data.profilePicture || data.photoURL || null,
          email: data.email || '',
        };
      }));
    }
    setFriends(friendsData);
  };

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, []);

  // When modal opens, fetch friends
  useEffect(() => {
    if (createModalVisible) {
      setStep(1);
      setGroupName('');
      setGroupImage(null);
      setSelectedFriends([]);
      setSearch('');
      fetchFriends();
    }
  }, [createModalVisible]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriends.length === 0) {
      Alert.alert('Error', 'Group name and at least one member required');
      return;
    }
    setCreating(true);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('Not logged in');
      let imageUrl = null;
      if (groupImage) {
        // Upload image to Firebase Storage
        const filename = `group_images/${currentUser.uid}_${Date.now()}`;
        const ref = storage().ref(filename);
        await ref.putFile(groupImage);
        imageUrl = await ref.getDownloadURL();
      }
      const members = [currentUser.uid, ...selectedFriends.map(f => f.id)];
      await firestore().collection('groups').add({
        name: groupName.trim(),
        image: imageUrl,
        members,
        createdBy: currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setCreateModalVisible(false);
      fetchGroups();
      fetchMyGroups();
      Alert.alert('Success', 'Group created!');
    } catch (error) {
      console.error('Group creation error:', error, JSON.stringify(error));
      Alert.alert('Error', 'Failed to create group: ' + (error.message || JSON.stringify(error)));
    } finally {
      setCreating(false);
    }
  };

  const handlePickImage = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        setGroupImage(response.assets[0].uri);
      }
    });
  };

  const handleJoinGroup = async (groupId) => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    await firestore().collection('groups').doc(groupId).update({
      members: firestore.FieldValue.arrayUnion(currentUser.uid)
    });
    fetchGroups();
    fetchMyGroups();
  };

  const handleLeaveGroup = async (groupId) => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    await firestore().collection('groups').doc(groupId).update({
      members: firestore.FieldValue.arrayRemove(currentUser.uid)
    });
    fetchGroups();
    fetchMyGroups();
  };

  const handleGroupPress = (group) => {
    navigation.navigate('GroupChatScreen', { groupId: group.id, groupName: group.name, groupImage: group.image });
  };

  const renderGroupItem = ({ item }) => {
    const isMember = myGroups.includes(item.id);
    return (
      <View style={[styles.groupCard, { backgroundColor: darkMode ? '#232323' : '#fff' }]}>
        <TouchableOpacity onPress={() => handleGroupPress(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Image source={item.image ? { uri: item.image } : require('../Assets/images/group.jpeg')} style={styles.groupImage} />
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: darkMode ? '#fff' : '#333' }]}>{item.name}</Text>
            <Text style={[styles.groupMembers, { color: darkMode ? '#bbb' : '#666' }]}>{item.members?.length || 0} members</Text>
          </View>
        </TouchableOpacity>
        {isMember ? (
          <TouchableOpacity style={[styles.leaveButton, { backgroundColor: darkMode ? '#3949ab' : '#FF3B30' }]} onPress={() => handleLeaveGroup(item.id)}>
            <Text style={[styles.leaveButtonText, { color: darkMode ? '#fff' : '#fff' }]}>Leave</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.joinButton, { backgroundColor: darkMode ? '#3949ab' : '#007AFF' }]} onPress={() => handleJoinGroup(item.id)}>
            <Text style={[styles.joinButtonText, { color: darkMode ? '#fff' : '#fff' }]}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Friend picker for group creation
  const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const toggleSelectFriend = (friend) => {
    if (selectedFriends.some(f => f.id === friend.id)) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#181818' : '#f5f5f5' }]}>
      {/* Modern header */}
      <View style={[styles.modernHeader, { backgroundColor: darkMode ? '#232323' : '#3949ab' }]}>
        <Icon name="users" size={32} color={darkMode ? '#fff' : '#fff'} style={{ marginRight: 12 }} />
        <Text style={[styles.modernHeaderTitle, { color: darkMode ? '#fff' : '#fff' }]}>Explore Groups</Text>
        <TouchableOpacity style={styles.createButtonModern} onPress={() => setCreateModalVisible(true)}>
          <Icon name="plus" size={20} color={darkMode ? '#fff' : '#fff'} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchGroups(); fetchMyGroups(); setRefreshing(false); }}
        contentContainerStyle={styles.groupsList}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: darkMode ? '#bbb' : '#666' }}>No groups found.</Text>}
      />
      {/* Create Group Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {step === 1 ? (
              <>
                <Text style={styles.modalTitle}>Create Group</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Group Name"
                  value={groupName}
                  onChangeText={setGroupName}
                />
                <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                  <Icon name="image" size={24} color={darkMode ? '#fff' : '#007AFF'} />
                  <Text style={[styles.imagePickerText, { color: darkMode ? '#fff' : '#007AFF' }]}>{groupImage ? 'Change Image' : 'Pick Group Image'}</Text>
                </TouchableOpacity>
                {groupImage && <Image source={{ uri: groupImage }} style={styles.previewImage} />}
                <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
                  <Text style={[styles.nextButtonText, { color: darkMode ? '#fff' : '#fff' }]}>Next</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCreateModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, { color: darkMode ? '#fff' : '#3949ab' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Add Members</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Search friends..."
                  value={search}
                  onChangeText={setSearch}
                />
                <ScrollView style={{ maxHeight: 200 }}>
                  {filteredFriends.map(friend => (
                    <TouchableOpacity key={friend.id} style={[styles.friendItem, { backgroundColor: darkMode ? '#232323' : '#fff' }]} onPress={() => toggleSelectFriend(friend)}>
                      <Image source={friend.profilePicture ? { uri: friend.profilePicture } : require('../Assets/images/male.jpg')} style={[styles.friendAvatar, { backgroundColor: darkMode ? '#232323' : '#eee' }]} />
                      <Text style={[styles.friendName, { color: darkMode ? '#fff' : '#333' }]}>{friend.name}</Text>
                      {selectedFriends.some(f => f.id === friend.id) && <Icon name="check" size={20} color={darkMode ? '#fff' : '#007AFF'} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  ))}
                  {filteredFriends.length === 0 && <Text style={[styles.friendName, { color: darkMode ? '#bbb' : '#666', textAlign: 'center', marginTop: 20 }]}>No friends found.</Text>}
                </ScrollView>
                <TouchableOpacity style={[styles.createButton, { opacity: (!groupName.trim() || selectedFriends.length === 0 || creating) ? 0.5 : 1, backgroundColor: darkMode ? '#3949ab' : '#007AFF' }]} onPress={handleCreateGroup} disabled={!groupName.trim() || selectedFriends.length === 0 || creating}>
                  {creating ? <ActivityIndicator color={darkMode ? '#fff' : '#fff'} /> : <Text style={[styles.createButtonText, { color: darkMode ? '#fff' : '#fff' }]}>Create</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCreateModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, { color: darkMode ? '#fff' : '#3949ab' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  modernHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#3949ab', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  modernHeaderTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', flex: 1 },
  createButtonModern: { backgroundColor: '#007AFF', padding: 10, borderRadius: 20, marginLeft: 12 },
  groupsList: { padding: 16 },
  groupCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  groupImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16, backgroundColor: '#eee' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  groupMembers: { fontSize: 14, color: '#666', marginTop: 4 },
  joinButton: { backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  joinButtonText: { color: '#fff', fontWeight: 'bold' },
  leaveButton: { backgroundColor: '#FF3B30', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  leaveButtonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#3949ab', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 16 },
  imagePicker: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  imagePickerText: { color: '#007AFF', marginLeft: 8, fontSize: 16 },
  previewImage: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 16 },
  nextButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  friendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  friendAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' },
  friendName: { fontSize: 16, color: '#333' },
  cancelButton: { marginTop: 12, alignItems: 'center' },
  cancelButtonText: { color: '#3949ab', fontWeight: 'bold', fontSize: 16 },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});

export default Explore;