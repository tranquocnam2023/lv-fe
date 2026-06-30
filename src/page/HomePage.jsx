// src/page/HomePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import FilterBar from '../components/FilterBar';
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
  const { brand } = useParams();
  const [prevBrand, setPrevBrand] = useState(brand);
  const [selectedBrand, setSelectedBrand] = useState(brand || null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  if (brand !== prevBrand) {
    setPrevBrand(brand);
    setSelectedBrand(brand || null);
  }

  const [advancedFilters, setAdvancedFilters] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const isAvailableInLocation = (product, locationName) => {
    if (!locationName) return true;
    const hash = locationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((product.id + hash) % 4) !== 0; 
  };

  useEffect(() => {
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
      });
  }, []);

  const handleApplyFilter = (filters) => {
    setAdvancedFilters(filters);
    setSelectedBrand(null); 
  };

  const filteredProducts = products.filter(product => {
    // Lọc theo từ khóa tìm kiếm trên URL (?search=...)
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        (product.brandName && product.brandName.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Quick brand / category filter
    if (selectedBrand) {
      const brandLower = selectedBrand.toLowerCase();
      
      // Check if selectedBrand is a Category name in database
      const matchingCat = categories.find(c => c.name.toLowerCase() === brandLower);
      if (matchingCat) {
        return product.categoryId === matchingCat.id || product.CategoryId === matchingCat.id;
      }
      
      const matches = (product.brand && product.brand.toLowerCase() === brandLower) ||
                      (product.brandName && product.brandName.toLowerCase() === brandLower) ||
                      (product.BrandName && product.BrandName.toLowerCase() === brandLower) ||
                      product.name.toLowerCase().includes(brandLower) || 
                      (product.category && product.category.toLowerCase().includes(brandLower)) ||
                      (product.categoryName && product.categoryName.toLowerCase().includes(brandLower));
      
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

  return (
    <>
      <Breadcrumb items={[{ label: selectedBrand || searchQuery || advancedFilters ? 'Kết quả tìm kiếm' : 'Tất cả sản phẩm điện thoại' }]} />
      <h2 
        className="text-2xl font-bold mb-4 pb-2 border-b"
        style={{ color: THEME.primary, borderColor: THEME.border }}
      >
        {searchQuery 
          ? `Kết quả tìm kiếm cho: "${searchQuery}"` 
          : (selectedBrand || advancedFilters ? `Sản phẩm ${selectedBrand || 'đã lọc'}` : 'Chào mừng đến với hệ thống PhoneShop!')}
      </h2>
      {!selectedBrand && !searchQuery && !advancedFilters && (
        <div 
          className="p-4 rounded mb-6 border bg-primary/5 text-secondary border-primary/20"
        >
          Khám phá các sản phẩm điện thoại, phụ kiện và nhiều ưu đãi Mùa hè hấp dẫn.
        </div>
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

      {filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
           <p className="text-lg">Không tìm thấy sản phẩm phù hợp.</p>
           <button 
             onClick={() => {
               setSelectedBrand(null);
               setAdvancedFilters(null);
             }}
             className="mt-4 hover:underline cursor-pointer"
             style={{ color: THEME.primary }}
           >
             Xem tất cả sản phẩm
           </button>
        </div>
      ) : (
        <>
          {localProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
              {localProducts.map((product) => (
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
                {otherLocationProducts.map((product) => (
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
