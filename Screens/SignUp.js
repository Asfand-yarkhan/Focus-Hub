import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SignUp = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [semester, setSemester] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState('');
  const [universityError, setUniversityError] = useState('');
  const [degreeError, setDegreeError] = useState('');
  const [semesterError, setSemesterError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    // Reset all errors
    const errors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      university: '',
      degree: '',
      semester: ''
    };

    // Validate all fields
    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Update error states
    setNameError(errors.name);
    setEmailError(errors.email);
    setPasswordError(errors.password);
    setConfirmPasswordError(errors.confirmPassword);
    setDateOfBirthError(errors.dateOfBirth);
    setUniversityError(errors.university);
    setDegreeError(errors.degree);
    setSemesterError(errors.semester);

    // If any errors exist, stop registration
    if (Object.values(errors).some(error => error !== '')) {
      return;
    }

    try {
      // Create user account
      const newUser = await auth().createUserWithEmailAndPassword(email, password);
      
      // Update user profile with name
      await newUser.user.updateProfile({
        displayName: name
      });

      // Save additional user data
      const userData = {
        name: name,
        email: email,
        dateOfBirth: dateOfBirth || '',
        university: university || '',
        degree: degree || '',
        semester: semester || '',
        createdAt: firestore.FieldValue.serverTimestamp()
      };

      // Save to Firestore
      await firestore()
        .collection('users')
        .doc(newUser.user.uid)
        .set(userData);

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Home');
    } catch (error) {
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          setEmailError('Email is already registered');
          Alert.alert('Sign Up Failed', 'This email is already registered.');
          break;
        case 'auth/invalid-email':
          setEmailError('Invalid email format');
          Alert.alert('Sign Up Failed', 'Invalid email format.');
          break;
        case 'auth/weak-password':
          setPasswordError('Password is too weak');
          Alert.alert('Sign Up Failed', 'Password is too weak.');
          break;
        default:
          Alert.alert('Sign Up Failed', error.message);
      }
    }
  };

  return (
    <ImageBackground 
      source={require('../Assets/images/signup.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image 
              source={require('../Assets/images/header.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Focus Hub</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Enter your full name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setNameError('');
                }}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                secureTextEntry
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                placeholder="Confirm your password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setConfirmPasswordError('');
                }}
                secureTextEntry
              />
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={[styles.input, dateOfBirthError ? styles.inputError : null]}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#666"
                value={dateOfBirth}
                onChangeText={(text) => {
                  setDateOfBirth(text);
                  setDateOfBirthError('');
                }}
              />
              {dateOfBirthError ? <Text style={styles.errorText}>{dateOfBirthError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>University Name</Text>
              <TextInput
                style={[styles.input, universityError ? styles.inputError : null]}
                placeholder="Enter your university name"
                placeholderTextColor="#666"
                value={university}
                onChangeText={(text) => {
                  setUniversity(text);
                  setUniversityError('');
                }}
              />
              {universityError ? <Text style={styles.errorText}>{universityError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Degree</Text>
              <TextInput
                style={[styles.input, degreeError ? styles.inputError : null]}
                placeholder="Enter your degree"
                placeholderTextColor="#666"
                value={degree}
                onChangeText={(text) => {
                  setDegree(text);
                  setDegreeError('');
                }}
              />
              {degreeError ? <Text style={styles.errorText}>{degreeError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Semester</Text>
              <TextInput
                style={[styles.input, semesterError ? styles.inputError : null]}
                placeholder="Enter your current semester"
                placeholderTextColor="#666"
                value={semester}
                onChangeText={(text) => {
                  setSemester(text);
                  setSemesterError('');
                }}
                keyboardType="numeric"
              />
              {semesterError ? <Text style={styles.errorText}>{semesterError}</Text> : null}
            </View>

            <TouchableOpacity 
              style={styles.signupButton}
              onPress={handleSignUp}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 40,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#000',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  dateText: {
    color: '#000',
    fontSize: 16,
  },
});

export default SignUp;