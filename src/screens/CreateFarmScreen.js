import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const CreateFarmScreen = ({ navigation }) => {
  const [farmName, setFarmName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { refreshUserData } = useContext(AuthContext);

  const handleCreateFarm = async () => {
    if (!farmName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a farm name',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.post('/farms/create_farm/', { name: farmName });
      // The response contains the farm object. We need to update the user's farm info.
      // We also need to update the role to 'superuser' and permissions.
      const newFarm = response.data;
      await refreshUserData({ 
        farm: newFarm, 
        role: 'superuser',
        permissions: {
            can_manage_flocks: true,
            can_manage_finances: true,
            can_manage_users: true,
            can_add_logs: true
        }
      }); 
      // Navigation will be handled by AppNavigator based on user state
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create farm',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Farm</Text>
      <Text style={styles.subtitle}>Start by giving your farm a name.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Farm Name"
        placeholderTextColor={theme.colors.textSecondary}
        value={farmName}
        onChangeText={setFarmName}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleCreateFarm}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Farm</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.l,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
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
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  buttonText: {
    ...theme.typography.button,
  },
  backButton: {
    alignItems: 'center',
    padding: theme.spacing.s,
  },
  backButtonText: {
    color: theme.colors.textSecondary,
  },
});

export default CreateFarmScreen;
