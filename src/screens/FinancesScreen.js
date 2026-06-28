import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, Platform, Alert, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import DropDownPicker from 'react-native-dropdown-picker';
import Toast from 'react-native-toast-message';

const FinancesScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState(30);
  const [categoryView, setCategoryView] = useState('expense');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [cyclePickerOpen, setCyclePickerOpen] = useState(false);
  const { theme } = useTheme();
  const { userInfo, displayCurrency, farmBaseCurrency, financeCategories } = useContext(AuthContext);
  const isManager = userInfo?.role === 'superuser' || userInfo?.role === 'manager';
  const isConverting = displayCurrency !== farmBaseCurrency;
  const swipeableRefs = useRef({});
  const styles = getStyles(theme);
  const screenWidth = Dimensions.get('window').width;

  const categoryLabels = useMemo(() => {
    const map = {};
    [...(financeCategories.expense || []), ...(financeCategories.income || [])].forEach(c => {
      map[c.key] = c.label;
    });
    return map;
  }, [financeCategories]);

  const getCategoryLabel = (key) => categoryLabels[key] || key?.charAt(0).toUpperCase() + key?.slice(1).replace('_', ' ') || key;

  const cycleItems = useMemo(() => {
    const sorted = [...cycles].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });
    return [
      { label: 'All Cycles', value: null },
      ...sorted.map(c => ({
        label: c.status === 'active' ? c.name : `${c.name} (Closed)`,
        value: c.id,
        icon: () => (
          <View style={{
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: c.status === 'active' ? '#4CAF50' : '#9E9E9E',
          }} />
        ),
      })),
    ];
  }, [cycles]);

  const getCycleName = (flockId) => {
    const cycle = cycles.find(c => c.id === flockId);
    return cycle ? cycle.name : null;
  };

  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchTransactions = async (currency, baseCurrency, cycleId) => {
    try {
      const params = {};
      if (currency !== baseCurrency) params.currency = currency;
      if (cycleId) params.related_flock = cycleId;
      const response = await client.get('/transactions/', { params });
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (currency, baseCurrency, cycleId, period) => {
    try {
      const params = {};
      if (currency !== baseCurrency) params.currency = currency;
      if (cycleId != null) params.related_flock = cycleId;
      params.period = period > 0 ? period : 3650;
      const response = await client.get('/transactions/analytics/', { params });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    client.get('/flocks/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setCycles(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTransactions(displayCurrency, farmBaseCurrency, selectedCycle);
    fetchAnalytics(displayCurrency, farmBaseCurrency, selectedCycle, timePeriod);
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTransactions(displayCurrency, farmBaseCurrency, selectedCycle);
      fetchAnalytics(displayCurrency, farmBaseCurrency, selectedCycle, timePeriod);
    });
    return unsubscribe;
  }, [navigation, displayCurrency, farmBaseCurrency, selectedCycle, timePeriod]);

  const handleDeleteTransaction = (transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.type} of ${formatCurrency(parseFloat(transaction.amount), displayCurrency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/transactions/${transaction.id}/`);
              Toast.show({ type: 'success', text1: 'Success', text2: 'Transaction deleted successfully', position: 'top' });
              fetchTransactions(displayCurrency, farmBaseCurrency, selectedCycle);
              fetchAnalytics(displayCurrency, farmBaseCurrency, selectedCycle, timePeriod);
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.detail || 'Failed to delete transaction', position: 'top' });
            }
          },
        },
      ],
    );
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(String(transaction.amount));
    setEditDescription(transaction.description || '');
    setEditCategory(transaction.category);
    setEditCategoryOpen(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editAmount || isNaN(parseFloat(editAmount))) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please enter a valid amount', position: 'top' });
      return;
    }
    setActionLoading(true);
    try {
      const patchData = {
        amount: parseFloat(editAmount),
        description: editDescription,
        category: editCategory,
      };
      if (isConverting) patchData.currency = displayCurrency;
      await client.patch(`/transactions/${editingTransaction.id}/`, patchData);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Transaction updated successfully', position: 'top' });
      setEditModalVisible(false);
      setEditingTransaction(null);
      fetchTransactions(displayCurrency, farmBaseCurrency, selectedCycle);
      fetchAnalytics(displayCurrency, farmBaseCurrency, selectedCycle, timePeriod);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.detail || 'Failed to update transaction', position: 'top' });
    } finally {
      setActionLoading(false);
    }
  };

  const renderRightActions = (item) => (
    <View style={styles.swipeActionsContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, styles.editAction]}
        onPress={() => {
          swipeableRefs.current[item.id]?.close();
          handleEditTransaction(item);
        }}
      >
        <MaterialCommunityIcons name="pencil" size={22} color="#fff" />
        <Text style={styles.swipeActionText}>Edit</Text>
      </TouchableOpacity>
      {isManager && (
        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => {
            swipeableRefs.current[item.id]?.close();
            handleDeleteTransaction(item);
          }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Use backend analytics for summaries, client-side for charts and list
  const analytics = useMemo(() => {
    const totalIncome = analyticsData?.total_income ? parseFloat(analyticsData.total_income) : 0;
    const totalExpenses = analyticsData?.total_expenses ? parseFloat(analyticsData.total_expenses) : 0;
    const netProfit = analyticsData?.net_profit ? parseFloat(analyticsData.net_profit) : 0;

    const expenseByCategory = analyticsData?.expense_by_category || {};
    const incomeByCategory = analyticsData?.income_by_category || {};

    // Filter transactions client-side for chart and list display
    const now = new Date();
    let filteredForChart = transactions;
    if (timePeriod > 0) {
      const periodStart = new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000);
      filteredForChart = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= periodStart && transactionDate <= now;
      });
    }

    // Prepare chart data
    const dailyData = {};
    filteredForChart.forEach(t => {
      const date = t.date;
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dailyData[date].income += parseFloat(t.amount);
      } else {
        dailyData[date].expense += parseFloat(t.amount);
      }
    });

    const sortedDates = Object.keys(dailyData).sort();
    const chartLabels = sortedDates.slice(-7).map(date => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    const incomeData = sortedDates.slice(-7).map(date => dailyData[date].income);
    const expenseData = sortedDates.slice(-7).map(date => dailyData[date].expense);

    // Top categories from backend
    const topExpenses = analyticsData?.top_expenses
      ? analyticsData.top_expenses.map(e => [e.category, parseFloat(e.amount)])
      : Object.entries(expenseByCategory).sort((a, b) => parseFloat(b[1]) - parseFloat(a[1])).slice(0, 3);

    const topIncome = analyticsData?.top_income
      ? analyticsData.top_income.map(e => [e.category, parseFloat(e.amount)])
      : Object.entries(incomeByCategory).sort((a, b) => parseFloat(b[1]) - parseFloat(a[1])).slice(0, 3);

    // Pie chart data
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    const expensePieData = Object.entries(expenseByCategory).map(([key, amount], index) => ({
      name: getCategoryLabel(key),
      amount: parseFloat(amount),
      color: colors[index % colors.length],
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }));

    const incomePieData = Object.entries(incomeByCategory).map(([key, amount], index) => ({
      name: getCategoryLabel(key),
      amount: parseFloat(amount),
      color: colors[index % colors.length],
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }));

    // Sort transactions by date descending for the list
    const sortedTransactions = [...filteredForChart].sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      chartLabels: chartLabels.length > 0 ? chartLabels : ['No Data'],
      incomeData: incomeData.length > 0 ? incomeData : [0],
      expenseData: expenseData.length > 0 ? expenseData : [0],
      topExpenses,
      topIncome,
      expensePieData,
      incomePieData,
      filteredTransactions: sortedTransactions,
    };
  }, [transactions, analyticsData, timePeriod, theme.colors.text, categoryLabels]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const SummaryCard = ({ icon, title, value, color }) => (
    <View style={[styles.summaryCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <View style={styles.summaryCardContent}>
        <Text style={styles.summaryCardTitle}>{title}</Text>
        <Text style={[styles.summaryCardValue, { color }]}>{isConverting ? '≈ ' : ''}{formatCurrency(value, displayCurrency)}</Text>
      </View>
    </View>
  );

  const TopCategoryItem = ({ category, amount, total }) => {
    const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
    return (
      <View style={styles.topCategoryItem}>
        <View style={styles.topCategoryInfo}>
          <Text style={styles.topCategoryName}>{getCategoryLabel(category)}</Text>
          <Text style={styles.topCategoryAmount}>{isConverting ? '≈ ' : ''}{formatCurrency(amount, displayCurrency)}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.topCategoryPercentage}>{percentage}%</Text>
      </View>
    );
  };

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
            <MaterialCommunityIcons name={iconName} size={32} color={iconColor} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{getCategoryLabel(item.category)}</Text>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.cardDetail}> {new Date(item.date).toLocaleDateString()}</Text>
            </View>
            {item.related_flock && getCycleName(item.related_flock) && (
              <View style={styles.cardRow}>
                <MaterialCommunityIcons name="refresh" size={14} color={theme.colors.primary} />
                <Text style={[styles.cardDetail, { color: theme.colors.primary, fontWeight: '500' }]}> {getCycleName(item.related_flock)}</Text>
              </View>
            )}
            <Text style={styles.cardDetail}>{item.description}</Text>
          </View>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {isExpense ? '-' : '+'}{isConverting ? '≈ ' : ''}{formatCurrency(parseFloat(item.amount), displayCurrency)}
          </Text>
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Finances" navigation={navigation} showBack={true} />
      
      <View style={styles.contentContainer}>
          {/* Top Section: Cycle Filter, Period & Summary */}
          <View style={styles.fixedTopSection}>
             {/* Cycle Filter */}
            <View style={{ zIndex: 3000, marginBottom: theme.spacing.m }}>
              <DropDownPicker
                open={cyclePickerOpen}
                value={selectedCycle}
                items={cycleItems}
                setOpen={setCyclePickerOpen}
                setValue={setSelectedCycle}
                listMode="SCROLLVIEW"
                style={styles.cycleDropdown}
                dropDownContainerStyle={styles.cycleDropdownContainer}
                textStyle={{ color: theme.colors.text }}
                placeholder="All Cycles"
                ArrowDownIconComponent={() => (
                  <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.text} />
                )}
                ArrowUpIconComponent={() => (
                  <MaterialCommunityIcons name="chevron-up" size={20} color={theme.colors.text} />
                )}
              />
            </View>

            {selectedCycle && (
              <View style={styles.cycleInfoBanner}>
                <MaterialCommunityIcons name="filter-variant" size={16} color={theme.colors.primary} />
                <Text style={styles.cycleInfoText}>
                  Showing finances for: {getCycleName(selectedCycle)}
                </Text>
              </View>
            )}

             {/* Time Period Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodSelector}>
            <TouchableOpacity
                style={[styles.periodButton, timePeriod === 7 && styles.periodButtonActive]}
                onPress={() => setTimePeriod(7)}
            >
                <Text style={[styles.periodButtonText, timePeriod === 7 && styles.periodButtonTextActive]}>7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.periodButton, timePeriod === 30 && styles.periodButtonActive]}
                onPress={() => setTimePeriod(30)}
            >
                <Text style={[styles.periodButtonText, timePeriod === 30 && styles.periodButtonTextActive]}>30 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.periodButton, timePeriod === 180 && styles.periodButtonActive]}
                onPress={() => setTimePeriod(180)}
            >
                <Text style={[styles.periodButtonText, timePeriod === 180 && styles.periodButtonTextActive]}>6 Months</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.periodButton, timePeriod === 0 && styles.periodButtonActive]}
                onPress={() => setTimePeriod(0)}
            >
                <Text style={[styles.periodButtonText, timePeriod === 0 && styles.periodButtonTextActive]}>All Time</Text>
            </TouchableOpacity>
            </ScrollView>

             {/* Summary Cards - Horizontal Scroll for compactness */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll} style={{ maxHeight: 90 }}>
                <View style={[styles.summaryCardCompact, { borderLeftColor: theme.colors.primary, borderLeftWidth: 4 }]}>
                    <Text style={styles.summaryLabel}>Income</Text>
                    <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{isConverting ? '≈ ' : ''}{formatCurrency(analytics.totalIncome, displayCurrency)}</Text>
                </View>
                <View style={[styles.summaryCardCompact, { borderLeftColor: theme.colors.error, borderLeftWidth: 4 }]}>
                    <Text style={styles.summaryLabel}>Expenses</Text>
                    <Text style={[styles.summaryValue, { color: theme.colors.error }]}>{isConverting ? '≈ ' : ''}{formatCurrency(analytics.totalExpenses, displayCurrency)}</Text>
                </View>
                <View style={[styles.summaryCardCompact, { borderLeftColor: analytics.netProfit >= 0 ? theme.colors.primary : theme.colors.error, borderLeftWidth: 4 }]}>
                    <Text style={styles.summaryLabel}>Net</Text>
                    <Text style={[styles.summaryValue, { color: analytics.netProfit >= 0 ? theme.colors.primary : theme.colors.error }]}>{isConverting ? '≈ ' : ''}{formatCurrency(analytics.netProfit, displayCurrency)}</Text>
                </View>
            </ScrollView>
          </View>

          {isConverting && (
            <View style={styles.conversionBanner}>
              <MaterialCommunityIcons name="swap-horizontal" size={16} color={theme.colors.primary} />
              <Text style={styles.conversionBannerText}>Amounts shown in {displayCurrency} (converted from {farmBaseCurrency})</Text>
            </View>
          )}

          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Transactions List */}
             <View style={styles.sectionHeader}>
                 <Text style={styles.sectionTitle}>Recent Activity</Text>
                 {analytics.filteredTransactions.length > 5 && (
                   <TouchableOpacity
                     onPress={() => navigation.navigate('AllTransactions', {
                       selectedCycle,
                       cycleName: selectedCycle ? getCycleName(selectedCycle) : null,
                     })}
                     style={styles.viewAllButton}
                   >
                     <Text style={styles.viewAllText}>View All</Text>
                     <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.primary} />
                   </TouchableOpacity>
                 )}
             </View>
            
            {analytics.filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bank-transfer" size={64} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>No recent transactions.</Text>
            </View>
            ) : (
            <View style={styles.transactionList}>
                {analytics.filteredTransactions.slice(0, 5).map((item) => (
                    <View key={item.id}>
                    {renderItem({ item })}
                    </View>
                ))}
            </View>
            )}

            {/* Invoices Link */}
            <TouchableOpacity
              style={styles.invoicesLink}
              onPress={() => navigation.navigate('InvoiceList', {
                selectedCycle,
                cycleName: selectedCycle ? getCycleName(selectedCycle) : null,
              })}
            >
              <View style={styles.invoicesLinkLeft}>
                <View style={[styles.invoicesLinkIcon, { backgroundColor: '#4CAF5018' }]}>
                  <MaterialCommunityIcons name="receipt" size={22} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.invoicesLinkTitle}>Invoices</Text>
                  <Text style={styles.invoicesLinkSub}>View and manage sales invoices</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Line Chart */}
            {analytics.filteredTransactions.length > 0 && (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Income vs Expenses Trend</Text>
                <LineChart
                data={{
                    labels: analytics.chartLabels,
                    datasets: [
                    {
                        data: analytics.incomeData,
                        color: () => theme.colors.primary,
                        strokeWidth: 2,
                    },
                    {
                        data: analytics.expenseData,
                        color: () => theme.colors.error,
                        strokeWidth: 2,
                    },
                    ],
                    legend: ['Income', 'Expenses'],
                }}
                width={screenWidth - 32}
                height={220}
                chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => theme.colors.text,
                    labelColor: (opacity = 1) => theme.colors.textSecondary,
                    style: {
                    borderRadius: 16,
                    },
                    propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    },
                }}
                bezier
                style={styles.chart}
                />
            </View>
            )}

            {/* Category Breakdown Pie Chart */}
            {analytics.filteredTransactions.length > 0 && (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Category Breakdown</Text>
                <View style={styles.categoryToggle}>
                <TouchableOpacity 
                    style={[styles.categoryButton, categoryView === 'expense' && styles.categoryButtonActive]}
                    onPress={() => setCategoryView('expense')}
                >
                    <Text style={[styles.categoryButtonText, categoryView === 'expense' && styles.categoryButtonTextActive]}>Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.categoryButton, categoryView === 'income' && styles.categoryButtonActive]}
                    onPress={() => setCategoryView('income')}
                >
                    <Text style={[styles.categoryButtonText, categoryView === 'income' && styles.categoryButtonTextActive]}>Income</Text>
                </TouchableOpacity>
                </View>
                {((categoryView === 'expense' && analytics.expensePieData.length > 0) || 
                (categoryView === 'income' && analytics.incomePieData.length > 0)) && (
                <PieChart
                    data={categoryView === 'expense' ? analytics.expensePieData : analytics.incomePieData}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={{
                    color: (opacity = 1) => theme.colors.text,
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />
                )}
            </View>
            )}

            {/* Top Categories */}
            {analytics.filteredTransactions.length > 0 && (
            <View style={styles.topCategoriesContainer}>
                <Text style={styles.sectionTitle}>Top Categories</Text>
                <View style={styles.topCategoryToggle}>
                <Text style={styles.topCategoryLabel}>
                    {categoryView === 'expense' ? 'Top Expenses' : 'Top Income Sources'}
                </Text>
                </View>
                {(categoryView === 'expense' ? analytics.topExpenses : analytics.topIncome).map(([category, amount]) => (
                <TopCategoryItem 
                    key={category}
                    category={category}
                    amount={amount}
                    total={categoryView === 'expense' ? analytics.totalExpenses : analytics.totalIncome}
                />
                ))}
            </View>
            )}
            
            <View style={{ height: 80 }} /> 
          </ScrollView>
      </View>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Transaction</Text>

            <Text style={styles.modalLabel}>Category</Text>
            <View style={{ zIndex: 1000, marginBottom: editCategoryOpen ? 160 : 0 }}>
              <DropDownPicker
                open={editCategoryOpen}
                value={editCategory}
                items={(financeCategories[editingTransaction?.type] || []).map(c => ({ label: c.label, value: c.key }))}
                setOpen={setEditCategoryOpen}
                setValue={setEditCategory}
                listMode="SCROLLVIEW"
                style={[styles.modalInput, { marginBottom: 0 }]}
                dropDownContainerStyle={{
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                }}
                textStyle={{ color: theme.colors.text }}
                ArrowDownIconComponent={() => (
                  <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.text} />
                )}
                ArrowUpIconComponent={() => (
                  <MaterialCommunityIcons name="chevron-up" size={20} color={theme.colors.text} />
                )}
              />
            </View>

            <Text style={styles.modalLabel}>Amount ({getCurrencySymbol(displayCurrency)} {displayCurrency})</Text>
            {isConverting && (
              <View style={styles.conversionBanner}>
                <MaterialCommunityIcons name="information-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.conversionBannerText}>
                  Will be converted to {farmBaseCurrency} for storage.
                </Text>
              </View>
            )}
            <TextInput
              style={styles.modalInput}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder={`${getCurrencySymbol(displayCurrency)} 0.00`}
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              placeholderTextColor={theme.colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => { setEditModalVisible(false); setEditingTransaction(null); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveEdit}
                disabled={actionLoading}
              >
                <Text style={styles.modalSaveText}>{actionLoading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddTransaction')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={32} color="#fff" />
        </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
      flex: 1,
  },
  fixedTopSection: {
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.m,
      backgroundColor: theme.colors.background,
      zIndex: 10,
  },
  cycleDropdown: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    minHeight: 40,
  },
  cycleDropdownContainer: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  cycleInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary + '12',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
  },
  cycleInfoText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  conversionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary + '12',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 6,
    marginHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  conversionBannerText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
      padding: theme.spacing.m,
      paddingTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  summaryScroll: {
      paddingBottom: 5,
  },
  summaryCardCompact: {
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 120,
    justifyContent: 'center'
  },
  summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2
  },
  summaryValue: {
      fontSize: 16,
      fontWeight: 'bold'
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.m,
    gap: theme.spacing.s,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surface
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 13,
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chartContainer: {
    marginBottom: theme.spacing.l,
    marginTop: theme.spacing.l,
  },
  chartTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
    fontSize: 18
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryToggle: {
    flexDirection: 'row',
    marginBottom: theme.spacing.m,
    gap: theme.spacing.s,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  topCategoriesContainer: {
    marginBottom: theme.spacing.l,
  },
  topCategoryToggle: {
    marginBottom: theme.spacing.m,
  },
  topCategoryLabel: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  topCategoryItem: {
    marginBottom: theme.spacing.m,
  },
  topCategoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topCategoryName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  topCategoryAmount: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  topCategoryPercentage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      marginTop: 20
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold'
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  invoicesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  invoicesLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoicesLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoicesLinkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  invoicesLinkSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
    marginBottom: 2,
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
    fontSize: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.body,
    marginTop: theme.spacing.m,
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
  editAction: {
    backgroundColor: '#1976D2',
    marginRight: 4,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: theme.spacing.l,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.l,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.l,
  },
  modalLabel: {
    ...theme.typography.body,
    marginBottom: theme.spacing.s,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.m,
  },
  modalButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: theme.colors.border,
  },
  modalCancelText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: theme.colors.primary,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FinancesScreen;
