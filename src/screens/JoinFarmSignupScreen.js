import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const JoinFarmSignupScreen = ({ navigation }) => {
  const [invitationCode, setInvitationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleJoinFarm = async () => {
    if (!invitationCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your invitation code',
        position: 'top',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.post('/users/validate_invitation/', {
        invitation_code: invitationCode.trim().toUpperCase(),
      });

      if (response.data.valid) {
        const { already_joined, username, farm_name } = response.data;
        
        if (already_joined) {
          // User has already joined before - don't disable biometrics
          Toast.show({
            type: 'info',
            text1: 'Already Joined',
            text2: `You've already joined ${farm_name} farm. Please login.`,
            position: 'top',
          });
          
          setTimeout(() => {
            navigation.navigate('Login', {
              message: `Welcome back! Please login with your username: ${username}`
            });
          }, 1500);
        } else {
          // First time joining - disable biometrics for new user
          await AsyncStorage.setItem('biometricsEnabled', 'false');
          
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: `Welcome to ${farm_name} farm!`,
            position: 'top',
          });

          // Navigate to login with instruction
          setTimeout(() => {
            navigation.navigate('Login', {
              message: `Please login with username: ${username} and your temporary password from the invitation email.`
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error(error);
      let errorMessage = 'Invalid invitation code';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Join Farm</Text>
        <Text style={styles.subtitle}>
          Enter the invitation code you received via email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Invitation Code"
          placeholderTextColor={theme.colors.textSecondary}
          value={invitationCode}
          onChangeText={setInvitationCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleJoinFarm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Validate Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.l,
  },
  title: {
    ...theme.typography.h1,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
    color: theme.colors.primary,
  },
  subtitle: {
    ...theme.typography.body,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.textSecondary,
  },
  input: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  buttonText: {
    ...theme.typography.button,
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linkButton: {
    marginTop: theme.spacing.l,
    alignItems: 'center',
  },
  linkText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
});

export default JoinFarmSignupScreen;
