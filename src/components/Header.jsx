import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

import { THEME } from '../utils/theme';
import { locationService } from '../services/locationService';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import Sidebar from './Sidebar';

// Subcomponents
import HeaderLocationSelector from './header/HeaderLocationSelector';
import HeaderSearchBar from './header/HeaderSearchBar';
import HeaderAccountMenu from './header/HeaderAccountMenu';

export default function Header({ selectedLocation, setSelectedLocation, isSidebarFocused, setIsSidebarFocused }) {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  
  const [provinces, setProvinces] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);

  // States cho tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    categoryService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.error("Lỗi tải danh mục trong mobile menu:", err));
  }, []);

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
    <header className="w-full text-white sticky top-0 z-50 shadow-md" style={{ backgroundColor: THEME.primary, color: THEME.textLight }}>
      {/* Top Bar */}
      <div className="container-box flex items-center justify-between py-3 h-16 px-4 md:px-6 lg:px-8 relative">
        
        {/* MOBILE & TABLET: Hamburger Menu Button */}
        <button 
          onClick={() => setIsOpenMobileMenu(true)}
          className="lg:hidden p-2 rounded hover:bg-white/10 transition cursor-pointer"
          aria-label="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

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

        {/* DESKTOP: Search Bar */}
        <div className="hidden lg:block flex-1 max-w-xl mx-4 min-w-[200px] relative" ref={searchContainerRef}>
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
        </div>

        {/* DESKTOP: Right Icons: Orders, Cart, Account */}
        <div className="hidden lg:flex items-center space-x-3 text-xs shrink-0 select-none">
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

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn p-2 rounded-full hover:bg-white/10 text-white focus:outline-none flex items-center justify-center cursor-pointer"
              title={isDark ? "Chuyển sang Chế độ sáng" : "Chuyển sang Chế độ tối"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-100 fill-indigo-100/10" />
              )}
            </button>

            {/* Account Menu Dropdown */}
            <HeaderAccountMenu
              isLoggedIn={isLoggedIn}
              user={user}
              userRole={userRole}
              handleLogout={handleLogout}
            />
        </div>

        {/* MOBILE & TABLET: Simple Action Icons */}
        <div className="flex lg:hidden items-center space-x-2">
          {/* Cart Icon */}
          <Link 
            to="/cart" 
            className="flex items-center p-2 rounded hover:bg-white/10 transition relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Theme Toggle Button (Mobile) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn p-2 rounded-full hover:bg-white/10 text-white focus:outline-none flex items-center justify-center cursor-pointer"
            title={isDark ? "Chuyển sang Chế độ sáng" : "Chuyển sang Chế độ tối"}
            aria-label="Toggle Theme Mobile"
          >
            {isDark ? (
              <Sun className="w-5.5 h-5.5 text-yellow-400 fill-yellow-400/20" />
            ) : (
              <Moon className="w-5.5 h-5.5 text-indigo-100 fill-indigo-100/10" />
            )}
          </button>

          {/* User Profile / Auth link */}
          {isLoggedIn ? (
            <Link 
              to="/profile?tab=info" 
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs hover:bg-white/30 transition-all select-none"
            >
              {(user.username || 'U')[0].toUpperCase()}
            </Link>
          ) : (
            <Link 
              to="/auth" 
              className="p-2 rounded hover:bg-white/10 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </Link>
          )}
        </div>

      </div>

      {/* MOBILE: Search Bar Row */}
      <div className="block lg:hidden px-4 pb-3">
        <div ref={searchContainerRef} className="relative w-full">
          <div className="flex items-center w-full h-10 rounded bg-white overflow-hidden shadow-inner">
            <input 
              type="text" 
              placeholder="Bạn tìm gì..." 
              className="w-full h-full text-gray-800 px-3 outline-none text-sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={handleSearchSubmit}
              className="h-full px-4 text-gray-600 bg-white hover:bg-gray-100 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </div>

          {/* Live Search Dropdown for Mobile */}
          {shouldShowDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-md shadow-2xl z-50 overflow-hidden text-gray-800 animate-in fade-in slide-in-from-top-2 duration-150">
              {filteredProducts.length > 0 ? (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Sản phẩm gợi ý ({filteredProducts.length})
                  </div>
                  <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                    {filteredProducts.slice(0, 5).map((product) => {
                      let finalDiscount = product.discount;
                      if (!finalDiscount && product.originalPrice && product.originalPrice > product.price) {
                        finalDiscount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                      }
                      
                      return (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          onClick={() => {
                            setShowDropdown(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors cursor-pointer group"
                        >
                          <div className="w-10 h-10 shrink-0 overflow-hidden flex items-center justify-center bg-white rounded border border-gray-100 p-1">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors truncate">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-red-600">
                                {product.price ? product.price.toLocaleString('vi-VN') : '0'}₫
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <>
                                  <span className="text-[10px] text-gray-400 line-through">
                                    {product.originalPrice.toLocaleString('vi-VN')}₫
                                  </span>
                                  {finalDiscount > 0 && (
                                    <span className="text-[9px] bg-red-50 text-red-600 font-bold px-1 rounded">
                                      -{finalDiscount}%
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {filteredProducts.length > 5 && (
                    <button
                      onClick={() => {
                        handleSearchSubmit();
                      }}
                      className="w-full text-center block py-2 bg-gray-50 hover:bg-gray-100 text-xs font-black text-primary border-t border-gray-100 cursor-pointer transition-all"
                    >
                      Xem tất cả {filteredProducts.length} kết quả cho "{searchQuery}"
                    </button>
                  )}
                </div>
              ) : (
                <div className="px-4 py-4 text-center text-xs text-gray-500 font-semibold">
                  Không tìm thấy sản phẩm cho "<span className="text-red-500">{searchQuery}</span>"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE & TABLET DRAWER MENU: Sliding Sidebar */}
      {isOpenMobileMenu && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-[99999] transition-opacity duration-300 lg:hidden"
            onClick={() => setIsOpenMobileMenu(false)}
          />
          {/* Drawer content */}
          <div 
            className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white text-gray-850 z-[100000] shadow-2xl flex flex-col transition-transform duration-300 ease-out transform lg:hidden animate-in slide-in-from-left duration-250"
            style={{ color: '#1f2937' }}
          >
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0" style={{ backgroundColor: THEME.primary, color: '#ffffff' }}>
              <span className="font-bold text-lg italic tracking-wider">PhoneShop</span>
              <button 
                onClick={() => setIsOpenMobileMenu(false)}
                className="p-1 rounded hover:bg-white/10 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
              
              {/* Location Select (Mobile Drawer) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Khu vực hiển thị giá</span>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between px-3 py-2.5 rounded border border-gray-200 cursor-pointer bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold select-none text-gray-700"
                >
                  <span>📍 {selectedLocation || 'Chọn Tỉnh/Thành phố'}</span>
                  <span>▾</span>
                </div>
                {isDropdownOpen && (
                  <div className="border border-gray-150 rounded-md bg-white mt-1 max-h-40 overflow-y-auto no-scrollbar shadow-inner py-1">
                    {displayLocations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setSelectedLocation(loc);
                          localStorage.setItem('selectedLocation', loc);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer block ${
                          selectedLocation === loc ? 'text-primary bg-primary/5' : 'text-gray-600'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tra cứu đơn hàng (Mobile Drawer) */}
              <div>
                <Link 
                  to="/track" 
                  onClick={() => setIsOpenMobileMenu(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-bold text-gray-700 transition"
                >
                  <span>📦 Tra cứu đơn hàng</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>

              {/* Danh mục sản phẩm (Mobile Drawer - thay thế cho Sidebar bị ẩn) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Danh mục điện thoại</span>
                <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-150">
                  {categories.map((cat, idx) => {
                    const path = `/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}`;
                    return (
                      <Link
                        key={idx}
                        to={path}
                        onClick={() => setIsOpenMobileMenu(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition"
                      >
                        <span>{cat.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Tài khoản & Thao tác khác (Mobile Drawer) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Tài khoản cá nhân</span>
                {isLoggedIn ? (
                  <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-150">
                    <div className="px-4 py-3 bg-gray-50 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        {(user.username || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800 truncate max-w-[150px]">{user.username || user.name || 'User'}</span>
                        <span className="text-[10px] text-gray-450">Đang hoạt động</span>
                      </div>
                    </div>

                    {userRole === 'Admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsOpenMobileMenu(false)}
                        className="flex items-center px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition"
                      >
                        <span>👑 Trang Quản trị</span>
                      </Link>
                    )}

                    <Link
                      to="/profile?tab=info"
                      onClick={() => setIsOpenMobileMenu(false)}
                      className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>👤 Thông tin cá nhân</span>
                    </Link>

                    <Link
                      to="/profile?tab=history"
                      onClick={() => setIsOpenMobileMenu(false)}
                      className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>📜 Lịch sử mua hàng</span>
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpenMobileMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition cursor-pointer"
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsOpenMobileMenu(false)}
                    className="flex items-center justify-center w-full py-3 rounded-lg bg-primary text-white font-bold text-sm hover:opacity-90 transition"
                  >
                    🔐 Đăng nhập tài khoản
                  </Link>
                )}
              </div>

            </div>
          </div>
        </>
      )}
    </header>
  );
}
