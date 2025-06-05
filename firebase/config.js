import firebase from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Get the default Firebase app instance
const app = firebase.app();

// Initialize Auth and Firestore using the specific app instance
const authInstance = getAuth(app);
const db = firestore(app);

// Enable offline persistence - React Native Firebase handles this differently or it might be enabled by default
// Remove the web-specific enableIndexedDbPersistence call
// enableIndexedDbPersistence(db).catch((err) => {
//   if (err.code === 'failed-precondition') {
//     console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
//   } else if (err.code === 'unimplemented') {
//     console.log('The current browser does not support persistence.');
//   }
// });

export { authInstance as auth, db };