import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import client from '../api/client';
import { useNavigation } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const FlockListScreen = () => {
  const [flocks, setFlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const fetchFlocks = async () => {
    try {
      const response = await client.get('/flocks/');
      setFlocks(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFlocks();
    });

    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('FlockDetail', { flockId: item.id, flockName: item.name })}
      activeOpacity={0.7}
    >
      <View style={styles.cardIconContainer}>
        <MaterialCommunityIcons name="bird" size={32} color={theme.colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="dna" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.cardDetail}> {item.breed}</Text>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="counter" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.cardDetail}> {item.current_quantity} birds</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="My Flocks" navigation={navigation} showBack={true} />
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('AddFlock')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Flock</Text>
        </TouchableOpacity>

        <FlatList
          data={flocks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="barn" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No flocks found. Add one to get started!</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.l,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonText: {
    ...theme.typography.button,
    marginLeft: theme.spacing.s,
    fontSize: 18,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  card: {
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
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}20`, // 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  cardContent: {
    flex: 1,
    marginRight: theme.spacing.s,
  },
  cardTitle: {
    ...theme.typography.h3,
    marginBottom: 4,
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardDetail: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl * 2,
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.body,
    marginTop: theme.spacing.m,
    textAlign: 'center',
  },
});

export default FlockListScreen;
