import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

import { THEME } from '../utils/theme';
import { locationService } from '../services/locationService';
import { productService } from '../services/productService';
import Sidebar from './Sidebar';

// Subcomponents
import HeaderLocationSelector from './header/HeaderLocationSelector';
import HeaderSearchBar from './header/HeaderSearchBar';
import HeaderAccountMenu from './header/HeaderAccountMenu';

export default function Header({ selectedLocation, setSelectedLocation, isSidebarFocused, setIsSidebarFocused }) {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [provinces, setProvinces] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // States cho tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

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

  // Lấy dữ liệu sản phẩm từ DATABASE
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        if (Array.isArray(data)) {
          const normalized = data.map(p => ({
            ...p,
            price: p.price || p.basePrice,
            image: p.image || p.thumbnailImage || p.mainImage
          }));
          setAllProducts(normalized);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách sản phẩm:", err);
      }
    };
    fetchProducts();
  }, []);

  // Đóng dropdown khi bấm ra ngoài vùng tìm kiếm
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const filteredProducts = searchQuery.trim()
    ? allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const shouldShowDropdown = showDropdown && searchQuery.trim().length > 0;

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
    <header className="w-full text-white shadow-md font-sans" style={{ backgroundColor: THEME.primary, color: THEME.textLight }}>
      {/* Top Bar */}
      <div className="container-box flex items-center justify-between py-3 h-16 px-4 relative">
        {/* Logo */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link to="/">
            <h1 className="text-2xl font-bold italic tracking-wider hover:opacity-90 transition-opacity">PhoneShop</h1>
          </Link>
        </div>

        {/* Danh mục Button */}
        <div className="shrink-0 ml-4 hidden md:block">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsSidebarFocused(prev => !prev);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded font-black text-xs transition-all duration-200 select-none cursor-pointer text-white hover:bg-white/20 border-0"
            style={{ 
              backgroundColor: isSidebarFocused ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
              boxShadow: isSidebarFocused ? '0 0 0 2px rgba(255,255,255,0.4)' : 'none'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            <span>Danh mục</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 ml-0.5 opacity-80 transition-transform duration-200 ${isSidebarFocused ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {isSidebarFocused && (
          <div className="absolute top-[calc(100%+12px)] left-4 z-[95] w-64">
            <Sidebar isFocused={isSidebarFocused} setIsFocused={setIsSidebarFocused} />
          </div>
        )}

        {/* Location Dropdown */}
        <HeaderLocationSelector
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          displayLocations={displayLocations}
        />

        {/* Search Bar */}
        <HeaderSearchBar
          searchContainerRef={searchContainerRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setShowDropdown={setShowDropdown}
          handleKeyDown={handleKeyDown}
          handleSearchSubmit={handleSearchSubmit}
          shouldShowDropdown={shouldShowDropdown}
          filteredProducts={filteredProducts}
        />

        {/* Right Icons: Orders, Cart, Account */}
        <div className="flex items-center space-x-3 text-xs shrink-0 select-none">
          <Link 
            to="/track" 
            className="flex items-center px-3 py-2 rounded transition text-center hover:bg-white/20 font-bold"
            style={{ color: THEME.textLight }}
          >
            Tra cứu<br/>đơn hàng
          </Link>

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

          {/* Account Menu Dropdown */}
          <HeaderAccountMenu
            isLoggedIn={isLoggedIn}
            user={user}
            userRole={userRole}
            handleLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}
