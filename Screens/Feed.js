import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { auth, db } from '../firebase/config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, getAuth } from 'firebase/auth';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    // Get the auth instance
    const authInstance = getAuth();
    
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
      console.log('Auth state changed:', user ? 'User is signed in' : 'User is signed out');
      
      if (user) {
        // User is signed in, fetch posts
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
          setLoading(false);
        }, error => {
          console.error('Error fetching posts:', error);
          if (error.code === 'permission-denied') {
            Alert.alert('Error', 'You do not have permission to view posts. Please make sure you are logged in.');
          } else {
            Alert.alert('Error', `Failed to load posts: ${error.message}`);
          }
          setLoading(false);
        });

        return () => subscriber();
      } else {
        // User is signed out
        setPosts([]);
        setLoading(false);
        Alert.alert('Error', 'Please log in to view posts');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribeAuth();
  }, []);

  const handleDeletePost = async (postId) => {
    try {
      const authInstance = getAuth();
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
            <TouchableOpacity style={styles.feedActionButton}>
              <Text style={styles.feedActionText}>Like ({post.likes})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.feedActionButton}>
              <Text style={styles.feedActionText}>Comment ({post.comments.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.feedActionButton}>
              <Text style={styles.feedActionText}>Share</Text>
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
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  feedActionText: {
    color: '#666',
    fontSize: 14,
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
});

export default Feed;