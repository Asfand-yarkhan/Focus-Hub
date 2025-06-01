import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "focus-hub-b58fe",
  storageBucket: "focus-hub-b58fe.firebasestorage.app",
  apiKey: "AIzaSyDyv5IAhdqGJ3YlmSFEUg70CishwhM8N-4",
  appId: "1:188699792715:android:a31a5361d94d289a9a44ce"
};

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Enable offline persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
});

export { auth, firestore }; 