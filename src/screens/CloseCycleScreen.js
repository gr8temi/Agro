import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, Platform, Modal, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import client from '../api/client';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const REASONS = [
  { value: 'sold', label: 'Sold', icon: 'cash' },
  { value: 'culled', label: 'Culled', icon: 'knife' },
  { value: 'disposed', label: 'Disposed', icon: 'delete-outline' },
  { value: 'transferred', label: 'Transferred', icon: 'swap-horizontal' },
  { value: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const CloseCycleScreen = ({ route, navigation }) => {
  const { flockId, flockName } = route.params;
  const [reason, setReason] = useState(null);
  const [notes, setNotes] = useState('');
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const handleClose = async () => {
    if (!reason) {
      Alert.alert('Required', 'Please select a closure reason.');
      return;
    }

    Alert.alert(
      'Close Cycle',
      `Are you sure you want to close "${flockName}"? This will archive the flock and prevent further entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Cycle',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await client.post(`/flocks/${flockId}/close_cycle/`, {
                closure_reason: reason,
                closure_notes: notes,
                end_date: endDate.toISOString().split('T')[0],
              });
              navigation.pop(2);
            } catch (error) {
              const detail = error.response?.data?.detail || 'Failed to close cycle.';
              Alert.alert('Error', detail);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Close Cycle" navigation={navigation} showBack={true} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.warningBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#FF9800" />
          <Text style={styles.warningText}>
            Closing this cycle will archive "{flockName}" and lock all logs and transactions for this flock.
          </Text>
        </View>

        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
          <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.dateText}>{endDate.toISOString().split('T')[0]}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          Platform.OS === 'ios' ? (
            <Modal visible={true} transparent={true} animationType="slide">
              <View style={styles.iosModalOverlay}>
                <View style={[styles.iosDatePickerContainer, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.iosHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={[styles.iosDoneText, { color: theme.colors.primary }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    textColor={theme.colors.text}
                    onChange={onChangeDate}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onChangeDate}
            />
          )
        )}

        <Text style={styles.label}>Closure Reason</Text>
        <View style={styles.reasonGrid}>
          {REASONS.map(r => {
            const selected = reason === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                style={[styles.reasonChip, selected && styles.reasonChipSelected]}
                onPress={() => setReason(r.value)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={r.icon}
                  size={20}
                  color={selected ? '#fff' : theme.colors.textSecondary}
                />
                <Text style={[styles.reasonChipText, selected && styles.reasonChipTextSelected]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional details about this closure..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.closeButton, submitting && { opacity: 0.6 }]}
          onPress={handleClose}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="archive-outline" size={22} color="#fff" />
          <Text style={styles.closeButtonText}>
            {submitting ? 'Closing...' : 'Close Cycle'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.l,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FF980015',
    borderWidth: 1,
    borderColor: '#FF980040',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  label: {
    ...theme.typography.body,
    marginBottom: theme.spacing.s,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
  },
  dateText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.l,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  reasonChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  reasonChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reasonChipTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 100,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F44336',
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.m,
  },
  closeButtonText: {
    ...theme.typography.button,
    fontSize: 16,
  },
  iosModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosDatePickerContainer: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iosDoneText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CloseCycleScreen;
