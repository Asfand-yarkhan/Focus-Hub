import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

const SettingsScreen = ({ navigation }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
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
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} />
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
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
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, color: '#333' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  settingLabel: { fontSize: 18, color: '#333' },
  deleteButton: { backgroundColor: '#f44336', padding: 16, borderRadius: 8, marginTop: 40 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }
});

export default SettingsScreen; 