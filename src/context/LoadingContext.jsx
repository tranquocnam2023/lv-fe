/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const isLoading = false;
  const isFading = false;
  const progress = 0;
  const startLoading = () => {};
  const stopLoading = () => {};

  return (
    <LoadingContext.Provider value={{ isLoading, isFading, progress, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
