import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { firestore } from '../firebase/config';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to posts collection
    const subscriber = firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
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
        Alert.alert('Error', 'Failed to load posts');
        setLoading(false);
      });

    return () => subscriber();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.feedContainer}>
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
                {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : 'Just now'}
              </Text>
            </View>
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
});

export default Feed;