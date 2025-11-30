import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const JoinFarmScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { refreshUserData } = useContext(AuthContext);

  const handleJoinFarm = async () => {
    if (!code.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter an invitation code',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.post('/farms/join_farm/', { code });
      const newFarm = response.data;
      await refreshUserData({ farm: newFarm }); 
      // Navigation will be handled by AppNavigator based on user state
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid code or failed to join',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Farm</Text>
      <Text style={styles.subtitle}>Enter the invitation code provided by your farm admin.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Invitation Code"
        placeholderTextColor={theme.colors.textSecondary}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleJoinFarm}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Join Farm</Text>
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

export default JoinFarmScreen;
