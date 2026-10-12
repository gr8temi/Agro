import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Platform, TouchableOpacity, Modal, KeyboardAvoidingView } from 'react-native';
import { useSubmitEntry } from '../context/OutboxContext';
import { toLocalDateString } from '../utils/date';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';

const AddEggCollectionScreen = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [damaged, setDamaged] = useState('0');
  const navigation = useNavigation();
  const route = useRoute();
  const { flockId } = route.params;
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const submitEntry = useSubmitEntry('eggCollection', 'Failed to add egg collection');

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    const quantityCollected = parseInt(quantity, 10);
    if (Number.isNaN(quantityCollected) || quantityCollected < 0) {
      alert('Please enter the number of eggs collected.');
      return;
    }
    const saved = await submitEntry({
      flock: flockId,
      date: toLocalDateString(date),
      quantity_collected: quantityCollected,
      damaged: parseInt(damaged, 10) || 0,
    });
    if (saved) navigation.goBack();
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Record Eggs" navigation={navigation} showBack={true} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
          <Text style={styles.dateText}>{toLocalDateString(date)}</Text>
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

        <Text style={styles.label}>Quantity Collected</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Damaged/Broken</Text>
        <TextInput
          style={styles.input}
          value={damaged}
          onChangeText={setDamaged}
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Record Collection</Text>
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

export default AddEggCollectionScreen;
