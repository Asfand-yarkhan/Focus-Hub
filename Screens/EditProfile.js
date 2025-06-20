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
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firebase from '@react-native-firebase/app';

const EditProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState('male');
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
        const currentUser = auth().currentUser;
        let userData = null;
        if (!currentUser) {
          // Try to use route.params.user as fallback
          if (route.params && route.params.user) {
            userData = route.params.user;
          } else {
            Alert.alert('Error', 'Could not load your profile. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          const userDoc = await firestore
            .collection('users')
            .doc(currentUser.uid)
            .get();
          if (userDoc.exists) {
            userData = userDoc.data();
          } else if (route.params && route.params.user) {
            userData = route.params.user;
          } else {
            Alert.alert('Error', 'Could not load your profile. Please try again.');
            setLoading(false);
            return;
          }
        }
        setName(userData.name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setGender(userData.gender || 'male');
        setDateOfBirth(userData.dateOfBirth || '');
        setUniversity(userData.university || '');
        setDegree(userData.degree || '');
        setSemester(userData.semester || '');
        setProfileImage(userData.profilePicture || null);
        setLoading(false);
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
        setLoading(false);
      }
    };
    loadUserData();
  }, [navigation, route.params]);

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
  };

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 200,
      maxWidth: 200,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick image.');
      } else if (response.assets && response.assets.length > 0) {
        const selectedAsset = response.assets[0];
        setProfileImage(selectedAsset.uri);
        uploadImage(selectedAsset.uri);
      }
    });
  };

  const uploadImage = async (uri) => {
    if (!uri) return;

    setUploading(true);
    setUploadProgress(0);

    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to upload a profile picture.');
      setUploading(false);
      return;
    }

    const filename = `profile_pictures/${currentUser.uid}/${Date.now()}`;
    const storageRef = storage().ref(filename);
    const task = storageRef.putFile(uri);

    task.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(progress);
    });

    try {
      await task;
      const url = await storageRef.getDownloadURL();
      console.log('Image uploaded successfully:', url);
      setProfileImage(url);
      Alert.alert('Success', 'Profile picture uploaded.');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture.');
      setProfileImage(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to continue');
        return;
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
        profilePicture: profileImage || (gender === 'male' ? 'male.jpg' : 'female.jpg'),
        lastUpdated: firestore.FieldValue.serverTimestamp()
      };

      // Save to Firestore
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .set(userData, { merge: true });

      // Update auth profile
      await currentUser.updateProfile({
        displayName: name.trim(),
        photoURL: profileImage || (gender === 'male' ? 'male.jpg' : 'female.jpg')
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
          disabled={loading || uploading}
        >
          {loading || uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        {/* Profile Picture Section */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={handleImagePick} disabled={uploading}>
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
              {uploading && (
                <View style={styles.uploadProgressOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.uploadProgressText}>{Math.round(uploadProgress)}%</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImagePick} disabled={uploading}>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

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
              disabled={loading || uploading}
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
              disabled={loading || uploading}
            >
              <Text style={[
                styles.genderText,
                gender === 'female' && styles.selectedGenderText
              ]}>Female</Text>
            </TouchableOpacity>
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
            editable={!loading && !uploading}
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
            editable={!loading && !uploading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="Enter your date of birth"
            placeholderTextColor="#666"
            editable={!loading && !uploading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>University</Text>
          <TextInput
            style={styles.input}
            value={university}
            onChangeText={setUniversity}
            placeholder="Enter your university"
            placeholderTextColor="#666"
            editable={!loading && !uploading}
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
            editable={!loading && !uploading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Semester</Text>
          <TextInput
            style={styles.input}
            value={semester}
            onChangeText={setSemester}
            placeholder="Enter your semester"
            placeholderTextColor="#666"
            editable={!loading && !uploading}
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
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 10,
  },
  uploadProgressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressText: {
    color: '#fff',
    marginTop: 5,
  },
});

export default EditProfile; 