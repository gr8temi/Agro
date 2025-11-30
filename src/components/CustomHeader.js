import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const CustomHeader = ({ title, navigation, showBack = false }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, !showBack && styles.titleNoBack]}>{title}</Text>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    marginRight: theme.spacing.m,
    padding: 4,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    flex: 1,
  },
  titleNoBack: {
    textAlign: 'center',
  },
});

export default CustomHeader;
