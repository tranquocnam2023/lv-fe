//Nguồn lưu trữ dữ liệu duy nhất của giỏ hàng 
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        : `${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}${product.selectedWarranty ? `-${product.selectedWarranty.id}` : ''}`;

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
        originalBasePrice: product.originalBasePrice || product.price,
        warrantyId: product.selectedWarranty?.id || null,
        warrantyName: product.selectedWarranty?.name || null,
        warrantyPrice: product.selectedWarranty?.basePrice || 0
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

  // logic tính tổng tiền trong giỏ (bao gồm cả giá gói bảo hành đi kèm)
  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.price + (item.warrantyPrice || 0)) * item.quantity,
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
        <div className="fixed bottom-6 right-6 z-[99999] bg-white border border-slate-200 text-slate-800 rounded-none shadow-2xl flex flex-col gap-3 p-4 w-64 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <Check size={14} strokeWidth={3} />
            </div>
            <p className="text-sm font-semibold text-slate-800">Đã thêm vào giỏ hàng</p>
          </div>
          <Link
            to="/cart"
            onClick={() => setToast(null)}
            className="w-full text-center py-2 bg-[#E6F0FA] hover:bg-[#D8E6F5] text-blue-600 font-bold text-sm rounded-none transition-colors"
          >
            Xem giỏ hàng
          </Link>
        </div>
      )}
    </CartContext.Provider>
  );
};
