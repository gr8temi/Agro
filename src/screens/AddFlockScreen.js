import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';

const AddFlockScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [quantity, setQuantity] = useState('');
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleAddFlock = async () => {
    try {
      await client.post('/flocks/', {
        name,
        breed,
        initial_quantity: parseInt(quantity),
        current_quantity: parseInt(quantity),
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Add New Flock" navigation={navigation} showBack={true} />
      <View style={styles.container}>
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

        <TouchableOpacity style={styles.button} onPress={handleAddFlock}>
          <Text style={styles.buttonText}>Add Flock</Text>
        </TouchableOpacity>
      </View>
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

export default AddFlockScreen;
