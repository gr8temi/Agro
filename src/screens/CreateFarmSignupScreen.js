import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import CurrencyPicker from '../components/CurrencyPicker';
import { getCurrencySymbol } from '../utils/currency';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CreateFarmSignupScreen = ({ navigation }) => {
  const [farmName, setFarmName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState('NGN');
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const [currencies, setCurrencies] = useState([]);

  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { registerOwner } = useContext(AuthContext);

  useEffect(() => {
    client.get('/currencies/')
      .then(res => {
        const list = res.data?.currencies || res.data || [];
        setCurrencies(list);
      })
      .catch(() => {});
  }, []);

  const handleSignup = async () => {
    if (!farmName || !username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    setIsLoading(true);
    try {
      await registerOwner(username, email, password, farmName, baseCurrency);
      // AuthContext will handle state update and navigation should happen automatically via AppNavigator
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.response?.data?.error || 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Your Farm</Text>
        <Text style={styles.subtitle}>Sign up and start managing your poultry farm.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Farm Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sunny Side Up Farm"
            placeholderTextColor={theme.colors.textSecondary}
            value={farmName}
            onChangeText={setFarmName}
          />

          <Text style={styles.label}>Farm Currency *</Text>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setCurrencyPickerVisible(true)}
          >
            <View style={styles.currencySelectorLeft}>
              <Text style={styles.currencySymbol}>{getCurrencySymbol(baseCurrency)}</Text>
              <Text style={styles.currencyCode}>{baseCurrency}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.currencyHint}>This cannot be changed after farm creation.</Text>

          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            placeholderTextColor={theme.colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create a password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity 
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.eyeIcon}
            >
              <MaterialCommunityIcons 
                name={isPasswordVisible ? "eye" : "eye-off"} 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Farm & Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Welcome</Text>
        </TouchableOpacity>
      </ScrollView>

      <CurrencyPicker
        visible={currencyPickerVisible}
        onClose={() => setCurrencyPickerVisible(false)}
        onSelect={setBaseCurrency}
        selectedCurrency={baseCurrency}
        currencies={currencies}
      />
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.l,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  form: {
    marginBottom: theme.spacing.l,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingRight: theme.spacing.m,
  },
  passwordInput: {
    flex: 1,
    padding: theme.spacing.m,
    color: theme.colors.text,
    // Remove individual border and margin as container handles it
  },
  eyeIcon: {
    padding: 4,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currencySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  currencyHint: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.m,
    marginLeft: theme.spacing.xs,
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
    color: '#fff',
  },
  backButton: {
    alignItems: 'center',
    padding: theme.spacing.s,
  },
  backButtonText: {
    color: theme.colors.textSecondary,
  },
});

export default CreateFarmSignupScreen;
