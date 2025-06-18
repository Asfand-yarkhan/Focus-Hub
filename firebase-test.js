// Firebase Connection Test Script
// Run this with: node firebase-test.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (for testing purposes)
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test basic read operation
    const testDoc = await db.collection('test').doc('test').get();
    console.log('✅ Firebase connection successful');
    
    // Test write operation
    await db.collection('test').doc('test').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'Test connection successful'
    });
    console.log('✅ Firebase write operation successful');
    
    // Test query operation
    const querySnapshot = await db.collection('test').limit(1).get();
    console.log('✅ Firebase query operation successful');
    
    console.log('🎉 All Firebase operations working correctly!');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if google-services.json is in android/app/ directory');
    console.log('2. Verify Firebase project configuration');
    console.log('3. Check Firestore security rules');
    console.log('4. Ensure internet connection is working');
  }
}

testFirebaseConnection(); 