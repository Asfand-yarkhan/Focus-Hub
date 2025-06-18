import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const USER_PROFILE_KEY = '@focushub_user_profile';
const USER_SETTINGS_KEY = '@focushub_user_settings';
const USER_PREFERENCES_KEY = '@focushub_user_preferences';
const USER_STATS_KEY = '@focushub_user_stats';

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// User profile storage
export const userStorage = {
  // Save user profile
  saveUserProfile: async (userData) => {
    try {
      const dataToStore = {
        data: userData,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(dataToStore));
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  },

  // Get user profile
  getUserProfile: async (forceRefresh = false) => {
    try {
      const storedData = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (!storedData) return null;

      const { data, timestamp } = JSON.parse(storedData);
      
      // Check if cache is expired
      if (!forceRefresh && Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
      
      return null; // Return null if cache is expired or force refresh is true
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  // Save user settings
  saveUserSettings: async (settings) => {
    try {
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving user settings:', error);
      return false;
    }
  },

  // Get user settings
  getUserSettings: async () => {
    try {
      const settings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  },

  // Save user preferences
  saveUserPreferences: async (preferences) => {
    try {
      await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  },

  // Get user preferences
  getUserPreferences: async () => {
    try {
      const preferences = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  },

  // Save user stats
  saveUserStats: async (stats) => {
    try {
      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
      return true;
    } catch (error) {
      console.error('Error saving user stats:', error);
      return false;
    }
  },

  // Get user stats
  getUserStats: async () => {
    try {
      const stats = await AsyncStorage.getItem(USER_STATS_KEY);
      return stats ? JSON.parse(stats) : null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  },

  // Clear all user data (useful for logout)
  clearUserData: async () => {
    try {
      await AsyncStorage.multiRemove([
        USER_PROFILE_KEY,
        USER_SETTINGS_KEY,
        USER_PREFERENCES_KEY,
        USER_STATS_KEY
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }
}; 