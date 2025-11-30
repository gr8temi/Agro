import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="egg-easter" size={80} color={theme.colors.primary} />
        <Text style={styles.title}>Poultry Manager</Text>
        <Text style={styles.subtitle}>Manage your farm efficiently</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('CreateFarmSignup')}
        >
          <MaterialCommunityIcons name="barn" size={24} color="#fff" style={styles.icon} />
          <Text style={styles.primaryButtonText}>Create New Farm</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => navigation.navigate('JoinFarmSignup')}
        >
          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} style={styles.icon} />
          <Text style={styles.secondaryButtonText}>Join Existing Farm</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity 
          style={styles.textButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.textButtonText}>Login to your account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.l,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginTop: theme.spacing.m,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.s,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: '#fff',
    marginLeft: theme.spacing.s,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.l,
  },
  secondaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    marginLeft: theme.spacing.s,
  },
  icon: {
    marginRight: theme.spacing.s,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.m,
    color: theme.colors.textSecondary,
  },
  textButton: {
    alignItems: 'center',
  },
  textButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
