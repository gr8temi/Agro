import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import DropDownPicker from 'react-native-dropdown-picker';
import * as Clipboard from 'expo-clipboard';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AddUserScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [role, setRole] = useState('staff');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    {label: 'Staff', value: 'staff'},
    {label: 'Manager', value: 'manager'},
    {label: 'Financial Manager', value: 'financial_manager'},
    {label: 'Superuser', value: 'superuser'}
  ]);
  
  // Permission Flags
  const [canManageFlocks, setCanManageFlocks] = useState(false);
  const [canManageFinances, setCanManageFinances] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canAddLogs, setCanAddLogs] = useState(true); // Default for staff

  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleAddUser = async () => {
    try {
      const response = await client.post('/users/', {
        username,
        email,
        password,
        role,
        can_manage_flocks: canManageFlocks,
        can_manage_finances: canManageFinances,
        can_manage_users: canManageUsers,
        can_add_logs: canAddLogs,
      });
      
      // Show invitation details
      const invitationCode = response.data.invitation_code;
      const tempPassword = response.data.temporary_password;
      
      Toast.show({
        type: 'success',
        text1: 'User Created',
        text2: `Invitation sent to ${username}`,
        position: 'top',
        visibilityTime: 4000,
      });
      
      // Show an alert with the credentials
      const credentialsText = `Username: ${username}\nInvitation Code: ${invitationCode}\nTemporary Password: ${tempPassword}`;
      
      setTimeout(() => {
        Alert.alert(
          'User Created Successfully!',
          `${credentialsText}\n\nThese details have been emailed to the user.`,
          [
            {
              text: 'Copy Details',
              onPress: async () => {
                await Clipboard.setStringAsync(credentialsText);
                Toast.show({
                  type: 'success',
                  text1: 'Copied',
                  text2: 'Credentials copied to clipboard',
                  position: 'top',
                });
              }
            },
            { 
              text: 'OK', 
              onPress: () => {} 
            }
          ]
        );
      }, 500);
      
      navigation.goBack();
    } catch (error) {
      let errorMessage = 'Failed to create user. Please try again.';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.username) errorMessage = errorData.username[0];
        else if (errorData.email) errorMessage = errorData.email[0];
        else if (errorData.password) errorMessage = errorData.password[0];
        else if (errorData.detail) errorMessage = errorData.detail;
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
      });
    }
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
      <CustomHeader title="Add New User" navigation={navigation} showBack={true} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="Enter username"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter email"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            placeholder="Enter password"
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <MaterialCommunityIcons 
              name={isPasswordVisible ? "eye" : "eye-off"} 
              size={24} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

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
            ArrowDownIconComponent={() => (
              <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.text} />
            )}
            ArrowUpIconComponent={() => (
              <MaterialCommunityIcons name="chevron-up" size={20} color={theme.colors.text} />
            )}
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

        <TouchableOpacity style={styles.button} onPress={handleAddUser}>
          <Text style={styles.buttonText}>Create User</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.m,
  },
  passwordInput: {
    flex: 1,
    padding: theme.spacing.m, // Vertical padding matches normal input
    // No border here
    color: theme.colors.text,
  },
  eyeIcon: {
    padding: 4,
  },
  pickerContainer: {
    marginBottom: theme.spacing.l,
    // Removed border and background as DropDownPicker handles it
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
  buttonText: {
    ...theme.typography.button,
  },
});

export default AddUserScreen;
