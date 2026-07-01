import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

import { THEME } from '../utils/theme';
import { locationService } from '../services/locationService';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

export default function Header({ selectedLocation, setSelectedLocation }) {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  
  const [provinces, setProvinces] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);

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

  // Lấy dữ liệu danh mục từ DATABASE
  useEffect(() => {
    categoryService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.error("Lỗi lấy danh sách danh mục Header:", err));
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
    <header className="w-full text-white" style={{ backgroundColor: THEME.primary, color: THEME.textLight }}>
      {/* Top Bar */}
      <div className="container-box flex items-center justify-between py-3 h-16 px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link to="/">
            <h1 className="text-2xl font-bold italic tracking-wider">PhoneShop</h1>
          </Link>
        </div>

        {/* Danh mục Dropdown Button (Hover style như CellphoneS) */}
        <div 
          className="relative shrink-0 ml-4 hidden md:block"
          onMouseEnter={() => setIsCategoryHovered(true)}
          onMouseLeave={() => setIsCategoryHovered(false)}
        >
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded font-black text-xs transition duration-150 select-none cursor-pointer text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            <span>Danh mục</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 ml-0.5 opacity-80">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {isCategoryHovered && categories.length > 0 && (
            <>
              <div className="absolute top-full left-0 w-full h-2 bg-transparent" />
              <div className="absolute left-0 mt-2 w-60 bg-white border border-gray-100 rounded-md shadow-2xl py-1 z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
                {categories.map((cat, idx) => {
                  const path = `/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}`;
                  return (
                    <Link
                      key={idx}
                      to={path}
                      onClick={() => setIsCategoryHovered(false)}
                      className="flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <span>{cat.name}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
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
        <div ref={searchContainerRef} className="flex-1 max-w-xl mx-4 min-w-[200px] relative">
          <div className="flex items-center w-full h-10 rounded bg-white overflow-hidden">
            <input 
              type="text" 
              placeholder="Bạn tìm gì..." 
              className="w-full h-full text-gray-800 px-3 outline-none"
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

          {/* Live Search Dropdown */}
          {shouldShowDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-md shadow-2xl z-50 overflow-hidden text-gray-800 animate-in fade-in slide-in-from-top-2 duration-150">
              {filteredProducts.length > 0 ? (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Sản phẩm gợi ý ({filteredProducts.length})
                  </div>
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar">
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
                          <div className="w-12 h-12 shrink-0 overflow-hidden flex items-center justify-center bg-white rounded border border-gray-100 p-1">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors truncate">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
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
                      className="w-full text-center block py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-black text-primary border-t border-gray-100 cursor-pointer transition-all"
                    >
                      Xem tất cả {filteredProducts.length} kết quả cho "{searchQuery}"
                    </button>
                  )}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-gray-500 font-semibold">
                  Không tìm thấy sản phẩm cho "<span className="text-red-500">{searchQuery}</span>"
                </div>
              )}
            </div>
          )}
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
              <div className="relative group py-2">
                <div className="flex items-center px-3 py-1 rounded bg-white/10 gap-3 cursor-pointer hover:bg-white/20 transition-all">
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[10px] opacity-75">Tài khoản</span>
                    <span className="font-bold text-xs truncate max-w-[100px]">{user.username || user.name || 'User'}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm select-none">
                    {(user.username || 'U')[0].toUpperCase()}
                  </div>
                </div>

                <div className="absolute right-0 top-full pt-1 z-[9999] hidden group-hover:block">
                  <div className="w-52 bg-white rounded-md shadow-xl py-1.5 border border-gray-100 text-gray-800">
                    {userRole === 'Admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-b border-gray-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                        </svg>
                        <span>Trang Quản trị</span>
                      </Link>
                    )}

                    <Link
                      to="/profile?tab=info"
                      className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      <span>Thông tin tài khoản</span>
                    </Link>

                    <Link
                      to="/profile?tab=addresses"
                      className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <span>Sổ địa chỉ nhận hàng</span>
                    </Link>

                    <Link
                      to="/profile?tab=history"
                      className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.732 2.076 1.719M9 12h.008v.008H9V12Zm0 3h.008v.008H9V15Zm0 3h.008v.008H9V18Z" />
                      </svg>
                      <span>Lịch sử mua hàng</span>
                    </Link>

                    <Link
                      to="/profile?tab=password"
                      className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                      </svg>
                      <span>Đổi mật khẩu</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                      </svg>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
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
