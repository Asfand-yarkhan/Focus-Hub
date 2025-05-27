import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TextInput,
  } from 'react-native';
  import React, {useState} from 'react';
  import {useNavigation} from '@react-navigation/native';
  import Icon from 'react-native-vector-icons/FontAwesome';
  
  const ForgetPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const navigation = useNavigation();
  
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
  
    const handleResetPassword = async () => {
      // Reset error
      setEmailError('');

      // Validate email
      if (!email) {
        setEmailError('Email is required');
        return;
      }
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }
  
      try {
        setLoading(true);
        // TODO: Implement password reset logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        Alert.alert(
          'Success',
          'Password reset instructions have been sent to your email',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'An error occurred while processing your request');
      } finally {
        setLoading(false);
      }
    };
  
    return (
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.description}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              style={[styles.input, emailError ? styles.inputError : null]}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
  
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 30,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
    },
    placeholder: {
      width: 40,
    },
    formContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 20,
    },
    description: {
      fontSize: 16,
      color: '#666',
      marginBottom: 30,
      lineHeight: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#3949ab',
      marginBottom: 8,
    },
    input: {
      backgroundColor: '#f5f5f5',
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
      fontSize: 16,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    inputError: {
      borderColor: '#FF3B30',
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 12,
      marginTop: -15,
      marginBottom: 15,
      marginLeft: 4,
    },
    button: {
      backgroundColor: '#3949ab',
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: '#9fa8da',
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '600',
    },
  });
  
  export default ForgetPassword; 