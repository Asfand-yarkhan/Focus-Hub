import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feed from './Feed';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [activeScreen, setActiveScreen] = useState('Feed');

  // Set Feed as active screen when HomeScreen mounts
  useEffect(() => {
    setActiveScreen('Feed');
  }, []);

  // Set Feed as active screen when returning to HomeScreen
  useFocusEffect(
    React.useCallback(() => {
      setActiveScreen('Feed');
    }, [])
  );

  const handleNavigation = (screenName) => {
    setActiveScreen(screenName);
    // Only navigate if it's not Feed
    if (screenName !== 'Feed') {
      navigation.navigate(screenName);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../Assets/images/welcome.jpg')}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.inviteButton}>
            <Text style={styles.inviteButtonText}>Invite Friends</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Hey Asfand!</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.navButton, activeScreen === 'Feed' && styles.activeButton]} 
          onPress={() => handleNavigation('Feed')}
        >
          <Text style={[styles.buttonText, activeScreen === 'Feed' && styles.activeButtonText]}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, activeScreen === 'Profile' && styles.activeButton]} 
          onPress={() => handleNavigation('Profile')}
        >
          <Text style={[styles.buttonText, activeScreen === 'Profile' && styles.activeButtonText]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, activeScreen === 'Explore' && styles.activeButton]} 
          onPress={() => handleNavigation('Explore')}
        >
          <Text style={[styles.buttonText, activeScreen === 'Explore' && styles.activeButtonText]}>Explore</Text>
        </TouchableOpacity>
      </View>

      <Feed />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 200,
    width: '100%',
  },
  headerContent: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activeButtonText: {
    color: '#fff',
  },
});

export default HomeScreen;
