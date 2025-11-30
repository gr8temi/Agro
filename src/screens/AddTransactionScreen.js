import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';

const AddTransactionScreen = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('feed');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    try {
      await client.post('/finances/transactions/', {
        date: date.toISOString().split('T')[0],
        type,
        category,
        amount: parseFloat(amount),
        description,
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to add transaction');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Add Transaction" navigation={navigation} showBack={true} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
          <Text style={styles.dateText}>{date.toISOString().split('T')[0]}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        <Text style={styles.label}>Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(itemValue)}
            style={styles.picker}
            itemStyle={{ color: theme.colors.text }}
          >
            <Picker.Item label="Expense" value="expense" color={theme.colors.text} />
            <Picker.Item label="Income" value="income" color={theme.colors.text} />
          </Picker>
        </View>

        <Text style={styles.label}>Category</Text>
        <TextInput 
          style={styles.input} 
          value={category} 
          onChangeText={setCategory} 
          placeholder="e.g., Feed, Medicine, Sales" 
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    height: 50,
    color: theme.colors.text,
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
});

export default AddTransactionScreen;
