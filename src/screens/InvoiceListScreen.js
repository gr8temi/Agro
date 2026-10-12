import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import client from '../api/client';
import { useApiQuery, asList } from '../api/queries';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { useRequireOnline } from '../context/NetworkContext';
import Toast from 'react-native-toast-message';

const STATUS_FILTERS = [
  { label: 'All', value: null },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_CONFIG = {
  draft:     { color: '#9E9E9E', icon: 'file-edit-outline' },
  sent:      { color: '#2196F3', icon: 'send' },
  paid:      { color: '#4CAF50', icon: 'check-circle-outline' },
  cancelled: { color: '#F44336', icon: 'close-circle-outline' },
};

const InvoiceListScreen = ({ navigation, route }) => {
  const { selectedCycle, cycleName } = route.params || {};
  const [statusFilter, setStatusFilter] = useState(null);
  const { theme } = useTheme();
  const { userInfo, farmBaseCurrency } = useContext(AuthContext);
  const swipeableRefs = useRef({});
  const styles = getStyles(theme);

  const canManage = userInfo?.role === 'superuser' || userInfo?.role === 'manager' || userInfo?.permissions?.can_manage_finances;

  const requireOnline = useRequireOnline();
  const params = {};
  if (selectedCycle) params.related_flock = selectedCycle;
  if (statusFilter) params.status = statusFilter;
  const { data, isLoading: loading, refetch: fetchInvoices } = useApiQuery('/invoices/', params);
  const invoices = [...asList(data)].sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));
  useRefreshOnFocus(fetchInvoices);

  const handleDelete = (invoice) => {
    if (!requireOnline('Deleting an invoice')) return;
    if (invoice.status !== 'draft') {
      Alert.alert('Cannot Delete', 'Only draft invoices can be deleted.');
      return;
    }
    Alert.alert('Delete Invoice', `Delete ${invoice.invoice_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await client.delete(`/invoices/${invoice.id}/`);
            Toast.show({ type: 'success', text1: 'Invoice deleted', position: 'top' });
            fetchInvoices();
          } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to delete.';
            Toast.show({ type: 'error', text1: msg, position: 'top' });
          }
        },
      },
    ]);
  };

  const renderRightActions = (item) => {
    if (!canManage || item.status !== 'draft') return null;
    return (
      <View style={styles.swipeActionsContainer}>
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
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
    return (
      <Swipeable
        ref={(ref) => { swipeableRefs.current[item.id] = ref; }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIcon, { backgroundColor: cfg.color + '18' }]}>
            <MaterialCommunityIcons name={cfg.icon} size={24} color={cfg.color} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
              <View style={[styles.statusPill, { backgroundColor: cfg.color + '18' }]}>
                <Text style={[styles.statusPillText, { color: cfg.color }]}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <View style={styles.cardBottomRow}>
              <View style={styles.cardMeta}>
                <MaterialCommunityIcons name="calendar" size={12} color={theme.colors.textSecondary} />
                <Text style={styles.cardMetaText}>{item.invoice_date}</Text>
              </View>
              <Text style={[styles.totalText, { color: theme.colors.primary }]}>
                {formatCurrency(parseFloat(item.grand_total), farmBaseCurrency)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const title = cycleName ? `Invoices - ${cycleName}` : 'Invoices';

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title={title} navigation={navigation} showBack />

      {/* Status filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map(f => {
            const active = statusFilter === f.value;
            return (
              <TouchableOpacity
                key={f.label}
                style={[styles.filterChip, active && { backgroundColor: theme.colors.primary }]}
                onPress={() => setStatusFilter(f.value)}
              >
                <Text style={[styles.filterChipText, active && { color: '#fff' }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="file-document-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No invoices found.</Text>
            </View>
          }
        />
      )}

      {canManage && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => requireOnline('Creating an invoice') && navigation.navigate('SalesInvoice', { flockId: selectedCycle, flockName: cycleName })}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },

  filterContainer: {
    backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },

  list: { padding: 12, paddingBottom: 80 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  invoiceNumber: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  customerName: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 12, color: theme.colors.textSecondary },
  totalText: { fontSize: 15, fontWeight: '700' },

  emptyText: { marginTop: 12, color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },

  swipeActionsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  swipeAction: {
    justifyContent: 'center', alignItems: 'center',
    width: 70, height: '100%', borderRadius: 14,
  },
  deleteAction: { backgroundColor: theme.colors.error },
  swipeActionText: { color: '#fff', fontSize: 11, marginTop: 2, fontWeight: '600' },
});

export default InvoiceListScreen;
