import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const NetworkContext = createContext({ isOnline: true });

// isInternetReachable is null while NetInfo is still checking; treat that as online
// so the app doesn't flash an offline state on launch.
const toOnline = (state) => !!state.isConnected && state.isInternetReachable !== false;

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(toOnline(state));
    });
    return unsubscribe;
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);

// For actions the server has to do right away (invoices, closing cycles, user changes).
// Returns a check that shows an explanation and returns false while offline.
export const useRequireOnline = () => {
  const { isOnline } = useNetwork();
  return useCallback((action = 'This action') => {
    if (isOnline) return true;
    Alert.alert("You're offline", `${action} needs an internet connection. Please try again when you're back online.`);
    return false;
  }, [isOnline]);
};
