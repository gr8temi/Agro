import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, asList } from '../api/queries';
import { useRequireOnline } from '../context/NetworkContext';
import Toast from 'react-native-toast-message';

const FarmProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { userInfo, refreshUserData } = useContext(AuthContext);
  const styles = getStyles(theme);

  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const requireOnline = useRequireOnline();
  const farmsQuery = useApiQuery('/farms/');
  const loading = farmsQuery.isLoading;
  const populated = useRef(false);
  const [farmId, setFarmId] = useState(null);

  const [farmName, setFarmName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sortCode, setSortCode] = useState('');

  // Fill the form once from the (possibly cached) farm, without overwriting edits.
  useEffect(() => {
    const farm = asList(farmsQuery.data)[0];
    if (!farm || populated.current) return;
    populated.current = true;
    setFarmId(farm.id);
    setFarmName(farm.name || '');
    setPhone(farm.phone || '');
    setEmail(farm.email || '');
    setAddress(farm.address || '');
    const pd = farm.payment_details || {};
    setBankName(pd.bank_name || '');
    setAccountName(pd.account_name || '');
    setAccountNumber(pd.account_number || '');
    setSortCode(pd.sort_code || '');
  }, [farmsQuery.data]);

  useEffect(() => {
    if (farmsQuery.isError && !farmsQuery.data) {
      Toast.show({ type: 'error', text1: 'Failed to load farm info', position: 'top' });
    }
  }, [farmsQuery.isError, farmsQuery.data]);

  const handleSave = async () => {
    if (!requireOnline('Saving the farm profile')) return;
    if (!farmName.trim()) {
      Toast.show({ type: 'error', text1: 'Farm name is required', position: 'top' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: farmName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        payment_details: {
          bank_name: bankName.trim(),
          account_name: accountName.trim(),
          account_number: accountNumber.trim(),
          sort_code: sortCode.trim(),
        },
      };
      const res = await client.patch(`/farms/${farmId}/`, payload);
      refreshUserData({ farm: { ...userInfo.farm, name: res.data.name } });
      queryClient.invalidateQueries({ queryKey: ['api', '/farms/'] });
      Toast.show({ type: 'success', text1: 'Farm profile updated', position: 'top' });
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save.';
      Toast.show({ type: 'error', text1: typeof msg === 'string' ? msg : 'Failed to save', position: 'top' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <CustomHeader title="Farm Profile" navigation={navigation} showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Farm Profile" navigation={navigation} showBack />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="office-building" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Farm Details</Text>
            </View>

            <Text style={styles.label}>Farm Name *</Text>
            <TextInput style={styles.input} value={farmName} onChangeText={setFarmName} placeholder="Farm name" placeholderTextColor={theme.colors.textSecondary} />

            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="e.g. +234 800 000 0000" placeholderTextColor={theme.colors.textSecondary} keyboardType="phone-pad" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="farm@example.com" placeholderTextColor={theme.colors.textSecondary} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Address</Text>
            <TextInput style={[styles.input, styles.multiline]} value={address} onChangeText={setAddress} placeholder="Farm address" placeholderTextColor={theme.colors.textSecondary} multiline numberOfLines={3} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="bank" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Payment Details</Text>
            </View>
            <Text style={styles.hint}>These appear on invoices so customers know where to pay.</Text>

            <Text style={styles.label}>Bank Name</Text>
            <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="e.g. First Bank" placeholderTextColor={theme.colors.textSecondary} />

            <Text style={styles.label}>Account Name</Text>
            <TextInput style={styles.input} value={accountName} onChangeText={setAccountName} placeholder="Account holder name" placeholderTextColor={theme.colors.textSecondary} />

            <Text style={styles.label}>Account Number</Text>
            <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="0000000000" placeholderTextColor={theme.colors.textSecondary} keyboardType="numeric" />

            <Text style={styles.label}>Sort Code</Text>
            <TextInput style={styles.input} value={sortCode} onChangeText={setSortCode} placeholder="Optional" placeholderTextColor={theme.colors.textSecondary} />
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  hint: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 12, fontStyle: 'italic' },

  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: theme.colors.border, padding: 12,
    marginBottom: 14, borderRadius: 10, backgroundColor: theme.colors.surface,
    color: theme.colors.text, fontSize: 14,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 14,
    gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FarmProfileScreen;
