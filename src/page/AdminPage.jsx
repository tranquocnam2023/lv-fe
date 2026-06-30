import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminProducts from './AdminProducts';
import AdminInventory from '../components/AdminInventory';
import AdminOrders from '../components/AdminOrders';
import AdminDashboard from '../components/AdminDashboard';
import AdminCustomers from '../components/AdminCustomers';
import AdminCategories from '../components/AdminCategories';
import AdminBrands from '../components/AdminBrands';
import AdminPromotions from '../components/AdminPromotions';
import AdminReviews from '../components/AdminReviews';
import AdminCreateProduct from './AdminCreateProduct';
import AdminUpdateProduct from './AdminUpdateProduct';
import { authService } from '../services/authService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { Layout, Package, Users, ShoppingCart, Settings, LogOut, Bell, FolderTree, Star, LayoutGrid, Ticket, Layers, Boxes, MessageSquare } from 'lucide-react';

const DASHBOARD_STATS = [
  { label: 'Tổng khách hàng', icon: Users, bgColor: '#5856d6', textColor: '#ffffff' },
  { label: 'Doanh thu tháng', icon: Layout, bgColor: '#007aff', textColor: '#ffffff', isCurrency: true },
  { label: 'Đơn hàng mới', icon: ShoppingCart, bgColor: '#32ade6', textColor: '#ffffff' },
  { label: 'Sản phẩm', icon: Package, bgColor: '#ff9500', textColor: '#ffffff' },
];

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeAdminTab = searchParams.get('tab') || 'dashboard';
  const editProductId = searchParams.get('productId');
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // States cho tìm kiếm thực thể chéo module
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Các tab chức năng trong trang Admin
  const ADMIN_FUNCTIONS = [
    { label: 'Bảng thống kê', tab: 'dashboard', keywords: ['thong ke', 'dashboard', 'bao cao'] },
    { label: 'Quản lý danh mục', tab: 'categories', keywords: ['danh muc', 'loai', 'categories'] },
    { label: 'Quản lý thương hiệu', tab: 'brands', keywords: ['thuong hieu', 'hang', 'brands'] },
    { label: 'Quản lý sản phẩm', tab: 'products', keywords: ['san pham', 'dien thoai', 'products'] },
    { label: 'Thêm sản phẩm mới', tab: 'create_product', keywords: ['them san pham', 'tao san pham', 'them moi', 'create'] },
    { label: 'Quản lý kho hàng', tab: 'inventory', keywords: ['kho', 'ton kho', 'inventory'] },
    { label: 'Quản lý đơn hàng', tab: 'orders', keywords: ['don hang', 'orders', 'hoa don'] },
    { label: 'Quản lý khách hàng', tab: 'customers', keywords: ['khach hang', 'nguoi dung', 'users', 'customers', 'tai khoan'] },
    { label: 'Quản lý khuyến mãi', tab: 'promotions', keywords: ['khuyen mai', 'ma giam gia', 'voucher', 'promotions'] },
    { label: 'Quản lý đánh giá', tab: 'reviews', keywords: ['danh gia', 'binh luan', 'reviews'] },
    { label: 'Cài đặt hệ thống', tab: 'settings', keywords: ['cai dat', 'settings', 'cau hinh'] }
  ];

  // Tải dữ liệu chéo module từ DATABASE
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const [productsData, ordersData, customersData] = await Promise.all([
          productService.getAll(true).catch(() => []),
          orderService.getAll().catch(() => []),
          userService.getAll().catch(() => [])
        ]);

        if (Array.isArray(productsData)) {
          setAllProducts(productsData);
        }
        if (Array.isArray(ordersData)) {
          const statusMap = {
            1: 'Chờ xác nhận',
            2: 'Đã xác nhận',
            3: 'Đang giao',
            4: 'Đã giao',
            5: 'Đã hủy',
            6: 'Giao thất bại',
            7: 'Đã hoàn tiền'
          };
          const mappedOrders = ordersData.map(order => ({
            ...order,
            statusStr: statusMap[order.statusId] || 'Chờ xác nhận'
          }));
          setAllOrders(mappedOrders);
        }
        if (Array.isArray(customersData)) {
          setAllCustomers(customersData);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu phục vụ tìm kiếm:", err);
      }
    };
    fetchSearchData();
  }, []);

  // Đóng dropdown khi click ra bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Bộ lọc chức năng
  const filteredFunctions = searchQuery.trim()
    ? ADMIN_FUNCTIONS.filter(f => 
        f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Bộ lọc sản phẩm: tên sản phẩm hoặc tên thương hiệu
  const filteredProducts = searchQuery.trim()
    ? allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brandName && p.brandName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Bộ lọc khách hàng: tên khách hàng (username) hoặc email
  const filteredCustomers = searchQuery.trim()
    ? allCustomers.filter(c => 
        (c.username && c.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Bộ lọc đơn hàng: mã đơn hàng hoặc số điện thoại người nhận
  const filteredOrders = searchQuery.trim()
    ? allOrders.filter(o => 
        String(o.id).includes(searchQuery.trim()) ||
        (o.receiverPhone && o.receiverPhone.includes(searchQuery.trim())) ||
        (o.phone && o.phone.includes(searchQuery.trim()))
      )
    : [];

  const setActiveAdminTab = (tab, brandId = null) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      if (brandId) {
        prev.set('brandId', brandId);
      } else {
        prev.delete('brandId');
      }
      if (tab !== 'update_product') {
        prev.delete('productId');
      }
      return prev;
    });
  };



  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      authService.logout();
      window.location.href = '/auth';
    }
  };

  const getHeaderTitle = () => {
    switch (activeAdminTab) {
      case 'products': return 'Quản lý sản phẩm';
      case 'inventory': return 'Quản lý kho hàng';
      case 'categories': return 'Quản lý danh mục';
      case 'brands': return 'Quản lý thương hiệu';
      case 'orders': return 'Quản lý đơn hàng';
      case 'customers': return 'Quản lý khách hàng';
      case 'promotions': return 'Quản lý mã khuyến mãi';
      case 'reviews': return 'Quản lý đánh giá';
      case 'dashboard': return 'Bảng thống kê số liệu';
      case 'create_product': return 'Thêm sản phẩm mới';
      case 'update_product': return 'Cập nhật sản phẩm';
      default: return 'Trang quản trị';
    }
  };

  const renderSidebarItem = (id, Icon, label) => (
    <button
      key={id}
      onClick={() => {
        setActiveAdminTab(id);
        setIsSidebarOpen(false); // Close sidebar drawer on mobile after selection
      }}
      className={`w-full flex items-center px-4 py-3 rounded-md transition-all duration-200 font-bold cursor-pointer ${activeAdminTab === id
        ? 'bg-admin-sidebar-hover text-primary border-l-4 border-primary'
        : 'text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-white'
        }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${activeAdminTab === id ? 'text-primary' : 'text-admin-sidebar-text'}`} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-admin-bg overflow-hidden font-sans">
      {/* MOBILE: Sliding overlay backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar - MOBILE: Sliding drawer, TABLET & DESKTOP: Fixed layout */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-admin-sidebar-bg flex flex-col shrink-0 border-r border-admin-sidebar-border transition-transform duration-300 md:relative md:translate-x-0 md:flex ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-20 flex items-center px-8 border-b border-admin-sidebar-border">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-3">
            <span className="font-bold text-lg text-white">AD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">PhoneShop</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[12px] font-bold text-admin-sidebar-text/60 uppercase tracking-widest mb-4">Chính</p>
          {renderSidebarItem("dashboard", Layout, "Bảng thống kê")}
          {renderSidebarItem("categories", FolderTree, "Danh mục")}
          {renderSidebarItem("brands", Star, "Thương hiệu")}
          {renderSidebarItem("products", Package, "Sản phẩm")}
          {renderSidebarItem("inventory", Boxes, "Quản lý kho")}
          {renderSidebarItem("orders", ShoppingCart, "Đơn hàng")}
          {renderSidebarItem("customers", Users, "Khách hàng")}
          {renderSidebarItem("promotions", Ticket, "Khuyến mãi")}
          {renderSidebarItem("reviews", MessageSquare, "Đánh giá")}

          <div className="pt-6">
            <p className="px-4 text-[12px] font-bold text-admin-sidebar-text/60 uppercase tracking-widest mb-4">Hệ thống</p>
            {renderSidebarItem("settings", Settings, "Cài đặt")}
          </div>
        </nav>

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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Header */}
        <header className="h-20 bg-white border-b border-admin-border flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* MOBILE & TABLET: Toggle sidebar button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition cursor-pointer text-admin-text-main"
              aria-label="Open Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div>
              <p className="text-xs md:text-sm font-medium text-admin-text-muted">Trang chủ / {getHeaderTitle()}</p>
            </div>
          </div>

          <div ref={searchRef} className="relative flex items-center bg-white rounded-full px-4 py-2 border border-admin-border z-50">
            <div className="flex items-center bg-admin-bg rounded-full px-4 py-2 mr-4">
              <svg className="w-4 h-4 text-admin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Tìm đơn, sản phẩm, khách..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="bg-transparent border-none outline-none text-sm ml-2 w-48 placeholder-admin-text-muted text-admin-text-main" 
              />
            </div>

            {/* Dropdown gợi ý tìm kiếm chéo module */}
            {showSearchDropdown && searchQuery.trim() && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-admin-border rounded-md shadow-2xl z-50 overflow-hidden text-admin-text-main max-h-[350px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                {/* 1. CHỨC NĂNG */}
                {filteredFunctions.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-admin-text-muted uppercase border-b border-admin-border">
                      Chức năng
                    </div>
                    {filteredFunctions.map(f => (
                      <button
                        key={f.tab}
                        onClick={() => {
                          setActiveAdminTab(f.tab);
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-admin-bg text-xs font-bold transition-colors flex items-center cursor-pointer border-b border-gray-50"
                      >
                        <span className="text-primary mr-1.5 font-bold">⚡ [Chức năng]</span> {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. SẢN PHẨM */}
                {filteredProducts.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-admin-text-muted uppercase border-b border-admin-border">
                      Sản phẩm
                    </div>
                    {filteredProducts.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSearchParams(prev => {
                            prev.set('tab', 'update_product');
                            prev.set('productId', p.id);
                            return prev;
                          });
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-admin-bg text-xs font-medium transition-colors truncate block cursor-pointer border-b border-gray-50"
                      >
                        <span className="text-orange-500 font-bold mr-1.5">[Sản phẩm]</span> {p.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. KHÁCH HÀNG */}
                {filteredCustomers.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-admin-text-muted uppercase border-b border-admin-border">
                      Khách hàng
                    </div>
                    {filteredCustomers.slice(0, 5).map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveAdminTab('customers');
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-admin-bg text-xs font-medium transition-colors truncate block cursor-pointer border-b border-gray-50"
                      >
                        <span className="text-green-600 font-bold mr-1.5">[Khách hàng]</span> {c.username}
                      </button>
                    ))}
                  </div>
                )}

                {/* 4. ĐƠN HÀNG */}
                {filteredOrders.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-admin-text-muted uppercase border-b border-admin-border">
                      Đơn hàng
                    </div>
                    {filteredOrders.slice(0, 5).map(o => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setActiveAdminTab('orders');
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-admin-bg text-xs font-medium transition-colors truncate block cursor-pointer border-b border-gray-50"
                      >
                        <span className="text-blue-600 font-bold mr-1.5">[Đơn hàng]</span> Đơn hàng #{o.id} ({o.statusStr})
                      </button>
                    ))}
                  </div>
                )}

                {/* KHÔNG CÓ KẾT QUẢ */}
                {filteredFunctions.length === 0 && filteredProducts.length === 0 && filteredCustomers.length === 0 && filteredOrders.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-admin-text-muted font-bold">
                    Không tìm thấy thực thể tương ứng
                  </div>
                )}
              </div>
            )}
            <button className="relative p-2 text-admin-text-muted hover:text-primary transition-colors mr-2">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-admin-danger rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 ml-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {user?.username?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-4 bg-admin-bg scroll-smooth">
          {activeAdminTab === 'products' && (
            <AdminProducts
              onCreate={() => setActiveAdminTab('create_product')}
              onEdit={(id) => {
                setSearchParams(prev => {
                  prev.set('tab', 'update_product');
                  prev.set('productId', id);
                  return prev;
                });
              }}
              defaultBrandFilter={selectedBrandId}
              clearBrandFilter={() => setSelectedBrandId(null)}
            />
          )}
          {activeAdminTab === 'create_product' && <AdminCreateProduct onBack={() => setActiveAdminTab('products')} />}
          {activeAdminTab === 'update_product' && <AdminUpdateProduct productId={editProductId} onBack={() => setActiveAdminTab('products')} onCreateNew={() => setActiveAdminTab('create_product')} />}
          {activeAdminTab === 'categories' && <AdminCategories />}
          {activeAdminTab === 'brands' && (
            <AdminBrands
              onRedirectToProducts={(brandId) => {
                setSelectedBrandId(brandId);
                setActiveAdminTab('products');
              }}
              onRedirectToCreateProduct={(brandId) => {
                setActiveAdminTab('create_product', brandId);
              }}
            />
          )}
          {activeAdminTab === 'inventory' && <AdminInventory />}
          {activeAdminTab === 'orders' && <AdminOrders />}
          {activeAdminTab === 'customers' && <AdminCustomers />}
          {activeAdminTab === 'promotions' && <AdminPromotions />}
          {activeAdminTab === 'reviews' && <AdminReviews />}
          {activeAdminTab === 'dashboard' && (
            <AdminDashboard />
          )}
          {activeAdminTab === 'settings' && (
            <div className="bg-white p-6 rounded-md border border-admin-border animate-in fade-in duration-350">
              <h2 className="text-2xl font-bold text-admin-text-main mb-4">Cài đặt hệ thống</h2>
              <div className="p-4 bg-gray-50 rounded-md border border-dashed border-admin-border text-admin-text-muted text-sm font-semibold">
                🔧 Tính năng cấu hình hệ thống đang được phát triển và hoàn thiện.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
