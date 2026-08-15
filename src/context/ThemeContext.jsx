/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

// Khởi tạo/Sử dụng Context (ThemeContext) để chia sẻ dữ liệu toàn cục
const ThemeContext = createContext();

// Custom Hook: useTheme - Quản lý logic tái sử dụng useTheme
export const useTheme = () => {
  // Khởi tạo/Sử dụng Context (context) để chia sẻ dữ liệu toàn cục
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Component React: ThemeProvider - Quản lý giao diện và logic xử lý của ThemeProvider
export const ThemeProvider = ({ children }) => {
  // State: theme - Quản lý trạng thái và dữ liệu của theme trong giao diện
  const [theme, setTheme] = useState(() => {
    // Khai báo biến/hằng số: savedTheme - Dùng trong logic xử lý của component
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Fallback to system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    // Khai báo biến/hằng số: root - Dùng trong logic xử lý của component
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen to system theme updates if user has not set an explicit preference
  useEffect(() => {
    // Khai báo biến/hằng số: mediaQuery - Dùng trong logic xử lý của component
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Hàm xử lý logic/sự kiện: handleSystemThemeChange
    const handleSystemThemeChange = (e) => {
      // Khai báo biến/hằng số: savedTheme - Dùng trong logic xử lý của component
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Hàm xử lý logic/sự kiện: toggleTheme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Khai báo biến/hằng số: isDark - Dùng trong logic xử lý của component
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
