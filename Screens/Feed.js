import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Image, Alert, ActivityIndicator, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { ThemeContext } from '../App';

const Feed = ({ postCreationComponent }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentingPost, setCommentingPost] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [friends, setFriends] = useState([]);
  let unsubscribePosts = null;
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    setLoading(true);
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      Alert.alert('Error', 'Please log in to view posts');
      return;
    }

    // Fetch friends first
    const unsubscribeFriends = firestore()
      .collection('friend_requests')
      .where('status', '==', 'accepted')
      .onSnapshot(friendSnap => {
        const friendIds = [];
        if (friendSnap && !friendSnap.empty) {
          friendSnap.forEach(doc => {
            if (doc && doc.exists) {
              const data = doc.data();
              if (data && data.from === currentUser.uid) friendIds.push(data.to);
              if (data && data.to === currentUser.uid) friendIds.push(data.from);
            }
          });
        }
        setFriends(friendIds);

        // Unsubscribe previous posts listener if any
        if (unsubscribePosts) unsubscribePosts();

        // Only subscribe to posts after friends are loaded
        unsubscribePosts = firestore()
          .collection('posts')
          .orderBy('createdAt', 'desc')
          .onSnapshot(
            (querySnapshot) => {
              const postsData = [];
              if (querySnapshot && !querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                  if (doc && doc.exists) {
                    const data = doc.data();
                    if (data && (friendIds.includes(data.userId) || data.userId === currentUser.uid)) {
                      postsData.push({
                        id: doc.id,
                        content: data.content || '',
                        userId: data.userId || '',
                        userName: data.userName || 'User',
                        userProfilePicture: data.userProfilePicture || null,
                        userGender: data.userGender || 'male',
                        createdAt: data.createdAt || new Date(),
                        likedBy: data.likedBy || [],
                        comments: data.comments || []
                      });
                    }
                  }
                });
              }
              setPosts(postsData);
              setLoading(false);
            },
            (error) => {
              console.error('Error fetching posts:', error);
              Alert.alert('Error', 'Failed to load posts');
              setLoading(false);
            }
          );
      });

    return () => {
      unsubscribeFriends();
      if (unsubscribePosts) unsubscribePosts();
    };
  }, []);

  const handleDeletePost = async (postId) => {
    try {
      const currentUser = auth().currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to delete posts');
        return;
      }

      const post = posts.find(p => p.id === postId);
      if (post.userId !== currentUser.uid) {
        Alert.alert('Error', 'You can only delete your own posts');
        return;
      }

      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await firestore().collection('posts').doc(postId).delete();
              setMenuVisible(false);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to delete post');
      console.error('Error deleting post:', error);
    }
  };

  const handleEditPost = (post) => {
    Alert.alert('Coming Soon', 'Edit functionality will be available soon!');
    setMenuVisible(false);
  };

  const handleSharePost = (post) => {
    Alert.alert('Coming Soon', 'Share functionality will be available soon!');
    setMenuVisible(false);
  };

  const handleAddComment = async (postId) => {
    try {
      const currentUser = auth().currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to comment');
        return;
      }

      if (!commentText.trim()) {
        Alert.alert('Error', 'Comment cannot be empty');
        return;
      }

      const postRef = firestore().collection('posts').doc(postId);
      const postDoc = await postRef.get();
      const postOwnerId = postDoc.data().userId;
      const newComment = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userProfilePicture: currentUser.photoURL,
        content: commentText.trim(),
        createdAt: new Date()
      };

      await postRef.update({
        comments: firestore.FieldValue.arrayUnion(newComment)
      });

      // Send notification to post owner (if not self)
      if (postOwnerId && postOwnerId !== currentUser.uid) {
        await firestore().collection('notifications').add({
          userId: postOwnerId,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Anonymous',
          senderPhotoURL: currentUser.photoURL || null,
          type: 'comment',
          message: `${currentUser.displayName || 'Someone'} commented on your post`,
          postId: postId,
          timestamp: firestore.FieldValue.serverTimestamp(),
          read: false
        });
      }

      setCommentText('');
      setCommentModalVisible(false);
      setCommentingPost(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const currentUser = auth().currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to delete comments');
        return;
      }

      const post = posts.find(p => p.id === postId);
      const comment = post.comments.find(c => c.id === commentId);

      if (comment.userId !== currentUser.uid) {
        Alert.alert('Error', 'You can only delete your own comments');
        return;
      }

      const postRef = firestore().collection('posts').doc(postId);
      await postRef.update({
        comments: firestore.FieldValue.arrayRemove(comment)
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to delete comment');
      console.error('Error deleting comment:', error);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to like posts');
        return;
      }
      const postRef = firestore().collection('posts').doc(postId);
      const postDoc = await postRef.get();
      const data = postDoc.data();
      const postOwnerId = data.userId;
      const likedBy = data.likedBy || [];
      const isLiked = likedBy.includes(currentUser.uid);
      if (isLiked) {
        // Unlike
        await postRef.update({
          likedBy: firestore.FieldValue.arrayRemove(currentUser.uid)
        });
        setLikedPosts(prev => ({ ...prev, [postId]: false }));
      } else {
        // Like
        await postRef.update({
          likedBy: firestore.FieldValue.arrayUnion(currentUser.uid)
        });
        setLikedPosts(prev => ({ ...prev, [postId]: true }));
        // Send notification to post owner (if not self)
        if (postOwnerId && postOwnerId !== currentUser.uid) {
          await firestore().collection('notifications').add({
            userId: postOwnerId,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'Anonymous',
            senderPhotoURL: currentUser.photoURL || null,
            type: 'like',
            message: `${currentUser.displayName || 'Someone'} liked your post`,
            postId: postId,
            timestamp: firestore.FieldValue.serverTimestamp(),
            read: false
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to like/unlike post');
      console.error('Error liking post:', error);
    }
  };

  const renderPostMenu = () => {
    if (!selectedPost) return null;

    return (
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleEditPost(selectedPost)}
            >
              <Icon name="edit" size={24} color="#3949ab" />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleDeletePost(selectedPost.id)}
            >
              <Icon name="delete" size={24} color="#d32f2f" />
              <Text style={[styles.menuItemText, { color: '#d32f2f' }]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleSharePost(selectedPost)}
            >
              <Icon name="share" size={24} color="#3949ab" />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderComments = (post) => {
    return (
      <View style={styles.commentsContainer}>
        {post.comments.map(comment => (
          <View key={comment.id} style={styles.commentItem}>
            <Image
              source={
                comment.userProfilePicture
                  ? { uri: comment.userProfilePicture }
                  : require('../Assets/images/male.jpg')
              }
              style={styles.commentUserImage}
            />
            <View style={styles.commentContent}>
              <Text style={styles.commentUserName}>{comment.userName}</Text>
              <Text style={styles.commentText}>{comment.content}</Text>
              <Text style={styles.commentTime}>
                {new Date(comment.createdAt.toDate()).toLocaleString()}
              </Text>
            </View>
            {comment.userId === auth().currentUser?.uid && (
              <TouchableOpacity
                onPress={() => handleDeleteComment(post.id, comment.id)}
                style={styles.deleteCommentButton}
              >
                <Icon name="delete" size={16} color="#d32f2f" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCommentModal = () => {
    if (!commentingPost) return null;

    return (
      <Modal
        visible={commentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setCommentModalVisible(false);
          setCommentingPost(null);
          setCommentText('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => {
                  setCommentModalVisible(false);
                  setCommentingPost(null);
                  setCommentText('');
                }}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.commentsList}>
              {renderComments(commentingPost)}
            </ScrollView>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={[styles.commentInput, { fontSize: 16, paddingVertical: 10, color: darkMode ? '#fff' : '#333' }]}
                placeholder="Write a comment..."
                placeholderTextColor={darkMode ? '#bbb' : '#666'}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleAddComment(commentingPost.id)}
              >
                <Icon name="send" size={24} color="#3949ab" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 0, paddingTop: 8 }}>
      <View style={{
        marginBottom: 12,
        paddingHorizontal: 0,
        paddingVertical: 0,
        width: '100%',
        alignSelf: 'center',
      }}>
        {postCreationComponent}
      </View>
      <View style={{ height: 1, backgroundColor: darkMode ? '#333' : '#eee', marginBottom: 8 }} />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.feedContainer, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color={darkMode ? '#90caf9' : '#3949ab'} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.feedContainer, { backgroundColor: darkMode ? '#181818' : '#fff', flex: 1 }]}> 
        {renderPostMenu()}
        {renderCommentModal()}
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View
              key={item.id}
              style={{
                backgroundColor: darkMode ? 'rgba(36,36,40,0.98)' : 'rgba(255,255,255,0.98)',
                borderRadius: 20,
                padding: 18,
                marginVertical: 10,
                shadowColor: darkMode ? '#000' : '#aaa',
                shadowOpacity: 0.13,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 12,
                elevation: 5,
                width: '100%',
                alignSelf: 'center',
              }}
            >
              <View style={[styles.feedHeader, { marginBottom: 6 }]}> 
                <Image
                  source={
                    item.userProfilePicture
                      ? { uri: item.userProfilePicture }
                      : item.userGender === 'female'
                      ? require('../Assets/images/female.jpg')
                      : require('../Assets/images/male.jpg')
                  }
                  style={[styles.feedUserImage, { borderWidth: 1, borderColor: darkMode ? '#333' : '#eee' }]}
                />
                <View style={styles.feedUserInfo}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: darkMode ? '#fff' : '#232323' }}>{item.userName}</Text>
                  <Text style={{ fontSize: 12, color: darkMode ? '#aaa' : '#888', marginTop: 1 }}>
                    {item.createdAt && typeof item.createdAt.toDate === 'function'
                      ? new Date(item.createdAt.toDate()).toLocaleString()
                      : 'Just now'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={() => {
                    setSelectedPost(item);
                    setMenuVisible(true);
                  }}
                >
                  <Icon name="more-vert" size={22} color={darkMode ? '#bbb' : '#333'} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 17, color: darkMode ? '#f5f5f5' : '#232323', lineHeight: 24, marginBottom: 10, marginTop: 2, fontWeight: '500' }}>{item.content}</Text>
              <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: darkMode ? '#292929' : '#f0f0f0', paddingTop: 10, marginTop: 4 }}>
                <TouchableOpacity 
                  style={[styles.feedActionButton, { marginRight: 22 }]}
                  onPress={() => handleLikePost(item.id)}
                  activeOpacity={0.7}
                >
                  <Icon 
                    name={likedPosts[item.id] ? "favorite" : "favorite-border"} 
                    size={24} 
                    color={likedPosts[item.id] ? "#e91e63" : darkMode ? "#bbb" : "#888"} 
                  />
                  <Text style={{ marginLeft: 6, color: likedPosts[item.id] ? '#e91e63' : (darkMode ? '#bbb' : '#888'), fontWeight: likedPosts[item.id] ? '700' : '500' }}>{item.likedBy.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.feedActionButton, { marginRight: 22 }]}
                  onPress={() => {
                    setCommentingPost(item);
                    setCommentModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="comment" size={24} color={darkMode ? '#90caf9' : '#2196f3'} />
                  <Text style={{ marginLeft: 6, color: darkMode ? '#90caf9' : '#2196f3', fontWeight: '500' }}>{item.comments.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.feedActionButton}
                  onPress={() => handleSharePost(item)}
                  activeOpacity={0.7}
                >
                  <Icon name="share" size={22} color={darkMode ? '#bbb' : '#888'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={{ color: darkMode ? '#bbb' : '#666', textAlign: 'center', marginTop: 40 }}>No posts yet</Text>}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: darkMode ? '#333' : '#eee', marginVertical: 10, width: '100%' }} />
          )}
          ListHeaderComponent={renderHeader}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    flex: 1,
    padding: 15,
  },
  feedItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  feedUserImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feedTime: {
    fontSize: 12,
    color: '#666',
  },
  feedContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
  },
  feedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  feedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  feedActionText: {
    marginLeft: 5,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  moreButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  commentsList: {
    flex: 1,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 5,
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  commentUserImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  commentText: {
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deleteCommentButton: {
    padding: 5,
  },
});

export default Feed;