//Nguồn lưu trữ dữ liệu duy nhất của giỏ hàng 
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

// Khởi tạo/Sử dụng Context (CartContext) để chia sẻ dữ liệu toàn cục
const CartContext = createContext();

// Custom Hook: useCart - Quản lý logic tái sử dụng useCart
export const useCart = () => {
  // Khởi tạo/Sử dụng Context (context) để chia sẻ dữ liệu toàn cục
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
//Lưu dữ liệu vào LocalStorage
export const CartProvider = ({ children }) => {
  // State: cartItems - Quản lý trạng thái và dữ liệu của cartItems trong giao diện
  const [cartItems, setCartItems] = useState(() => {
    try {
      // Khai báo biến/hằng số: savedCart - Dùng trong logic xử lý của component
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return [];
      // Khai báo biến/hằng số: parsed - Dùng trong logic xử lý của component
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
      return [];
    } catch {
      return [];
    }
  });
  // State: toast - Quản lý trạng thái và dữ liệu của toast trong giao diện
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      // Hàm thực thi logic: timer
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Hàm thực thi logic: showToast
  const showToast = (message) => {
    setToast({ message });
  };

  // Khai báo biến/hằng số: safeCartItems - Dùng trong logic xử lý của component
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  useEffect(() => {
    // Kiểm tra xem có sản phẩm chính (máy điện thoại/máy tính bảng...) nào trong giỏ không
    const hasMainProduct = safeCartItems.some(item => !item.isAddon);
    
    // Nếu KHÔNG có sản phẩm chính, nhưng lại CÓ phụ kiện mua kèm (isAddon = true)
    if (!hasMainProduct && safeCartItems.some(item => item.isAddon)) {
      setCartItems((prevItems) => {
        // Khai báo biến/hằng số: currentArr - Dùng trong logic xử lý của component
        const currentArr = Array.isArray(prevItems) ? prevItems : [];
        return currentArr.map((item) => {
          if (item.isAddon) {
            // Khôi phục giá gốc của phụ kiện khi mua lẻ độc lập
            const normalPrice = item.originalBasePrice || item.price;
            // Tạo lại mã định danh giỏ hàng tiêu chuẩn (không có tiền tố addon-)
            const normalCartId = `${item.id}-${item.selectedStorage || ''}-${item.selectedColor || ''}${item.selectedWarranty ? `-${item.selectedWarranty.id}` : ''}`;
            return {
              ...item,
              isAddon: false,
              price: normalPrice,
              cartId: normalCartId
            };
          }
          return item;
        });
      });
      return;
    }
    
    localStorage.setItem('cart', JSON.stringify(safeCartItems));
  }, [safeCartItems]);

  // Hàm thực thi logic: addToCart
  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      // Khai báo biến/hằng số: currentArr - Dùng trong logic xử lý của component
      const currentArr = Array.isArray(prevItems) ? prevItems : [];
      // Khai báo biến/hằng số: cartId - Dùng trong logic xử lý của component
      const cartId = product.isAddon && product.appliedCampaignId
        ? `addon-${product.appliedCampaignId}-${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}`
        : `${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}${product.selectedWarranty ? `-${product.selectedWarranty.id}` : ''}`;

      // Hàm thực thi logic: existingItemIndex
      const existingItemIndex = currentArr.findIndex(item => item.cartId === cartId);

      if (existingItemIndex >= 0) {
        // Khai báo biến/hằng số: newItems - Dùng trong logic xử lý của component
        const newItems = [...currentArr];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      return [...currentArr, {
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

  // Hàm thực thi logic: removeFromCart
  const removeFromCart = (cartId) => {
    setCartItems((prevItems) => {
      // Khai báo biến/hằng số: currentArr - Dùng trong logic xử lý của component
      const currentArr = Array.isArray(prevItems) ? prevItems : [];
      return currentArr.filter((item) => item.cartId !== cartId);
    });
  };

  // Hàm thực thi logic: updateQuantity
  const updateQuantity = (cartId, quantity) => {
    if (quantity < 1) return;
    setCartItems((prevItems) => {
      // Khai báo biến/hằng số: currentArr - Dùng trong logic xử lý của component
      const currentArr = Array.isArray(prevItems) ? prevItems : [];
      return currentArr.map((item) =>
        item.cartId === cartId ? { ...item, quantity } : item
      );
    });
  };

  // Hàm thực thi logic: clearCart
  const clearCart = () => {
    setCartItems([]);
  };

  // logic tính tổng tiền trong giỏ (bao gồm cả giá gói bảo hành đi kèm)
  const cartTotal = safeCartItems.reduce(
    (total, item) => total + (item.price + (item.warrantyPrice || 0)) * item.quantity,
    0
  );

  // Hàm thực thi logic: cartCount
  const cartCount = safeCartItems.reduce((count, item) => count + (item.quantity || 1), 0);

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
