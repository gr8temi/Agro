import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';

import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
        <Toast />
      </AuthProvider>
    </ThemeProvider>
  );
}
