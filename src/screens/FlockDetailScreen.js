import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import client from '../api/client';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const FlockDetailScreen = ({ route, navigation }) => {
  const { flockId, flockName } = route.params;
  const [flock, setFlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const flockRes = await client.get(`/flocks/${flockId}/`);
        setFlock(flockRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [flockId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!flock) return null;

  const DetailCard = ({ icon, title, value }) => (
    <View style={styles.detailCard}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <View>
        <Text style={styles.detailLabel}>{title}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  const ActionButton = ({ title, icon, onPress, color = theme.colors.primary }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      <Text style={styles.actionButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title={flockName} navigation={navigation} showBack={true} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.infoSection}>
          <DetailCard icon="dna" title="Breed" value={flock.breed} />
          <DetailCard icon="counter" title="Current Quantity" value={`${flock.current_quantity} birds`} />
          <DetailCard icon="calendar" title="Date Added" value={new Date(flock.date_added).toLocaleDateString()} />
        </View>
        
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton 
            title="Add Feed Log" 
            icon="food-drumstick" 
            onPress={() => navigation.navigate('AddFeedLog', { flockId })} 
          />
          <ActionButton 
            title="Add Health Log" 
            icon="medical-bag" 
            onPress={() => navigation.navigate('AddHealthLog', { flockId })} 
          />
          <ActionButton 
            title="Record Eggs" 
            icon="egg" 
            onPress={() => navigation.navigate('AddEggCollection', { flockId })}
            color={theme.colors.secondary}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    padding: theme.spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  infoSection: {
    marginBottom: theme.spacing.xl,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  detailLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.m,
    color: theme.colors.primary,
  },
  actionsGrid: {
    gap: theme.spacing.m,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  actionButtonText: {
    ...theme.typography.button,
    marginLeft: theme.spacing.s,
    fontSize: 16,
  },
});

export default FlockDetailScreen;
