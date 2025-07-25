// src/theme/ThemeContext.jsx - Simple Working Version
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [preferences, setPreferences] = useState({
    useSystemTheme: false,
    animations: true,
    reducedMotion: false
  });

  // Apply theme to DOM
  const applyTheme = (theme) => {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('theme-light', 'theme-dark');

    // Add new theme classes
    root.classList.add(theme);
    body.classList.add(`theme-${theme}`);

    // Apply CSS custom properties
    if (theme === 'dark') {
      root.style.setProperty('--color-bg-primary', '#0f172a');
      root.style.setProperty('--color-bg-secondary', '#1e293b');
      root.style.setProperty('--color-bg-tertiary', '#334155');
      root.style.setProperty('--color-text-primary', '#f8fafc');
      root.style.setProperty('--color-text-secondary', '#e2e8f0');
      root.style.setProperty('--color-border-light', '#334155');
      root.style.setProperty('--color-border-medium', '#475569');
    } else {
      root.style.setProperty('--color-bg-primary', '#ffffff');
      root.style.setProperty('--color-bg-secondary', '#f8fafc');
      root.style.setProperty('--color-bg-tertiary', '#f1f5f9');
      root.style.setProperty('--color-text-primary', '#1e293b');
      root.style.setProperty('--color-text-secondary', '#475569');
      root.style.setProperty('--color-border-light', '#e2e8f0');
      root.style.setProperty('--color-border-medium', '#cbd5e1');
    }

    console.log(`Applied theme: ${theme}`);
    console.log('HTML classes:', root.className);
    console.log('Body classes:', body.className);
  };

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('gawde_theme') || 'light';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Save theme when it changes
  useEffect(() => {
    localStorage.setItem('gawde_theme', currentTheme);
    applyTheme(currentTheme);
  }, [currentTheme]);

  const toggleMode = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log('Toggling from', currentTheme, 'to', newTheme);
    setCurrentTheme(newTheme);
  };

  const setTheme = (theme) => {
    setCurrentTheme(theme);
  };

  const updatePreferences = (newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  const isDarkMode = () => currentTheme === 'dark';

  const value = {
    currentTheme,
    preferences,
    toggleMode,
    setTheme,
    updatePreferences,
    isDarkMode,
    // Simple theme objects for compatibility
    themes: {
      light: {
        name: 'Light',
        description: 'Clean and bright interface'
      },
      dark: {
        name: 'Dark', 
        description: 'Easy on the eyes for extended use'
      }
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};