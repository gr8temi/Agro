import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../styles/theme';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    updateTheme(themeMode);
  }, [themeMode, systemScheme]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode) {
        setThemeMode(savedMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference', error);
    }
  };

  const updateTheme = (mode) => {
    if (mode === 'system') {
      setTheme(systemScheme === 'dark' ? darkTheme : lightTheme);
    } else if (mode === 'dark') {
      setTheme(darkTheme);
    } else {
      setTheme(lightTheme);
    }
  };

  const handleSetThemeMode = async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode: handleSetThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
