// ==========================================================================
// MODULE: CartContextInstance.js
// MỤC ĐÍCH: Tách phần Context + hook useCart ra khỏi file component.
//           React Fast Refresh chỉ hoạt động khi một file .jsx chỉ export component,
//           nên hằng số/hook dùng chung phải nằm ở file riêng.
// ==========================================================================
import { createContext, useContext } from 'react';

export const CartContext = createContext(null);

// Custom Hook: useCart - Truy cập kho dữ liệu giỏ hàng dùng chung
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
