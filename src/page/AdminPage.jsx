import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminProducts from './AdminProducts';
import AdminInventory from '../components/AdminInventory';
import AdminOrders from '../components/AdminOrders';
import AdminDashboard from '../components/AdminDashboard';
import AdminCustomers from '../components/AdminCustomers';
import AdminCategories from '../components/AdminCategories';
import AdminBrands from '../components/AdminBrands';
import AdminPromotions from '../components/AdminPromotions';
import AdminProductVariants from '../components/AdminProductVariants';
import AdminCreateProduct from './AdminCreateProduct';
import AdminUpdateProduct from './AdminUpdateProduct';
import { dashboardService } from '../services/dashboardService';
import { authService } from '../services/authService';
import { Layout, Package, Users, ShoppingCart, Settings, LogOut, Bell, FolderTree, Star, LayoutGrid, Ticket, Layers, Boxes } from 'lucide-react';

const DASHBOARD_STATS = [
  { label: 'Tổng khách hàng', icon: Users, bgColor: '#5856d6', textColor: '#ffffff' },
  { label: 'Doanh thu tháng', icon: Layout, bgColor: '#007aff', textColor: '#ffffff', isCurrency: true },
  { label: 'Đơn hàng mới', icon: ShoppingCart, bgColor: '#32ade6', textColor: '#ffffff' },
  { label: 'Sản phẩm', icon: Package, bgColor: '#ff9500', textColor: '#ffffff' },
];

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeAdminTab = searchParams.get('tab') || 'dashboard';
  const [editProductId, setEditProductId] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState(null);

  const setActiveAdminTab = (tab, brandId = null) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      if (brandId) {
        prev.set('brandId', brandId);
      } else {
        prev.delete('brandId');
      }
      return prev;
    });
  };

  // Khởi tạo state trống để sau này truyền API
  const [stats, setStats] = useState({ users: 0, revenue: 0, orders: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    dashboardService.getStats()
      .then(data => {
        if (data) setStats(data);
      })
      .catch(e => console.log("Lỗi tải thống kê tổng quát"));
  }, []);

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
      case 'variants': return 'Quản lý biến thể';
      case 'orders': return 'Quản lý đơn hàng';
      case 'customers': return 'Quản lý khách hàng';
      case 'promotions': return 'Quản lý mã khuyến mãi';
      case 'dashboard': return 'Bảng thống kê số liệu';
      case 'create_product': return 'Thêm sản phẩm mới';
      case 'update_product': return 'Cập nhật sản phẩm';
      default: return 'Trang quản trị';
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveAdminTab(id)}
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
      {/* Admin Sidebar */}
      <aside className="w-64 bg-admin-sidebar-bg flex flex-col hidden md:flex shrink-0 border-r border-admin-sidebar-border">
        <div className="h-20 flex items-center px-8 border-b border-admin-sidebar-border">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-3">
            <span className="font-bold text-lg text-white">AD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">PhoneShop</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[12px] font-bold text-admin-sidebar-text/60 uppercase tracking-widest mb-4">Chính</p>
          <SidebarItem id="dashboard" icon={Layout} label="Bảng thống kê" />
          <SidebarItem id="categories" icon={FolderTree} label="Danh mục" />
          <SidebarItem id="brands" icon={Star} label="Thương hiệu" />
          <SidebarItem id="products" icon={Package} label="Sản phẩm" />
          <SidebarItem id="inventory" icon={Boxes} label="Quản lý kho" />
          <SidebarItem id="variants" icon={Layers} label="Biến thể" />
          <SidebarItem id="orders" icon={ShoppingCart} label="Đơn hàng" />
          <SidebarItem id="customers" icon={Users} label="Khách hàng" />
          <SidebarItem id="promotions" icon={Ticket} label="Khuyến mãi" />

          <div className="pt-6">
            <p className="px-4 text-[12px] font-bold text-admin-sidebar-text/60 uppercase tracking-widest mb-4">Hệ thống</p>
            <SidebarItem id="settings" icon={Settings} label="Cài đặt" />
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
        <header className="h-20 bg-white border-b border-admin-border flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-admin-text-muted">Trang chủ / {getHeaderTitle()}</p>
            </div>
          </div>

          <div className="flex items-center bg-white rounded-full px-4 py-2 border border-admin-border">
            <div className="flex items-center bg-admin-bg rounded-full px-4 py-2 mr-4">
              <svg className="w-4 h-4 text-admin-text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input type="text" placeholder="Tìm kiếm..." className="bg-transparent border-none outline-none text-sm ml-2 w-32 placeholder-admin-text-muted text-admin-text-main" />
            </div>
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
              onEdit={(id) => { setEditProductId(id); setActiveAdminTab('update_product'); }}
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
          {activeAdminTab === 'variants' && <AdminProductVariants />}
          {activeAdminTab === 'orders' && <AdminOrders />}
          {activeAdminTab === 'customers' && <AdminCustomers />}
          {activeAdminTab === 'promotions' && <AdminPromotions />}
          {activeAdminTab === 'dashboard' && (
            <AdminDashboard />
          )}
        </main>
      </div>
    </div>
  );
}
