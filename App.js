import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persistOptions } from './src/api/queryClient';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';

import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { OutboxProvider } from './src/context/OutboxContext';
import OfflineBanner from './src/components/OfflineBanner';


export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <ThemeProvider>
            <NetworkProvider>
              <AuthProvider>
                <OutboxProvider>
                  <NotificationProvider>
                    <AppNavigator />
                    <OfflineBanner />
                    <Toast />
                  </NotificationProvider>
                </OutboxProvider>
              </AuthProvider>
            </NetworkProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
