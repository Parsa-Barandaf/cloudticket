import { useState, useEffect, useCallback } from 'react';

export function useTheme(defaultDark = true) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('sahab_theme');
    return saved !== null ? saved === 'dark' : defaultDark;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sahab_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  return { isDark, toggleTheme };
}
