import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import client from '../api/client';
import Toast from 'react-native-toast-message';

const SettingsScreen = ({ navigation }) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { userInfo, logout } = useContext(AuthContext);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
    loadBiometricsPreference();
  }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricsAvailable(hasHardware && isEnrolled);
  };

  const loadBiometricsPreference = async () => {
    try {
      const value = await AsyncStorage.getItem('biometricsEnabled');
      if (value !== null) {
        setBiometricsEnabled(value === 'true');
      }
    } catch (error) {
      console.error('Error loading biometrics preference:', error);
    }
  };

  const toggleBiometrics = async (value) => {
    setBiometricsEnabled(value);
    try {
      await AsyncStorage.setItem('biometricsEnabled', value.toString());
    } catch (error) {
      console.error('Error saving biometrics preference:', error);
    }
  };

  const handleDeleteFarm = () => {
    Alert.alert(
      'Delete Farm',
      'This will permanently delete your farm and ALL data (users, flocks, logs, transactions). This action cannot be undone!',
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
              
              // Logout and navigate to welcome
              setTimeout(async () => {
                await logout();
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

  const ThemeOption = ({ label, mode, icon }) => (
    <TouchableOpacity
      style={[
        styles.option,
        { 
          backgroundColor: theme.colors.surface,
          borderColor: themeMode === mode ? theme.colors.primary : theme.colors.border
        }
      ]}
      onPress={() => setThemeMode(mode)}
      activeOpacity={0.7}
    >
      <View style={styles.optionContent}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.text} />
        <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>
      {themeMode === mode && (
        <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.background }]}>
      <CustomHeader title="Settings" navigation={navigation} showBack={true} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
        <View style={styles.optionsContainer}>
          <ThemeOption label="Light Mode" mode="light" icon="white-balance-sunny" />
          <ThemeOption label="Dark Mode" mode="dark" icon="weather-night" />
          <ThemeOption label="System Default" mode="system" icon="theme-light-dark" />
        </View>

        {/* Biometric Authentication */}
        {biometricsAvailable && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Security</Text>
            <View style={[styles.option, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.optionContent}>
                <MaterialCommunityIcons name="fingerprint" size={24} color={theme.colors.text} />
                <View>
                  <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Biometric Login</Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    Use fingerprint or face ID to login
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={toggleBiometrics}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
                thumbColor={biometricsEnabled ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </>
        )}

        {/* Change Password */}
        <TouchableOpacity
          style={[styles.option, { backgroundColor: theme.colors.surface, marginTop: biometricsAvailable ? 12 : 24, borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('ResetPassword', { isFirstLogin: false })}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <MaterialCommunityIcons name="lock-reset" size={24} color={theme.colors.text} />
            <View>
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Change Password</Text>
              <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                Update your account password
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Delete Farm - Superuser only */}
        {userInfo?.role === 'superuser' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.error, marginTop: 32 }]}>Danger Zone</Text>
            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.colors.surface, borderColor: theme.colors.error }]}
              onPress={handleDeleteFarm}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <MaterialCommunityIcons name="delete-forever" size={24} color={theme.colors.error} />
                <View>
                  <Text style={[styles.optionLabel, { color: theme.colors.error }]}>Delete Farm</Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    Permanently delete farm and all data
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default SettingsScreen;
