import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Toast from 'react-native-toast-message';
import client from '../api/client';

const PasswordResetConfirmScreen = ({ navigation, route }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  // Refs for each input box
  const inputRefs = useRef([]);

  const handleCodeChange = (text, index) => {
    // Check if this is a paste (more than 1 character)
    if (text.length > 1) {
      // Only allow numbers
      const numericText = text.replace(/[^0-9]/g, '');
      
      // If we have 6 digits, fill all boxes
      if (numericText.length === 6) {
        const newCode = numericText.split('');
        setCode(newCode);
        // Focus the last box
        inputRefs.current[5]?.focus();
        return;
      }
      
      // If less than 6 digits, fill from current position
      const digits = numericText.split('').slice(0, 6 - index);
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      
      // Focus next empty box or last filled box
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    
    // Normal single character input
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= 1) {
      const newCode = [...code];
      newCode[index] = numericText;
      setCode(newCode);
      
      // Auto-focus next input
      if (numericText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    const resetToken = code.join('');
    
    if (resetToken.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the complete 6-digit code',
        position: 'top',
      });
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter both password fields',
        position: 'top',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
        position: 'top',
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 6 characters',
        position: 'top',
      });
      return;
    }

    setIsLoading(true);
    try {
      await client.post('/users/reset_password_with_token/', {
        reset_token: resetToken,
        new_password: newPassword,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password reset successfully!',
        position: 'top',
      });

      // Navigate to login
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to reset password',
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
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code from your email
        </Text>

        {/* 6-Box Code Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeBox,
                digit ? styles.codeBoxFilled : null,
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Back to Login</Text>
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.l,
    paddingHorizontal: theme.spacing.s,
  },
  codeBox: {
    width: 50,
    height: 60,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.text,
  },
  codeBoxFilled: {
    borderColor: theme.colors.primary,
  },
  input: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
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
    marginTop: theme.spacing.m,
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

export default PasswordResetConfirmScreen;
