import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

import { MapPin } from 'lucide-react';
import { locationService } from './services/locationService';
import { THEME } from './utils/theme';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import HomePage from './page/HomePage';
import AuthPage from './page/AuthPage';
import CartPage from './page/CartPage';
import AdminPage from './page/AdminPage';
import DonatePage from './page/DonatePage';
import ProductDetailPage from './page/ProductDetailPage';
import PolicyPage from './page/PolicyPage';
import CheckoutPage from './page/CheckoutPage';
import OrderTrackingPage from './page/OrderTrackingPage';
import ProductComparison from './components/ProductComparison';

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('selectedLocation') || '');
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

  if (!selectedLocation && !isAdminPath) {
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
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    );
  }

  const isCartOrCheckout = location.pathname === '/cart' || location.pathname === '/checkout';

  return (
    <div
      className="w-full flex justify-center font-sans min-h-screen"
      style={{ backgroundColor: THEME.bgPage, color: THEME.textDark }}
    >
      <div className="w-full h-full flex flex-col">
        {/* Header full width */}
        <Header selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />

        {/* Main Container */}
        {isCartOrCheckout ? (
          <main className="flex-1 min-h-[50vh]">
            <Routes>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </main>
        ) : (
          <div className="container-box flex flex-1 w-full my-6 flex-col md:flex-row space-y-4 md:space-y-0 px-4">
            {/* Sidebar danh mục (Chỉ hiện ở trang chủ / trang danh mục) */}
            {(location.pathname === '/' || location.pathname.startsWith('/danh-muc/')) && (
              <div className="hidden md:flex flex-col space-y-4 w-64 md:mr-6 shrink-0">
                <Sidebar />
              </div>
            )}

            {/* Nội dung chính linh hoạt theo Route (Kéo rộng tối đa khi ẩn sidebar) */}
            <main className="flex-1 bg-white p-6 rounded border border-bordercustom min-h-[50vh] min-w-0 w-full">
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
            </main>
          </div>
        )}

        {/* Footer full width */}
        <Footer />
        
        {/* Floating comparison drawer and details modal */}
        <ProductComparison />
      </div>
    </div>
  );
}

export default App;
