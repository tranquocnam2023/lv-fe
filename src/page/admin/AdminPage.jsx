// ĐIỀU PHỐI CÁC TRANG CON ADMIN
import React from 'react';
import { useSearchParams } from 'react-router-dom';

import AdminLayout from './AdminLayout';

// ─── Lazy-loaded sub-pages ────────────────────────────────────────────────────
const AdminProducts      = React.lazy(() => import('./products/AdminProducts'));
// Component React: AdminInventory - Quản lý giao diện và logic xử lý của AdminInventory
const AdminInventory     = React.lazy(() => import('./inventory/AdminInventory'));
// Component React: AdminOrders - Quản lý giao diện và logic xử lý của AdminOrders
const AdminOrders        = React.lazy(() => import('./orders/AdminOrders'));
// Component React: AdminDashboard - Quản lý giao diện và logic xử lý của AdminDashboard
const AdminDashboard     = React.lazy(() => import('./dashboard/AdminDashboard'));
// Component React: AdminCustomers - Quản lý giao diện và logic xử lý của AdminCustomers
const AdminCustomers     = React.lazy(() => import('./customers/AdminCustomers'));
// Component React: AdminCategories - Quản lý giao diện và logic xử lý của AdminCategories
const AdminCategories    = React.lazy(() => import('./categories/AdminCategories'));
// Component React: AdminBrands - Quản lý giao diện và logic xử lý của AdminBrands
const AdminBrands        = React.lazy(() => import('./brands/AdminBrands'));
// Component React: AdminPromotions - Quản lý giao diện và logic xử lý của AdminPromotions
const AdminPromotions    = React.lazy(() => import('./promotions/AdminPromotions'));
// Component React: AdminCombos - Quản lý giao diện và logic xử lý của AdminCombos
const AdminCombos        = React.lazy(() => import('./combos/AdminCombos'));
// Component React: AdminComboForm - Quản lý giao diện và logic xử lý của AdminComboForm
const AdminComboForm     = React.lazy(() => import('./combos/AdminComboForm'));
// Component React: AdminReviews - Quản lý giao diện và logic xử lý của AdminReviews
const AdminReviews       = React.lazy(() => import('./reviews/AdminReviews'));
// Component React: AdminCreateProduct - Quản lý giao diện và logic xử lý của AdminCreateProduct
const AdminCreateProduct = React.lazy(() => import('./products/AdminCreateProduct'));
// Component React: AdminUpdateProduct - Quản lý giao diện và logic xử lý của AdminUpdateProduct
const AdminUpdateProduct = React.lazy(() => import('./products/AdminUpdateProduct'));
// Component React: AdminAuditLogs - Quản lý giao diện và logic xử lý của AdminAuditLogs
const AdminAuditLogs     = React.lazy(() => import('./audit-logs/AdminAuditLogs'));
// Component React: BannerManager - Quản lý giao diện và logic xử lý của BannerManager
const BannerManager      = React.lazy(() => import('./settings/BannerManager'));
// Component React: AdminPayments - Quản lý giao diện và logic xử lý của AdminPayments
const AdminPayments      = React.lazy(() => import('./payments/AdminPayments'));
// Component React: AdminInspectionPanel - Quản lý giao diện và logic xử lý của AdminInspectionPanel
const AdminInspectionPanel = React.lazy(() => import('./warranties/AdminInspectionPanel'));

