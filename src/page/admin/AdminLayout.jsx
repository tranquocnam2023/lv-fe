// KHUNG BỐ CỤC CHUNG ADMIN (LAYOUT)
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import {
  Layout, Package, Users, ShoppingCart, Settings, LogOut,
  Bell, FolderTree, Star, LayoutGrid, Ticket, Boxes,
  MessageSquare, History, Sun, Moon, CreditCard, PackagePlus,
  ShieldAlert,
  Newspaper
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// ─── Danh sách gõ tìm kiếm nhanh trên thanh công cụ  ────────────────────────
const ADMIN_FUNCTIONS = [
  { label: 'Bảng thống kê', tab: 'dashboard', keywords: ['thong ke', 'dashboard', 'bao cao'] },
  { label: 'Quản lý danh mục', tab: 'categories', keywords: ['danh muc', 'loai', 'categories'] },
  { label: 'Quản lý thương hiệu', tab: 'brands', keywords: ['thuong hieu', 'hang', 'brands'] },
  { label: 'Quản lý sản phẩm', tab: 'products', keywords: ['san pham', 'dien thoai', 'products'] },
  { label: 'Thêm sản phẩm mới', tab: 'create_product', keywords: ['them san pham', 'tao san pham', 'them moi', 'create'] },
  { label: 'Quản lý kho hàng', tab: 'inventory', keywords: ['kho', 'ton kho', 'inventory'] },
  { label: 'Quản lý đơn hàng', tab: 'orders', keywords: ['don hang', 'orders', 'hoa don'] },
  { label: 'Quản lý giao dịch', tab: 'payments', keywords: ['thanh toan', 'giao dich', 'vnpay', 'stripe', 'payments'] },
  { label: 'Quản lý khách hàng', tab: 'customers', keywords: ['khach hang', 'nguoi dung', 'users', 'customers', 'tai khoan'] },
  { label: 'Quản lý khuyến mãi', tab: 'promotions', keywords: ['khuyen mai', 'ma giam gia', 'voucher', 'promotions'] },
  { label: 'Quản lý Combo', tab: 'combos', keywords: ['combo', 'mua kem', 'ban cheo', 'combos'] },
  { label: 'Quản lý Tin tức-Blog', tab: 'blog', keywords: ['blog', 'blog', 'bai viet', 'tin tuc'] },
  { label: 'Quản lý đánh giá', tab: 'reviews', keywords: ['danh gia', 'binh luan', 'reviews'] },
  { label: 'Cài đặt hệ thống', tab: 'settings', keywords: ['cai dat', 'settings', 'cau hinh'] },
  { label: 'Nhật ký hoạt động', tab: 'audit_logs', keywords: ['nhat ky', 'kiem toan', 'audit', 'logs', 'hoat dong'] },
  { label: 'Quản lý bảo hành', tab: 'inspections', keywords: ['quan ly bao hanh', 'tham dinh', 'bao hanh', 'inspections', 'imei', 'ktv'] },
];

// ─── Map tab → tiêu đề breadcrumb ────────────────────────────────────────────
const TAB_TITLES = {
  products: 'Quản lý sản phẩm',
  inventory: 'Quản lý kho hàng',
  categories: 'Quản lý danh mục',
  brands: 'Quản lý thương hiệu',
  orders: 'Quản lý đơn hàng',
  payments: 'Quản lý giao dịch thanh toán',
  customers: 'Quản lý khách hàng',
  promotions: 'Quản lý mã khuyến mãi',
  combos: 'Quản lý Combo / Bán chéo',
  reviews: 'Quản lý đánh giá',
  dashboard: 'Bảng thống kê số liệu',
  create_product: 'Thêm sản phẩm mới',
  update_product: 'Cập nhật sản phẩm',
  audit_logs: 'Nhật ký hoạt động',
  settings: 'Cài đặt hệ thống',
  inspections: 'Quản lý bảo hành',
  blog: 'Quản lý Tin tức-Blog',
};

// ─── AdminLayout ──────────────────────────────────────────────────────────────
/**
 * Layout khung tổng của trang Admin: sidebar + header cố định.
 * Nhận `children` là nội dung tab hiện tại được render từ AdminPage.
 *
 * Props:
 *   activeAdminTab  – tab đang active (string)
 *   onTabChange     – callback (tab: string) để chuyển tab
 *   setSearchParams – từ useSearchParams, dùng cho global search điều hướng
 *   children        – nội dung trang con (tab content)
 */
export default function AdminLayout({ activeAdminTab, onTabChange, setSearchParams, children }) {
  // Khai báo giải nén các thuộc tính/hàm (toggleTheme, isDark) từ Hook / Context / Props
  const { toggleTheme, isDark } = useTheme();

  // ── Sidebar mobile ──────────────────────────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // các state cho thanh tìm kiếm toàn cục
  const [searchQuery, setSearchQuery] = useState('');
  // State: allProducts - Quản lý trạng thái và dữ liệu của allProducts trong giao diện
  const [allProducts, setAllProducts] = useState([]);
  // State: allOrders - Quản lý trạng thái và dữ liệu của allOrders trong giao diện
  const [allOrders, setAllOrders] = useState([]);
  // State: allCustomers - Quản lý trạng thái và dữ liệu của allCustomers trong giao diện
  const [allCustomers, setAllCustomers] = useState([]);
  // State: showSearchDropdown - Quản lý trạng thái và dữ liệu của showSearchDropdown trong giao diện
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  // Reference (useRef): searchRef - Lưu vết tham chiếu DOM hoặc giá trị không gây re-render
  const searchRef = useRef(null);

  // ── Notifications state ─────────────────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  // State: notificationFilter - Quản lý trạng thái và dữ liệu của notificationFilter trong giao diện
  const [notificationFilter, setNotificationFilter] = useState('all');
  // Reference (useRef): notificationRef - Lưu vết tham chiếu DOM hoặc giá trị không gây re-render
  const notificationRef = useRef(null);

  // Hàm thực thi logic: user
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  }, []);

  // State: readNotificationIds - Quản lý trạng thái và dữ liệu của readNotificationIds trong giao diện
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      // Khai báo biến/hằng số: key - Dùng trong logic xử lý của component
      const key = user?.id ? `admin_read_notifications_${user.id}` : 'admin_read_notifications';
      // Khai báo biến/hằng số: saved - Dùng trong logic xử lý của component
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      // Khai báo biến/hằng số: key - Dùng trong logic xử lý của component
      const key = user?.id ? `admin_read_notifications_${user.id}` : 'admin_read_notifications';
      localStorage.setItem(key, JSON.stringify(readNotificationIds));
    } catch (err) {
      console.error('Lỗi lưu trạng thái đã đọc thông báo:', err);
    }
  }, [readNotificationIds, user?.id]);

  // State làm mới thông báo khi có yêu cầu đổi trả mới
  const [returnSignal, setReturnSignal] = useState(0);

  useEffect(() => {
    // Hàm xử lý logic/sự kiện: handleReturnEvent
    const handleReturnEvent = () => setReturnSignal(prev => prev + 1);
    window.addEventListener('return_request_updated', handleReturnEvent);
    window.addEventListener('storage', handleReturnEvent);
    return () => {
      window.removeEventListener('return_request_updated', handleReturnEvent);
      window.removeEventListener('storage', handleReturnEvent);
    };
  }, []);

  // Hàm thực thi logic: notifications
  const notifications = React.useMemo(() => {
    // Cấu hình/Hằng số/Dịch vụ dữ liệu: list
    const list = [];

    // 1. Yêu cầu đổi trả từ khách hàng (PROJECT_RETURN_REQUESTS)
    try {
      // Khai báo biến/hằng số: returnRequests - Dùng trong logic xử lý của component
      const returnRequests = JSON.parse(localStorage.getItem('PROJECT_RETURN_REQUESTS') || '{}');
      Object.values(returnRequests).forEach(req => {
        if (req && req.status === 'Pending') {
          list.push({
            id: `return-${req.orderId}`,
            type: 'order',
            title: 'Yêu cầu đổi trả / hoàn tiền',
            message: `Đơn hàng #PS${req.orderId} có yêu cầu đổi trả sản phẩm cần xử lý`,
            time: req.createdAt || new Date().toISOString(),
            targetTab: 'orders',
            data: req
          });
        }
      });
    } catch (e) {
      console.error('Lỗi đọc thông báo đổi trả:', e);
    }
    
    // 2. Pending orders (statusId === 1) tất cả 
    allOrders.forEach(o => {
      if (o.statusId === 1) {
        list.push({
          id: `order-${o.id}`,
          type: 'order',
          title: 'Đơn hàng mới',
          message: `Đơn hàng #${o.id} đang chờ xác nhận từ ${o.receiverName || o.customerName || 'Khách hàng'}`,
          time: o.createdAt,
          targetTab: 'orders',
          data: o
        });
      }
    });

    // 3. Low stock products (< 5) hết hàng 
    allProducts.forEach(p => {
      // Khai báo biến/hằng số: stock - Dùng trong logic xử lý của component
      const stock = p.totalStock ?? p.stock ?? p.stockQuantity ?? 0;
      if (stock < 5) {
        list.push({
          id: `stock-${p.id}`,
          type: 'stock',
          title: 'Sản phẩm sắp hết hàng',
          message: `Sản phẩm "${p.name}" sắp hết hàng (chỉ còn ${stock} cái)`,
          time: null,
          targetTab: 'products',
          data: p
        });
      }
    });
    // Hàm thực thi logic: orders
    const orders = list.filter(n => n.type === 'order').sort((a, b) => new Date(b.time) - new Date(a.time));
    // Hàm thực thi logic: stocks
    const stocks = list.filter(n => n.type === 'stock') ;
    return [...orders, ...stocks];
  }, 
  [allOrders, allProducts, returnSignal]);

  //bộ lọc tab thông báo
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter(n => {
      // Khai báo biến/hằng số: isRead - Dùng trong logic xử lý của component
      const isRead = readNotificationIds.includes(n.id);
      if (notificationFilter === 'unread') return !isRead;
      if (notificationFilter === 'order') return n.type === 'order';
      if (notificationFilter === 'stock') return n.type === 'stock';

      return true;
    });
  }, [notifications, notificationFilter, readNotificationIds]);

  // Hàm thực thi logic: unreadCount
  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => !readNotificationIds.includes(n.id)).length;
  }, [notifications, readNotificationIds]);

  // Hàm xử lý logic/sự kiện: handleMarkAllAsRead
  const handleMarkAllAsRead = () => {
    // Hàm thực thi logic: allIds
    const allIds = notifications.map(n => n.id);
    setReadNotificationIds(prev => {
      // Khai báo biến/hằng số: combined - Dùng trong logic xử lý của component
      const combined = [...new Set([...prev, ...allIds])];
      return combined;
    });
  };

  // Hàm xử lý logic/sự kiện: handleNotificationClick
  const handleNotificationClick = (n) => {
    if (!readNotificationIds.includes(n.id)) {
      setReadNotificationIds(prev => [...prev, n.id]);
    }
    onTabChange(n.targetTab);
    setShowNotifications(false);
  };

  // Tải dữ liệu cho thông báo và tìm kiếm toàn cục
  useEffect(() => {
    // Hàm xử lý logic/sự kiện: fetchSearchData
    const fetchSearchData = async () => {
      try {
        // State: productsData - Quản lý trạng thái và dữ liệu của productsData trong giao diện
        const [productsData, ordersData, customersData] = await Promise.all([
          productService.getAll(true).catch(() => []),
          orderService.getAll().catch(() => []),
          userService.getAll().catch(() => []),

        ]);

        if (Array.isArray(productsData)) setAllProducts(productsData);

        if (Array.isArray(ordersData)) {
          // Cấu hình/Hằng số/Dịch vụ dữ liệu: statusMap
          const statusMap = {
            1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Đang giao',
            4: 'Đã giao', 5: 'Đã hủy', 6: 'Giao thất bại',
            7: 'Đã hoàn tiền',
          };
          setAllOrders(ordersData.map(o => ({ ...o, statusStr: statusMap[o.statusId] || 'Chờ xác nhận' })));
        }

        if (Array.isArray(customersData)) setAllCustomers(customersData);
      } catch (err) {
        console.error('Lỗi tải dữ liệu phục vụ tìm kiếm:', err);
      }
    };
    fetchSearchData();
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    // Hàm xử lý logic/sự kiện: handleClickOutside
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Bộ lọc search ──────────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  // Khai báo biến/hằng số: filteredFunctions - Dùng trong logic xử lý của component
  const filteredFunctions = q
    ? ADMIN_FUNCTIONS.filter(f =>
      f.label.toLowerCase().includes(q) ||
      f.keywords.some(k => k.toLowerCase().includes(q))
    )
    : [];
  // Khai báo biến/hằng số: filteredProducts - Dùng trong logic xử lý của component
  const filteredProducts = q
    ? allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brandName && p.brandName.toLowerCase().includes(q))
    )
    : [];
  // Khai báo biến/hằng số: filteredCustomers - Dùng trong logic xử lý của component
  const filteredCustomers = q
    ? allCustomers.filter(c =>
      (c.username && c.username.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
    : [];
  // Khai báo biến/hằng số: filteredOrders - Dùng trong logic xử lý của component
  const filteredOrders = q
    ? allOrders.filter(o =>
      String(o.id).includes(searchQuery.trim()) ||
      (o.receiverPhone && o.receiverPhone.includes(searchQuery.trim())) ||
      (o.phone && o.phone.includes(searchQuery.trim()))
    )
    : [];
  // Khai báo biến/hằng số: noResults - Dùng trong logic xử lý của component
  const noResults =
    filteredFunctions.length === 0 &&
    filteredProducts.length === 0 &&
    filteredCustomers.length === 0 &&
    filteredOrders.length === 0;

  // ── Auth helpers ────────────────────────────────────────────────────────────
  // user is defined at the top using React.useMemo

  // Hàm xử lý logic/sự kiện: handleLogout
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      authService.logout();
      window.location.href = '/auth';
    }
  };

  // ── Sidebar item renderer ───────────────────────────────────────────────────
  const SidebarItem = ({ id, Icon: IconComponent, label }) => (
    <button
      onClick={() => { onTabChange(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center px-4 py-3 rounded-md transition-all duration-200 font-bold cursor-pointer ${activeAdminTab === id
          ? 'bg-admin-sidebar-hover text-primary border-l-4 border-primary'
          : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-white'
        }`}
    >
      <IconComponent className={`w-5 h-5 mr-3 ${activeAdminTab === id ? 'text-primary' : 'text-admin-sidebar-text'}`} />
      <span className="text-sm">{label}</span>
    </button>
  );

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-admin-bg overflow-hidden font-sans">

      {/* MOBILE: overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-admin-sidebar-bg flex flex-col shrink-0 border-r border-admin-sidebar-border transition-transform duration-300 md:relative md:translate-x-0 md:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-admin-sidebar-border">
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/logo2.jpg" alt="Logo" className="h-12 object-contain rounded-md" />
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[12px] font-bold text-admin-sidebar-text/60 uppercase tracking-widest mb-4">Chính</p>
          <SidebarItem id="dashboard" Icon={Layout} label="Bảng thống kê" />
          <SidebarItem id="categories" Icon={FolderTree} label="Danh mục" />
          <SidebarItem id="brands" Icon={Star} label="Thương hiệu" />
          <SidebarItem id="products" Icon={Package} label="Sản phẩm" />
          <SidebarItem id="inventory" Icon={Boxes} label="Quản lý kho" />
          <SidebarItem id="orders" Icon={ShoppingCart} label="Đơn hàng" />
          <SidebarItem id="payments" Icon={CreditCard} label="Giao dịch" />
          <SidebarItem id="customers" Icon={Users} label="Khách hàng" />
          <SidebarItem id="promotions" Icon={Ticket} label="Khuyến mãi" />
          <SidebarItem id="combos" Icon={PackagePlus} label="Quản lý Combo" />
          <SidebarItem id="reviews" Icon={MessageSquare} label="Đánh giá" />
          <SidebarItem id="inspections" Icon={ShieldAlert} label="Thẩm định bảo hành" />
          <SidebarItem id="blog" Icon={Newspaper} label="Quản lý tin tức-blog" />

          <div className="pt-6">
            <p className="px-4 text-[12px] font-bold text-admin-sidebar-text/60 uppercase tracking-widest mb-4">Hệ thống</p>
            <SidebarItem id="settings" Icon={Settings} label="Cài đặt" />
            <SidebarItem id="audit_logs" Icon={History} label="Nhật ký hoạt động" />
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="p-4 bg-admin-sidebar-bg border-t border-admin-sidebar-border space-y-2">
          <Link
            to="/"
            className="w-full flex items-center px-4 py-3 text-sm font-bold text-admin-sidebar-text hover:text-primary hover:bg-admin-sidebar-hover transition-colors rounded-md group"
          >
            <LayoutGrid className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            Xem cửa hàng
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-bold text-admin-sidebar-text hover:text-admin-danger hover:bg-red-500/10 transition-colors rounded-md group cursor-pointer"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <header className="h-20 bg-white border-b border-admin-border flex items-center justify-between px-4 md:px-8 shrink-0">
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile: hamburger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition cursor-pointer text-admin-text-main"
              aria-label="Mở sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <p className="text-xs md:text-sm font-medium text-admin-text-muted">
              Trang chủ / {TAB_TITLES[activeAdminTab] ?? 'Trang quản trị'}
            </p>
          </div>

          {/* Right: search + bell + avatar */}
          <div ref={searchRef} className="relative flex items-center bg-white rounded-full px-4 py-2 border border-admin-border z-50">
            {/* Search input */}
            <div className="flex items-center bg-admin-bg rounded-full px-4 py-2 mr-4">
              <svg className="w-4 h-4 text-admin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm đơn, sản phẩm, khách..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
                onFocus={() => setShowSearchDropdown(true)}
                className="bg-transparent border-none outline-none text-sm ml-2 w-48 placeholder-admin-text-muted text-admin-text-main"
              />
            </div>

            {/* Dropdown kết quả search */}
            {showSearchDropdown && searchQuery.trim() && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-admin-border rounded-md shadow-2xl z-50 overflow-hidden text-admin-text-main max-h-[350px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">

                {/* Chức năng */}
                {filteredFunctions.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-admin-text-muted uppercase border-b border-admin-border">Chức năng</div>
                    {filteredFunctions.map(f => (
                      <button key={f.tab} onClick={() => { onTabChange(f.tab); setSearchQuery(''); setShowSearchDropdown(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-admin-bg text-xs font-bold transition-colors flex items-center cursor-pointer border-b border-gray-50">
                        <span className="text-primary mr-1.5 font-bold">⚡ [Chức năng]</span> {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sản phẩm */}
                {filteredProducts.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-admin-text-muted uppercase border-b border-admin-border">Sản phẩm</div>
                    {filteredProducts.slice(0, 5).map(p => (
                      <button key={p.id} onClick={() => {
                        setSearchParams(prev => { prev.set('tab', 'update_product'); prev.set('productId', p.id); return prev; });
                        setSearchQuery(''); setShowSearchDropdown(false);
                      }}
                        className="w-full text-left px-4 py-2 hover:bg-admin-bg text-xs font-medium transition-colors truncate block cursor-pointer border-b border-gray-50">
                        <span className="text-orange-500 font-bold mr-1.5">[Sản phẩm]</span> {p.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Khách hàng */}
                {filteredCustomers.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-admin-text-muted uppercase border-b border-admin-border">Khách hàng</div>
                    {filteredCustomers.slice(0, 5).map(c => (
                      <button key={c.id} onClick={() => { onTabChange('customers'); setSearchQuery(''); setShowSearchDropdown(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-admin-bg text-xs font-medium transition-colors truncate block cursor-pointer border-b border-gray-50">
                        <span className="text-green-600 font-bold mr-1.5">[Khách hàng]</span> {c.username}
                      </button>
                    ))}
                  </div>
                )}

                {/* Đơn hàng */}
                {filteredOrders.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-admin-text-muted uppercase border-b border-admin-border">Đơn hàng</div>
                    {filteredOrders.slice(0, 5).map(o => (
                      <button key={o.id} onClick={() => { onTabChange('orders'); setSearchQuery(''); setShowSearchDropdown(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-admin-bg text-xs font-medium transition-colors truncate block cursor-pointer border-b border-gray-50">
                        <span className="text-blue-600 font-bold mr-1.5">[Đơn hàng]</span> Đơn hàng #{o.id} ({o.statusStr})
                      </button>
                    ))}
                  </div>
                )}

                {/* Không có kết quả */}
                {noResults && (
                  <div className="px-4 py-6 text-center text-xs text-admin-text-muted font-bold">
                    Không tìm thấy thực thể tương ứng
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            {/*<button
              onClick={toggleTheme}
              className="p-2 text-admin-text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors mr-2 cursor-pointer rounded-full flex items-center justify-center"
              title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
            >
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>*/}

            {/* Bell & Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-admin-text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors mr-2 cursor-pointer flex items-center justify-center rounded-full"
                title="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-admin-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-white border border-admin-border rounded-xl shadow-2xl z-50 overflow-hidden text-admin-text-main animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-admin-border flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
                    <span className="font-bold text-sm">Thông báo ({notifications.length})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                      >
                        Đánh dấu đã đọc tất cả
                      </button>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-admin-border px-2 py-1 bg-gray-50/50 dark:bg-admin-bg/30">
                    {['all', 'unread', 'order', 'stock','logs'].map(tab => {
                      // Khai báo biến/hằng số: labels - Dùng trong logic xử lý của component
                      const labels = {
                        all: 'Tất cả',
                        unread: 'Chưa đọc',
                        order: 'Đơn hàng',
                        stock: 'Hết hàng',
                        logs: 'Nhật ký'
                      };
                      return (
                        <button
                          key={tab}
                          onClick={() => setNotificationFilter(tab)}
                          className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            notificationFilter === tab
                              ? 'bg-primary/10 text-primary dark:bg-primary/20'
                              : 'text-admin-text-muted hover:text-admin-text-main hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                    {filteredNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-admin-text-muted font-bold">
                        Không có thông báo nào
                      </div>
                    ) : (
                      filteredNotifications.map(n => {
                        // Khai báo biến/hằng số: isRead - Dùng trong logic xử lý của component
                        const isRead = readNotificationIds.includes(n.id);
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-admin-border/30 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${
                              !isRead ? 'bg-primary/5 dark:bg-primary/5 font-semibold' : ''
                            }`}
                          >
                            {/* Icon */}
                            <div className="mt-0.5 shrink-0">
                              {n.type === 'order' ? (
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                  <ShoppingCart size={16} />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                  <Package size={16} />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-admin-text-main line-clamp-2 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-admin-text-muted mt-1 block">
                                {n.time ? new Date(n.time).toLocaleString('vi-VN') : 'Cần xử lý ngay'}
                              </span>
                            </div>

                            {/* Unread dot */}
                            {!isRead && (
                              <div className="mt-2 shrink-0 w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-3 ml-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {user?.username?.charAt(0) ?? 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content (children từ AdminPage) ── */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-4 bg-admin-bg scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
