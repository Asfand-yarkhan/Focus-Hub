import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const Explore = () => {
  const navigation = useNavigation();

  const handleGroupPress = (groupName) => {
    console.log('Navigating to chat with group:', groupName);
    navigation.navigate('ChatScreen', { groupName });
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
    <TouchableOpacity 
      style={styles.groupCard} 
      onPress={() => handleGroupPress(item.name)}
    >
      <Image source={item.image} style={styles.groupImage} />
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupDescription}>{item.description}</Text>
        <View style={styles.groupStats}>
          <Icon name="users" size={16} color="#666" />
          <Text style={styles.memberCount}>{item.members} members</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
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

      {/* Categories Section */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Explore;