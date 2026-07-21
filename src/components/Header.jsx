import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  Smartphone,
  Tablet,
  Cpu,
  Watch,
  Headphones,
  Cable,
  Shield,
  HardDrive,
  ShoppingBag,
  ChevronDown
} from 'lucide-react';

import { THEME } from '../utils/theme';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { brandService } from '../services/brandService';

const getCategoryIcon = (name, iconUrl) => {
  if (iconUrl) {
    return (
      <img src={iconUrl} alt={name} className="w-3.5 h-3.5 object-contain shrink-0" />
    );
  }

  const normalized = name.toLowerCase();
  let IconComponent = ShoppingBag;

  if (normalized.includes('thoại') || normalized.includes('phone') || normalized.includes('mobile')) {
    IconComponent = Smartphone;
  } else if (normalized.includes('bảng') || normalized.includes('tablet') || normalized.includes('ipad')) {
    IconComponent = Tablet;
  } else if (normalized.includes('đeo') || normalized.includes('đồng hồ') || normalized.includes('watch') || normalized.includes('vòng đeo')) {
    IconComponent = Watch;
  } else if (normalized.includes('âm thanh') || normalized.includes('tai nghe') || normalized.includes('loa') || normalized.includes('headphones') || normalized.includes('mic')) {
    IconComponent = Headphones;
  } else if (normalized.includes('cáp') || normalized.includes('sạc') || normalized.includes('cable') || normalized.includes('củ')) {
    IconComponent = Cable;
  } else if (normalized.includes('ốp') || normalized.includes('cường lực') || normalized.includes('bao da') || normalized.includes('kính') || normalized.includes('shield')) {
    IconComponent = Shield;
  } else if (normalized.includes('lưu trữ') || normalized.includes('thẻ nhớ') || normalized.includes('ổ cứng') || normalized.includes('usb') || normalized.includes('sd')) {
    IconComponent = HardDrive;
  } else if (normalized.includes('phụ kiện') || normalized.includes('công nghệ') || normalized.includes('thiết bị')) {
    IconComponent = Cpu;
  }

  return <IconComponent className="w-3.5 h-3.5 shrink-0 opacity-80" />;
};

// Subcomponents
import HeaderSearchBar from './header/HeaderSearchBar';
import HeaderAccountMenu from './header/HeaderAccountMenu';

