import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Check } from 'lucide-react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
//Lưu dữ liệu vào LocalStorage
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message) => {
    setToast({ message });
  };

  // Xóa logic load combos cũ

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const cartId = product.isAddon && product.appliedCampaignId 
            ? `addon-${product.appliedCampaignId}-${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}`
            : `${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}`;
      
      const existingItemIndex = prevItems.findIndex(item => item.cartId === cartId);
      
      if (existingItemIndex >= 0) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }
      
      return [...prevItems, { 
        ...product, 
        quantity, 
        cartId,
        originalBasePrice: product.originalBasePrice || product.price 
      }];
    });

    showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
  };

  const removeFromCart = (cartId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity < 1) return;
    setCartItems((prevItems) => {
      return prevItems.map((item) =>
        item.cartId === cartId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        showToast
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white rounded-xl shadow-2xl flex items-center gap-3 p-4 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
            <Check size={16} strokeWidth={3} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Giỏ hàng</p>
            <p className="text-sm font-black leading-snug line-clamp-2">{toast.message}</p>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};
