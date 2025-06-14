import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const Explore = () => {
  const navigation = useNavigation();
  const [joinedGroups, setJoinedGroups] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const handleGroupPress = (groupName) => {
    navigation.navigate('ChatScreen', { groupName });
  };

  const handleJoinPress = (groupId) => {
    if (joinedGroups.has(groupId)) {
      return;
    }
    setJoinedGroups(prev => new Set([...prev, groupId]));
  };

  const studyGroups = [
    {
      id: '1',
      name: 'Computer Science',
      members: 156,
      image: require('../Assets/images/group.jpeg'),
      description: 'Study group for CS students'
    },
    {
      id: '2',
      name: 'Mathematics',
      members: 89,
      image: require('../Assets/images/group.jpeg'),
      description: 'Advanced mathematics discussion'
    },
    {
      id: '3',
      name: 'Physics',
      members: 120,
      image: require('../Assets/images/group.jpeg'),
      description: 'Physics study group'
    },
    {
      id: '4',
      name: 'Chemistry',
      members: 95,
      image: require('../Assets/images/group.jpeg'),
      description: 'Chemistry enthusiasts'
    }
  ];

  const renderGroupItem = ({ item }) => (
    <View style={styles.groupCard}>
      <Image source={item.image} style={styles.groupImage} />
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupDescription}>{item.description}</Text>
        <View style={styles.groupStats}>
          <Icon name="users" size={16} color="#666" />
          <Text style={styles.memberCount}>{item.members} members</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.joinButton, joinedGroups.has(item.id) && styles.joinButtonRequested]}
        onPress={() => handleJoinPress(item.id)}
      >
        <Text style={[styles.joinButtonText, joinedGroups.has(item.id) && styles.joinButtonTextRequested]}>
          {joinedGroups.has(item.id) ? 'Requested' : 'Join'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explore</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Icon name="search" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Study Hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Completed Tasks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
        </View>

        {/* Categories Section - My Groups */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => handleGroupPress('Computer Science')}
            >
              <Icon name="laptop" size={24} color="#007AFF" />
              <Text style={styles.categoryText}>Computer Science</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => handleGroupPress('Mathematics')}
            >
              <Icon name="calculator" size={24} color="#007AFF" />
              <Text style={styles.categoryText}>Mathematics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => handleGroupPress('Physics')}
            >
              <Icon name="flask" size={24} color="#007AFF" />
              <Text style={styles.categoryText}>Science</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => handleGroupPress('Literature')}
            >
              <Icon name="book" size={24} color="#007AFF" />
              <Text style={styles.categoryText}>Literature</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Study Groups Section */}
        <View style={styles.groupsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Study Groups</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={studyGroups}
            renderItem={renderGroupItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#ddd',
  },
  categoriesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    minWidth: 100,
  },
  categoryText: {
    marginTop: 8,
    color: '#333',
    fontSize: 14,
  },
  groupsContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 16,
  },
  groupCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  groupImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  joinButtonRequested: {
    backgroundColor: '#E0E0E0',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  joinButtonTextRequested: {
    color: '#666',
  },
});

export default Explore;