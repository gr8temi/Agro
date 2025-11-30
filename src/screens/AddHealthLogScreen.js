import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';

const AddHealthLogScreen = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [logType, setLogType] = useState('vaccination');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [affectedBirds, setAffectedBirds] = useState('0');
  const navigation = useNavigation();
  const route = useRoute();
  const { flockId } = route.params;
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    try {
      await client.post('/health-logs/', {
        flock: flockId,
        date: date.toISOString().split('T')[0],
        log_type: logType,
        description,
        cost: parseFloat(cost) || 0,
        affected_birds: parseInt(affectedBirds) || 0,
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
      alert('Failed to add health log');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Add Health Log" navigation={navigation} showBack={true} />
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
            selectedValue={logType}
            onValueChange={(itemValue) => setLogType(itemValue)}
            style={styles.picker}
            itemStyle={{ color: theme.colors.text }}
          >
            <Picker.Item label="Vaccination" value="vaccination" color={theme.colors.text} />
            <Picker.Item label="Medication" value="medication" color={theme.colors.text} />
            <Picker.Item label="Mortality" value="mortality" color={theme.colors.text} />
            <Picker.Item label="Other" value="other" color={theme.colors.text} />
          </Picker>
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={styles.input} 
          value={description} 
          onChangeText={setDescription} 
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Cost</Text>
        <TextInput
          style={styles.input}
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
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

export default AddHealthLogScreen;
