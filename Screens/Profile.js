import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@user_profile_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const Profile = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      const currentUser = auth().currentUser;
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Try to get cached data first
      if (!forceRefresh) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setUser(data);
            setLoading(false);
            return;
          }
        }
      }

      // Fetch fresh data
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      const userData = userDoc.exists ? userDoc.data() : {};
      const newUserData = {
        name: currentUser.displayName || userData.name || 'User',
        email: currentUser.email || userData.email,
        photoURL: currentUser.photoURL || userData.profilePicture || null,
        gender: userData.gender || 'male',
      };

      // Cache the new data
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newUserData,
        timestamp: Date.now()
      }));

      setUser(newUserData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData(true);
    }, [fetchUserData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData(true);
  }, [fetchUserData]);

  const menuItems = [
    { icon: 'user', title: 'Edit Profile', screen: 'EditProfile' },
    { icon: 'lock', title: 'Privacy', screen: 'Privacy' },
    { icon: 'question-circle', title: 'Help & Support', screen: 'Support' },
    { icon: 'info-circle', title: 'About', screen: 'About' },
  ];

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await auth().signOut();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <Image
        source={
          user.photoURL 
            ? { uri: user.photoURL } 
            : (user.gender === 'female' 
                ? require('../Assets/images/female.jpg') 
                : require('../Assets/images/male.jpg'))
        }
        style={styles.profileImage}
      />
      <Text style={styles.userName}>{user.name}</Text>
      <Text style={styles.userEmail}>{user.email}</Text>
      <TouchableOpacity 
        style={styles.editProfileButton}
        onPress={() => navigation.navigate('EditProfile', { user })}>
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuItem = ({ item, index }) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={styles.menuItemLeft}>
        <Icon name={item.icon} size={24} color="#333" />
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#333" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchUserData(true)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#007AFF']}
          tintColor="#007AFF"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="cog" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {user && renderProfileSection()}

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => renderMenuItem({ item, index }))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}>
        <Icon name="sign-out" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
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
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default memo(Profile);