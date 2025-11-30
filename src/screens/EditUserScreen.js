import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import Toast from 'react-native-toast-message';

const EditUserScreen = ({ route, navigation }) => {
  const { user } = route.params;
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    {label: 'Staff', value: 'staff'},
    {label: 'Manager', value: 'manager'},
    {label: 'Financial Manager', value: 'financial_manager'},
    {label: 'Superuser', value: 'superuser'}
  ]);
  
  // Permission Flags - read directly from user object
  const [canManageFlocks, setCanManageFlocks] = useState(user.can_manage_flocks || false);
  const [canManageFinances, setCanManageFinances] = useState(user.can_manage_finances || false);
  const [canManageUsers, setCanManageUsers] = useState(user.can_manage_users || false);
  const [canAddLogs, setCanAddLogs] = useState(user.can_add_logs || false);

  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleUpdateUser = async () => {
    try {
      await client.put(`/users/${user.id}/`, {
        username,
        email,
        role,
        can_manage_flocks: canManageFlocks,
        can_manage_finances: canManageFinances,
        can_manage_users: canManageUsers,
        can_add_logs: canAddLogs,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'User updated successfully',
        position: 'top',
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update user',
        position: 'top',
      });
    }
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/users/${user.id}/`);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'User deleted successfully',
                position: 'top',
              });
              navigation.goBack();
            } catch (error) {
              console.error(error);
              
              // Check if this is the last superuser error
              if (error.response?.data?.is_last_superuser) {
                Alert.alert(
                  'Last Superuser',
                  'You are the last superuser. What would you like to do?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Transfer Ownership',
                      onPress: () => {
                        navigation.navigate('TransferOwnership', {
                          currentUserId: user.id
                        });
                      }
                    },
                    {
                      text: 'Delete Farm',
                      style: 'destructive',
                      onPress: () => handleDeleteFarm()
                    }
                  ]
                );
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: error.response?.data?.error || 'Failed to delete user',
                  position: 'top',
                });
              }
            }
          }
        }
      ]
    );
  };

  const handleDeleteFarm = () => {
    Alert.alert(
      'Delete Farm',
      'This will permanently delete the farm and ALL data (users, flocks, logs, transactions). This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.post('/farms/delete_farm/');
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Farm deleted successfully',
                position: 'top',
              });
              
              // Navigate to welcome screen
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
                text2: error.response?.data?.error || 'Failed to delete farm',
                position: 'top',
              });
            }
          }
        }
      ]
    );
  };
  // Update permissions when role changes (presets)
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'superuser') {
      setCanManageFlocks(true);
      setCanManageFinances(true);
      setCanManageUsers(true);
      setCanAddLogs(true);
    } else if (newRole === 'manager') {
      setCanManageFlocks(true);
      setCanManageFinances(true);
      setCanManageUsers(false);
      setCanAddLogs(true);
    } else if (newRole === 'financial_manager') {
      setCanManageFlocks(false);
      setCanManageFinances(true);
      setCanManageUsers(false);
      setCanAddLogs(false);
    } else { // staff
      setCanManageFlocks(false);
      setCanManageFinances(false);
      setCanManageUsers(false);
      setCanAddLogs(true);
    }
  };

  const PermissionToggle = ({ label, value, onValueChange }) => (
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        trackColor={{ false: "#767577", true: theme.colors.primary }}
        thumbColor={value ? theme.colors.secondary : "#f4f3f4"}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <CustomHeader title="Edit User" navigation={navigation} showBack={true} />
      <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled={true}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Role</Text>
        <View style={[styles.pickerContainer, { zIndex: 1000 }]}>
          <DropDownPicker
            open={open}
            value={role}
            items={items}
            setOpen={setOpen}
            setValue={setRole}
            setItems={setItems}
            onChangeValue={handleRoleChange}
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={{ color: theme.colors.text }}
          />
        </View>

        <Text style={styles.sectionHeader}>Permissions</Text>
        <PermissionToggle 
          label="Manage Flocks" 
          value={canManageFlocks} 
          onValueChange={setCanManageFlocks} 
        />
        <PermissionToggle 
          label="Manage Finances" 
          value={canManageFinances} 
          onValueChange={setCanManageFinances} 
        />
        <PermissionToggle 
          label="Manage Users" 
          value={canManageUsers} 
          onValueChange={setCanManageUsers} 
        />
        <PermissionToggle 
          label="Add Logs" 
          value={canAddLogs} 
          onValueChange={setCanAddLogs} 
        />

        <TouchableOpacity style={styles.button} onPress={handleUpdateUser}>
          <Text style={styles.buttonText}>Update User</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteUser}>
          <Text style={styles.buttonText}>Delete User</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
  },
  label: {
    ...theme.typography.body,
    marginBottom: theme.spacing.s,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  pickerContainer: {
    marginBottom: theme.spacing.l,
  },
  dropdown: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  dropdownContainer: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: {
    ...theme.typography.h2,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.m,
    color: theme.colors.primary,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  toggleLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.l,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    marginTop: theme.spacing.m,
  },
  buttonText: {
    ...theme.typography.button,
  },
});

export default EditUserScreen;
