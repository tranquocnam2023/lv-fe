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
      <img
        src={iconUrl}
        alt={name}
        className="w-6 h-6 object-contain shrink-0 rounded border border-gray-200/90 dark:border-slate-700/80 bg-white p-0.5 shadow-2xs transition-all"
      />
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
  } else if (normalized.includes('ốp') || normalized.includes('cường lực') || normalized.includes('bao da') || normalized.includes('kính') || normalized.includes('shield') || normalized.includes('dán')) {
    IconComponent = Shield;
  } else if (normalized.includes('lưu trữ') || normalized.includes('thẻ nhớ') || normalized.includes('ổ cứng') || normalized.includes('usb') || normalized.includes('sd')) {
    IconComponent = HardDrive;
  } else if (normalized.includes('phụ kiện') || normalized.includes('công nghệ') || normalized.includes('thiết bị')) {
    IconComponent = Cpu;
  }

  return (
    <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
      <IconComponent className="w-4 h-4 shrink-0" />
    </div>
  );
};

// Subcomponents
import HeaderSearchBar from './header/HeaderSearchBar';
import HeaderAccountMenu from './header/HeaderAccountMenu';

// Fallback logo các thương hiệu lớn nếu DB chưa cập nhật imageUrl
const BRAND_FALLBACK_LOGOS = {
  apple: 'https://cdn.simpleicons.org/apple',
  iphone: 'https://cdn.simpleicons.org/apple',
  samsung: 'https://cdn.simpleicons.org/samsung/142890',
  xiaomi: 'https://cdn.simpleicons.org/xiaomi/FF6900',
  oppo: 'https://cdn.simpleicons.org/oppo/008000',
  sony: 'https://cdn.simpleicons.org/sony',
  jbl: 'https://cdn.simpleicons.org/jbl/FF6600',
  anker: 'https://cdn.simpleicons.org/anker/00A4E4',
  baseus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Baseus_logo.svg/320px-Baseus_logo.svg.png',
  garmin: 'https://cdn.simpleicons.org/garmin/007CC3',
  vivo: 'https://cdn.simpleicons.org/vivo/415FFF',
  realme: 'https://cdn.simpleicons.org/realme/FFC900',
  nokia: 'https://cdn.simpleicons.org/nokia/124191',
  asus: 'https://cdn.simpleicons.org/asus/00539B'
};

// Hàm đệ quy lấy tất cả ID danh mục con và cháu
const getAllCategoryIdsRecursive = (parentId, allCategories) => {
  let result = [parentId];
  const children = allCategories.filter(c => String(c.parentId || c.ParentId) === String(parentId));
  children.forEach(child => {
    const childId = child.id || child.Id;
    result = result.concat(getAllCategoryIdsRecursive(childId, allCategories));
  });
  return result;
};

