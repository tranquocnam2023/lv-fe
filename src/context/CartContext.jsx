//Nguồn lưu trữ dữ liệu duy nhất của giỏ hàng 
import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calcComboPrice } from '../utils/comboPrice';
import { CartContext } from './CartContextInstance';

// Gộp các dòng hàng trùng cartId (xảy ra khi phụ kiện mua kèm bị hạ cấp về hàng mua lẻ)
const mergeByCartId = (list) => {
  const merged = [];
  list.forEach(item => {
    const idx = merged.findIndex(i => i.cartId === item.cartId);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + item.quantity };
    } else {
      merged.push(item);
    }
  });
  return merged;
};

// Sinh cartId của một sản phẩm mua lẻ (không phải hàng mua kèm)
const buildNormalCartId = (item) =>
  `${item.id}-${item.selectedStorage || ''}-${item.selectedColor || ''}${item.selectedWarranty ? `-${item.selectedWarranty.id}` : ''}`;

// Phụ kiện mua kèm bị mất sản phẩm chính -> khôi phục về giá bán lẻ.
// Đây là phép biến đổi THUẦN trên danh sách giỏ hàng nên được chạy ngay trong hàm cập nhật
// state, thay vì trong useEffect. Nhờ vậy không có render thừa và giỏ hàng không bao giờ
// hiển thị giá combo trong khoảnh khắc sản phẩm chính vừa bị xoá.
const revertOrphanAddons = (list) => {
  const arr = Array.isArray(list) ? list : [];
  const mainProducts = arr.filter(item => !item.isAddon);

  let needsRevert = false;
  const reverted = arr.map((item) => {
    if (!item.isAddon) return item;

    let isValidAddon = false;
    if (mainProducts.length > 0) {
      isValidAddon = item.parentProductId
        ? mainProducts.some(m => Number(m.id) === Number(item.parentProductId))
        : true;
    }
    if (isValidAddon) return item;

    needsRevert = true;
    const normalPrice = item.originalBasePrice || item.originalPrice || item.price;
    return {
      ...item,
      isAddon: false,
      price: normalPrice,
      originalBasePrice: item.originalBasePrice || item.originalPrice || normalPrice,
      originalPrice: item.originalPrice || item.originalBasePrice || normalPrice,
      appliedCampaignId: null,
      parentProductId: null,
      parentCartItemId: null,
      cartId: buildNormalCartId(item)
    };
  });

  return needsRevert ? mergeByCartId(reverted) : arr;
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
      let restored = [];
      if (Array.isArray(parsed)) restored = parsed;
      else if (parsed && Array.isArray(parsed.items)) restored = parsed.items;
      else if (parsed && Array.isArray(parsed.data)) restored = parsed.data;
      // Giỏ hàng cũ trong localStorage có thể đã mất sản phẩm chính -> chuẩn hoá ngay khi khôi phục
      return revertOrphanAddons(restored);
    } catch {
      return [];
    }
  });
  // Mọi thay đổi giỏ hàng đều đi qua đây để phụ kiện mua kèm không bao giờ "mồ côi" sản phẩm chính
  const setCart = (updater) => {
    setCartItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return revertOrphanAddons(next);
    });
  };

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
  const safeCartItems = useMemo(() => (Array.isArray(cartItems) ? cartItems : []), [cartItems]);

  // Effect này CHỈ còn 2 việc: đồng bộ giỏ hàng xuống localStorage và soát lại giá combo
  // (gọi API nên bắt buộc phải bất đồng bộ). Việc hạ cấp phụ kiện mồ côi đã chuyển vào
  // revertOrphanAddons, chạy ngay lúc cập nhật state.
  useEffect(() => {
    const mainProducts = safeCartItems.filter(item => !item.isAddon);
    const hasAddons = safeCartItems.some(item => item.isAddon);

    // 2. Kiểm tra nếu thêm lại sản phẩm chính -> Tự động chuyển các phụ kiện độc lập phù hợp thành sản phẩm mua kèm giảm giá
    const regularItemsToUpgrade = safeCartItems.filter(item => !item.isAddon);
    // Ngoài việc nâng cấp phụ kiện lẻ thành hàng mua kèm, luôn chạy lại khi giỏ đang có hàng mua kèm
    // để soát lại giá combo theo cấu hình chiến dịch mới nhất (giỏ lưu trong localStorage có thể giữ giá cũ).
    if (mainProducts.length > 0 && (regularItemsToUpgrade.length > 1 || hasAddons)) {
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

                const comboPrice = calcComboPrice(origPrice, campaign);

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

        // Soát lại giá của các phụ kiện ĐANG là hàng mua kèm.
        // Giỏ hàng nằm trong localStorage nên có thể còn giữ giá tính theo công thức cũ
        // (ví dụ chưa áp trần MaxDiscountAmount) -> phải tính lại theo đúng cấu hình chiến dịch,
        // nếu không tổng tiền ở giỏ sẽ thấp hơn số tiền back-end thực thu.
        const campaignById = new Map();
        results.forEach(({ campaigns }) => {
          (campaigns || []).forEach(campData => {
            if (campData?.campaign) campaignById.set(Number(campData.campaign.id), campData.campaign);
          });
        });

        currentList = currentList.map(item => {
          if (!item.isAddon || !item.appliedCampaignId) return item;

          const campaign = campaignById.get(Number(item.appliedCampaignId));
          if (!campaign) return item;

          const origPrice = item.originalBasePrice || item.originalPrice || item.price;
          const correctedPrice = calcComboPrice(origPrice, campaign);
          if (correctedPrice === item.price) return item;

          itemsUpgraded = true;
          return { ...item, price: correctedPrice, originalBasePrice: origPrice, originalPrice: origPrice };
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
          setCart(mergedList);
        }
      });
    }

    localStorage.setItem('cart', JSON.stringify(safeCartItems));
  }, [safeCartItems]);

  // Hàm thực thi logic: addToCart
  const addToCart = (product, quantity = 1) => {
    // RÀNG BUỘC TỒN KHO KHẢ DỤNG (AVAILABLE STOCK):
    // Ưu tiên các trường chứa tồn kho khả dụng từ backend/frontend theo thứ tự
    const maxStock = product.availableStock ?? product.stockQuantity ?? product.stock ?? product.totalStock ?? 999;

    if (maxStock <= 0) {
      showToast(`Rất tiếc, sản phẩm "${product.name}" hiện đã hết hàng!`, 'warning');
      return;
    }

    let isOverStock = false;
    let finalAddedQty = quantity;

    setCart((prevItems) => {
      const currentArr = Array.isArray(prevItems) ? prevItems : [];
      const cartId = product.isAddon && product.appliedCampaignId
        ? `addon-${product.appliedCampaignId}-${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}`
        : `${product.id}-${product.selectedStorage || ''}-${product.selectedColor || ''}${product.selectedWarranty ? `-${product.selectedWarranty.id}` : ''}`;

      const existingItemIndex = currentArr.findIndex(item => item.cartId === cartId);

      if (existingItemIndex >= 0) {
        const existingItem = currentArr[existingItemIndex];
        const itemMaxStock = existingItem.availableStock ?? existingItem.stockQuantity ?? existingItem.stock ?? existingItem.totalStock ?? maxStock;
        
        if (existingItem.quantity + quantity > itemMaxStock) {
          isOverStock = true;
          const newItems = [...currentArr];
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: itemMaxStock,
            availableStock: itemMaxStock,
            stockQuantity: itemMaxStock
          };
          return newItems;
        }

        const newItems = [...currentArr];
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          availableStock: itemMaxStock,
          stockQuantity: itemMaxStock
        };
        return newItems;
      }

      if (quantity > maxStock) {
        isOverStock = true;
        finalAddedQty = maxStock;
      }

      const regularPrice = product.originalBasePrice || product.originalPrice || product.basePrice || product.price;

      return [...currentArr, {
        ...product,
        quantity: finalAddedQty,
        cartId,
        availableStock: maxStock,
        stockQuantity: maxStock,
        price: product.price,
        originalBasePrice: regularPrice,
        originalPrice: regularPrice,
        parentProductId: product.parentProductId || null,
        warrantyId: product.selectedWarranty?.id || null,
        warrantyName: product.selectedWarranty?.name || null,
        warrantyPrice: product.selectedWarranty?.basePrice || 0
      }];
    });

    if (isOverStock) {
      showToast(`Số lượng sản phẩm "${product.name}" trong giỏ hàng đã đạt giới hạn tồn kho khả dụng (${maxStock} sản phẩm)!`, 'warning');
    } else {
      showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
    }
  };

  // Hàm thực thi logic: removeFromCart
  const removeFromCart = (cartId) => {
    setCart((prevItems) => {
      const currentArr = Array.isArray(prevItems) ? prevItems : [];
      return currentArr.filter((item) => item.cartId !== cartId);
    });
  };

  // Hàm thực thi logic: updateQuantity
  const updateQuantity = (cartId, quantity) => {
    if (quantity < 1) return;
    setCart((prevItems) => {
      const currentArr = Array.isArray(prevItems) ? prevItems : [];
      return currentArr.map((item) => {
        if (item.cartId === cartId) {
          const maxStock = item.availableStock ?? item.stockQuantity ?? item.stock ?? item.totalStock ?? 999;
          
          let targetQty = quantity;
          if (targetQty > maxStock) {
            showToast(`Sản phẩm "${item.name}" chỉ còn ${maxStock} sản phẩm trong kho!`, 'warning');
            targetQty = maxStock;
          }
          if (item.isAddon && item.maxQuantityAllowed && targetQty > item.maxQuantityAllowed) {
            showToast(`Phụ kiện mua kèm "${item.name}" được mua tối đa ${item.maxQuantityAllowed} sản phẩm!`, 'warning');
            targetQty = item.maxQuantityAllowed;
          }
          return {
            ...item,
            quantity: targetQty,
            availableStock: maxStock,
            stockQuantity: maxStock
          };
        }
        return item;
      });
    });
  };

  // Hàm thực thi logic: clearCart
  const clearCart = () => {
    setCart([]);
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
    setCart(prev => [...prev]);
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
