'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from user preferences or localStorage
  useEffect(() => {
    setMounted(true);
    let initialTheme: Theme = 'dark';

    if (user?.preferences?.theme && (user.preferences.theme === 'light' || user.preferences.theme === 'dark')) {
      initialTheme = user.preferences.theme;
    } else {
      const stored = localStorage.getItem('ruhi-theme');
      if (stored === 'light' || stored === 'dark') {
        initialTheme = stored;
      }
    }

    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, [user?.preferences?.theme]);

  const applyTheme = (t: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('ruhi-theme', t);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    // Optionally persist to server if user is logged in
    if (user) {
      fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            ...user.preferences,
            theme: newTheme,
          },
        }),
      }).catch((err) => console.warn('Failed to persist theme preference:', err));
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
