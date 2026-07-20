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
  const [activeCombos, setActiveCombos] = useState([]);
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

  useEffect(() => {
    api.get('/ProductCombo/active')
      .then(res => {
        setActiveCombos(res.data || res || []);
      })
      .catch(err => console.error("Lỗi tải combo:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const autoGroupCombos = (items, combosList) => {
    if (!combosList || combosList.length === 0) return items;

    // 1. Explode items (Tách tất cả ra thành số lượng 1 để dễ ghép cặp)
    let exploded = [];
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        const basePrice = item.originalBasePrice || item.price;
        exploded.push({
          ...item,
          quantity: 1,
          appliedComboId: null,
          comboPrice: null,
          price: basePrice,
          originalBasePrice: basePrice
        });
      }
    });

    // 2. Thuật toán ghép Combo
    for (const combo of combosList) {
      const mainDef = combo.items?.find(i => i.isMain);
      const accDefs = combo.items?.filter(i => !i.isMain) || [];
      if (!mainDef) continue;

      let availableMains = exploded.filter(i => i.id === mainDef.productId && !i.appliedComboId);

      for (const mainItem of availableMains) {
        let comboApplied = false;

        for (const accDef of accDefs) {
          const unappliedAccs = exploded.filter(i => i.id === accDef.productId && !i.appliedComboId);
          const accsToApply = unappliedAccs.slice(0, 5); // Tối đa 5 phụ kiện mỗi loại cho 1 sản phẩm chính

          for (const accItem of accsToApply) {
            accItem.appliedComboId = combo.id;
            let cPrice = accItem.originalBasePrice;
            if (accDef.discountType === 'Percentage') {
              cPrice = cPrice * (1 - accDef.discountValue / 100);
            } else if (accDef.discountType === 'Fixed') {
              cPrice = Math.max(0, cPrice - accDef.discountValue);
            }
            accItem.comboPrice = cPrice;
            accItem.price = cPrice;
            comboApplied = true;
          }
        }

        if (comboApplied) {
          mainItem.appliedComboId = combo.id;
          mainItem.isComboMain = true;
          let mPrice = mainItem.originalBasePrice;
          if (mainDef.discountType === 'Percentage') {
            mPrice = mPrice * (1 - mainDef.discountValue / 100);
          } else if (mainDef.discountType === 'Fixed') {
            mPrice = Math.max(0, mPrice - mainDef.discountValue);
          }
          mainItem.comboPrice = mPrice;
          mainItem.price = mPrice;
        }
      }
    }

    // 3. Regroup items (Gộp lại những món giống nhau)
    let regrouped = [];
    exploded.forEach(item => {
      const cartId = item.appliedComboId
        ? `combo-${item.appliedComboId}-${item.id}-${item.selectedStorage || ''}-${item.selectedColor || ''}`
        : `${item.id}-${item.selectedStorage || ''}-${item.selectedColor || ''}`;

      const existing = regrouped.find(i => i.cartId === cartId);
      if (existing) {
        existing.quantity += 1;
      } else {
        regrouped.push({ ...item, cartId });
      }
    });

    return regrouped;
  };

  const addToCart = (product, quantity = 1, forceComboId = null) => {
    setCartItems((prevItems) => {
      // Create a temporary base item
      const tempId = `temp-${Date.now()}`;
      const newItem = {
        ...product,
        quantity,
        cartId: tempId,
        originalBasePrice: product.originalBasePrice || product.price
      };

      const newItemsList = [...prevItems, newItem];
      return autoGroupCombos(newItemsList, activeCombos);
    });

    showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
  };

  const removeFromCart = (cartId) => {
    setCartItems((prevItems) => {
      // Remove just that specific grouped item line
      const filtered = prevItems.filter((item) => item.cartId !== cartId);
      return autoGroupCombos(filtered, activeCombos); // Re-optimize after removal
    });
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity < 1) return;
    setCartItems((prevItems) => {
      const mapped = prevItems.map((item) =>
        item.cartId === cartId ? { ...item, quantity } : item
      );
      return autoGroupCombos(mapped, activeCombos); // Re-optimize after quantity change
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
