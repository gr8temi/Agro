import React, { useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import client from '../api/client';
import { useApiQuery, asList } from '../api/queries';
import { useRequireOnline } from '../context/NetworkContext';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/currency';
import Toast from 'react-native-toast-message';

const AllTransactionsScreen = ({ navigation, route }) => {
  const { selectedCycle, cycleName } = route.params || {};
  const { theme } = useTheme();
  const { userInfo, displayCurrency, farmBaseCurrency, financeCategories } = useContext(AuthContext);
  const isManager = userInfo?.role === 'superuser' || userInfo?.role === 'manager';
  const isConverting = displayCurrency !== farmBaseCurrency;
  const swipeableRefs = useRef({});
  const styles = getStyles(theme);
  const requireOnline = useRequireOnline();

  const getCategoryLabel = (key) => {
    const all = [...(financeCategories.expense || []), ...(financeCategories.income || [])];
    const found = all.find(c => c.key === key);
    return found ? found.label : key?.charAt(0).toUpperCase() + key?.slice(1).replace('_', ' ') || key;
  };

  const params = {};
  if (isConverting) params.currency = displayCurrency;
  if (selectedCycle) params.related_flock = selectedCycle;
  const { data, isLoading: loading, refetch: fetchTransactions } = useApiQuery('/transactions/', params);
  const transactions = [...asList(data)].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleDelete = (transaction) => {
    if (!requireOnline('Deleting a transaction')) return;
    Alert.alert(
      'Delete Transaction',
      `Delete this ${transaction.type} of ${formatCurrency(parseFloat(transaction.amount), displayCurrency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/transactions/${transaction.id}/`);
              Toast.show({ type: 'success', text1: 'Transaction deleted', position: 'top' });
              fetchTransactions();
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Failed to delete', position: 'top' });
            }
          },
        },
      ],
    );
  };

  const renderRightActions = (item) => (
    <View style={styles.swipeActionsContainer}>
      {isManager && (
        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => {
            swipeableRefs.current[item.id]?.close();
            handleDelete(item);
          }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    const isExpense = item.type === 'expense';
    const iconName = isExpense ? 'cash-minus' : 'cash-plus';
    const iconColor = isExpense ? theme.colors.error : theme.colors.primary;
    const amountColor = isExpense ? theme.colors.error : theme.colors.primary;

    return (
      <Swipeable
        ref={(ref) => { swipeableRefs.current[item.id] = ref; }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}
      >
        <View style={styles.card}>
          <View style={[styles.cardIconContainer, { backgroundColor: `${iconColor}20` }]}>
            <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{getCategoryLabel(item.category)}</Text>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.cardDetail}> {new Date(item.date).toLocaleDateString()}</Text>
            </View>
            {item.description ? <Text style={styles.cardDetail} numberOfLines={1}>{item.description}</Text> : null}
          </View>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {isExpense ? '-' : '+'}{isConverting ? '≈ ' : ''}{formatCurrency(parseFloat(item.amount), displayCurrency)}
          </Text>
        </View>
      </Swipeable>
    );
  };

  const title = cycleName ? `Transactions - ${cycleName}` : 'All Transactions';

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <CustomHeader title={title} navigation={navigation} showBack={true} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title={title} navigation={navigation} showBack={true} />
      <FlatList
        data={transactions}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centered}>
            <MaterialCommunityIcons name="bank-transfer" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No transactions found.</Text>
          </View>
        }
      />
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  list: {
    padding: theme.spacing.m,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  cardContent: {
    flex: 1,
    marginRight: theme.spacing.s,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardDetail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  amountText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: theme.spacing.m,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    borderRadius: 16,
  },
  deleteAction: {
    backgroundColor: theme.colors.error,
  },
  swipeActionText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
});

export default AllTransactionsScreen;
