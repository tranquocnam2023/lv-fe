import React, { createContext, useContext } from 'react';

const ProductFormContext = createContext(null);

export const ProductFormProvider = ({ children, value }) => {
  return (
    <ProductFormContext.Provider value={value}>
      {children}
    </ProductFormContext.Provider>
  );
};

export const useProductFormContext = () => {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error('useProductFormContext must be used within a ProductFormProvider');
  }
  return context;
};
