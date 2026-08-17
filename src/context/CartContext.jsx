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
    const mainProducts = safeCartItems.filter(item => !item.isAddon);
    const hasAddons = safeCartItems.some(item => item.isAddon);

    // 1. Kiểm tra nếu sản phẩm phụ bị mất sản phẩm chính -> Khôi phục về giá gốc mua lẻ
    let needsRevert = false;
    const updatedCartItems = safeCartItems.map((item) => {
      if (!item.isAddon) return item;

      let isValidAddon = false;
      if (mainProducts.length > 0) {
        if (item.parentProductId) {
          isValidAddon = mainProducts.some(m => Number(m.id) === Number(item.parentProductId));
        } else {
          isValidAddon = true;
        }
      }

      if (!isValidAddon) {
        needsRevert = true;
        const normalPrice = item.originalBasePrice || item.originalPrice || item.price;
        const normalCartId = `${item.id}-${item.selectedStorage || ''}-${item.selectedColor || ''}${item.selectedWarranty ? `-${item.selectedWarranty.id}` : ''}`;
        return {
          ...item,
          isAddon: false,
          price: normalPrice,
          originalBasePrice: item.originalBasePrice || item.originalPrice || normalPrice,
          originalPrice: item.originalPrice || item.originalBasePrice || normalPrice,
          appliedCampaignId: null,
          parentProductId: null,
          parentCartItemId: null,
          cartId: normalCartId
        };
      }
      return item;
    });

    if (needsRevert) {
      const mergedItems = [];
      updatedCartItems.forEach(item => {
        const existingIdx = mergedItems.findIndex(i => i.cartId === item.cartId);
        if (existingIdx >= 0) {
          mergedItems[existingIdx] = {
            ...mergedItems[existingIdx],
            quantity: mergedItems[existingIdx].quantity + item.quantity
          };
        } else {
          mergedItems.push(item);
        }
      });
      setCartItems(mergedItems);
      return;
    }

    // 2. Kiểm tra nếu thêm lại sản phẩm chính -> Tự động chuyển các phụ kiện độc lập phù hợp thành sản phẩm mua kèm giảm giá
    const regularItemsToUpgrade = safeCartItems.filter(item => !item.isAddon);
    if (mainProducts.length > 0 && regularItemsToUpgrade.length > 1) {
      Promise.all(
        mainProducts.map(mainProd =>
          api.get(`/PromotionCampaign/product/${mainProd.id}`)
            .then(res => ({ mainProd, campaigns: res.data || res || [] }))
            .catch(() => ({ mainProd, campaigns: [] }))
        )
      ).then(results => {
        let itemsUpgraded = false;
        let currentList = [...safeCartItems];

        results.forEach(({ mainProd, campaigns }) => {
          if (!campaigns || campaigns.length === 0) return;

          campaigns.forEach(campData => {
            const campaign = campData.campaign;
            const addonProducts = campData.addonProducts || [];
            if (!campaign || !addonProducts.length) return;

            addonProducts.forEach(addonProd => {
              const matchIndex = currentList.findIndex(
                ci => !ci.isAddon && Number(ci.id) === Number(addonProd.id) && Number(ci.id) !== Number(mainProd.id)
              );

              if (matchIndex >= 0) {
                const targetItem = currentList[matchIndex];
                const origPrice = targetItem.originalBasePrice || targetItem.originalPrice || targetItem.price;

                let comboPrice = origPrice;
                if (campaign.discountType === 'Percentage') {
                  comboPrice = origPrice * (1 - campaign.discountValue / 100);
                } else if (campaign.discountType === 'FixedAmount') {
                  comboPrice = Math.max(0, origPrice - campaign.discountValue);
                } else if (campaign.discountType === 'FixedPrice') {
                  comboPrice = campaign.discountValue;
                }

                const addonCartId = `addon-${campaign.id}-${targetItem.id}-${targetItem.selectedStorage || ''}-${targetItem.selectedColor || ''}`;

                currentList[matchIndex] = {
                  ...targetItem,
                  isAddon: true,
                  price: comboPrice,
                  originalBasePrice: origPrice,
                  originalPrice: origPrice,
                  appliedCampaignId: campaign.id,
                  parentProductId: mainProd.id,
                  parentCartItemId: mainProd.cartId,
                  cartId: addonCartId
                };

                itemsUpgraded = true;
              }
            });
          });
        });

        if (itemsUpgraded) {
          const mergedList = [];
          currentList.forEach(item => {
            const idx = mergedList.findIndex(i => i.cartId === item.cartId);
            if (idx >= 0) {
              mergedList[idx] = {
                ...mergedList[idx],
                quantity: mergedList[idx].quantity + item.quantity
              };
            } else {
              mergedList.push(item);
            }
          });
          setCartItems(mergedList);
        }
      });
    }

    localStorage.setItem('cart', JSON.stringify(safeCartItems));
  }, [safeCartItems]);

  // Hàm thực thi logic: addToCart
  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const currentArr = Array.isArray(prevItems) ? prevItems : [];
      const cartId = product.isAddon && product.appliedCampaignId
        ? `addon-${product.appliedCampaignId}-${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}`
        : `${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}${product.selectedWarranty ? `-${product.selectedWarranty.id}` : ''}`;

      const existingItemIndex = currentArr.findIndex(item => item.cartId === cartId);

      if (existingItemIndex >= 0) {
        const newItems = [...currentArr];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      const regularPrice = product.originalBasePrice || product.originalPrice || product.basePrice || product.price;

      return [...currentArr, {
        ...product,
        quantity,
        cartId,
        price: product.price,
        originalBasePrice: regularPrice,
        originalPrice: regularPrice,
        parentProductId: product.parentProductId || null,
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

  // Hàm chủ động làm mới/cập nhật combo giỏ hàng
  const refreshCartCombos = () => {
    setCartItems(prev => [...prev]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCartCombos,
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
