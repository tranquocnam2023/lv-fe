/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';

// Khởi tạo/Sử dụng Context (LoadingContext) để chia sẻ dữ liệu toàn cục
const LoadingContext = createContext();

// Custom Hook: useLoading - Quản lý logic tái sử dụng useLoading
export const useLoading = () => {
  // Khởi tạo/Sử dụng Context (context) để chia sẻ dữ liệu toàn cục
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Component React: LoadingProvider - Quản lý giao diện và logic xử lý của LoadingProvider
export const LoadingProvider = ({ children }) => {
  // Khai báo biến/hằng số: isLoading - Dùng trong logic xử lý của component
  const isLoading = false;
  // Khai báo biến/hằng số: isFading - Dùng trong logic xử lý của component
  const isFading = false;
  // Khai báo biến/hằng số: progress - Dùng trong logic xử lý của component
  const progress = 0;
  // Hàm thực thi logic: startLoading
  const startLoading = () => {};
  // Hàm thực thi logic: stopLoading
  const stopLoading = () => {};

  return (
    <LoadingContext.Provider value={{ isLoading, isFading, progress, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
