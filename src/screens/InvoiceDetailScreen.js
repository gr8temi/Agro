import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import client from '../api/client';
import { useApiQuery } from '../api/queries';
import { useNetwork, useRequireOnline } from '../context/NetworkContext';
import Toast from 'react-native-toast-message';

const FOREST = '#1a3a2a';
const AMBER = '#c8963e';
const CREAM = '#f5f0e8';
const CREAM_DARK = '#ede6d8';

const STATUS_CONFIG = {
  draft:     { color: '#9E9E9E', icon: 'file-edit-outline',   label: 'Draft' },
  sent:      { color: '#2196F3', icon: 'send',                label: 'Sent' },
  paid:      { color: '#4CAF50', icon: 'check-circle-outline',label: 'Paid' },
  cancelled: { color: '#F44336', icon: 'close-circle-outline',label: 'Cancelled' },
};

const InvoiceDetailScreen = ({ navigation, route }) => {
  const { invoiceId } = route.params;
  const { theme } = useTheme();
  const { farmBaseCurrency } = useContext(AuthContext);
  const [actionLoading, setActionLoading] = useState(false);
  const styles = getStyles(theme);
  const { isOnline } = useNetwork();
  const requireOnline = useRequireOnline();
  const invoiceQuery = useApiQuery(`/invoices/${invoiceId}/`);
  const invoice = invoiceQuery.data ?? null;
  const loading = invoiceQuery.isLoading;
  const fetchInvoice = invoiceQuery.refetch;

  useEffect(() => {
    if (invoiceQuery.isError && !invoice) Alert.alert('Error', 'Failed to load invoice.');
  }, [invoiceQuery.isError, invoice]);

  const handleMarkPaid = () => {
    if (!requireOnline('Marking an invoice as paid')) return;
    Alert.alert('Mark as Paid', 'This will create an income transaction for the invoice total. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid', onPress: async () => {
          setActionLoading(true);
          try {
            await client.post(`/invoices/${invoiceId}/mark_paid/`);
            Toast.show({ type: 'success', text1: 'Invoice marked as paid', position: 'top' });
            fetchInvoice();
          } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to mark as paid.';
            Alert.alert('Error', msg);
          } finally { setActionLoading(false); }
        },
      },
    ]);
  };

  const handleCancel = () => {
    if (!requireOnline('Cancelling an invoice')) return;
    Alert.alert('Cancel Invoice', 'Are you sure you want to cancel this invoice?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            await client.post(`/invoices/${invoiceId}/cancel/`);
            Toast.show({ type: 'success', text1: 'Invoice cancelled', position: 'top' });
            fetchInvoice();
          } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to cancel invoice.';
            Alert.alert('Error', msg);
          } finally { setActionLoading(false); }
        },
      },
    ]);
  };

  const generatePdfHtml = () => {
    const currency = farmBaseCurrency;
    const sym = getCurrencySymbol(currency);
    const pd = invoice.payment_details || {};
    const fmtNum = (n) => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const lineItemRows = (invoice.line_items || []).map((item) => `
      <tr>
        <td style="padding:14px 16px;font-size:15px;color:#3a3a3a;border-bottom:1px solid #ede6d8;">${item.description}</td>
        <td style="padding:14px 16px;font-size:15px;color:#3a3a3a;border-bottom:1px solid #ede6d8;text-align:right;">${parseFloat(item.quantity).toLocaleString()}</td>
        <td style="padding:14px 16px;font-size:15px;color:#3a3a3a;border-bottom:1px solid #ede6d8;text-align:right;">${sym}${fmtNum(item.unit_price)}</td>
        <td style="padding:14px 16px;font-size:15px;color:#1a3a2a;border-bottom:1px solid #ede6d8;text-align:right;font-weight:600;">${sym}${fmtNum(item.total)}</td>
      </tr>
    `).join('');

    const paymentRows = [];
    if (pd.bank_name) paymentRows.push(['Bank', pd.bank_name]);
    if (pd.account_name) paymentRows.push(['Account Name', pd.account_name]);
    if (pd.account_number) paymentRows.push(['Account No.', pd.account_number]);
    if (pd.sort_code) paymentRows.push(['Sort Code', pd.sort_code]);

    const paymentHtml = paymentRows.length > 0 ? `
    <div style="border:2px solid #ede6d8;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
      <div style="font-size:13px;font-weight:700;color:#c8963e;text-transform:uppercase;letter-spacing:3px;margin-bottom:14px;">PAYMENT DETAILS</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          ${paymentRows.map(([k, v]) => `
            <td style="padding:4px 0;vertical-align:top;">
              <span style="font-size:13px;color:#9c9a8e;font-weight:500;">${k}</span><br>
              <span style="font-size:15px;color:#3a3a3a;font-weight:600;">${v}</span>
            </td>
          `).join('')}
        </tr>
      </table>
    </div>` : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #3a3a3a;
    margin: 0;
    padding: 0;
    font-size: 16px;
    line-height: 1.6;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
</style>
</head>
<body>
  <div style="background:#ffffff;padding:60px 50px;width:100%;min-height:100vh;">

    <!-- Header -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
      <tr>
        <td style="vertical-align:top;padding:0;width:55%;">
          <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1a3a2a;line-height:1.2;margin-bottom:8px;">${invoice.farm_name || ''}</div>
          ${invoice.farm_address ? `<div style="font-size:14px;color:#6b6b60;line-height:1.6;">${invoice.farm_address}</div>` : ''}
          ${invoice.farm_phone ? `<div style="font-size:14px;color:#6b6b60;line-height:1.6;">${invoice.farm_phone}</div>` : ''}
          ${invoice.farm_email ? `<div style="font-size:14px;color:#6b6b60;line-height:1.6;">${invoice.farm_email}</div>` : ''}
        </td>
        <td style="vertical-align:top;text-align:right;padding:0;width:45%;">
          <div style="font-family:Georgia,serif;font-size:40px;font-weight:700;color:#c8963e;letter-spacing:4px;line-height:1;margin-bottom:16px;">INVOICE</div>
          <table style="border-collapse:collapse;margin-left:auto;">
            <tr>
              <td style="font-size:14px;color:#9c9a8e;font-weight:500;padding:3px 16px 3px 0;text-align:left;">Invoice #</td>
              <td style="font-size:14px;color:#3a3a3a;font-weight:600;padding:3px 0;text-align:right;min-width:100px;">${invoice.invoice_number}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#9c9a8e;font-weight:500;padding:3px 16px 3px 0;text-align:left;">Date</td>
              <td style="font-size:14px;color:#3a3a3a;font-weight:600;padding:3px 0;text-align:right;">${invoice.invoice_date}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#9c9a8e;font-weight:500;padding:3px 16px 3px 0;text-align:left;">Due Date</td>
              <td style="font-size:14px;color:#3a3a3a;font-weight:600;padding:3px 0;text-align:right;">${invoice.due_date || '—'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <div style="height:2px;margin:32px 0;opacity:0.3;background:#c8963e;"></div>

    <!-- Bill To -->
    <div style="margin-bottom:32px;">
      <div style="font-size:13px;font-weight:700;color:#c8963e;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;">BILL TO</div>
      <div style="font-family:Georgia,serif;font-size:20px;font-weight:600;color:#1a3a2a;margin-bottom:4px;">${invoice.customer_name}</div>
      ${invoice.customer_address ? `<div style="font-size:14px;color:#6b6b60;line-height:1.6;">${invoice.customer_address}</div>` : ''}
      ${invoice.customer_phone ? `<div style="font-size:14px;color:#6b6b60;line-height:1.6;">${invoice.customer_phone}</div>` : ''}
      ${invoice.customer_email ? `<div style="font-size:14px;color:#6b6b60;line-height:1.6;">${invoice.customer_email}</div>` : ''}
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <thead>
        <tr>
          <th style="background-color:#1a3a2a;padding:14px 16px;color:#f5f0e8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;text-align:left;">Description</th>
          <th style="background-color:#1a3a2a;padding:14px 16px;color:#f5f0e8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;text-align:right;">Qty</th>
          <th style="background-color:#1a3a2a;padding:14px 16px;color:#f5f0e8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;text-align:right;">Unit Price</th>
          <th style="background-color:#1a3a2a;padding:14px 16px;color:#f5f0e8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemRows}
      </tbody>
    </table>

    <!-- Totals -->
    <table style="border-collapse:collapse;margin-left:auto;margin-bottom:36px;">
      <tr>
        <td style="font-size:15px;color:#6b6b60;padding:5px 40px 5px 0;">Subtotal</td>
        <td style="font-size:15px;color:#3a3a3a;font-weight:600;text-align:right;min-width:130px;">${sym}${fmtNum(invoice.subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size:18px;font-weight:700;color:#1a3a2a;padding:14px 40px 5px 0;border-top:2px solid #1a3a2a;">Total</td>
        <td style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#1a3a2a;text-align:right;min-width:130px;padding-top:14px;border-top:2px solid #1a3a2a;">${sym}${fmtNum(invoice.grand_total)}</td>
      </tr>
    </table>

    <!-- Notes -->
    ${invoice.notes ? `
    <div style="background:#f0f5f1;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
      <div style="font-size:12px;font-weight:700;color:#1a3a2a;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Notes</div>
      <div style="font-size:14px;color:#6b6b60;line-height:1.7;white-space:pre-wrap;">${invoice.notes}</div>
    </div>` : ''}

    <!-- Payment Details -->
    ${paymentHtml}

    <!-- Terms -->
    ${invoice.terms ? `
    <div style="margin-bottom:28px;">
      <div style="font-size:12px;font-weight:700;color:#9c9a8e;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Terms & Conditions</div>
      <div style="font-size:14px;color:#6b6b60;line-height:1.7;">${invoice.terms}</div>
    </div>` : ''}

    <!-- Footer -->
    <div style="height:1px;background:#ddd5c4;margin-bottom:16px;"></div>
    <div style="text-align:center;font-size:13px;color:#9c9a8e;">Generated with care — ${invoice.farm_name || ''}</div>
  </div>
</body>
</html>`;
  };

  const markAsSent = async () => {
    if (invoice.status !== 'draft') return;
    if (!isOnline) {
      Toast.show({ type: 'info', text1: "Offline: invoice wasn't marked as sent", text2: 'Share it again when online to update its status.', position: 'top' });
      return;
    }
    try {
      await client.post(`/invoices/${invoiceId}/mark_sent/`);
      fetchInvoice();
      Toast.show({ type: 'success', text1: 'Invoice marked as sent', position: 'top' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not update invoice status.';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
    }
  };

  const handleSharePdf = async () => {
    let shared = false;
    try {
      const html = generatePdfHtml();
      const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792, base64: false });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      shared = true;
    } catch (err) {
      if (err.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to generate PDF.');
        return;
      }
      shared = true;
    }
    if (shared) await markAsSent();
  };

  const handlePrint = async () => {
    let printed = false;
    try {
      const html = generatePdfHtml();
      await Print.printAsync({ html });
      printed = true;
    } catch (err) {
      if (err.message !== 'Cancelled') {
        Alert.alert('Error', 'Failed to print.');
        return;
      }
      printed = true;
    }
    if (printed) await markAsSent();
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <CustomHeader title="Invoice" navigation={navigation} showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!invoice) {
    if (invoiceQuery.fetchStatus !== 'paused') return null;
    return (
      <View style={styles.mainContainer}>
        <CustomHeader title="Invoice" navigation={navigation} showBack />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="cloud-off-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>
            You're offline. This invoice will load when you reconnect.
          </Text>
        </View>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const currency = farmBaseCurrency;
  const pd = invoice.payment_details || {};

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title={invoice.invoice_number || 'Invoice'} navigation={navigation} showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '18', borderColor: statusCfg.color + '40' }]}>
          <MaterialCommunityIcons name={statusCfg.icon} size={20} color={statusCfg.color} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>

        {/* Invoice Preview Card */}
        <View style={styles.invoiceCard}>
          {/* Header: Farm + Invoice Title */}
          <View style={styles.invHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.invFarmName}>{invoice.farm_name || ''}</Text>
              <View style={styles.invFarmDetails}>
                {invoice.farm_address ? <Text style={styles.invFarmDetailText}>{invoice.farm_address}</Text> : null}
                {invoice.farm_phone ? <Text style={styles.invFarmDetailText}>{invoice.farm_phone}</Text> : null}
                {invoice.farm_email ? <Text style={styles.invFarmDetailText}>{invoice.farm_email}</Text> : null}
              </View>
            </View>
            <View style={styles.invTitleBlock}>
              <Text style={styles.invTitle}>INVOICE</Text>
              <View style={styles.invMetaRow}>
                <Text style={styles.invMetaLabel}>Invoice #</Text>
                <Text style={styles.invMetaValue}>{invoice.invoice_number}</Text>
              </View>
              <View style={styles.invMetaRow}>
                <Text style={styles.invMetaLabel}>Date</Text>
                <Text style={styles.invMetaValue}>{invoice.invoice_date}</Text>
              </View>
              <View style={styles.invMetaRow}>
                <Text style={styles.invMetaLabel}>Due</Text>
                <Text style={styles.invMetaValue}>{invoice.due_date || '—'}</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.invDivider} />

          {/* Bill To */}
          <View style={styles.invBillTo}>
            <Text style={styles.invBillLabel}>BILL TO</Text>
            <Text style={styles.invCustomerName}>{invoice.customer_name}</Text>
            {invoice.customer_address ? <Text style={styles.invDetailText}>{invoice.customer_address}</Text> : null}
            {invoice.customer_phone ? <Text style={styles.invDetailText}>{invoice.customer_phone}</Text> : null}
            {invoice.customer_email ? <Text style={styles.invDetailText}>{invoice.customer_email}</Text> : null}
          </View>

          {/* Items Table */}
          <View style={styles.invTableHeader}>
            <Text style={[styles.invTableHeaderText, { flex: 2.5 }]}>Description</Text>
            <Text style={[styles.invTableHeaderText, { flex: 1, textAlign: 'right' }]}>Qty</Text>
            <Text style={[styles.invTableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
            <Text style={[styles.invTableHeaderText, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
          </View>
          {(invoice.line_items || []).map((item, i) => (
            <View key={item.id || i} style={styles.invTableRow}>
              <Text style={[styles.invTableCell, { flex: 2.5 }]}>{item.description}</Text>
              <Text style={[styles.invTableCell, { flex: 1, textAlign: 'right' }]}>{parseFloat(item.quantity).toLocaleString()}</Text>
              <Text style={[styles.invTableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(parseFloat(item.unit_price), currency)}</Text>
              <Text style={[styles.invTableCell, styles.invTableCellBold, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(parseFloat(item.total), currency)}</Text>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.invTotals}>
            <View style={styles.invTotalsRow}>
              <Text style={styles.invTotalsLabel}>Subtotal</Text>
              <Text style={styles.invTotalsValue}>{formatCurrency(parseFloat(invoice.subtotal), currency)}</Text>
            </View>
            <View style={[styles.invTotalsRow, styles.invTotalsGrand]}>
              <Text style={styles.invTotalsGrandLabel}>Total</Text>
              <Text style={styles.invTotalsGrandValue}>{formatCurrency(parseFloat(invoice.grand_total), currency)}</Text>
            </View>
          </View>

          {/* Notes */}
          {invoice.notes ? (
            <View style={styles.invNotes}>
              <Text style={styles.invNotesLabel}>NOTES</Text>
              <Text style={styles.invNotesText}>{invoice.notes}</Text>
            </View>
          ) : null}

          {/* Payment Details */}
          {(pd.bank_name || pd.account_name) ? (
            <View style={styles.invPayment}>
              <Text style={styles.invPaymentLabel}>PAYMENT DETAILS</Text>
              <View style={styles.invPaymentGrid}>
                {pd.bank_name ? <PaymentField label="Bank" value={pd.bank_name} /> : null}
                {pd.account_name ? <PaymentField label="Account Name" value={pd.account_name} /> : null}
                {pd.account_number ? <PaymentField label="Account No." value={pd.account_number} /> : null}
                {pd.sort_code ? <PaymentField label="Sort Code" value={pd.sort_code} /> : null}
              </View>
            </View>
          ) : null}

          {/* Terms */}
          {invoice.terms ? (
            <View style={styles.invTerms}>
              <Text style={styles.invTermsLabel}>TERMS & CONDITIONS</Text>
              <Text style={styles.invTermsText}>{invoice.terms}</Text>
            </View>
          ) : null}

          {/* Footer */}
          <View style={styles.invFooterLine} />
          <Text style={styles.invFooter}>Generated with care — {invoice.farm_name || ''}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: AMBER }]} onPress={handleSharePdf}>
            <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Share PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: FOREST }]} onPress={handlePrint}>
            <MaterialCommunityIcons name="printer" size={20} color={CREAM} />
            <Text style={[styles.actionBtnText, { color: CREAM }]}>Print</Text>
          </TouchableOpacity>
        </View>

        {(invoice.status === 'draft' || invoice.status === 'sent') && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#4CAF50', flex: 1 }]}
              onPress={handleMarkPaid}
              disabled={actionLoading}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Mark as Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#b54a3f', flex: 1 }]}
              onPress={handleCancel}
              disabled={actionLoading}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {actionLoading && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 10 }} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const PaymentField = ({ label, value }) => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
    <Text style={{ fontSize: 10, color: '#9c9a8e', fontWeight: '500' }}>{label}</Text>
    <Text style={{ fontSize: 12, color: '#3a3a3a', fontWeight: '600' }}>{value}</Text>
  </View>
);

const getStyles = (theme) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginBottom: 16,
  },
  statusText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },

  // Invoice preview card (organic-luxury)
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CREAM_DARK,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: FOREST,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },

  invHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  invFarmName: {
    fontSize: 20,
    fontWeight: '700',
    color: FOREST,
    marginBottom: 6,
  },
  invFarmDetails: { gap: 1 },
  invFarmDetailText: { fontSize: 11, color: '#6b6b60' },

  invTitleBlock: { alignItems: 'flex-end' },
  invTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: AMBER,
    letterSpacing: 3,
    marginBottom: 10,
  },
  invMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 2,
  },
  invMetaLabel: { fontSize: 11, color: '#9c9a8e', fontWeight: '500' },
  invMetaValue: { fontSize: 11, color: '#3a3a3a', fontWeight: '600', minWidth: 80, textAlign: 'right' },

  invDivider: {
    height: 2,
    marginVertical: 20,
    opacity: 0.3,
    backgroundColor: AMBER,
  },

  invBillTo: { marginBottom: 20 },
  invBillLabel: {
    fontSize: 9, fontWeight: '700', color: AMBER,
    textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 6,
  },
  invCustomerName: {
    fontSize: 16, fontWeight: '600', color: FOREST, marginBottom: 3,
  },
  invDetailText: { fontSize: 11, color: '#6b6b60', marginTop: 1 },

  invTableHeader: {
    flexDirection: 'row',
    backgroundColor: FOREST,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  invTableHeaderText: {
    fontSize: 9, fontWeight: '600', color: CREAM,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  invTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: CREAM_DARK,
  },
  invTableCell: { fontSize: 12, color: '#3a3a3a' },
  invTableCellBold: { fontWeight: '600', color: FOREST },

  invTotals: {
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 24,
  },
  invTotalsRow: {
    flexDirection: 'row',
    gap: 28,
    marginBottom: 4,
  },
  invTotalsLabel: { fontSize: 12, color: '#6b6b60' },
  invTotalsValue: { fontSize: 12, fontWeight: '600', color: '#3a3a3a', minWidth: 100, textAlign: 'right' },
  invTotalsGrand: {
    borderTopWidth: 2,
    borderTopColor: FOREST,
    paddingTop: 8,
    marginTop: 4,
  },
  invTotalsGrandLabel: { fontSize: 14, fontWeight: '700', color: FOREST },
  invTotalsGrandValue: { fontSize: 18, fontWeight: '700', color: FOREST, minWidth: 100, textAlign: 'right' },

  invNotes: {
    backgroundColor: 'rgba(26, 58, 42, 0.06)',
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  invNotesLabel: {
    fontSize: 9, fontWeight: '700', color: FOREST,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5,
  },
  invNotesText: { fontSize: 11, color: '#6b6b60', lineHeight: 17 },

  invPayment: {
    borderWidth: 1.5,
    borderColor: CREAM_DARK,
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  invPaymentLabel: {
    fontSize: 9, fontWeight: '700', color: AMBER,
    textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 10,
  },
  invPaymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },

  invTerms: { marginBottom: 16 },
  invTermsLabel: {
    fontSize: 9, fontWeight: '700', color: '#9c9a8e',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5,
  },
  invTermsText: { fontSize: 11, color: '#6b6b60', lineHeight: 17 },

  invFooterLine: {
    height: 1,
    backgroundColor: CREAM_DARK,
    marginBottom: 10,
  },
  invFooter: {
    fontSize: 10,
    color: '#9c9a8e',
    textAlign: 'center',
  },

  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, gap: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default InvoiceDetailScreen;