// Component React: AdminBlog - Quản lý giao diện và logic xử lý của AdminBlog
const AdminBlog          = React.lazy(() => import('./news/AdminBlog'));
// Component React: AdminBlogForm - Quản lý giao diện và logic xử lý của AdminBlogForm
const AdminBlogForm      = React.lazy(() => import('./news/AdminBlogForm'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
const TabSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── AdminPage ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  // State: searchParams - Quản lý trạng thái và dữ liệu của searchParams trong giao diện
  const [searchParams, setSearchParams] = useSearchParams();


  // Khai báo biến/hằng số: activeAdminTab - Dùng trong logic xử lý của component
  const activeAdminTab = searchParams.get('tab') || 'dashboard';
  // Khai báo biến/hằng số: editProductId - Dùng trong logic xử lý của component
  const editProductId  = searchParams.get('productId');
  // Khai báo biến/hằng số: editComboId - Dùng trong logic xử lý của component
  const editComboId    = searchParams.get('comboId');
  // Khai báo biến/hằng số: editBlogId - Dùng trong logic xử lý của component
  const editBlogId     = searchParams.get('blogId');

  // State: selectedBrandId - Quản lý trạng thái và dữ liệu của selectedBrandId trong giao diện
  const [selectedBrandId, setSelectedBrandId] = React.useState(null);

  // ── Tab navigation helper ─────────────────────────────────────────────────
  const handleTabChange = (tab, brandId = null) => {
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
      if (tab !== 'update_combo') {
        prev.delete('comboId');
      }
      if (tab !== 'update_blog') {
        prev.delete('blogId');
      }
      return prev;
    });
  };

  // ── Tab content ───────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeAdminTab) {
      case 'products':
        return (
          <AdminProducts
            onCreate={() => handleTabChange('create_product')}
            onEdit={(id) => setSearchParams(prev => {
              prev.set('tab', 'update_product');
              prev.set('productId', id);
              return prev;
            })}
            defaultBrandFilter={selectedBrandId}
            clearBrandFilter={() => setSelectedBrandId(null)}
          />
        );

      case 'create_product':
        return (
          <AdminCreateProduct onBack={() => handleTabChange('products')} />
        );

      case 'update_product':
        return (
          <AdminUpdateProduct
            productId={editProductId}
            onBack={() => handleTabChange('products')}
            onCreateNew={() => handleTabChange('create_product')}
          />
        );

      case 'categories':
        return <AdminCategories />;

      case 'brands':
        return (
          <AdminBrands
            onRedirectToProducts={(brandId) => {
              setSelectedBrandId(brandId);
              handleTabChange('products');
            }}
            onRedirectToCreateProduct={(brandId) => handleTabChange('create_product', brandId)}
          />
        );
      //không truyền biến vì trong component có xử lý dữ liệu
      case 'inventory':   return <AdminInventory />;
      case 'orders':      return <AdminOrders />;
      case 'payments':    return <AdminPayments />;
      case 'customers':   return <AdminCustomers />;
      case 'promotions':  return <AdminPromotions />;
      case 'combos':
        return (
          <AdminCombos
            onCreate={() => handleTabChange('create_combo')}
            onEdit={(id) => setSearchParams(prev => {
              prev.set('tab', 'update_combo');
              prev.set('comboId', id);
              return prev;
            })}
          />
        );

      case 'create_combo':
        return (
          <AdminComboForm onBack={() => handleTabChange('combos')} />
        );

      case 'update_combo':
        return (
          <AdminComboForm
            comboId={editComboId}
            onBack={() => handleTabChange('combos')}
          />
        );

      case 'blog':
        return (
          <AdminBlog
            onCreate={() => handleTabChange('create_blog')}
            onEdit={(id) => setSearchParams(prev => {
              prev.set('tab', 'update_blog');
              prev.set('blogId', id);
              return prev;
            })}
          />
        );

      case 'create_blog':
        return (
          <AdminBlogForm onBack={() => handleTabChange('blog')} />
        );

      case 'update_blog':
        return (
          <AdminBlogForm
            blogId={editBlogId}
            onBack={() => handleTabChange('blog')}
          />
        );

      case 'reviews':     return <AdminReviews />;
      case 'dashboard':   return <AdminDashboard onTabChange={handleTabChange} />;
      case 'audit_logs':  return <AdminAuditLogs />;
      case 'inspections': return <AdminInspectionPanel />;

      case 'settings':
        return (
          <BannerManager />
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout
      activeAdminTab={activeAdminTab}
      onTabChange={handleTabChange}
      setSearchParams={setSearchParams}
    >
      <React.Suspense fallback={<TabSpinner />}>
        {renderTabContent()}
      </React.Suspense>
    </AdminLayout>
  );
}
