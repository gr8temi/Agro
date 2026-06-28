import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, TouchableOpacity, Modal, KeyboardAvoidingView } from 'react-native';
import client from '../api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrencySymbol } from '../utils/currency';

const AddHealthLogScreen = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [logType, setLogType] = useState('vaccination');
  const [typeOpen, setTypeOpen] = useState(false);
  const [typeItems, setTypeItems] = useState([
    { label: 'Vaccination', value: 'vaccination' },
    { label: 'Medication', value: 'medication' },
    { label: 'Mortality', value: 'mortality' },
    { label: 'Other', value: 'other' },
  ]);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [affectedBirds, setAffectedBirds] = useState('0');
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
        log_type: logType,
        description,
        cost: parseFloat(cost) || 0,
        affected_birds: parseInt(affectedBirds) || 0,
      };
      if (displayCurrency !== farmBaseCurrency) payload.currency = displayCurrency;
      await client.post('/health-logs/', payload);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to add health log');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Add Health Log" navigation={navigation} showBack={true} />
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
        <View style={[styles.pickerContainer, { zIndex: 1000 }]}>
          <DropDownPicker
            open={typeOpen}
            value={logType}
            items={typeItems}
            setOpen={setTypeOpen}
            setValue={setLogType}
            setItems={setTypeItems}
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

        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={styles.input} 
          value={description} 
          onChangeText={setDescription} 
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

        <Text style={styles.label}>Affected Birds</Text>
        <TextInput
          style={styles.input}
          value={affectedBirds}
          onChangeText={setAffectedBirds}
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save Log</Text>
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

export default AddHealthLogScreen;
