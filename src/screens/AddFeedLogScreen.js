import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Platform, TouchableOpacity, Modal, KeyboardAvoidingView } from 'react-native';
import client from '../api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';

const AddFeedLogScreen = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [feedType, setFeedType] = useState('');
  const [cost, setCost] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const { flockId } = route.params;
  const { theme } = useTheme();
  const { farmBaseCurrency, displayCurrency } = useContext(AuthContext);
  const styles = getStyles(theme);

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
        flock: flockId,
        date: date.toISOString().split('T')[0],
        quantity_kg: parseFloat(quantity),
        feed_type: feedType,
        cost: parseFloat(cost) || 0,
      };
      if (displayCurrency !== farmBaseCurrency) payload.currency = displayCurrency;
      await client.post('/feed-logs/', payload);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to add feed log');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Add Feed Log" navigation={navigation} showBack={true} />
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

        <Text style={styles.label}>Feed Type</Text>
        <TextInput 
          style={styles.input} 
          value={feedType} 
          onChangeText={setFeedType} 
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Quantity (kg)</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Cost ({getCurrencySymbol(displayCurrency)} {displayCurrency})</Text>
        {displayCurrency !== farmBaseCurrency && (
          <View style={styles.currencyNote}>
            <Text style={styles.currencyNoteText}>
              Will be converted to {farmBaseCurrency} for storage.
            </Text>
          </View>
        )}
        <TextInput
          style={styles.input}
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
          placeholder={`${getCurrencySymbol(displayCurrency)} 0.00`}
          placeholderTextColor={theme.colors.textSecondary}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Add Log</Text>
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
    backgroundColor: theme.colors.primary + '12',
    padding: 8,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
  },
  currencyNoteText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
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

export default AddFeedLogScreen;
