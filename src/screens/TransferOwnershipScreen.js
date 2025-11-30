import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import Toast from 'react-native-toast-message';
import client from '../api/client';

const TransferOwnershipScreen = ({ route, navigation }) => {
  const { currentUserId } = route.params;
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await client.get('/users/');
      // Filter out the current superuser
      const otherUsers = response.data.filter(user => user.id !== currentUserId);
      setUsers(otherUsers);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load users',
        position: 'top',
      });
    }
  };

  const handleTransfer = async () => {
    if (!selectedUserId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a user to transfer ownership to',
        position: 'top',
      });
      return;
    }

    setIsLoading(true);
    try {
      await client.post(`/users/${currentUserId}/transfer_ownership/`, {
        new_superuser_id: selectedUserId,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Ownership transferred successfully',
        position: 'top',
      });

      // Navigate back to login since current user is deleted
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }, 1500);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to transfer ownership',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        selectedUserId === item.id && styles.userCardSelected,
      ]}
      onPress={() => setSelectedUserId(item.id)}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
        {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
      </View>
      {selectedUserId === item.id && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Transfer Ownership" navigation={navigation} showBack={true} />
      <View style={styles.content}>
        <Text style={styles.title}>Select New Superuser</Text>
        <Text style={styles.subtitle}>
          Choose a user to transfer farm ownership to. You will be logged out after transfer.
        </Text>

        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleTransfer}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Transfer Ownership</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.l,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.l,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.l,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  userCardSelected: {
    borderColor: theme.colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userRole: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  userEmail: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.m,
  },
  buttonText: {
    ...theme.typography.button,
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default TransferOwnershipScreen;