const getMegaMenuData = (cat, subcategories, allProducts, dbBrands) => {
  const normName = cat.name.toLowerCase();
  const catId = cat.id || cat.Id;
  const subIds = subcategories.map(s => s.id || s.Id);
  const targetCategoryIds = [catId, ...subIds];

  // 1. Lọc sản phẩm thực tế thuộc danh mục này và các danh mục con
  const catProducts = allProducts.filter(p => {
    const pCatId = p.categoryId || p.CategoryId;
    if (pCatId && targetCategoryIds.includes(pCatId)) return true;

    // Tìm theo tên khớp
    const pCatName = (p.categoryName || p.CategoryName || p.category || '').toLowerCase();
    return pCatName === normName || subcategories.some(sub => pCatName === sub.name.toLowerCase());
  });

  // 2. Lấy danh sách thương hiệu thực tế từ các sản phẩm thuộc danh mục
  const productBrands = Array.from(new Set(
    catProducts
      .map(p => (p.brand || p.brandName || p.BrandName || '').trim())
      .filter(Boolean)
  ));

  // Lọc dbBrands khớp với các thương hiệu thực tế trong sản phẩm
  let categoryBrands = dbBrands.filter(b =>
    productBrands.some(pb => pb.toLowerCase() === b.name.toLowerCase())
  );

  // Nếu không tìm thấy thương hiệu khớp nào từ sản phẩm (ví dụ DB chưa có sản phẩm),
  // hiển thị các thương hiệu lấy từ DB
  if (categoryBrands.length === 0) {
    categoryBrands = dbBrands.length > 0 ? dbBrands : [
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Samsung' },
      { id: 3, name: 'OPPO' },
      { id: 4, name: 'Xiaomi' },
      { id: 5, name: 'Realme' },
      { id: 6, name: 'Nokia' }
    ];
  }

  // Chuyển đổi định dạng
  const brands = categoryBrands.map(b => ({
    name: b.name,
    logoText: b.name.toUpperCase()
  }));

  // 3. Lấy danh sách sản phẩm HOT thực tế từ SQL Server
  let hotProds = catProducts.filter(p => p.isFeatured || p.IsFeatured);
  if (hotProds.length < 8) {
    const regularProds = catProducts.filter(p => !(p.isFeatured || p.IsFeatured));
    hotProds = [...hotProds, ...regularProds];
  }

  // Fallback
  if (hotProds.length === 0) {
    hotProds = allProducts.filter(p => p.isFeatured || p.IsFeatured);
  }
  if (hotProds.length === 0) {
    hotProds = allProducts;
  }

  const hotProducts = hotProds.slice(0, 8).map((p, idx) => ({
    id: p.id || p.Id,
    name: p.name,
    tag: p.isFeatured || p.IsFeatured || idx === 0 ? 'Hot' : p.originalPrice > p.price ? 'Giảm Giá' : ''
  }));

  // 4. Tạo mức giá
  let priceRanges = [];
  if (normName.includes('thoại') || normName.includes('phone') || normName.includes('mobile')) {
    priceRanges = [
      { label: 'Dưới 2 triệu', query: 'price_max=2000000' },
      { label: '2 - 4 triệu', query: 'price_min=2000000&price_max=4000000' },
      { label: '4 - 7 triệu', query: 'price_min=4000000&price_max=7000000' },
      { label: '7 - 13 triệu', query: 'price_min=7000000&price_max=13000000' },
      { label: '13 - 20 triệu', query: 'price_min=13000000&price_max=20000000' },
      { label: 'Trên 20 triệu', query: 'price_min=20000000' }
    ];
  } else if (normName.includes('bảng') || normName.includes('tablet') || normName.includes('ipad')) {
    priceRanges = [
      { label: 'Dưới 5 triệu', query: 'price_max=5000000' },
      { label: '5 - 10 triệu', query: 'price_min=5000000&price_max=10000000' },
      { label: '10 - 15 triệu', query: 'price_min=10000000&price_max=15000000' },
      { label: 'Trên 15 triệu', query: 'price_min=15000000' }
    ];
  } else {
    priceRanges = [
      { label: 'Dưới 200k', query: 'price_max=200000' },
      { label: '200k - 500k', query: 'price_min=200000&price_max=500000' },
      { label: '500k - 1 triệu', query: 'price_min=500000&price_max=1000000' },
      { label: 'Trên 1 triệu', query: 'price_min=1000000' }
    ];
  }

  return {
    brands,
    hotProducts,
    priceRanges
  };
};

