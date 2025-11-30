import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FarmOnboardingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>To get started, you need to be part of a farm.</Text>

      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('CreateFarm')}
      >
        <MaterialCommunityIcons name="barn" size={40} color={theme.colors.primary} />
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>Create a New Farm</Text>
          <Text style={styles.cardDescription}>Start a new farm and become the superuser.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('JoinFarm')}
      >
        <MaterialCommunityIcons name="account-group" size={40} color={theme.colors.secondary} />
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>Join an Existing Farm</Text>
          <Text style={styles.cardDescription}>Use an invitation code to join a team.</Text>
        </View>
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
    marginBottom: theme.spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textContainer: {
    marginLeft: theme.spacing.m,
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});

export default FarmOnboardingScreen;
