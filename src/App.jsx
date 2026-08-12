//định tuyến (Routing)
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

import Header from './components/Header';
import Footer from './components/Footer';
import ProductComparison from './components/ProductComparison';
import BottomNav from './components/common/BottomNav';
import ChatbotWidget from './components/ChatbotWidget';

// A tiny, premium loading bar at the very top of the page shown only during chunk downloads (like CellphoneS / TGDĐ)
const TopBarProgress = () => (
  <div className="fixed top-0 left-0 right-0 h-[3px] bg-indigo-600 z-[99999] animate-pulse" />
);

// Dynamic Import (Lazy Loading) for pages to reduce initial bundle size and boost SEO
const HomePage = React.lazy(() => import('./page/HomePage'));
const AuthPage = React.lazy(() => import('./page/AuthPage'));
const CartPage = React.lazy(() => import('./page/CartPage'));
const AdminPage = React.lazy(() => import('./page/admin/AdminPage'));
const DonatePage = React.lazy(() => import('./page/DonatePage'));
const TermsOfServicePage = React.lazy(() => import('./page/Termsofservice'));
const ProductDetailPage = React.lazy(() => import('./page/ProductDetailPage'));
const PolicyPage = React.lazy(() => import('./page/PolicyPage'));
const CheckoutPage = React.lazy(() => import('./page/CheckoutPage'));
const OrderTrackingPage = React.lazy(() => import('./page/OrderTrackingPage'));
const PaymentCallbackPage = React.lazy(() => import('./page/PaymentCallbackPage'));
const WarrantyPurchasePage = React.lazy(() => import('./page/WarrantyPurchasePage'));
const BlogPage = React.lazy(() => import('./page/blog/BlogPage'));
const BlogDetailPage = React.lazy(() => import('./page/blogdetail/BlogDetail'));

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('selectedLocation') || 'Toàn quốc');





  if (isAdminPath) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-semibold text-gray-500 bg-gray-50">Đang tải Admin...</div>}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
    );
  }

  const isCartOrCheckout = location.pathname === '/cart' || location.pathname === '/checkout' || location.pathname === '/payment-callback';

  return (
    <div
      className="w-full flex justify-center font-sans min-h-screen relative"
      style={{ backgroundColor: THEME.bgPage, color: THEME.textDark }}
    >
      <div className="w-full h-full flex flex-col relative">
        {/* Header full width */}
        <div className="relative z-30">
          <Header />
        </div>

        {/* Main Container */}
        {isCartOrCheckout ? (
          <main className="flex-1 min-h-[50vh]">
            <Suspense fallback={<TopBarProgress />}>
              <Routes>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment-callback" element={<PaymentCallbackPage />} />
              </Routes>
            </Suspense>
          </main>
        ) : (
          <div className="container-box flex flex-1 w-full mt-3 mb-6 flex-col md:flex-row space-y-4 md:space-y-0 px-4">
            {/* Nội dung chính linh hoạt theo Route (Kéo rộng tối đa khi ẩn sidebar) */}
            <main className="flex-1 bg-white p-6 rounded border border-bordercustom min-h-[50vh] min-w-0 w-full">
              <Suspense fallback={<TopBarProgress />}>
                <Routes>
                  <Route path="/" element={<HomePage selectedLocation={selectedLocation} />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/profile" element={<AuthPage />} />
                  <Route path="/donate" element={<DonatePage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/chinh-sach/:type" element={<PolicyPage />} />
                  <Route path="/danh-muc/:brand" element={<HomePage selectedLocation={selectedLocation} />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:id" element={<BlogDetailPage />} />
                  <Route path="/track" element={<OrderTrackingPage />} />
                  <Route path="/dich-vu-bao-hanh" element={<WarrantyPurchasePage />} />
                  <Route path="/dieu-khoan-dich-vu" element={<TermsOfServicePage />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        )}

        {/* Footer full width */}
        <Footer />
        
        {/* Floating comparison drawer and details modal */}
        <ProductComparison />

        <ChatbotWidget />

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />
      </div>
    </div>
  );
}

export default App;
