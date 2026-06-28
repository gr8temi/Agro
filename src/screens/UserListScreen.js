import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const UserListScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const fetchUsers = async () => {
    try {
      const response = await client.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUsers();
    });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }


  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('EditUser', { user: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardIconContainer}>
        <MaterialCommunityIcons name="account" size={32} color={theme.colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.username}</Text>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="badge-account-horizontal" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.cardDetail}> {item.role}</Text>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="email" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.cardDetail} numberOfLines={1}> {item.email}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Manage Users" navigation={navigation} showBack={true} />
      <View style={styles.container}>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-group" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          }
        />
        
        {/* FAB */}
        {/* FAB */}
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('AddUser')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-plus" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  cardContent: {
    flex: 1,
    marginRight: theme.spacing.s,
  },
  cardTitle: {
    ...theme.typography.h3,
    marginBottom: 4,
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardDetail: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl * 2,
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.body,
    marginTop: theme.spacing.m,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default UserListScreen;
