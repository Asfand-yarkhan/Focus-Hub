import React, { useState, useEffect, createContext, useContext } from 'react';
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
import NotificationScreen from './Screens/NotificationScreen';
import ChatList from './Screens/ChatList';
import OneOnOneChat from './Screens/OneOnOneChat';
import FirebaseTest from './Screens/FirebaseTest';
import SettingsScreen from './Screens/SettingsScreen';
import GroupChatScreen from './Screens/GroupChatScreen';

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  try {
    firebase.initializeApp();
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.log('Firebase already initialized');
}

// Initialize navigation
const Stack = createNativeStackNavigator();

// Theme context for dark mode
const defaultTheme = {
  darkMode: false,
  setDarkMode: () => {},
};
export const ThemeContext = createContext(defaultTheme);

const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Optionally, load from AsyncStorage here if you want persistence

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

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
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#3949ab',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                color: '#fff',
              },
            }}
          >
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
              name="HomeScreen"
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
              name="ChatScreen"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatList"
              component={ChatList}
              options={{
                title: 'Messages',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="OneOnOneChat"
              component={OneOnOneChat}
              options={{
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="NotificationScreen"
              component={NotificationScreen}
              options={{
                title: 'Notifications',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="Explore"
              component={Explore}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="FirebaseTest"
              component={FirebaseTest}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SettingsScreen"
              component={SettingsScreen}
              options={{ title: 'Settings', headerShown: true }}
            />
            <Stack.Screen
              name="GroupChatScreen"
              component={GroupChatScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}