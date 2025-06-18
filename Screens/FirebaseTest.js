import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const FirebaseTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Firebase App Initialization
      addResult('Firebase App', 'RUNNING', 'Checking Firebase app initialization...');
      try {
        const app = firebase.app();
        addResult('Firebase App', 'PASS', `App initialized: ${app.name}`);
      } catch (error) {
        addResult('Firebase App', 'FAIL', error.message);
        return;
      }

      // Test 2: Firestore Connection
      addResult('Firestore', 'RUNNING', 'Testing Firestore connection...');
      try {
        const db = firestore();
        addResult('Firestore', 'PASS', 'Firestore instance created successfully');
      } catch (error) {
        addResult('Firestore', 'FAIL', error.message);
        return;
      }

      // Test 3: Auth Connection
      addResult('Authentication', 'RUNNING', 'Testing Authentication connection...');
      try {
        const authInstance = auth();
        addResult('Authentication', 'PASS', 'Auth instance created successfully');
      } catch (error) {
        addResult('Authentication', 'FAIL', error.message);
        return;
      }

      // Test 4: Basic Firestore Read
      addResult('Firestore Read', 'RUNNING', 'Testing basic Firestore read operation...');
      try {
        const testDoc = await firestore().collection('test').doc('connection-test').get();
        addResult('Firestore Read', 'PASS', 'Read operation successful');
      } catch (error) {
        addResult('Firestore Read', 'FAIL', error.message);
      }

      // Test 5: Basic Firestore Write
      addResult('Firestore Write', 'RUNNING', 'Testing basic Firestore write operation...');
      try {
        await firestore().collection('test').doc('connection-test').set({
          timestamp: firestore.FieldValue.serverTimestamp(),
          message: 'Connection test successful',
          testTime: new Date().toISOString()
        });
        addResult('Firestore Write', 'PASS', 'Write operation successful');
      } catch (error) {
        addResult('Firestore Write', 'FAIL', error.message);
      }

      // Test 6: Current User
      addResult('Current User', 'RUNNING', 'Checking current user...');
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          addResult('Current User', 'PASS', `User logged in: ${currentUser.email}`);
        } else {
          addResult('Current User', 'INFO', 'No user currently logged in');
        }
      } catch (error) {
        addResult('Current User', 'FAIL', error.message);
      }

    } catch (error) {
      addResult('General', 'FAIL', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Running Tests...' : 'Run Firebase Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <View key={index} style={[styles.resultItem, styles[`result${result.status}`]]}>
            <Text style={styles.resultTest}>{result.test}</Text>
            <Text style={styles.resultStatus}>{result.status}</Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
            <Text style={styles.resultTime}>{result.timestamp}</Text>
          </View>
        ))}
        
        {testResults.length === 0 && (
          <Text style={styles.noResults}>No test results yet. Click "Run Firebase Tests" to start.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3949ab',
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  resultPASS: {
    borderLeftColor: '#4caf50',
  },
  resultFAIL: {
    borderLeftColor: '#f44336',
  },
  resultRUNNING: {
    borderLeftColor: '#ff9800',
  },
  resultINFO: {
    borderLeftColor: '#2196f3',
  },
  resultTest: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  resultPASS: {
    color: '#4caf50',
  },
  resultFAIL: {
    color: '#f44336',
  },
  resultRUNNING: {
    color: '#ff9800',
  },
  resultINFO: {
    color: '#2196f3',
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
});

export default FirebaseTest; 