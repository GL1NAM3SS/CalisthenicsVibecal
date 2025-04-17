import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const themes = {
  light: {
    background: '#fff',
    text: '#111',
    card: '#f4f4f4',
    accent: '#007AFF',
  },
  dark: {
    background: '#111',
    text: '#fff',
    card: '#222',
    accent: '#007AFF',
  },
  amoled: {
    background: '#000',
    text: '#fff',
    card: '#111',
    accent: '#12C06A',
  },
};

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState('system');
  const [theme, setTheme] = useState(themes.dark);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(t => {
      setThemeKey(t || 'system');
    });
  }, []);

  useEffect(() => {
    let resolved = themeKey;
    if (themeKey === 'system') {
      const colorScheme = Appearance.getColorScheme();
      resolved = colorScheme === 'dark' ? 'dark' : 'light';
    }
    setTheme(themes[resolved] || themes.dark);
  }, [themeKey]);

  const changeTheme = async (key) => {
    setThemeKey(key);
    await AsyncStorage.setItem('theme', key);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeKey, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
