import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client, { setOnAuthFailure } from '../api/client';
import Toast from 'react-native-toast-message';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [displayCurrency, setDisplayCurrencyState] = useState(null);
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [financeCategories, setFinanceCategories] = useState({ expense: [], income: [] });
  const deregisterTokenRef = useRef(null);

  const farmBaseCurrency = userInfo?.farm?.base_currency || 'NGN';

  const setDeregisterToken = useCallback((fn) => {
    deregisterTokenRef.current = fn;
  }, []);

  const fetchSupportedCurrencies = async () => {
    try {
      const response = await client.get('/currencies/');
      const currencies = response.data?.currencies || response.data || [];
      setSupportedCurrencies(currencies);
      await AsyncStorage.setItem('supportedCurrencies', JSON.stringify(currencies));
    } catch {
      const cached = await AsyncStorage.getItem('supportedCurrencies');
      if (cached) setSupportedCurrencies(JSON.parse(cached));
    }
  };

  const fetchFinanceCategories = async () => {
    try {
      const response = await client.get('/finance-categories/');
      const data = response.data || {};
      const categories = {
        expense: data.expense || [],
        income: data.income || [],
      };
      setFinanceCategories(categories);
      await AsyncStorage.setItem('financeCategories', JSON.stringify(categories));
    } catch {
      const cached = await AsyncStorage.getItem('financeCategories');
      if (cached) setFinanceCategories(JSON.parse(cached));
    }
  };

  const loadDisplayCurrency = async (baseCurrency) => {
    try {
      const saved = await AsyncStorage.getItem('displayCurrency');
      setDisplayCurrencyState(saved || baseCurrency);
    } catch {
      setDisplayCurrencyState(baseCurrency);
    }
  };

  const setDisplayCurrency = async (code) => {
    setDisplayCurrencyState(code);
    try {
      await AsyncStorage.setItem('displayCurrency', code);
    } catch {
      // Non-critical
    }
  };

  const onLoginSuccess = async (farmData) => {
    const baseCurrency = farmData?.base_currency || 'NGN';
    await loadDisplayCurrency(baseCurrency);
    fetchSupportedCurrencies();
    fetchFinanceCategories();
  };

  const login = async (username, password) => {
    try {
      const response = await client.post('/token/', { username, password });
      const { access, refresh, role, username: resUsername, permissions, farm, is_password_temporary } = response.data;

      setUserToken(access);
      await SecureStore.setItemAsync('userToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);

      if (!is_password_temporary) {
        await SecureStore.setItemAsync('biometricCredentials', JSON.stringify({ username, password }));
      }

      const userInfoData = { username: resUsername, role, permissions, farm };
      setUserInfo(userInfoData);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfoData));

      await onLoginSuccess(farm);

      return { is_password_temporary };
    } catch (e) {
      throw e;
    }
  };

  const registerOwner = async (username, email, password, farmName, baseCurrency) => {
    try {
      const payload = { username, email, password, farm_name: farmName };
      if (baseCurrency) payload.base_currency = baseCurrency;
      const response = await client.post('/register-owner/register/', payload);
      const { access, refresh, role, username: resUsername, permissions, farm } = response.data;

      setUserToken(access);
      await SecureStore.setItemAsync('userToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      await SecureStore.setItemAsync('biometricCredentials', JSON.stringify({ username, password }));

      const userInfoData = { username: resUsername, role, permissions, farm };
      setUserInfo(userInfoData);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfoData));

      await onLoginSuccess(farm);
    } catch (e) {
      throw e;
    }
  };

  const registerMember = async (username, email, password, farmCode) => {
    try {
      const response = await client.post('/register-member/register/', {
        username, email, password, farm_code: farmCode,
      });
      const { access, refresh, role, username: resUsername, permissions, farm } = response.data;

      setUserToken(access);
      await SecureStore.setItemAsync('userToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      await SecureStore.setItemAsync('biometricCredentials', JSON.stringify({ username, password }));

      const userInfoData = { username: resUsername, role, permissions, farm };
      setUserInfo(userInfoData);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfoData));

      await onLoginSuccess(farm);
    } catch (e) {
      throw e;
    }
  };

  const biometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Toast.show({
          type: 'error',
          text1: 'Biometrics Unavailable',
          text2: 'Your device does not support biometrics or none are enrolled.',
        });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
      });

      if (result.success) {
        const credentialsStr = await SecureStore.getItemAsync('biometricCredentials');
        if (credentialsStr) {
          const { username, password } = JSON.parse(credentialsStr);
          await login(username, password);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Login Required',
            text2: 'Please login with password first to enable biometrics.',
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Biometric Error',
        text2: 'Authentication failed.',
      });
    }
  };

  const refreshUserData = async (newData = {}) => {
    try {
      const updatedUserInfo = { ...userInfo, ...newData };
      setUserInfo(updatedUserInfo);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(updatedUserInfo));
    } catch (e) {
      // Non-critical
    }
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (deregisterTokenRef.current) {
        await deregisterTokenRef.current();
      }
    } catch {
      // Best-effort deregistration
    }
    setUserToken(null);
    setUserInfo(null);
    setDisplayCurrencyState(null);
    setSupportedCurrencies([]);
    setFinanceCategories({ expense: [], income: [] });
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userInfo');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setOnAuthFailure(() => {
      logout();
    });
  }, [logout]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const token = await SecureStore.getItemAsync('userToken');
        const userInfoStr = await SecureStore.getItemAsync('userInfo');
        setUserToken(token);
        if (userInfoStr) {
          const parsed = JSON.parse(userInfoStr);
          setUserInfo(parsed);
          if (token && parsed?.farm) {
            await onLoginSuccess(parsed.farm);
          }
        }
      } catch (e) {
        // Session restore failed
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  return (
    <AuthContext.Provider value={{
      login, logout, biometricLogin, registerOwner, registerMember,
      refreshUserData, isLoading, userToken, userInfo, setUserInfo,
      setDeregisterToken,
      displayCurrency: displayCurrency || farmBaseCurrency,
      farmBaseCurrency,
      supportedCurrencies,
      setDisplayCurrency,
      financeCategories,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
