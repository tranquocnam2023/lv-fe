import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

import { MapPin } from 'lucide-react';
import { locationService } from './services/locationService';
import { THEME } from './utils/theme';

import Header from './components/Header';
import Footer from './components/Footer';
import ProductComparison from './components/ProductComparison';
import BottomNav from './components/common/BottomNav';

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
const ProductDetailPage = React.lazy(() => import('./page/ProductDetailPage'));
const PolicyPage = React.lazy(() => import('./page/PolicyPage'));
const CheckoutPage = React.lazy(() => import('./page/CheckoutPage'));
const OrderTrackingPage = React.lazy(() => import('./page/OrderTrackingPage'));
const PaymentCallbackPage = React.lazy(() => import('./page/PaymentCallbackPage'));

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('selectedLocation') || 'Toàn quốc');
  const [provinces, setProvinces] = useState([]);

  useEffect(() => {
    if (!selectedLocation && !isAdminPath) {
      const fetchProvinces = async () => {
        try {
          const data = await locationService.getProvinces();
          setProvinces(data);
        } catch (err) {
          console.error("Lỗi lấy danh sách tỉnh thành:", err);
        }
      };
      fetchProvinces();
    }
  }, [selectedLocation, isAdminPath]);

  const displayLocations = provinces.length > 0 
    ? provinces.map(p => p.fullName || p.name) 
    : ['Thành phố Hồ Chí Minh', 'Thành phố Hà Nội', 'Thành phố Đà Nẵng', 'Thành phố Cần Thơ', 'Tỉnh Đồng Nai'];

  if (false && !selectedLocation && !isAdminPath) {
    return (
      <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chào mừng bạn đến với PhoneShop!</h2>
          <p className="text-sm text-gray-500 mb-6">Vui lòng chọn tỉnh/thành phố để xem giá và tồn kho chính xác nhất tại khu vực của bạn.</p>
          
          <div className="w-full relative">
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedLocation(e.target.value);
                  localStorage.setItem('selectedLocation', e.target.value);
                }
              }}
              defaultValue=""
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-800 cursor-pointer"
            >
              <option value="" disabled>-- Chọn Tỉnh / Thành Phố --</option>
              {displayLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }





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
                  <Route path="/track" element={<OrderTrackingPage />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        )}

        {/* Footer full width */}
        <Footer />
        
        {/* Floating comparison drawer and details modal */}
        <ProductComparison />

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />
      </div>
    </div>
  );
}

export default App;
