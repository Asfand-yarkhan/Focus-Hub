import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Initialize Auth and Firestore
const authInstance = auth();
const db = firestore();

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