import React, { createContext, useContext } from 'react';

// Khởi tạo/Sử dụng Context (ProductFormContext) để chia sẻ dữ liệu toàn cục
const ProductFormContext = createContext(null);

// Component React: ProductFormProvider - Quản lý giao diện và logic xử lý của ProductFormProvider
export const ProductFormProvider = ({ children, value }) => {
  return (
    <ProductFormContext.Provider value={value}>
      {children}
    </ProductFormContext.Provider>
  );
};

// Custom Hook: useProductFormContext - Quản lý logic tái sử dụng useProductFormContext
export const useProductFormContext = () => {
  // Khởi tạo/Sử dụng Context (context) để chia sẻ dữ liệu toàn cục
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error('useProductFormContext must be used within a ProductFormProvider');
  }
  return context;
};