export default function Header() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  const [categories, setCategories] = useState([]);
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const [hoveredCatId, setHoveredCatId] = useState(null);
  const [dbBrands, setDbBrands] = useState([]);

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

  // Lấy dữ liệu thương hiệu từ DB
  useEffect(() => {
    brandService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setDbBrands(data);
        }
      })
      .catch(err => console.error("Lỗi tải thương hiệu từ DB:", err));
  }, []);

  // Quản lý class body để che/ẩn quảng cáo khi mở mega menu
  useEffect(() => {
    if (hoveredCatId) {
      document.body.classList.add('mega-menu-active');
    } else {
      document.body.classList.remove('mega-menu-active');
    }
    return () => {
      document.body.classList.remove('mega-menu-active');
    };
  }, [hoveredCatId]);

  // Lấy dữ liệu sản phẩm từ DB
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
          const payloadJson = decodeURIComponent(atob(payloadBase64).split('').map(function (c) {
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
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo2.jpg" alt="Logo" className="h-10 object-contain rounded-md" />
          </Link>
        </div>



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
            className="flex items-center justify-center px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-all shadow-sm text-center cursor-pointer"
            style={{ color: THEME.textLight }}
          >
            <div className="flex flex-col items-center justify-center leading-tight text-xs font-bold">
              <span>Tra cứu</span>
              <span>đơn hàng</span>
            </div>
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

      {/* Row 2: Menu danh mục ngang (Thế giới di động style) */}
      <div className="border-t border-white/10 bg-white/5 py-1.5 hidden md:block select-none">
        <div className="container-box flex items-center justify-start gap-3 px-4 md:px-6 lg:px-8 text-[11px] font-bold tracking-wide relative">
          {categories.filter(cat => cat.parentId === null || cat.level === 1).map((cat) => {
            const subcategories = categories.filter(c => c.parentId === cat.id);
            const hasSub = subcategories.length > 0;
            const isHovered = hoveredCatId === cat.id;

            return (
              <div
                key={cat.id}
                className=""
                onMouseEnter={() => setHoveredCatId(cat.id)}
                onMouseLeave={() => setHoveredCatId(null)}
              >
                <Link
                  to={`/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all duration-200 text-white hover:bg-white/15 ${isHovered ? 'bg-white/20' : ''}`}
                >
                  {getCategoryIcon(cat.name, cat.iconUrl)}
                  <span>{cat.name}</span>
                  {hasSub && (
                    <ChevronDown className="w-3 h-3 opacity-80" />
                  )}
                </Link>

                {/* Mega menu giống CellphoneS đè lên nội dung */}
                {isHovered && hasSub && (() => {
                  const megaData = getMegaMenuData(cat, subcategories, allProducts, dbBrands);
                  return (
                    <div
                      className="absolute top-full left-0 right-0 w-full z-[100] pt-2"
                      onMouseEnter={() => setHoveredCatId(cat.id)}
                      onMouseLeave={() => setHoveredCatId(null)}
                    >
                      <div className={`${isDark ? 'bg-slate-900 text-slate-100 border-slate-850' : 'bg-white text-gray-800 border-gray-200/80'} rounded-2xl shadow-2xl p-6 border grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-150 w-full`}>

                        {/* Cột 1: Hãng sản xuất */}
                        <div className="space-y-3">
                          <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                            Thương hiệu
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {megaData.brands.map((brand, bIdx) => (
                              <Link
                                key={bIdx}
                                to={`/danh-muc/${encodeURIComponent(brand.name.toLowerCase())}`}
                                className={`flex items-center justify-center p-2.5 rounded-lg border text-center font-bold text-[11px] transition-all hover:-translate-y-0.5 hover:shadow-sm ${isDark
                                  ? 'bg-slate-850 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-200'
                                  : 'bg-gray-50 border-gray-150 hover:border-gray-250 hover:bg-gray-100/50 text-gray-700'
                                  }`}
                              >
                                {brand.logoText}
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Cột 2: Phân khúc sản phẩm */}
                        <div className="space-y-3">
                          <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                            Phân khúc sản phẩm
                          </h4>
                          <div className="flex flex-col gap-1.5">
                            {subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/danh-muc/${encodeURIComponent(sub.name.toLowerCase())}`}
                                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold border border-transparent transition-all ${isDark
                                  ? 'hover:bg-slate-800 hover:text-white text-slate-300'
                                  : 'hover:bg-primary/5 hover:text-primary text-gray-700'
                                  }`}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Cột 3: Sản phẩm HOT */}
                        <div className="space-y-3">
                          <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                            Sản phẩm HOT
                          </h4>
                          <div className="flex flex-col gap-1.5">
                            {megaData.hotProducts.map((prod, pIdx) => (
                              <Link
                                key={pIdx}
                                to={prod.id ? `/product/${prod.id}` : `/?search=${encodeURIComponent(prod.name)}`}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold border border-transparent transition-all ${isDark ? 'hover:bg-slate-800 hover:text-white text-slate-300' : 'hover:bg-primary/5 hover:text-primary text-gray-700'
                                  }`}
                              >
                                <span className="truncate text-[11px]">{prod.name}</span>
                                {prod.tag && (
                                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${prod.tag === 'Hot'
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : prod.tag === 'Mới'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-orange-500 text-white'
                                    }`}>
                                    {prod.tag}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
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
              <div className="flex items-center gap-2">
                <img src="/logo2.jpg" alt="Logo" className="h-8 object-contain rounded-md" />
              </div>
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
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsOpenMobileMenu(false)}
                    className="flex items-center justify-center w-full py-3 rounded-lg bg-primary text-white font-bold text-sm hover:opacity-90 transition"
                  >
                    Đăng nhập tài khoản
                  </Link>
                )}
              </div>

            </div>
          </div>
        </>
      )}

      {/* Background backdrop overlay to hide/dim static ads and main page */}
      {hoveredCatId && (
        <div
          className="fixed top-full left-0 right-0 bottom-0 bg-black/40 backdrop-blur-[1.5px] z-[45] pointer-events-none animate-in fade-in duration-200"
        />
      )}
    </header>
  );
}
