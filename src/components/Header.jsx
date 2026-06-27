import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

import { THEME } from '../utils/theme';
import { locationService } from '../services/locationService';

export default function Header({ selectedLocation, setSelectedLocation }) {
  const { cartCount } = useCart();
  
  const [provinces, setProvinces] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await locationService.getProvinces();
        setProvinces(data);
      } catch (err) {
        console.error("Lỗi lấy danh sách tỉnh thành:", err);
      }
    };
    fetchProvinces();
  }, []);

  const displayLocations = provinces.length > 0 
    ? provinces.map(p => p.fullName || p.name) 
    : ['Thành phố Hồ Chí Minh', 'Thành phố Hà Nội', 'Thành phố Đà Nẵng', 'Thành phố Cần Thơ', 'Tỉnh Đồng Nai'];
  
  // Lấy thông tin user từ localStorage an toàn hơn
  let user = null;
  try {
    const userJson = localStorage.getItem('user');
    if (userJson && userJson !== 'undefined' && userJson !== 'null') {
      user = JSON.parse(userJson);
      
      // Thử lấy username từ token nếu chưa có trong user object
      const token = localStorage.getItem('token');
      if (!user.username && token) {
        try {
          const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const payloadJson = decodeURIComponent(atob(payloadBase64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(payloadJson);
          user.username = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.unique_name || payload.name || payload.sub;
        } catch (e) {
          console.error("Lỗi decode token:", e);
        }
      }
    }
  } catch (err) {
    console.error("Lỗi parse user từ localStorage:", err);
    localStorage.removeItem('user'); // Xóa nếu hỏng
  }
  
  // Kiểm tra đăng nhập cực kỳ nghiêm ngặt
  const isLoggedIn = !!(user && (user.id || user.Id)); 
  const userRole = user?.role || user?.Role || '';

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    window.location.href = '/'; // Reload để xóa state
  };

  return (
    <header className="w-full text-white" style={{ backgroundColor: THEME.primary, color: THEME.textLight }}>
      {/* Top Bar */}
      <div className="container-box flex items-center justify-between py-3 h-16 px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link to="/">
            <h1 className="text-2xl font-bold italic tracking-wider">PhoneShop</h1>
          </Link>
        </div>

        {/* Cụm chức năng (Location, Search, etc) theo style mượt mà */}
        <div className="relative shrink-0 ml-4">
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-3 py-1.5 rounded cursor-pointer hover:bg-opacity-80 transition text-[11px] leading-tight text-white select-none"
            style={{ backgroundColor: THEME.secondary }}
          >
            <span className="truncate max-w-[120px]">
              Xem giá, tồn kho tại: <br/> 
              <span className="font-bold text-[13px]">{selectedLocation} ▾</span>
            </span>
          </div>

          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-white border border-gray-100 rounded-md shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
                {displayLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setSelectedLocation(loc);
                      localStorage.setItem('selectedLocation', loc);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedLocation === loc ? 'text-primary bg-primary/5' : 'text-gray-700'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-4 min-w-[200px]">
          <div className="relative flex items-center w-full h-10 rounded bg-white overflow-hidden">
            <input 
              type="text" 
              placeholder="Bạn tìm gì..." 
              className="w-full h-full text-gray-800 px-3 outline-none"
            />
            <button className="h-full px-4 text-gray-600 bg-white hover:bg-gray-100 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Icons: Orders, Cart, Account */}
        <div className="flex items-center space-x-3 text-xs shrink-0">
            <Link 
              to="/track" 
              className="flex items-center px-3 py-2 rounded transition text-center hover:bg-white/20 font-bold"
              style={{ color: THEME.textLight }}
            >
              Tra cứu<br/>đơn hàng
            </Link>

            {/* KIỂM TRA QUYỀN: Phải ĐĂNG NHẬP và là ADMIN mới thấy Thẻ Quản Trị */}
            {isLoggedIn && userRole === 'Admin' && (
              <Link 
                to="/admin" 
                className="flex items-center px-3 py-2 rounded border font-black transition text-center animate-pulse hover:animate-none"
                style={{ backgroundColor: THEME.accent, color: '#000', borderColor: THEME.accent }}
              >
                Trang<br/>Quản trị
              </Link>
            )}
 
            <Link 
              to="/cart" 
              className="flex items-center px-3 py-2 border rounded transition space-x-2 relative group"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = THEME.primary; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = THEME.textLight; }}
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:scale-110">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-semibold text-sm">Giỏ hàng</span>
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center px-3 py-1 rounded bg-white/10 gap-3">
                 <div className="flex flex-col items-end">
                    <span className="font-bold opacity-80">Chào {user.username || user.name || 'User'}</span>
                    <button onClick={handleLogout} className="text-[10px] hover:underline text-yellow-300 font-bold uppercase">Đăng xuất</button>
                 </div>
                 <Link to="/profile" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm hover:bg-white/30 cursor-pointer transition-colors" title="Quản lý thông tin tài khoản">
                    {(user.username || 'U')[0].toUpperCase()}
                 </Link>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="flex items-center px-3 py-2 rounded transition text-center hover:bg-white/20"
                style={{ color: THEME.textLight }}
              >
                Đăng nhập<br/>Tài khoản
              </Link>
            )}
        </div>
      </div>
    </header>
  );
}
