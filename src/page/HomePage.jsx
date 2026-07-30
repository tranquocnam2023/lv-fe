// src/page/HomePage.jsx
/**
 * ============================================================================
 * PAGE: HomePage (Trang Chủ Hệ Thống PhoneShop)
 * ============================================================================
 * Chức năng & Nâng cấp tối ưu:
 *  1. Tải Dữ Liệu Async & Skeleton UI: Tải danh sách sản phẩm/danh mục bất đồng bộ kèm Skeleton Loaders.
 *  2. Tải Sản Phẩm Theo Đợt (Batch Loading): Giới hạn số lượng sản phẩm render ban đầu (12 items)
 *     và mở rộng bằng nút "Xem thêm sản phẩm", giúp giảm tải số lượng DOM Nodes trên trình duyệt.
 *  3. Bộ Lọc Linh Hoạt: Hỗ trợ lọc theo Từ khóa tìm kiếm, Thương hiệu, Danh mục đệ quy, Khoảng giá & Specs.
 *  4. Phân Khu Sản Phẩm: Tách riêng Sản phẩm nổi bật (Featured), Sản phẩm đúng khu vực và Sản phẩm khu vực khác.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import BannerSkeleton from '../components/common/skeletons/BannerSkeleton';
import ProductCardSkeleton from '../components/common/skeletons/ProductCardSkeleton';
import CategorySkeleton from '../components/common/skeletons/CategorySkeleton';
import ProductCard from '../components/product/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import FilterBar from '../components/FilterBar';
import BannerSection from '../components/BannerSection';
import { Sliders } from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { THEME } from '../utils/theme';

const parseSpecs = (specsInput) => {
  if (!specsInput) return [];
  let parsed = specsInput;
  if (typeof specsInput === 'string') {
    try {
      parsed = JSON.parse(specsInput);
    } catch (e) {
      return specsInput.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(parsed)) return [];
  if (parsed.length === 0) return [];
  if (typeof parsed[0] === 'string') return parsed;

  const tags = [];
  parsed.forEach(group => {
    if (group && Array.isArray(group.items)) {
      group.items.forEach(item => {
        if (item && item.value && item.value.trim() !== '') {
          const val = item.value.trim();
          if (!tags.includes(val)) {
            tags.push(val);
          }
        }
      });
    }
  });
  return tags;
};

export default function HomePage({ selectedLocation }) {
  const { stopLoading } = useLoading();
  const { brand } = useParams();
  
  // ── Khai báo toàn bộ các React State Hooks ở đầu component ──
  const [prevBrand, setPrevBrand] = useState(brand);
  // selectedBrand: Lưu trữ danh mục/thương hiệu chính được map từ URL param hoặc trang chủ (ví dụ: 'điện thoại', 'Apple')
  const [selectedBrand, setSelectedBrand] = useState(brand || null);
  // selectedQuickBrand: Bộ lọc thương hiệu phụ (ví dụ: khi đang xem Điện thoại mà bấm lọc nhanh 'Apple' thì lưu tại đây)
  const [selectedQuickBrand, setSelectedQuickBrand] = useState(null);
  const [categories, setCategories] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  // ── Lấy các tham số tìm kiếm từ URL query string ──
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const priceMinParam = searchParams.get('price_min');
  const priceMaxParam = searchParams.get('price_max');
  const filterBrandParam = searchParams.get('filterBrand');

  // [LOGIC PHÂN CHIA DANH MỤC & THƯƠNG HIỆU]:
  // Kiểm tra xem selectedBrand/brand hiện tại trên URL có phải là Danh mục sản phẩm (ví dụ: Điện thoại, Tablet) hay không
  const brandLower = selectedBrand ? selectedBrand.toLowerCase() : '';
  const matchingCat = categories.find(c => 
    c.name.toLowerCase() === brandLower || 
    (c.slug && c.slug.toLowerCase() === brandLower)
  );

  // [ĐỒNG BỘ HÓA TRẠNG THÁI]: Khi người dùng click chuyển hướng sang danh mục khác trên Header
  if (brand !== prevBrand) {
    setPrevBrand(brand);
    setSelectedBrand(brand || null);
    setSelectedQuickBrand(null); // Reset bộ lọc hãng phụ (Apple/Samsung) khi đổi danh mục chính
    setAdvancedFilters(null); // Reset bộ lọc nâng cao chi tiết (RAM, ROM, Giá trượt)
  }


  // 1. LOGIC LẤY DỮ LIỆU DANH MỤC (Categories) - Chỉ lấy 1 lần duy nhất khi component mount
  useEffect(() => {
    categoryService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.error("Lỗi tải danh mục:", err));
  }, []);

  // 2. LOGIC LẤY DỮ LIỆU SẢN PHẨM ĐỘNG TỪ API/DATABASE (Server-side Sorting & Filtering)
  // [LUỒNG HEADER & BỘ LỌC]:
  // - Khi người dùng chọn danh mục trên Header (được ánh xạ thành selectedBrand) hoặc thanh FilterBar:
  // - Hệ thống so khớp selectedBrand với danh sách Categories để lấy categoryId (ví dụ: Điện thoại, Tablet, Phụ kiện).
  // - Nếu không khớp danh mục nào, hệ thống coi đây là lọc theo Hãng (brandParam) gửi lên Backend.
  // - Nếu ở trang chủ mặc định (không lọc), hệ thống gán categoryId của "Điện thoại" để tránh lẫn phụ kiện giá rẻ.
  useEffect(() => {
    setIsLoading(true);

    let categoryId = matchingCat ? (matchingCat.id || matchingCat.Id) : null;
    
    // Thương hiệu gửi lên API Backend:
    // - Nếu đang ở trang Danh mục chính, thì lấy theo bộ lọc hãng nhanh (selectedQuickBrand)
    // - Nếu không phải trang Danh mục chính, thì lấy theo selectedBrand (chính là tên hãng)
    const brandParam = matchingCat ? selectedQuickBrand : ((!matchingCat && selectedBrand) ? selectedBrand : null);

    // Nếu đang ở trang chủ (không tìm kiếm và không chọn hãng cụ thể)
    // Mặc định chúng ta lọc theo danh mục "Điện thoại" để không bị trộn lẫn phụ kiện rẻ tiền giống TGDD
    if (!selectedBrand && !searchQuery) {
      const defaultCat = categories.find(c => {
        const nameLower = (c.name || '').toLowerCase();
        return nameLower === 'điện thoại' || nameLower === 'dien thoai' || nameLower === 'điện thoại di động';
      });
      if (defaultCat) {
        categoryId = defaultCat.id || defaultCat.Id;
      }
    }

    // Ánh xạ các tiêu chí sắp xếp từ tăng giảm frontend sang tham số API của Backend
    // - featured (Sản phẩm nổi bật): Sắp xếp dựa theo trạng thái tick IsFeatured của Admin ở trang quản trị.
    // - best_seller (Sản phẩm bán chạy): Sắp xếp dựa theo tổng số lượng Reviews không bị ẩn trong DB.
    let apiSortBy = 'featured';
    let apiSortOrder = 'desc';
//nếu người dùng chọn giá tăng dần
    if (sortBy === 'price_asc') {
      apiSortBy = 'price';
      apiSortOrder = 'asc';
      //giá thấp đến cao
    } else if (sortBy === 'price_desc') {//nếu người dùng chọn giá giảm dần
      apiSortBy = 'price';
      apiSortOrder = 'desc';
      //giá cao đến thấp
    } else {
      apiSortBy = sortBy;
      apiSortOrder = 'desc';
      //nổi bật
    }

    const params = {
      categoryId,
      brand: brandParam,
      search: searchQuery,
      sortBy: apiSortBy,
      sortOrder: apiSortOrder
    };

    productService.getAll(params)
      .then(productsData => {
        if (Array.isArray(productsData)) {
          const normalizedData = productsData.map(p => ({
            ...p,
            price: p.price || p.basePrice,
            image: p.image || p.thumbnailImage || p.mainImage,
            stockQuantity: p.availableStock ?? p.totalStock ?? p.stockQuantity ?? p.stock ?? 0,
            averageRating: p.averageRating ?? 5,
            reviewCount: p.reviewCount ?? 0
          }));
          setProducts(normalizedData);
        } else {
          setProducts([]);
        }
      })
      .catch(err => {
        console.error("Lỗi tải sản phẩm từ API:", err);
        setProducts([]);
      })
      .finally(() => {
        setIsLoading(false);
        stopLoading();
      });
  }, [brand, selectedBrand, selectedQuickBrand, searchQuery, sortBy, categories, stopLoading]);

  // Reset visible items count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [brand, selectedBrand, selectedQuickBrand, searchQuery, advancedFilters]);

  const handleApplyFilter = (filters) => {
    setAdvancedFilters(filters);
    setSelectedBrand(null);
  };

  // 3. LỌC NÂNG CAO (Advanced Filters) Ở CLIENT (TRÌNH DUYỆT)
  // [LUỒNG LỌC CHI TIẾT TẠI CLIENT]:
  // - Trực tiếp lọc trên mảng 'products' trong RAM client mà không gọi lại Database.
  // - Lọc giá bán thực tế nằm trong khoảng giá trượt của Slider (advancedFilters.priceRange).
  // - Lọc RAM: Phân tích chuỗi cấu hình product.specs qua hàm parseSpecs, giữ sản phẩm chứa dung lượng RAM khách chọn.
  const filteredProducts = products.filter(product => {
    // Lọc theo khoảng giá từ URL (?price_min=...&price_max=...)
    if (priceMinParam !== null) {
      const minPrice = parseFloat(priceMinParam);
      if (!isNaN(minPrice) && product.price < minPrice) return false;
    }
    if (priceMaxParam !== null) {
      const maxPrice = parseFloat(priceMaxParam);
      if (!isNaN(maxPrice) && product.price > maxPrice) return false;
    }

    // Lọc nâng cao từ FilterModal
    if (advancedFilters) {
      // Lọc theo khoảng giá từ thanh trượt Slider
      const [min, max] = advancedFilters.priceRange;
      if (product.price < min || product.price > max) {
        return false;
      }

      // 1. Lọc theo Loại điện thoại (Hệ điều hành Android / iPhone (iOS))
      if (advancedFilters['Loại điện thoại'] && advancedFilters['Loại điện thoại'].length > 0) {
        const selectedTypes = advancedFilters['Loại điện thoại'];
        const specsLower = (product.specs || '').toLowerCase();
        const nameLower = (product.name || '').toLowerCase();
        const brandLower = (product.brandName || product.brand?.name || product.brand || '').toLowerCase();
        
        // Nhận diện iPhone/iOS
        const isIphone = nameLower.includes('iphone') || brandLower.includes('apple') || specsLower.includes('ios');
        // Nhận diện Android
        const isAndroid = !isIphone && (specsLower.includes('android') || brandLower.includes('samsung') || brandLower.includes('oppo') || brandLower.includes('xiaomi') || brandLower.includes('vivo') || brandLower.includes('realme') || brandLower.includes('sony'));

        const matchesType = selectedTypes.some(type => {
          if (type === 'iPhone (iOS)') return isIphone;
          if (type === 'Android') return isAndroid;
          return false;
        });
        if (!matchesType) return false;
      }

      // 2. Lọc theo Hãng sản xuất được chọn trong modal
      if (advancedFilters['Hãng'] && advancedFilters['Hãng'].length > 0) {
        const selectedBrands = advancedFilters['Hãng'];
        const brandName = (product.brandName || product.brand?.name || product.brand || '').toLowerCase();
        const matchesBrand = selectedBrands.some(brand => brandName === brand.toLowerCase());
        if (!matchesBrand) return false;
      }

      // 3. Lọc theo dung lượng RAM
      if (advancedFilters['RAM'] && advancedFilters['RAM'].length > 0) {
        const specTags = parseSpecs(product.specs);
        const nameLower = (product.name || '').toLowerCase();
        const matchesRam = advancedFilters['RAM'].some(ram => {
          const cleanRam = ram.replace(/\s+/g, '').toLowerCase(); // Ví dụ: "8gb"
          const spaceRam = ram.toLowerCase(); // Ví dụ: "8 gb"
          
          const inSpecs = specTags.some(spec => {
            const cleanSpec = spec.replace(/\s+/g, '').toLowerCase();
            return cleanSpec === cleanRam || cleanSpec.includes(spaceRam);
          });
          const inName = nameLower.includes(cleanRam) || nameLower.includes(spaceRam);
          return inSpecs || inName;
        });
        if (!matchesRam) return false;
      }

      // 4. Lọc theo Dung lượng lưu trữ bộ nhớ trong (ROM)
      if (advancedFilters['Dung lượng lưu trữ'] && advancedFilters['Dung lượng lưu trữ'].length > 0) {
        const specTags = parseSpecs(product.specs);
        const nameLower = (product.name || '').toLowerCase();
        const matchesStorage = advancedFilters['Dung lượng lưu trữ'].some(storage => {
          const cleanStorage = storage.replace(/\s+/g, '').toLowerCase(); // Ví dụ: "128gb"
          const spaceStorage = storage.toLowerCase(); // Ví dụ: "128 gb"
          
          const inSpecs = specTags.some(spec => {
            const cleanSpec = spec.replace(/\s+/g, '').toLowerCase();
            return cleanSpec === cleanStorage || cleanSpec.includes(spaceStorage);
          });
          const inName = nameLower.includes(cleanStorage) || nameLower.includes(spaceStorage);
          return inSpecs || inName;
        });
        if (!matchesStorage) return false;
      }
    }

    return true;
  });

  // Tách riêng sản phẩm nổi bật
  const featuredProducts = filteredProducts.filter(p => p.isFeatured || p.IsFeatured);

  const displaySelectedBrand = () => {
    if (matchingCat) {
      if (selectedQuickBrand) {
        return `${matchingCat.name} - ${selectedQuickBrand}`;
      }
      return matchingCat.name;
    }
    return selectedBrand || brand || '';
  };

  return (
    <>
      {(selectedBrand || searchQuery || advancedFilters) ? (
        <Breadcrumb items={[{ label: 'Kết quả tìm kiếm' }]} />
      ) : (
        <Breadcrumb items={[{ label: 'Tất cả sản phẩm điện thoại' }]} />
      )}

      <h2
        className="text-2xl font-bold mb-4 pb-2 border-b"
        style={{ color: THEME.primary, borderColor: THEME.border }}
      >
        {searchQuery
          ? `Kết quả tìm kiếm cho: "${searchQuery}"`
          : (selectedBrand || advancedFilters ? `Sản phẩm ${displaySelectedBrand() || 'đã lọc'}` : 'Chào mừng đến với hệ thống PhoneShop!')}
      </h2>

      {/*chọn nhãn hàng trên header*/}
      <BannerSection showSlider={false} />

      {!selectedBrand && !searchQuery && !advancedFilters && (
        <>
          <div
            className="p-4 rounded mb-6 border bg-primary/5 text-secondary border-primary/20"
          >
            Khám phá các sản phẩm điện thoại, phụ kiện và nhiều ưu đãi Mùa hè hấp dẫn.
          </div>
        </>
      )}

      {/* SECTION SẢN PHẨM NỔI BẬT (Điện Máy Xanh Style) */}
      {!selectedBrand && !searchQuery && !advancedFilters && featuredProducts.length > 0 && (
        <div className="w-full bg-white rounded-md p-6 mb-8 border border-gray-200 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
            <h3 className="text-lg font-black flex items-center gap-2" style={{ color: THEME.secondary }}>
              <span>SẢN PHẨM NỔI BẬT NHẤT</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={`featured-${product.id}`}
                id={product.id}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                discount={product.discount}
                specs={product.specs || []}
                image={product.image}
                stockQuantity={product.stockQuantity}
                isFeatured={true}
                averageRating={product.averageRating}
                reviewCount={product.reviewCount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Banner Quảng cáo chạy (Nằm trên bộ lọc, dưới mục sản phẩm nổi bật) */}
      {!selectedBrand && !searchQuery && !advancedFilters && (
        <div className="mb-6">
          <BannerSection showTopBanner={false} showSideBanners={false} />
        </div>
      )}
{/*Logic click chọn sản phẩm theo danh mục*/}
      <FilterBar
        selectedBrand={matchingCat ? selectedQuickBrand : selectedBrand}
        onSelectBrand={(b) => {
          if (matchingCat) {
            // Nếu đang trong danh mục chính, gán bộ lọc thương hiệu phụ
            setSelectedQuickBrand(b);
          } else {
            // Nếu ở trang thương hiệu hoặc trang chủ, đổi thương hiệu chính
            setSelectedBrand(b);
          }
          setAdvancedFilters(null);
        }}
        onApplyFilter={handleApplyFilter}
        onClearAll={((matchingCat ? selectedQuickBrand : selectedBrand) || advancedFilters) ? () => {
          setSelectedQuickBrand(null);
          setSelectedBrand(matchingCat ? brand : null); // Quay về danh mục gốc nếu có
          setAdvancedFilters(null);
        } : null}
      />

      {/* Sắp xếp theo nổi bật, bán chạy, giảm giá, giá tăng dần, giảm dần */}
      <div className="flex items-center gap-2 mb-4 mt-2 text-[14px] text-gray-700 select-none flex-wrap py-1.5">
        <span className="font-semibold text-gray-500">Sắp xếp theo:</span>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSortBy('featured')}
            className={`cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100 ${sortBy === 'featured' ? 'text-primary font-bold bg-primary/5' : 'hover:text-primary'}`}
          >
            Nổi bật
          </button>

          <span className="text-gray-300">•</span>

          <button
            onClick={() => setSortBy('best_seller')}
            className={`cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100 ${sortBy === 'best_seller' ? 'text-primary font-bold bg-primary/5' : 'hover:text-primary'}`}
          >
            Bán chạy
          </button>

          <span className="text-gray-300">•</span>

          <button
            onClick={() => setSortBy('discount')}
            className={`cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100 ${sortBy === 'discount' ? 'text-primary font-bold bg-primary/5' : 'hover:text-primary'}`}
          >
            Giảm giá
          </button>

          <span className="text-gray-300">•</span>

          <button
            onClick={() => setSortBy('newest')}
            className={`cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100 ${sortBy === 'newest' ? 'text-primary font-bold bg-primary/5' : 'hover:text-primary'}`}
          >
            Mới
          </button>

          <span className="text-gray-300">•</span>

          {/* Dropdown Giá */}
          <div className="relative">
            <button
              onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
              className={`flex items-center gap-0.5 cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100 ${(sortBy === 'price_asc' || sortBy === 'price_desc') ? 'text-primary font-bold bg-primary/5' : 'hover:text-primary'
                }`}
            >
              <span>
                {sortBy === 'price_asc'
                  ? 'Giá thấp - cao'
                  : sortBy === 'price_desc'
                    ? 'Giá cao - thấp'
                    : 'Giá'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {isPriceDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsPriceDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setSortBy('price_asc');
                      setIsPriceDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-[13px] transition-colors cursor-pointer ${sortBy === 'price_asc' ? 'bg-primary/5 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Giá thấp - cao
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('price_desc');
                      setIsPriceDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-[13px] transition-colors cursor-pointer ${sortBy === 'price_desc' ? 'bg-primary/5 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Giá cao - thấp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={`skeleton-${idx}`} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg">Không tìm thấy sản phẩm phù hợp.</p>
          <button
            onClick={() => {
              setSelectedBrand(null);
              setAdvancedFilters(null);
            }}
            className="mt-4 hover:underline cursor-pointer font-bold"
            style={{ color: THEME.primary }}
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      ) : (
        <>
          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                {filteredProducts.slice(0, visibleCount).map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    discount={product.discount}
                    specs={product.specs || []}
                    image={product.image}
                    stockQuantity={product.stockQuantity}
                    isFeatured={product.isFeatured}
                    averageRating={product.averageRating}
                    reviewCount={product.reviewCount}
                  />
                ))}
              </div>

              {/* Nút Xem thêm sản phẩm (Batch Loading) */}
              {filteredProducts.length > visibleCount && (
                <div className="flex flex-col items-center justify-center my-8">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 group cursor-pointer"
                  >
                    <span>Xem thêm {filteredProducts.length - visibleCount} sản phẩm</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-y-0.5 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <p className="text-xs text-slate-400 mt-2">
                    Đang hiển thị {Math.min(visibleCount, filteredProducts.length)} trên tổng số {filteredProducts.length} sản phẩm
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-slate-50 rounded-md border border-dashed border-admin-border">
              <p className="text-sm font-semibold text-admin-text-muted">Sản phẩm hiện tạm hết hàng.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
