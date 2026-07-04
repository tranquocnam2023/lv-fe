import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import {
  Layout, Package, Users, ShoppingCart, Settings, LogOut,
  Bell, FolderTree, Star, LayoutGrid, Ticket, Boxes,
  MessageSquare, History
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// ─── Danh sách tab chức năng (dùng cho global search) ────────────────────────
const ADMIN_FUNCTIONS = [
  { label: 'Bảng thống kê',      tab: 'dashboard',      keywords: ['thong ke', 'dashboard', 'bao cao'] },
  { label: 'Quản lý danh mục',   tab: 'categories',     keywords: ['danh muc', 'loai', 'categories'] },
  { label: 'Quản lý thương hiệu',tab: 'brands',         keywords: ['thuong hieu', 'hang', 'brands'] },
  { label: 'Quản lý sản phẩm',   tab: 'products',       keywords: ['san pham', 'dien thoai', 'products'] },
  { label: 'Thêm sản phẩm mới',  tab: 'create_product', keywords: ['them san pham', 'tao san pham', 'them moi', 'create'] },
  { label: 'Quản lý kho hàng',   tab: 'inventory',      keywords: ['kho', 'ton kho', 'inventory'] },
  { label: 'Quản lý đơn hàng',   tab: 'orders',         keywords: ['don hang', 'orders', 'hoa don'] },
  { label: 'Quản lý khách hàng', tab: 'customers',      keywords: ['khach hang', 'nguoi dung', 'users', 'customers', 'tai khoan'] },
  { label: 'Quản lý khuyến mãi', tab: 'promotions',     keywords: ['khuyen mai', 'ma giam gia', 'voucher', 'promotions'] },
  { label: 'Quản lý đánh giá',   tab: 'reviews',        keywords: ['danh gia', 'binh luan', 'reviews'] },
  { label: 'Cài đặt hệ thống',   tab: 'settings',       keywords: ['cai dat', 'settings', 'cau hinh'] },
  { label: 'Nhật ký hoạt động',  tab: 'audit_logs',     keywords: ['nhat ky', 'kiem toan', 'audit', 'logs', 'hoat dong'] },
];

// ─── Map tab → tiêu đề breadcrumb ────────────────────────────────────────────
const TAB_TITLES = {
  products:       'Quản lý sản phẩm',
  inventory:      'Quản lý kho hàng',
  categories:     'Quản lý danh mục',
  brands:         'Quản lý thương hiệu',
  orders:         'Quản lý đơn hàng',
  customers:      'Quản lý khách hàng',
  promotions:     'Quản lý mã khuyến mãi',
  reviews:        'Quản lý đánh giá',
  dashboard:      'Bảng thống kê số liệu',
  create_product: 'Thêm sản phẩm mới',
  update_product: 'Cập nhật sản phẩm',
  audit_logs:     'Nhật ký hoạt động',
  settings:       'Cài đặt hệ thống',
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
  const { setTheme } = useTheme();

  // ── Sidebar mobile ──────────────────────────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Global cross-module search ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery]           = useState('');
  const [allProducts, setAllProducts]           = useState([]);
  const [allOrders, setAllOrders]               = useState([]);
  const [allCustomers, setAllCustomers]         = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Tải dữ liệu cho cross-module search
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const [productsData, ordersData, customersData] = await Promise.all([
          productService.getAll(true).catch(() => []),
          orderService.getAll().catch(() => []),
          userService.getAll().catch(() => []),
        ]);

        if (Array.isArray(productsData)) setAllProducts(productsData);

        if (Array.isArray(ordersData)) {
          const statusMap = {
            1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Đang giao',
            4: 'Đã giao',      5: 'Đã hủy',      6: 'Giao thất bại',
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
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Bộ lọc search ──────────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  const filteredFunctions = q
    ? ADMIN_FUNCTIONS.filter(f =>
        f.label.toLowerCase().includes(q) ||
        f.keywords.some(k => k.toLowerCase().includes(q))
      )
    : [];
  const filteredProducts = q
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brandName && p.brandName.toLowerCase().includes(q))
      )
    : [];
  const filteredCustomers = q
    ? allCustomers.filter(c =>
        (c.username && c.username.toLowerCase().includes(q)) ||
        (c.email    && c.email.toLowerCase().includes(q))
      )
    : [];
  const filteredOrders = q
    ? allOrders.filter(o =>
        String(o.id).includes(searchQuery.trim()) ||
        (o.receiverPhone && o.receiverPhone.includes(searchQuery.trim())) ||
        (o.phone         && o.phone.includes(searchQuery.trim()))
      )
    : [];
  const noResults =
    filteredFunctions.length === 0 &&
    filteredProducts.length  === 0 &&
    filteredCustomers.length === 0 &&
    filteredOrders.length    === 0;

  // ── Auth helpers ────────────────────────────────────────────────────────────
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      authService.logout();
      window.location.href = '/auth';
    }
  };

  // ── Sidebar item renderer ───────────────────────────────────────────────────
  const SidebarItem = ({ id, Icon, label }) => (
    <button
      onClick={() => { onTabChange(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center px-4 py-3 rounded-md transition-all duration-200 font-bold cursor-pointer ${
        activeAdminTab === id
          ? 'bg-admin-sidebar-hover text-primary border-l-4 border-primary'
          : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${activeAdminTab === id ? 'text-primary' : 'text-admin-sidebar-text'}`} />
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-admin-sidebar-bg flex flex-col shrink-0 border-r border-admin-sidebar-border transition-transform duration-300 md:relative md:translate-x-0 md:flex ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-admin-sidebar-border">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-3">
            <span className="font-bold text-lg text-white">AD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">PhoneShop</h1>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[12px] font-bold text-admin-sidebar-text/60 uppercase tracking-widest mb-4">Chính</p>
          <SidebarItem id="dashboard"  Icon={Layout}       label="Bảng thống kê" />
          <SidebarItem id="categories" Icon={FolderTree}   label="Danh mục" />
          <SidebarItem id="brands"     Icon={Star}         label="Thương hiệu" />
          <SidebarItem id="products"   Icon={Package}      label="Sản phẩm" />
          <SidebarItem id="inventory"  Icon={Boxes}        label="Quản lý kho" />
          <SidebarItem id="orders"     Icon={ShoppingCart} label="Đơn hàng" />
          <SidebarItem id="customers"  Icon={Users}        label="Khách hàng" />
          <SidebarItem id="promotions" Icon={Ticket}       label="Khuyến mãi" />
          <SidebarItem id="reviews"    Icon={MessageSquare}label="Đánh giá" />

          <div className="pt-6">
            <p className="px-4 text-[12px] font-bold text-admin-sidebar-text/60 uppercase tracking-widest mb-4">Hệ thống</p>
            <SidebarItem id="settings"   Icon={Settings} label="Cài đặt" />
            <SidebarItem id="audit_logs" Icon={History}  label="Nhật ký hoạt động" />
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

            {/* Bell */}
            <button className="relative p-2 text-admin-text-muted hover:text-primary transition-colors mr-2">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-admin-danger rounded-full border-2 border-white" />
            </button>

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
