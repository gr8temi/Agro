import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import client from '../api/client';
import Toast from 'react-native-toast-message';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (username, password) => {
    try {
      const response = await client.post('/token/', {
        username,
        password,
      });
      const { access, refresh, role, username: resUsername, permissions, farm, is_password_temporary } = response.data;
      setUserToken(access);
      await SecureStore.setItemAsync('userToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      
      // Save credentials for biometric login
      await SecureStore.setItemAsync('biometricCredentials', JSON.stringify({ username, password }));
      
      const userInfoData = { username: resUsername, role, permissions, farm };
      setUserInfo(userInfoData);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfoData));
      
      // Return the is_password_temporary flag so LoginScreen can handle it
      return { is_password_temporary };
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  const registerOwner = async (username, email, password, farmName) => {
    try {
      const response = await client.post('/register-owner/register/', {
        username,
        email,
        password,
        farm_name: farmName,
      });
      const { access, refresh, role, username: resUsername, permissions, farm } = response.data;
      setUserToken(access);
      await SecureStore.setItemAsync('userToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      
      const userInfoData = { username: resUsername, role, permissions, farm };
      setUserInfo(userInfoData);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfoData));
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  const registerMember = async (username, email, password, farmCode) => {
    try {
      const response = await client.post('/register-member/register/', {
        username,
        email,
        password,
        farm_code: farmCode,
      });
      const { access, refresh, role, username: resUsername, permissions, farm } = response.data;
      setUserToken(access);
      await SecureStore.setItemAsync('userToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      
      const userInfoData = { username: resUsername, role, permissions, farm };
      setUserInfo(userInfoData);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfoData));
    } catch (e) {
      console.log(e);
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
      console.error(error);
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
      console.log(e);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUserInfo(null);
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userInfo');
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userToken = await SecureStore.getItemAsync('userToken');
      let userInfoStr = await SecureStore.getItemAsync('userInfo');
      setUserToken(userToken);
      if (userInfoStr) {
        setUserInfo(JSON.parse(userInfoStr));
      }
    } catch (e) {
      console.log(`isLoggedIn error ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, biometricLogin, registerOwner, registerMember, refreshUserData, isLoading, userToken, userInfo, setUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
