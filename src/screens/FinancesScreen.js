import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FinancesScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const fetchTransactions = async () => {
    try {
      const response = await client.get('/finances/transactions/');
      setTransactions(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTransactions();
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

  const renderItem = ({ item }) => {
    const isExpense = item.type === 'expense';
    const iconName = isExpense ? 'cash-minus' : 'cash-plus';
    const iconColor = isExpense ? theme.colors.error : theme.colors.primary;
    const amountColor = isExpense ? theme.colors.error : theme.colors.primary;

    return (
      <View style={styles.card}>
        <View style={[styles.cardIconContainer, { backgroundColor: `${iconColor}20` }]}>
          <MaterialCommunityIcons name={iconName} size={32} color={iconColor} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.category}</Text>
          <View style={styles.cardRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.cardDetail}> {new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.cardDetail}>{item.description}</Text>
        </View>
        <Text style={[styles.amountText, { color: amountColor }]}>
          {isExpense ? '-' : '+'}${item.amount}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Finances" navigation={navigation} showBack={true} />
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('AddTransaction')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="cash-plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Transaction</Text>
        </TouchableOpacity>

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bank-transfer" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No transactions found.</Text>
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
    fontSize: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  cardDetail: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default FinancesScreen;
