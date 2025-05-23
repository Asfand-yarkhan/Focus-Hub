import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
  } from 'react-native';
  import React, {useState} from 'react';
  import Backbutton from '../components/Backbutton';
  import {TextInput} from 'react-native';
  import {useNavigation} from '@react-navigation/native';
  import {useDispatch} from 'react-redux';
  import {login} from '../store/slices/authSlice';
  import auth from '@react-native-firebase/auth';
  import firestore from '@react-native-firebase/firestore';
  
  const LogIn = () => {
    const [email, setemail] = useState('');
    const [Password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const dispatch = useDispatch();
  
    const handleSignin = async () => {
      if (!email || !Password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
  
      try {
        setLoading(true);
        // Sign in with Firebase
        const userCredential = await auth().signInWithEmailAndPassword(email, Password);
        
        // Get additional user data from Firestore
        const userDoc = await firestore()
          .collection('users')
          .doc(userCredential.user.uid)
          .get();
  
        if (!userDoc.exists) {
          throw new Error('User data not found');
        }
  
        const userData = userDoc.data();
  
        // Update Redux state with user data
        dispatch(login({
          uid: userCredential.user.uid,
          email: userData.email,
          cnic: userData.cnic,
          phoneNumber: userData.phoneNumber,
        }));
  
        // Navigation will be handled automatically by the App.js conditional rendering
      } catch (error) {
        let errorMessage = 'An error occurred during sign in';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (error.message === 'User data not found') {
          errorMessage = 'User data not found in database';
        }
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container1}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Backbutton />
          </View>
  
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <Text style={styles.heading}>Sign In</Text>
          </View>
  
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <Image style={styles.Image} source={require('../assets/signin.jpg')} />
          </View>
  
          <View>
            <Text style={styles.Text}>Email : </Text>
            <TextInput
              value={email}
              onChangeText={value => setemail(value)}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              style={styles.Input}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.Text}>Password :</Text>
            <TextInput
              value={Password}
              onChangeText={value => setPassword(value)}
              style={styles.Input}
              secureTextEntry={true}
              placeholder="Enter your password"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>
          <View style={styles.forgetContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')}>
              <Text style={styles.forgetText}>Forget Password?</Text>
            </TouchableOpacity>
          </View>
  
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSignin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };
  
  export default LogIn;
  
  const styles = StyleSheet.create({
    container1: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 50,
      marginBottom: 20,
    },
    heading: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1a237e',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    Image: {
      marginTop: 10,
      width: 200,
      height: 200,
      borderRadius: 40,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    },
    Text: {
      fontSize: 16,
      fontWeight: '600',
      color: '#3949ab',
      marginTop: 15,
      marginLeft: 5,
    },
    Input: {
      borderRadius: 15,
      backgroundColor: '#ffffff',
      padding: 15,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      color: '#000000',
      fontSize: 16,
    },
    buttonContainer: {
      marginTop: 40,
      paddingHorizontal: 10,
    },
    button: {
      backgroundColor: '#3949ab',
      paddingVertical: 16,
      borderRadius: 30,
      width: '100%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    buttonDisabled: {
      backgroundColor: '#9fa8da',
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      letterSpacing: 1,
    },
    forgetContainer: {
      alignItems: 'flex-end',
      paddingRight: 10,
      marginTop: 5,
    },
    forgetText: {
      color: '#3949ab',
      fontSize: 14,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
  });
  