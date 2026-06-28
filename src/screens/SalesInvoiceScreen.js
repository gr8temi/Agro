import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, KeyboardAvoidingView, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';
import client from '../api/client';
import Toast from 'react-native-toast-message';
import DropDownPicker from 'react-native-dropdown-picker';

const SalesInvoiceScreen = ({ navigation, route }) => {
  const { flockId, flockName } = route.params || {};
  const { theme } = useTheme();
  const { userInfo, displayCurrency, farmBaseCurrency, financeCategories } = useContext(AuthContext);
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [farmInfo, setFarmInfo] = useState(null);

  // Invoice details
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  // Category
  const [category, setCategory] = useState('bird_sales');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryItems = useMemo(() => {
    const incomeList = financeCategories.income || [];
    return incomeList.map(c => ({ label: c.label, value: c.key }));
  }, [financeCategories]);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Line items
  const [lineItems, setLineItems] = useState([
    { description: 'Broiler Chicken', quantity: '', unitPrice: '', key: Date.now().toString() },
  ]);

  // Notes & terms
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment is due within the specified period.');

  useEffect(() => {
    const fetchFarmInfo = async () => {
      try {
        const res = await client.get('/farms/');
        const farms = Array.isArray(res.data) ? res.data : (res.data.results || []);
        if (farms.length > 0) setFarmInfo(farms[0]);
      } catch (err) {
        console.error('Failed to fetch farm info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmInfo();
  }, []);

  const updateLineItem = (index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { description: '', quantity: '', unitPrice: '', key: Date.now().toString() },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const getLineTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  };

  const subtotal = lineItems.reduce((sum, item) => sum + getLineTotal(item), 0);

  const formatDate = (date) => date.toISOString().split('T')[0];

  const onChangeInvoiceDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowInvoiceDatePicker(false);
    if (selectedDate) setInvoiceDate(selectedDate);
  };

  const onChangeDueDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDueDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

  const validate = () => {
    if (!customerName.trim()) {
      Alert.alert('Required', 'Customer name is required.');
      return false;
    }
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.description.trim()) {
        Alert.alert('Required', `Line item ${i + 1} needs a description.`);
        return false;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        Alert.alert('Required', `Line item ${i + 1} needs a valid quantity.`);
        return false;
      }
      if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) {
        Alert.alert('Required', `Line item ${i + 1} needs a valid unit price.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        invoice_date: formatDate(invoiceDate),
        due_date: formatDate(dueDate),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        customer_address: customerAddress.trim(),
        category,
        notes: notes.trim(),
        terms: terms.trim(),
        line_items: lineItems.map((item, idx) => ({
          description: item.description.trim(),
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unitPrice),
          sort_order: idx,
        })),
      };
      if (flockId) payload.related_flock = flockId;

      const res = await client.post('/invoices/', payload);
      Toast.show({ type: 'success', text1: 'Invoice Created', text2: `Invoice ${res.data.invoice_number} created.`, position: 'top' });
      navigation.replace('InvoiceDetail', { invoiceId: res.data.id });
    } catch (error) {
      const detail = error.response?.data?.detail || error.response?.data?.line_items?.[0] || 'Failed to create invoice.';
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDatePicker = (show, setShow, value, onChange) => {
    if (!show) return null;
    if (Platform.OS === 'ios') {
      return (
        <Modal visible transparent animationType="slide">
          <View style={styles.iosModalOverlay}>
            <View style={[styles.iosDatePickerContainer, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.iosHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={[styles.iosDoneText, { color: theme.colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker value={value} mode="date" display="spinner" textColor={theme.colors.text} onChange={onChange} />
            </View>
          </View>
        </Modal>
      );
    }
    return <DateTimePicker value={value} mode="date" display="default" onChange={onChange} />;
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <CustomHeader title="Create Invoice" navigation={navigation} showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const currencyLabel = `${getCurrencySymbol(farmBaseCurrency)} ${farmBaseCurrency}`;
  const paymentDetails = farmInfo?.payment_details || {};

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Create Invoice" navigation={navigation} showBack />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Business Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="office-building" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Business Details</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <InfoField label="Farm Name" value={farmInfo?.name || '—'} theme={theme} />
              <InfoField label="Phone" value={farmInfo?.phone || 'Not set'} theme={theme} />
              <InfoField label="Email" value={farmInfo?.email || 'Not set'} theme={theme} />
              <InfoField label="Address" value={farmInfo?.address || 'Not set'} theme={theme} />
            </View>
            {(!farmInfo?.phone && !farmInfo?.email) && (
              <Text style={styles.hintText}>Update your farm details in Settings to auto-fill this section.</Text>
            )}
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Customer name" placeholderTextColor={theme.colors.textSecondary} />
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} placeholder="Phone number" placeholderTextColor={theme.colors.textSecondary} keyboardType="phone-pad" />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={customerEmail} onChangeText={setCustomerEmail} placeholder="Email address" placeholderTextColor={theme.colors.textSecondary} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={customerAddress} onChangeText={setCustomerAddress} placeholder="Customer address" placeholderTextColor={theme.colors.textSecondary} multiline />
          </View>

          {/* Invoice Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Invoice Details</Text>
            </View>

            {flockName && (
              <View style={styles.cycleBadge}>
                <MaterialCommunityIcons name="bird" size={16} color={theme.colors.primary} />
                <Text style={styles.cycleBadgeText}>Cycle: {flockName}</Text>
              </View>
            )}

            <Text style={styles.label}>Invoice Date</Text>
            <TouchableOpacity onPress={() => setShowInvoiceDatePicker(true)} style={styles.dateInput}>
              <Text style={styles.dateText}>{formatDate(invoiceDate)}</Text>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {renderDatePicker(showInvoiceDatePicker, setShowInvoiceDatePicker, invoiceDate, onChangeInvoiceDate)}

            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity onPress={() => setShowDueDatePicker(true)} style={styles.dateInput}>
              <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {renderDatePicker(showDueDatePicker, setShowDueDatePicker, dueDate, onChangeDueDate)}

            <Text style={styles.label}>Income Category</Text>
            <View style={{ zIndex: 1000 }}>
              <DropDownPicker
                open={categoryOpen}
                value={category}
                items={categoryItems}
                setOpen={setCategoryOpen}
                setValue={setCategory}
                listMode="SCROLLVIEW"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={{ color: theme.colors.text }}
                ArrowDownIconComponent={() => <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.text} />}
                ArrowUpIconComponent={() => <MaterialCommunityIcons name="chevron-up" size={20} color={theme.colors.text} />}
              />
            </View>
          </View>

          {/* Line Items */}
          <View style={[styles.section, { zIndex: -1 }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="format-list-numbered" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Line Items ({currencyLabel})</Text>
            </View>

            {lineItems.map((item, index) => (
              <View key={item.key} style={[styles.lineItemCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.lineItemNum}>Item {index + 1}</Text>
                  {lineItems.length > 1 && (
                    <TouchableOpacity onPress={() => removeLineItem(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <MaterialCommunityIcons name="close-circle" size={22} color={theme.colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={item.description}
                  onChangeText={(v) => updateLineItem(index, 'description', v)}
                  placeholder="e.g. Broiler Chicken"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <View style={styles.lineItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Quantity (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={item.quantity}
                      onChangeText={(v) => updateLineItem(index, 'quantity', v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Price/kg</Text>
                    <TextInput
                      style={styles.input}
                      value={item.unitPrice}
                      onChangeText={(v) => updateLineItem(index, 'unitPrice', v)}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </View>
                </View>
                <View style={styles.lineTotalRow}>
                  <Text style={styles.lineTotalLabel}>Line Total:</Text>
                  <Text style={styles.lineTotalValue}>{formatCurrency(getLineTotal(item), farmBaseCurrency)}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addItemBtn} onPress={addLineItem}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.addItemText}>Add Line Item</Text>
            </TouchableOpacity>

            <View style={[styles.subtotalRow, { borderColor: theme.colors.border }]}>
              <Text style={styles.subtotalLabel}>Grand Total</Text>
              <Text style={styles.subtotalValue}>{formatCurrency(subtotal, farmBaseCurrency)}</Text>
            </View>
          </View>

          {/* Notes & Terms */}
          <View style={[styles.section, { zIndex: -2 }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="note-text-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Notes & Terms</Text>
            </View>
            <Text style={styles.label}>Notes</Text>
            <TextInput style={[styles.input, styles.multiline]} value={notes} onChangeText={setNotes} placeholder="Additional notes for the customer..." placeholderTextColor={theme.colors.textSecondary} multiline numberOfLines={3} />
            <Text style={styles.label}>Terms</Text>
            <TextInput style={[styles.input, styles.multiline]} value={terms} onChangeText={setTerms} placeholder="Payment terms..." placeholderTextColor={theme.colors.textSecondary} multiline numberOfLines={3} />
          </View>

          {/* Payment Details */}
          <View style={[styles.section, { zIndex: -3 }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="bank" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Payment Details</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <InfoField label="Bank Name" value={paymentDetails.bank_name || 'Not set'} theme={theme} />
              <InfoField label="Account Name" value={paymentDetails.account_name || 'Not set'} theme={theme} />
              <InfoField label="Account Number" value={paymentDetails.account_number || 'Not set'} theme={theme} />
              {paymentDetails.sort_code ? <InfoField label="Sort Code" value={paymentDetails.sort_code} theme={theme} /> : null}
            </View>
            {!paymentDetails.bank_name && (
              <Text style={styles.hintText}>Set up payment details in farm settings to include them on invoices.</Text>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                <Text style={styles.submitBtnText}>Create Invoice</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const InfoField = ({ label, value, theme }) => (
  <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
    <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' }}>{label}</Text>
    <Text style={{ fontSize: 14, color: theme.colors.text, marginTop: 2 }}>{value}</Text>
  </View>
);

const getStyles = (theme) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },

  card: {
    borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden',
  },
  hintText: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 6, fontStyle: 'italic' },

  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: theme.colors.border, padding: 12,
    marginBottom: 12, borderRadius: 10, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 14,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },

  dateInput: {
    borderWidth: 1, borderColor: theme.colors.border, padding: 12,
    marginBottom: 12, borderRadius: 10, backgroundColor: theme.colors.surface,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dateText: { color: theme.colors.text, fontSize: 14 },

  dropdown: { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, marginBottom: 12 },
  dropdownContainer: { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },

  cycleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.primary + '15', padding: 10,
    borderRadius: 10, marginBottom: 12,
  },
  cycleBadgeText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

  lineItemCard: {
    borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 12,
  },
  lineItemHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  lineItemNum: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  lineItemRow: { flexDirection: 'row' },
  lineTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  lineTotalLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  lineTotalValue: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },

  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: theme.colors.primary, borderStyle: 'dashed', marginBottom: 12,
  },
  addItemText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },

  subtotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderTopWidth: 2, backgroundColor: theme.colors.surface, borderRadius: 10,
  },
  subtotalLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  subtotalValue: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 14,
    gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  iosModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  iosDatePickerContainer: { paddingBottom: 20, paddingTop: 10 },
  iosHeader: {
    flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 15,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  iosDoneText: { fontSize: 18, fontWeight: 'bold' },
});

export default SalesInvoiceScreen;