const getMegaMenuData = (cat, subcategories, allProducts, dbBrands, allCategories = []) => {
  const normName = cat.name.toLowerCase();
  const catId = cat.id || cat.Id;

  // Lấy tất cả ID danh mục con & cháu đệ quy (Cấp 2, Cấp 3, Cấp 4)
  const targetCategoryIds = allCategories.length > 0
    ? getAllCategoryIdsRecursive(catId, allCategories)
    : [catId, ...subcategories.map(s => s.id || s.Id)];

  // 1. Lọc sản phẩm thực tế thuộc danh mục này và tất cả các danh mục con/cháu
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

  // Nếu không tìm thấy thương hiệu khớp nào từ sản phẩm (ví dụ DB chưa gán brand cho sản phẩm),
  // hiển thị các thương hiệu mặc định lấy từ DB
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

  // Chuyển đổi định dạng kèm logoUrl
  const brands = categoryBrands.map(b => {
    const nameLower = (b.name || '').toLowerCase().trim();
    const dbImage = b.imageUrl || b.ImageUrl || b.logoUrl || b.logo || b.image;
    const logoUrl = dbImage || BRAND_FALLBACK_LOGOS[nameLower] || null;
    return {
      name: b.name,
      logoText: b.name.toUpperCase(),
      logoUrl: logoUrl
    };
  });

  // 3. Lấy danh sách sản phẩm HOT thực tế thuộc danh mục này
  let hotProds = catProducts.filter(p => p.isFeatured || p.IsFeatured);
  if (hotProds.length < 4) {
    const regularProds = catProducts.filter(p => !(p.isFeatured || p.IsFeatured));
    hotProds = [...hotProds, ...regularProds];
  }

  // Nếu vẫn không có sản phẩm nào thuộc danh mục này, thử lọc từ allProducts theo từ khóa đặc thù của danh mục
  // (Đảm bảo tuyệt đối KHÔNG hiển thị Điện thoại như Samsung S25 Ultra trong danh mục Phụ kiện hay Âm thanh)
  if (hotProds.length === 0) {
    if (normName.includes('phụ kiện')) {
      hotProds = allProducts.filter(p => {
        const pCatName = (p.categoryName || p.CategoryName || p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return (
          pCatName.includes('phụ kiện') || pCatName.includes('sạc') || pCatName.includes('ốp') ||
          pName.includes('sạc') || pName.includes('cáp') || pName.includes('ốp') || pName.includes('pin') || pName.includes('dán') || pName.includes('thẻ nhớ') || pName.includes('usb') || pName.includes('tai nghe')
        );
      });
    } else if (normName.includes('âm thanh')) {
      hotProds = allProducts.filter(p => {
        const pCatName = (p.categoryName || p.CategoryName || p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return (
          pCatName.includes('âm thanh') || pCatName.includes('tai nghe') || pCatName.includes('loa') ||
          pName.includes('tai nghe') || pName.includes('loa') || pName.includes('airpods') || pName.includes('headphone')
        );
      });
    } else if (normName.includes('thoại') || normName.includes('phone') || normName.includes('mobile')) {
      hotProds = allProducts.filter(p => p.isFeatured || p.IsFeatured);
    }
  }

  const hotProducts = hotProds.slice(0, 4).map((p, idx) => ({
    id: p.id || p.Id,
    name: p.name,
    price: p.price || p.basePrice || 0,
    originalPrice: p.originalPrice || 0,
    image: p.image || p.thumbnailImage || p.mainImage,
    tag: p.isFeatured || p.IsFeatured || idx === 0 ? 'Hot' : (p.originalPrice && p.originalPrice > p.price) ? 'Giảm Giá' : ''
  }));

  // 4. Tạo các mức giá lọc nhanh
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
                  onClick={() => {
                    const targetPath = `/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}`;
                    // LOGIC XỬ LÝ: So sánh đường dẫn (pathname) của trang hiện tại với link danh mục vừa bấm
                    // Nếu trùng khớp (tức là người dùng đang đứng ở danh mục này và muốn reset/tải lại danh sách gốc)
                    if (window.location.pathname === targetPath) {
                      // Tiến hành ép tải lại trang (Full Reload) -> Xóa sạch toàn bộ các filter nâng cao trong state
                      window.location.reload();
                    }
                  }}
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
                  const megaData = getMegaMenuData(cat, subcategories, allProducts, dbBrands, categories);
                  return (
                    <div
                      className="absolute top-full left-0 right-0 w-full z-[100] pt-2"
                      onMouseEnter={() => setHoveredCatId(cat.id)}
                      onMouseLeave={() => setHoveredCatId(null)}
                    >
                      <div className={`${isDark ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-gray-800 border-gray-200'} rounded-2xl p-6 border grid grid-cols-3 gap-6 shadow-none animate-in fade-in slide-in-from-top-2 duration-150 w-full`}>

                        {/* Cột 1: Hãng sản xuất (Hiển thị ảnh Logo thực tế từ Database trên Card nền trắng mượt cả Sáng & Tối) */}
                        <div className="space-y-3">
                          <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                            Thương hiệu
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {megaData.brands.map((brand, bIdx) => (
                              <Link
                                key={bIdx}
                                to={`/danh-muc/${encodeURIComponent(brand.name.toLowerCase())}`}
                                className={`flex items-center justify-center p-2 h-11 rounded-xl bg-white border transition-colors ${
                                  isDark ? 'border-slate-700/80 hover:border-blue-400' : 'border-gray-200/90 hover:border-blue-500'
                                }`}
                              >
                                {brand.logoUrl ? (
                                  <img
                                    src={brand.logoUrl}
                                    alt={brand.name}
                                    className="max-h-7 max-w-[85%] object-contain transition-all"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const textSpan = e.currentTarget.parentElement.querySelector('.brand-text');
                                      if (textSpan) {
                                        textSpan.style.setProperty('display', 'block', 'important');
                                      }
                                    }}
                                  />
                                ) : null}
                                <span className={`brand-text font-black text-[12px] uppercase tracking-wider text-gray-800 text-center ${brand.logoUrl ? 'hidden' : 'block'}`}>
                                  {brand.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Cột 2: Phân khúc sản phẩm (Chuẩn giao diện CellphoneS: Card Pill rounded-xl, viền mảnh nhẹ & Thumbnail 28px) */}
                        <div className="space-y-3">
                          <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                            Phân khúc sản phẩm
                          </h4>
                          <div className="flex flex-col gap-4 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
                            {(() => {
                              const level2Cats = categories.filter(c => String(c.parentId) === String(cat.id));
                              const hasLevel3 = level2Cats.some(l2 => categories.some(c => String(c.parentId) === String(l2.id)));

                              if (hasLevel3) {
                                // Gom nhóm theo từng danh mục cha cấp 2 (Ví dụ: Phụ kiện di động, Thiết bị lưu trữ...)
                                return level2Cats.map((l2) => {
                                  const l3Children = categories.filter(c => String(c.parentId) === String(l2.id));
                                  return (
                                    <div key={l2.id} className="space-y-2">
                                      {/* Tiêu đề nhóm danh mục cha cấp 2 (Chuẩn CellphoneS: Chữ Bold đậm, sạch sẽ) */}
                                      <Link
                                        to={`/danh-muc/${encodeURIComponent(l2.name.toLowerCase())}`}
                                        className={`block font-extrabold text-[13px] transition-colors pt-1 pb-0.5 ${
                                          isDark ? 'text-slate-100 hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                                        }`}
                                      >
                                        <span>{l2.name}</span>
                                      </Link>

                                      {/* Danh sách danh mục con cấp 3 (Card Pill bo góc rounded-xl viền mảnh CellphoneS style) */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {(l3Children.length > 0 ? l3Children : [l2]).map((sub) => (
                                          <Link
                                            key={sub.id}
                                            to={`/danh-muc/${encodeURIComponent(sub.name.toLowerCase())}`}
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors ${
                                              isDark
                                                ? 'bg-slate-800/80 border-slate-700/80 hover:border-blue-400/80 hover:bg-slate-800 text-slate-100'
                                                : 'bg-white border-gray-200/90 hover:border-blue-500 hover:text-blue-600 text-gray-800'
                                            }`}
                                          >
                                            {/* Thumbnail 28px chuẩn CellphoneS */}
                                            {sub.iconUrl ? (
                                              <img
                                                src={sub.iconUrl}
                                                alt={sub.name}
                                                className="w-7 h-7 object-contain shrink-0 rounded"
                                              />
                                            ) : (
                                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                {getCategoryIcon(sub.name, null)}
                                              </div>
                                            )}
                                            <span className="truncate text-[12px] font-semibold">{sub.name}</span>
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                });
                              }

                              // Trường hợp danh mục phẳng (chỉ có cấp 2)
                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {level2Cats.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      to={`/danh-muc/${encodeURIComponent(sub.name.toLowerCase())}`}
                                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors ${
                                        isDark
                                          ? 'bg-slate-800/80 border-slate-700/80 hover:border-blue-400/80 hover:bg-slate-800 text-slate-100'
                                          : 'bg-white border-gray-200/90 hover:border-blue-500 hover:text-blue-600 text-gray-800'
                                      }`}
                                    >
                                      {sub.iconUrl ? (
                                        <img
                                          src={sub.iconUrl}
                                          alt={sub.name}
                                          className="w-7 h-7 object-contain shrink-0 rounded"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                                          {getCategoryIcon(sub.name, null)}
                                        </div>
                                      )}
                                      <span className="truncate text-[12px] font-semibold">{sub.name}</span>
                                    </Link>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Cột 3: Mức Giá Phổ Biến & Top Sản Phẩm HOT (Bỏ border thô, thiết kế minimalist mượt mà) */}
                        <div className="space-y-4 flex flex-col justify-between">
                          {/* Khối Mức Giá Phổ Biến */}
                          {megaData.priceRanges && megaData.priceRanges.length > 0 && (
                            <div className="space-y-2">
                              <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                                Mức giá phổ biến
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {megaData.priceRanges.map((range, rIdx) => (
                                  <Link
                                    key={rIdx}
                                    to={`/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}?${range.query}`}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                                      isDark
                                        ? 'bg-slate-800/80 text-slate-300 hover:bg-blue-600 hover:text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                                    }`}
                                  >
                                    {range.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Khối Top Sản Phẩm HOT (Loại bỏ border ô hình chữ nhật, dạng list thanh lịch) */}
                          <div className="space-y-2">
                            <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                              Sản phẩm HOT nhất
                            </h4>
                            <div className="flex flex-col gap-1">
                              {megaData.hotProducts.map((prod, pIdx) => (
                                <Link
                                  key={pIdx}
                                  to={prod.id ? `/product/${prod.id}` : `/?search=${encodeURIComponent(prod.name)}`}
                                  className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                                    isDark
                                      ? 'hover:bg-slate-800/80 text-slate-200'
                                      : 'hover:bg-blue-50/60 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    {prod.image ? (
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-8 h-8 object-contain shrink-0 rounded-md bg-white p-0.5 border border-gray-150 dark:border-slate-700"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <ShoppingBag size={14} className="text-blue-500" />
                                      </div>
                                    )}
                                    <div className="flex flex-col truncate">
                                      <span className="truncate text-[11px] font-semibold">{prod.name}</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-red-500">
                                          {prod.price > 0 ? `${prod.price.toLocaleString('vi-VN')}₫` : 'Liên hệ'}
                                        </span>
                                        {prod.originalPrice > prod.price && (
                                          <span className="text-[9px] text-gray-400 line-through">
                                            {prod.originalPrice.toLocaleString('vi-VN')}₫
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {prod.tag && (
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                      prod.tag === 'Hot'
                                        ? 'bg-red-500 text-white'
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
                    </div>
                  );
                })()}
              </div>
            );
          })}
          
          {/* Mua lẻ gói bảo hành (Máy cũ cần thẩm định) */}
          <Link
            to="/dich-vu-bao-hanh"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all duration-200 text-white hover:bg-white/15 shrink-0"
          >
            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4 shrink-0" />
            </div>
            <span>Dịch vụ bảo hành</span>
          </Link>
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
                        onClick={() => {
                          setIsOpenMobileMenu(false); // Đóng Drawer Sidebar trên mobile
                          
                          // LOGIC XỬ LÝ: Kiểm tra nếu bấm vào đúng đường dẫn danh mục đang hiển thị trên màn hình
                          if (window.location.pathname === path) {
                            // Thực hiện tải lại trang để xóa bỏ toàn bộ bộ lọc cũ và trả về danh sách gốc
                            window.location.reload();
                          }
                        }}
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
