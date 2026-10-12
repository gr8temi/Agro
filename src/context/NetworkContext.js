import React, { createContext, useState, useEffect, useContext } from 'react';
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
