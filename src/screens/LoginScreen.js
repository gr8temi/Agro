import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { login, biometricLogin } = useContext(AuthContext);
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [biometricsAttempted, setBiometricsAttempted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const attemptBiometricLogin = async () => {
      try {
        const biometricsEnabled = await AsyncStorage.getItem('biometricsEnabled');
        if (biometricsEnabled !== 'true') {
          if (!cancelled) setShowPasswordForm(true);
          return;
        }

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          if (!cancelled) setShowPasswordForm(true);
          return;
        }

        timeoutId = setTimeout(() => {
          cancelled = true;
          setShowPasswordForm(true);
          setBiometricsAttempted(true);
        }, 5000);

        await biometricLogin();
        clearTimeout(timeoutId);
      } catch {
        if (!cancelled) setShowPasswordForm(true);
      } finally {
        if (!cancelled) setBiometricsAttempted(true);
      }
    };

    attemptBiometricLogin();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      const result = await login(username, password);
      
      // Check if password is temporary and redirect to reset screen
      if (result?.is_password_temporary) {
        navigation.navigate('ResetPassword', { isFirstLogin: true });
      }
      // Otherwise navigation happens automatically via AuthContext
    } catch (error) {
      if (!error.response) {
        Toast.show({
          type: 'error',
          text1: 'No connection',
          text2: 'Logging in needs an internet connection.',
          position: 'top',
        });
      } else if (error.response.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Invalid username or password',
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An error occurred. Please try again.',
          position: 'top',
        });
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  if (!biometricsAttempted) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Checking biometric authentication...
        </Text>
      </View>
    );
  }

  if (!showPasswordForm) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Poultry Farm Manager</Text>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <TouchableOpacity 
          style={styles.fallbackButton} 
          onPress={() => setShowPasswordForm(true)}
        >
          <Text style={styles.fallbackButtonText}>Login with Password</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces={false}>
      <Text style={styles.title}>Poultry Farm Manager</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={theme.colors.textSecondary}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
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
      <TouchableOpacity 
        style={[styles.button, isLoginLoading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoginLoading}
      >
        {isLoginLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Forgot Password Link */}
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>Forgot Password?</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.l,
  },
  title: {
    ...theme.typography.h1,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.primary,
  },
  input: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.m,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    fontSize: 16,
    color: theme.colors.text,
  },
  eyeIcon: {
    padding: 4,
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
    marginTop: theme.spacing.m,
    alignItems: 'center',
    padding: theme.spacing.s,
  },
  linkText: {
    ...theme.typography.body,
    fontSize: 14,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    fontSize: 16,
    textAlign: 'center',
  },
  fallbackButton: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  fallbackButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
