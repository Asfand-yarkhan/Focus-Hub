import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { auth, firestore } from '../firebase/config';

const EditProfile = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState('male');
  const [profileImage, setProfileImage] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [semester, setSemester] = useState('');

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert('Error', 'Please log in to continue');
          navigation.goBack();
          return;
        }

        const userDoc = await firestore
          .collection('users')
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          setName(userData.name || '');
          setEmail(userData.email || currentUser.email || '');
          setPhone(userData.phone || '');
          setGender(userData.gender || 'male');
          setDateOfBirth(userData.dateOfBirth || '');
          setUniversity(userData.university || '');
          setDegree(userData.degree || '');
          setSemester(userData.semester || '');
          setProfileImage(userData.profilePicture || null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      }
    };

    loadUserData();
  }, [navigation]);

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    setProfileImage(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Please log in to continue');
      }

      const userData = {
        name: name.trim(),
        email: currentUser.email,
        phone: phone || '',
        gender: gender,
        dateOfBirth: dateOfBirth || '',
        university: university || '',
        degree: degree || '',
        semester: semester || '',
        profilePicture: gender === 'male' ? 'male.jpg' : 'female.jpg',
        lastUpdated: firestore.FieldValue.serverTimestamp()
      };

      // Save to Firestore
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .set(userData, { merge: true });

      // Update auth profile
      await currentUser.updateProfile({
        displayName: name.trim()
      });

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        {/* Gender Selection */}
        <View style={styles.genderContainer}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderButtons}>
            <TouchableOpacity 
              style={[
                styles.genderButton, 
                gender === 'male' && styles.selectedGender
              ]}
              onPress={() => handleGenderSelect('male')}
            >
              <Text style={[
                styles.genderText,
                gender === 'male' && styles.selectedGenderText
              ]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.genderButton, 
                gender === 'female' && styles.selectedGender
              ]}
              onPress={() => handleGenderSelect('female')}
            >
              <Text style={[
                styles.genderText,
                gender === 'female' && styles.selectedGenderText
              ]}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageWrapper}>
            <Image 
              source={
                profileImage
                  ? { uri: profileImage }
                  : gender === 'male'
                  ? require('../Assets/images/male.jpg')
                  : require('../Assets/images/female.jpg')
              }
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Rest of the form fields */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#666"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false}
            placeholder="Enter your email"
            placeholderTextColor="#666"
          />
          <Text style={styles.helperText}>Email cannot be changed</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#666"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>University Name</Text>
          <TextInput
            style={styles.input}
            value={university}
            onChangeText={setUniversity}
            placeholder="Enter your university name"
            placeholderTextColor="#666"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Degree</Text>
          <TextInput
            style={styles.input}
            value={degree}
            onChangeText={setDegree}
            placeholder="Enter your degree"
            placeholderTextColor="#666"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Semester</Text>
          <TextInput
            style={styles.input}
            value={semester}
            onChangeText={setSemester}
            placeholder="Enter your current semester"
            placeholderTextColor="#666"
            keyboardType="numeric"
            editable={!loading}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  saveButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  genderContainer: {
    marginBottom: 20,
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedGender: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  selectedGenderText: {
    color: '#fff',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default EditProfile; 