import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Image, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { auth, db } from '../firebase/config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, where, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import firebase from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentingPost, setCommentingPost] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});

  useEffect(() => {
    setLoading(true); // Start loading when the effect runs

    const authInstance = getAuth(firebase.app());
    
    const unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
      console.log('Auth state changed:', user ? 'User is signed in' : 'User is signed out');
      
      if (user) {
        setLoading(true); // Set loading to true when fetching posts for a user
        const postsRef = collection(db, 'posts');
        const q = query(
          postsRef,
          orderBy('createdAt', 'desc')
        );
        
        const subscriber = onSnapshot(q, (querySnapshot) => {
          const postsData = [];
          querySnapshot.forEach(doc => {
            const data = doc.data();
            postsData.push({
              id: doc.id,
              content: data.content || '',
              userId: data.userId || '',
              userName: data.userName || 'User',
              userProfilePicture: data.userProfilePicture || null,
              userGender: data.userGender || 'male',
              createdAt: data.createdAt || new Date(),
              likes: data.likes || 0,
              comments: data.comments || []
            });
          });
          setPosts(postsData);
          setLoading(false); // Dismiss loading on successful fetch
        }, error => {
          console.error('Error fetching posts:', error);
          if (error.code === 'permission-denied') {
            Alert.alert('Error', 'You do not have permission to view posts. Please make sure you are logged in.');
          } else {
            Alert.alert('Error', `Failed to load posts: ${error.message}`);
          }
          setLoading(false); // Dismiss loading on fetch error
        });

        return () => subscriber();
      } else {
        // User is signed out
        setPosts([]);
        setLoading(false); // Dismiss loading when user is signed out
        Alert.alert('Error', 'Please log in to view posts');
      }
    });

    // Cleanup subscriptions on unmount
    return () => unsubscribeAuth();
  }, [auth, db]); // Add auth and db as dependencies

  const handleDeletePost = async (postId) => {
    try {
      const authInstance = getAuth(firebase.app());
      const currentUser = authInstance.currentUser;
      
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
              const postRef = doc(db, 'posts', postId);
              await deleteDoc(postRef);
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
      const authInstance = getAuth(firebase.app());
      const currentUser = authInstance.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to comment');
        return;
      }

      if (!commentText.trim()) {
        Alert.alert('Error', 'Comment cannot be empty');
        return;
      }

      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userProfilePicture: currentUser.photoURL,
        content: commentText.trim(),
        createdAt: new Date()
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

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
      const authInstance = getAuth(firebase.app());
      const currentUser = authInstance.currentUser;
      
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

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayRemove(comment)
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to delete comment');
      console.error('Error deleting comment:', error);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const authInstance = getAuth(firebase.app());
      const currentUser = authInstance.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to like posts');
        return;
      }

      const postRef = doc(db, 'posts', postId);
      const isLiked = likedPosts[postId];

      if (isLiked) {
        await updateDoc(postRef, {
          likes: increment(-1)
        });
        setLikedPosts(prev => ({ ...prev, [postId]: false }));
      } else {
        await updateDoc(postRef, {
          likes: increment(1)
        });
        setLikedPosts(prev => ({ ...prev, [postId]: true }));
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
            {comment.userId === auth.currentUser?.uid && (
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
                style={styles.commentInput}
                placeholder="Write a comment..."
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.feedContainer}>
      {renderPostMenu()}
      {renderCommentModal()}
      {posts.map(post => (
        <View key={post.id} style={styles.feedItem}>
          <View style={styles.feedHeader}>
            <Image
              source={
                post.userProfilePicture
                  ? { uri: post.userProfilePicture }
                  : post.userGender === 'female'
                  ? require('../Assets/images/female.jpg')
                  : require('../Assets/images/male.jpg')
              }
              style={styles.feedUserImage}
            />
            <View style={styles.feedUserInfo}>
              <Text style={styles.feedUserName}>{post.userName}</Text>
              <Text style={styles.feedTime}>
                {post.createdAt && typeof post.createdAt.toDate === 'function'
                  ? new Date(post.createdAt.toDate()).toLocaleString()
                  : 'Just now'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => {
                setSelectedPost(post);
                setMenuVisible(true);
              }}
            >
              <Icon name="more-vert" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.feedContent}>{post.content}</Text>
          <View style={styles.feedActions}>
            <TouchableOpacity 
              style={styles.feedActionButton}
              onPress={() => handleLikePost(post.id)}
            >
              <Icon 
                name={likedPosts[post.id] ? "favorite" : "favorite-border"} 
                size={24} 
                color={likedPosts[post.id] ? "#d32f2f" : "#666"} 
              />
              <Text style={styles.feedActionText}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.feedActionButton}
              onPress={() => {
                setCommentingPost(post);
                setCommentModalVisible(true);
              }}
            >
              <Icon name="comment" size={24} color="#666" />
              <Text style={styles.feedActionText}>{post.comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.feedActionButton}
              onPress={() => handleSharePost(post)}
            >
              <Icon name="share" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
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