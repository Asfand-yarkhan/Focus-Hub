import { initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyv5IAhdqGJ3YlmSFEUg70CishwhM8N-4",
  authDomain: "focus-hub-b58fe.firebaseapp.com",
  projectId: "focus-hub-b58fe",
  storageBucket: "focus-hub-b58fe.appspot.com",
  messagingSenderId: "188699792715",
  appId: "1:188699792715:android:a31a5361d94d289a9a44ce"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    app = getApp();
    console.log('Using existing Firebase app');
  } else {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Initialize Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.log('The current browser does not support persistence.');
  }
});

export { auth, db }; 