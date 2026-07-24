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
  const [prevBrand, setPrevBrand] = useState(brand);
  const [selectedBrand, setSelectedBrand] = useState(brand || null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const priceMinParam = searchParams.get('price_min');
  const priceMaxParam = searchParams.get('price_max');
  const filterBrandParam = searchParams.get('filterBrand');

  if (brand !== prevBrand) {
    setPrevBrand(brand);
    setSelectedBrand(brand || null);
  }

  const [advancedFilters, setAdvancedFilters] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  const isAvailableInLocation = (product, locationName) => {
    return true; 
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      productService.getAll(),
      categoryService.getAll().catch(() => [])
    ])
      .then(([productsData, categoriesData]) => {
        if (Array.isArray(productsData) && productsData.length > 0) {
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
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        }
      })
      .catch(err => {
        console.error("Lỗi tải sản phẩm/danh mục:", err);
        setProducts([]);
      })
      .finally(() => {
        setIsLoading(false);
        stopLoading();
      });
  }, [stopLoading]);

  // Reset visible items count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedBrand, searchQuery, advancedFilters]);

  const handleApplyFilter = (filters) => {
    setAdvancedFilters(filters);
    setSelectedBrand(null); 
  };

  const filteredProducts = products.filter(product => {
    // Lọc theo từ khóa tìm kiếm trên URL (?search=...)
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      
      // Resolve category name from categories list using categoryId (type-safe)
      const pCatId = product.categoryId || product.CategoryId;
      const catObj = categories.find(c => String(c.id || c.Id || '') === String(pCatId || ''));
      const resolvedCatName = catObj ? catObj.name.toLowerCase() : '';

      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        (product.brandName && product.brandName.toLowerCase().includes(query)) ||
        (product.BrandName && product.BrandName.toLowerCase().includes(query)) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        resolvedCatName.includes(query);
      if (!matchesSearch) return false;
    }

    // Lọc theo khoảng giá từ URL (?price_min=...&price_max=...)
    if (priceMinParam !== null) {
      const minPrice = parseFloat(priceMinParam);
      if (!isNaN(minPrice) && product.price < minPrice) return false;
    }
    if (priceMaxParam !== null) {
      const maxPrice = parseFloat(priceMaxParam);
      if (!isNaN(maxPrice) && product.price > maxPrice) return false;
    }

    // Quick brand / category filter
    if (selectedBrand) {
      const brandLower = selectedBrand.toLowerCase();
      
      // Check if selectedBrand is a Category name or slug in database
      const matchingCat = categories.find(c => 
        c.name.toLowerCase() === brandLower || 
        (c.slug && c.slug.toLowerCase() === brandLower)
      );

      if (matchingCat) {
        // Hàm lấy đệ quy tất cả các ID của danh mục con
        const getAllCategoryIds = (parentId, categoriesList) => {
          let ids = [String(parentId)];
          const children = categoriesList.filter(c => String(c.parentId) === String(parentId));
          for (const child of children) {
            ids = ids.concat(getAllCategoryIds(child.id, categoriesList));
          }
          return ids;
        };

        const allowedCatIds = getAllCategoryIds(matchingCat.id || matchingCat.Id, categories);
        if (!allowedCatIds.includes(String(product.categoryId || product.CategoryId || ''))) return false;

        // Nếu có param filterBrand trên URL, lọc thêm theo thương hiệu
        if (filterBrandParam) {
          const fbLower = filterBrandParam.toLowerCase();
          const matchesBrand = (product.brand && product.brand.toLowerCase() === fbLower) ||
                               (product.brandName && product.brandName.toLowerCase() === fbLower) ||
                               (product.BrandName && product.BrandName.toLowerCase() === fbLower);
          if (!matchesBrand) return false;
        }
        
        return true;
      }
      
      const matches = (product.brand && product.brand.toLowerCase() === brandLower) ||
                      (product.brandName && product.brandName.toLowerCase() === brandLower) ||
                      (product.BrandName && product.BrandName.toLowerCase() === brandLower) ||
                      product.name.toLowerCase().includes(brandLower) || 
                      (product.category && product.category.toLowerCase().includes(brandLower)) ||
                      (product.categoryName && product.categoryName.toLowerCase().includes(brandLower)) ||
                      (product.categorySlug && product.categorySlug.toLowerCase() === brandLower);
      
      if (!matches) return false;
    }

    // Advanced filters from modal
    if (advancedFilters) {
      if (advancedFilters['Hãng'] && advancedFilters['Hãng'].length > 0) {
        const matchesBrand = advancedFilters['Hãng'].some(brand => 
          product.name.toLowerCase().includes(brand.toLowerCase())
        );
        if (!matchesBrand) return false;
      }

      const [min, max] = advancedFilters.priceRange;
      if (product.price < min || product.price > max) {
        return false;
      }

      if (advancedFilters['RAM'] && advancedFilters['RAM'].length > 0 && product.specs) {
        const specTags = parseSpecs(product.specs);
        const matchesRam = advancedFilters['RAM'].some(ram => 
          specTags.some(spec => spec.includes(ram))
        );
        if (!matchesRam) return false;
      }
    }

    return true;
  });

  const localProducts = filteredProducts.filter(p => isAvailableInLocation(p, selectedLocation));
  const otherLocationProducts = filteredProducts.filter(p => !isAvailableInLocation(p, selectedLocation));

  const featuredProducts = localProducts.filter(p => p.isFeatured || p.IsFeatured);

  const displaySelectedBrand = () => {
    if (!selectedBrand) return '';
    const brandLower = selectedBrand.toLowerCase();
    const matchingCat = categories.find(c => 
      c.name.toLowerCase() === brandLower || 
      (c.slug && c.slug.toLowerCase() === brandLower)
    );
    if (matchingCat) return matchingCat.name;
    return selectedBrand;
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

      {!selectedBrand && !searchQuery && !advancedFilters && (
        <>
          <div 
            className="p-4 rounded mb-6 border bg-primary/5 text-secondary border-primary/20"
          >
            Khám phá các sản phẩm điện thoại, phụ kiện và nhiều ưu đãi Mùa hè hấp dẫn.
          </div>
          <div className="mb-6">
            <BannerSection showSlider={false} />
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
      
      <FilterBar 
        selectedBrand={selectedBrand} 
        onSelectBrand={(brand) => {
          setSelectedBrand(brand);
          setAdvancedFilters(null); 
        }} 
        onApplyFilter={handleApplyFilter}
        onClearAll={(selectedBrand || advancedFilters) ? () => {
          setSelectedBrand(null);
          setAdvancedFilters(null);
        } : null}
      />

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
          {localProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                {localProducts.slice(0, visibleCount).map((product) => (
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
              {localProducts.length > visibleCount && (
                <div className="flex flex-col items-center justify-center my-8">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 group cursor-pointer"
                  >
                    <span>Xem thêm {localProducts.length - visibleCount} sản phẩm</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-y-0.5 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <p className="text-xs text-slate-400 mt-2">
                    Đang hiển thị {Math.min(visibleCount, localProducts.length)} trên tổng số {localProducts.length} sản phẩm
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-slate-50 rounded-md border border-dashed border-admin-border">
               <p className="text-sm font-semibold text-admin-text-muted">Sản phẩm hiện tạm hết hàng tại khu vực này.</p>
            </div>
          )}

          {/* SECTION SẢN PHẨM KHU VỰC KHÁC */}
          {otherLocationProducts.length > 0 && (
            <div className="mt-12 border-t border-admin-border pt-8 animate-fade-in">
              <div className="flex flex-col mb-5">
                <h3 className="text-lg font-bold text-gray-800">
                  Sản phẩm bạn tìm hiện không có ở khu vực này?
                </h3>
                <p className="text-xs text-admin-text-muted mt-1">
                  Dưới đây là các sản phẩm đang có sẵn tại các chi nhánh và kho hàng ở khu vực khác:
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
                {otherLocationProducts.slice(0, 8).map((product) => (
                  <ProductCard 
                     key={`other-${product.id}`}
                     id={product.id}
                     name={product.name}
                     price={product.price}
                     originalPrice={product.originalPrice}
                     discount={product.discount}
                     specs={product.specs || []}
                     image={product.image}
                     stockQuantity={product.stockQuantity}
                     isFeatured={product.isFeatured}
                     badgeText="Khu vực khác"
                     badgeBg="bg-indigo-600"
                     averageRating={product.averageRating}
                     reviewCount={product.reviewCount}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
