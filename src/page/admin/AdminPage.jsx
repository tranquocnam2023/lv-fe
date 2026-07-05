import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings } from 'lucide-react';

import AdminLayout from './AdminLayout';

// ─── Lazy-loaded sub-pages ────────────────────────────────────────────────────
const AdminProducts      = React.lazy(() => import('./products/AdminProducts'));
const AdminInventory     = React.lazy(() => import('./inventory/AdminInventory'));
const AdminOrders        = React.lazy(() => import('./orders/AdminOrders'));
const AdminDashboard     = React.lazy(() => import('./dashboard/AdminDashboard'));
const AdminCustomers     = React.lazy(() => import('./customers/AdminCustomers'));
const AdminCategories    = React.lazy(() => import('./categories/AdminCategories'));
const AdminBrands        = React.lazy(() => import('./brands/AdminBrands'));
const AdminPromotions    = React.lazy(() => import('./promotions/AdminPromotions'));
const AdminReviews       = React.lazy(() => import('./reviews/AdminReviews'));
const AdminCreateProduct = React.lazy(() => import('./products/AdminCreateProduct'));
const AdminUpdateProduct = React.lazy(() => import('./products/AdminUpdateProduct'));
const AdminAuditLogs     = React.lazy(() => import('./audit-logs/AdminAuditLogs'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
const TabSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── AdminPage ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();


  const activeAdminTab = searchParams.get('tab') || 'dashboard';
  const editProductId  = searchParams.get('productId');

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

      case 'inventory':   return <AdminInventory />;
      case 'orders':      return <AdminOrders />;
      case 'customers':   return <AdminCustomers />;
      case 'promotions':  return <AdminPromotions />;
      case 'reviews':     return <AdminReviews />;
      case 'dashboard':   return <AdminDashboard />;
      case 'audit_logs':  return <AdminAuditLogs />;

      case 'settings':
        return (
          <div className="bg-white p-6 rounded-lg border border-admin-border shadow-sm animate-in fade-in duration-350">
            <h2 className="text-2xl font-bold text-admin-text-main mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              Cài đặt hệ thống
            </h2>

            <div className="space-y-6">
              <div className="p-5 border border-admin-border rounded-xl bg-gray-50/50 text-center py-12">
                <p className="text-sm font-medium text-admin-text-muted mb-2">
                  Các cài đặt hệ thống khác đang được phát triển.
                </p>
                <p className="text-xs text-admin-text-muted/60">
                  Giao diện sáng/tối hiện đã được chuyển lên thanh công cụ (Header) để thao tác nhanh hơn.
                </p>
              </div>
            </div>
          </div>
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
