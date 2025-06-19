import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { ThemeContext } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const [deleting, setDeleting] = useState(false);

  // Load dark mode from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const settings = await AsyncStorage.getItem('@focushub_user_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (typeof parsed.darkMode === 'boolean') setDarkMode(parsed.darkMode);
      }
    })();
  }, [setDarkMode]);

  const toggleDarkMode = async () => {
    setDarkMode(!darkMode);
    await AsyncStorage.mergeItem(
      '@focushub_user_settings',
      JSON.stringify({ darkMode: !darkMode })
    );
    Alert.alert('Theme Changed', `App is now in ${!darkMode ? 'Dark' : 'Light'} Mode`);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const user = auth().currentUser;
              if (!user) throw new Error('No user logged in');

              // 1. Delete user data from Firestore
              await firestore().collection('users').doc(user.uid).delete();

              // 2. Delete user's profile picture from Storage (if any)
              try {
                const userDoc = await firestore().collection('users').doc(user.uid).get();
                const data = userDoc.data();
                if (data && data.profilePicture) {
                  const ref = storage().refFromURL(data.profilePicture);
                  await ref.delete();
                }
              } catch (e) {
                // Ignore if no profile picture
              }

              // 3. Delete all notifications for this user
              const notifications = await firestore().collection('notifications').where('userId', '==', user.uid).get();
              const batch = firestore().batch();
              notifications.forEach(doc => batch.delete(doc.ref));
              await batch.commit();

              // 4. Delete all friend requests involving this user
              const sentRequests = await firestore().collection('friend_requests').where('from', '==', user.uid).get();
              const receivedRequests = await firestore().collection('friend_requests').where('to', '==', user.uid).get();
              const batch2 = firestore().batch();
              sentRequests.forEach(doc => batch2.delete(doc.ref));
              receivedRequests.forEach(doc => batch2.delete(doc.ref));
              await batch2.commit();

              // 5. Delete user from Auth
              await user.delete();

              Alert.alert('Account Deleted', 'Your account has been deleted.');
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#181818' : '#f5f5f5' }]}>
      <Text style={[styles.title, { color: darkMode ? '#fff' : '#333' }]}>Settings</Text>
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: darkMode ? '#fff' : '#333' }]}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ false: '#767577', true: '#81b0ff' }} thumbColor={darkMode ? '#3949ab' : '#f4f3f4'} />
      </View>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: darkMode ? '#ff5252' : '#f44336' }]}
        onPress={handleDeleteAccount}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  settingLabel: { fontSize: 18 },
  deleteButton: { padding: 16, borderRadius: 8, marginTop: 40 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }
});

export default SettingsScreen; 