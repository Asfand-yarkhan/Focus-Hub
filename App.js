import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Welcome from './Screens/Welcome';
import Login from './Screens/Login';
import SignUp from './Screens/SignUp';
import HomeScreen from './Screens/Homescreen';
import Feed from './Screens/Feed';
import Profile from './Screens/Profile';
import Explore from './Screens/Explore';
import ChatScreen from './Screens/ChatScreen';
import ForgetPassword from './Screens/ForgetPassword';
import EditProfile from './Screens/EditProfile';

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp();
}

// Initialize navigation
const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) {
    return null; // or a loading screen
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={user ? "Home" : "Welcome"}>
          {!user ? (
            // Auth screens
            <>
              <Stack.Screen 
                name="Welcome" 
                component={Welcome}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Login" 
                component={Login}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="SignUp" 
                component={SignUp}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="ForgetPassword" 
                component={ForgetPassword}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            // App screens
            <>
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Feed" 
                component={Feed}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Profile" 
                component={Profile}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="EditProfile" 
                component={EditProfile}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Explore" 
                component={Explore}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="ChatScreen" 
                component={ChatScreen}
                options={{ 
                  headerShown: true,
                  headerTitle: 'Group Chat',
                  headerStyle: {
                    backgroundColor: '#f8f9fa',
                  },
                  headerTintColor: '#3949ab',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}