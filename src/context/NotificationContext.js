import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import client from '../api/client';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
  }),
});

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { userToken, setDeregisterToken } = useContext(AuthContext);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notif) => setNotification(notif)
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      () => {}
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!userToken) return;

    const registerToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          await client.post('/register-token/', { token });
        }
      } catch (error) {
        // Silent fail — token registration is non-critical
      }
    };

    registerToken();
  }, [userToken]);

  const deregisterToken = useCallback(async () => {
    if (!expoPushToken) return;
    try {
      await client.post('/deregister-token/', { token: expoPushToken });
    } catch (error) {
      // Best-effort deregistration
    }
    setExpoPushToken('');
  }, [expoPushToken]);

  useEffect(() => {
    if (setDeregisterToken) {
      setDeregisterToken(deregisterToken);
    }
  }, [deregisterToken, setDeregisterToken]);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'CluckOps Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        lockScreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        return null;
      }

      if (Platform.OS === 'android') {
        return (await Notifications.getDevicePushTokenAsync()).data;
      }
      return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch {
      return null;
    }
  };

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, deregisterToken }}>
      {children}
    </NotificationContext.Provider>
  );
};
