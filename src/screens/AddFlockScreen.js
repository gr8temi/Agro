import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Modal, KeyboardAvoidingView, ScrollView } from 'react-native';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddFlockScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleAddFlock = async () => {
    try {
      await client.post('/flocks/', {
        name,
        breed,
        initial_quantity: parseInt(quantity),
        current_quantity: parseInt(quantity),
        start_date: startDate.toISOString().split('T')[0],
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Add New Flock" navigation={navigation} showBack={true} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Flock Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Layer Flock A"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Breed</Text>
        <TextInput
          style={styles.input}
          value={breed}
          onChangeText={setBreed}
          placeholder="e.g., Rhode Island Red"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Initial Quantity</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="e.g., 100"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
          <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.dateText}>{startDate.toISOString().split('T')[0]}</Text>
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
                    value={startDate}
                    mode="date"
                    display="spinner"
                    textColor={theme.colors.text}
                    onChange={onChangeDate}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )
        )}

        <TouchableOpacity style={styles.button} onPress={handleAddFlock}>
          <Text style={styles.buttonText}>Add Flock</Text>
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
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    backgroundColor: theme.colors.surface,
  },
  dateText: {
    color: theme.colors.text,
    fontSize: 16,
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

export default AddFlockScreen;
