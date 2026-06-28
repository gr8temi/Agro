import React, { useState, useMemo, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Platform, TouchableOpacity, Modal, KeyboardAvoidingView } from 'react-native';
import client from '../api/client';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrencySymbol } from '../utils/currency';

const AddTransactionScreen = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState('expense');
  const [typeOpen, setTypeOpen] = useState(false);
  const [category, setCategory] = useState('feed');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [flockId, setFlockId] = useState(null);
  const [flockOpen, setFlockOpen] = useState(false);
  const [flockItems, setFlockItems] = useState([]);
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { farmBaseCurrency, displayCurrency, financeCategories } = useContext(AuthContext);
  const styles = getStyles(theme);

  const categoryItems = useMemo(() => {
    const list = financeCategories[type] || [];
    return list.map(c => ({ label: c.label, value: c.key }));
  }, [type, financeCategories]);

  useEffect(() => {
    if (categoryItems.length > 0) {
      setCategory(categoryItems[0].value);
    }
  }, [type, categoryItems]);

  useEffect(() => {
    client.get('/flocks/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        const sorted = [...data].sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return 0;
        });
        setFlockItems([
          { label: 'None (general)', value: null },
          ...sorted.map(f => ({
            label: f.status === 'active' ? f.name : `${f.name} (Closed)`,
            value: f.id,
            icon: () => (
              <View style={{
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: f.status === 'active' ? '#4CAF50' : '#9E9E9E',
              }} />
            ),
          })),
        ]);
      })
      .catch(() => {});
  }, []);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        date: date.toISOString().split('T')[0],
        type,
        category,
        amount: parseFloat(amount),
        description,
      };
      if (displayCurrency !== farmBaseCurrency) payload.currency = displayCurrency;
      if (flockId) payload.related_flock = flockId;
      await client.post('/transactions/', payload);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to add transaction');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Add Transaction" navigation={navigation} showBack={true} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
          <Text style={styles.dateText}>{date.toISOString().split('T')[0]}</Text>
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
                            testID="dateTimePicker"
                            value={date}
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
              testID="dateTimePicker"
              value={date}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onChangeDate}
            />
          )
        )}

        <Text style={styles.label}>Type</Text>
        <View style={[styles.pickerContainer, { zIndex: 2000 }]}>
          <DropDownPicker
            open={typeOpen}
            value={type}
            items={[
              { label: 'Expense', value: 'expense' },
              { label: 'Income', value: 'income' }
            ]}
            setOpen={setTypeOpen}
            setValue={setType}
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={{ color: theme.colors.text }}
            ArrowDownIconComponent={() => (
              <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.text} />
            )}
            ArrowUpIconComponent={() => (
              <MaterialCommunityIcons name="chevron-up" size={20} color={theme.colors.text} />
            )}
          />
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={[styles.pickerContainer, { zIndex: 1000 }]}>
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
            ArrowDownIconComponent={() => (
              <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.text} />
            )}
            ArrowUpIconComponent={() => (
              <MaterialCommunityIcons name="chevron-up" size={20} color={theme.colors.text} />
            )}
          />
        </View>

        {flockItems.length > 1 && (
          <>
            <Text style={styles.label}>Related Cycle (optional)</Text>
            <View style={[styles.pickerContainer, { zIndex: 500 }]}>
              <DropDownPicker
                open={flockOpen}
                value={flockId}
                items={flockItems}
                setOpen={setFlockOpen}
                setValue={setFlockId}
                listMode="SCROLLVIEW"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={{ color: theme.colors.text }}
                placeholder="Select a cycle..."
                ArrowDownIconComponent={() => (
                  <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.text} />
                )}
                ArrowUpIconComponent={() => (
                  <MaterialCommunityIcons name="chevron-up" size={20} color={theme.colors.text} />
                )}
              />
            </View>
          </>
        )}

        <Text style={styles.label}>Amount ({getCurrencySymbol(displayCurrency)} {displayCurrency})</Text>
        {displayCurrency !== farmBaseCurrency && (
          <View style={styles.currencyNote}>
            <MaterialCommunityIcons name="information-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.currencyNoteText}>
              Will be converted to {farmBaseCurrency} for storage.
            </Text>
          </View>
        )}
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder={`${getCurrencySymbol(displayCurrency)} 0.00`}
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor={theme.colors.textSecondary}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save Transaction</Text>
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
  label: {
    ...theme.typography.body,
    marginBottom: theme.spacing.s,
    fontWeight: '600',
    color: theme.colors.text,
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
  currencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary + '12',
    padding: 8,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
  },
  currencyNoteText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  pickerContainer: {
    marginBottom: theme.spacing.l,
  },
  dropdown: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  dropdownContainer: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  dateText: {
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.m,
  },
  buttonText: {
    ...theme.typography.button,
  },
    // iOS DatePicker Styles
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
  }
});

export default AddTransactionScreen;
