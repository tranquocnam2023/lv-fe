// src/components/common/BottomNav.jsx
/**
 * ============================================================================
 * COMPONENT: BottomNav (Mobile Navigation Bar)
 * ============================================================================
 * Chức năng:
 *  1. Hiển thị thanh điều hướng cố định dưới đáy màn hình dành riêng cho di động (Mobile - md:hidden).
 *  2. Tối ưu UX Thumb-Zone giúp người dùng thao tác bằng 1 tay nhanh chóng.
 *  3. Tự động ẩn khi cuộn trang xuống (Scroll Down) và hiện lại khi cuộn lên (Scroll Up).
 *  4. Đồng bộ Badge số lượng sản phẩm trong giỏ hàng real-time từ CartContext.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingBag, User, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy số lượng sản phẩm từ CartContext để hiển thị Badge real-time
  const { cartCount } = useCart();
  
  // State quản lý việc ẩn/hiện thanh điều hướng khi cuộn trang
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  /**
   * Effect lắng nghe sự kiện cuộn trang (Scroll Listener):
   * - Nếu cuộn xuống (scroll down) > 10px: Ẩn thanh BottomNav để mở rộng diện tích đọc nội dung.
   * - Nếu cuộn lên (scroll up) > 10px hoặc gần đầu trang (< 50px): Hiển thị lại thanh BottomNav.
   */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Luôn hiển thị khi ở gần đầu trang
      if (currentScrollY < 50) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (currentScrollY > lastScrollY + 10) {
        // Cuộn xuống -> Ẩn thanh BottomNav
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 10) {
        // Cuộn lên -> Hiển thị lại BottomNav
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Cấu hình các mục điều hướng chính trên di động
  const navItems = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      path: '/',
      isActive: location.pathname === '/'
    },
    {
      id: 'category',
      label: 'Danh mục',
      icon: Grid,
      path: '/danh-muc/dien-thoai',
      isActive: location.pathname.startsWith('/danh-muc')
    },
    {
      id: 'track',
      label: 'Tra cứu',
      icon: Search,
      path: '/track',
      isActive: location.pathname === '/track'
    },
    {
      id: 'cart',
      label: 'Giỏ hàng',
      icon: ShoppingBag,
      path: '/cart',
      badge: cartCount > 0 ? cartCount : null,
      isActive: location.pathname === '/cart'
    },
    {
      id: 'account',
      label: 'Tài khoản',
      icon: User,
      path: '/auth',
      isActive: location.pathname === '/auth' || location.pathname === '/profile'
    }
  ];

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-[9990] bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-transform duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold transition-all duration-200 ${
                item.isActive
                  ? 'text-blue-600 dark:text-blue-400 scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5 stroke-[2]" />
                {/* Badge số lượng sản phẩm giỏ hàng real-time */}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-slate-900 shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {/* Dấu chấm chỉ báo tab đang active */}
              {item.isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
