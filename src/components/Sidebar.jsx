import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Smartphone, 
  Tablet, 
  Cpu, 
  Watch, 
  Headphones, 
  Cable, 
  Shield, 
  HardDrive, 
  ShoppingBag 
} from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { brandService } from '../services/brandService';
import { productService } from '../services/productService';

// Mapper function to select the best icon for the category based on its name
const getCategoryIcon = (name, iconUrl) => {
  if (iconUrl) {
    return (
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        <img src={iconUrl} alt={name} className="w-full h-full object-contain" />
      </div>
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

  return (
    <div className="w-5 h-5 flex items-center justify-center shrink-0">
      <IconComponent className="w-full h-full text-gray-500 group-hover:text-primary transition-colors" />
    </div>
  );
};

export default function Sidebar({ isFocused, setIsFocused }) {
  const [categories, setCategories] = useState([]);
  const [hoveredRootId, setHoveredRootId] = useState(null);
  const [hoveredSub2Id, setHoveredSub2Id] = useState(null);
  const [brands, setBrands] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    categoryService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.error("Lỗi tải danh mục sidebar:", err));

    brandService.getAll()
      .then(res => {
        if (res && res.items) {
          setBrands(res.items);
        } else if (Array.isArray(res)) {
          setBrands(res);
        }
      })
      .catch(err => console.error("Lỗi tải brands sidebar:", err));

    productService.getAll()
      .then(res => {
        let prods = [];
        if (res && res.items) prods = res.items;
        else if (Array.isArray(res)) prods = res;
        
        // Normalize product data
        const normalized = prods.map(p => ({
          ...p,
          price: p.price || p.basePrice,
          image: p.image || p.thumbnailImage || p.mainImage,
          stockQuantity: p.availableStock ?? p.totalStock ?? p.stockQuantity ?? p.stock ?? 0,
          averageRating: p.averageRating ?? 5,
          reviewCount: p.reviewCount ?? 0
        }));
        setAllProducts(normalized);
      })
      .catch(err => console.error("Lỗi tải sản phẩm sidebar:", err));
  }, []);

  // Filter only root categories (Level 1)
  const rootCategories = categories.filter(cat => cat.parentId === null || cat.level === 1);

  // Helper to handle category switch on hover
  const handleRootMouseEnter = (catId) => {
    setHoveredRootId(catId);
    setHoveredSub2Id(null); // Reset sub2 hover on category switch
  };

  return (
    <aside 
      className={`w-64 flex-shrink-0 bg-white rounded-md border p-1.5 space-y-1 h-fit transition-all duration-300 relative ${
        isFocused 
          ? 'border-primary ring-4 ring-primary/10 shadow-2xl scale-[1.01]' 
          : 'border-gray-200/80 shadow-sm'
      }`}
      onMouseLeave={() => {
        setHoveredRootId(null);
        setHoveredSub2Id(null);
      }}
    >
      <nav className="flex flex-col">
        {rootCategories.map((cat) => {
          const path = `/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}`;
          const isHovered = hoveredRootId === cat.id;
          const subcategories = categories.filter(c => c.parentId === cat.id);
          const hasSub = subcategories.length > 0;
          
          return (
            <Link
              key={cat.id}
              to={path}
              onMouseEnter={() => handleRootMouseEnter(cat.id)}
              onClick={() => {
                setHoveredRootId(null);
                setHoveredSub2Id(null);
                if (setIsFocused) setIsFocused(false);
              }}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200 font-semibold text-sm ${
                isHovered
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getCategoryIcon(cat.name, cat.iconUrl)}
                <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
                  {cat.name}
                </span>
              </div>
              {hasSub && (
                <ChevronRight 
                  className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                    isHovered
                      ? 'text-primary translate-x-0.5' 
                      : 'text-gray-300 group-hover:text-primary group-hover:translate-x-0.5'
                  }`} 
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Subcategories Flyout Menu */}
      {hoveredRootId && (
        (() => {
          const activeRoot = categories.find(c => c.id === hoveredRootId);
          const sub2List = activeRoot ? categories.filter(c => c.parentId === activeRoot.id) : [];
          if (sub2List.length === 0) return null;

          const isDeviceCategory = activeRoot.name.toLowerCase().includes('thoại') || 
                                   activeRoot.name.toLowerCase().includes('phone') || 
                                   activeRoot.name.toLowerCase().includes('tablet') || 
                                   activeRoot.name.toLowerCase().includes('bảng') || 
                                   activeRoot.name.toLowerCase().includes('máy tính');

          // Default active sub2 selection
          const activeSub2 = sub2List.find(s => s.id === hoveredSub2Id) || sub2List[0];
          const sub3List = activeSub2 ? categories.filter(c => c.parentId === activeSub2.id) : [];

          // Get all descendant category IDs under this root category
          const descendantIds = new Set([hoveredRootId]);
          const level2 = categories.filter(c => c.parentId === hoveredRootId);
          level2.forEach(c2 => {
            descendantIds.add(c2.id);
            const level3 = categories.filter(c => c.parentId === c2.id);
            level3.forEach(c3 => descendantIds.add(c3.id));
          });

          // Filter brands that have products in the currently hovered category
          const rootCategoryProductBrandIds = new Set(
            allProducts
              .filter(p => descendantIds.has(p.categoryId))
              .map(p => p.brandId)
              .filter(Boolean)
          );

          let filteredBrands = brands;
          if (rootCategoryProductBrandIds.size > 0) {
            filteredBrands = brands.filter(b => rootCategoryProductBrandIds.has(b.id));
          }

          // Filter featured products dynamically from preloaded list
          const featuredProducts = allProducts
            .filter(prod => descendantIds.has(prod.categoryId))
            .slice(0, 8);

          return (
            <div 
              className="absolute left-full top-0 pl-2 w-[940px] z-[100] min-h-full h-fit"
            >
              <div 
                className="bg-white border border-gray-200/80 rounded-md shadow-2xl p-6 min-h-full h-fit animate-in fade-in slide-in-from-left-2 duration-200 grid grid-cols-12 gap-6"
                style={{ minHeight: '100%' }}
              >
                
                {/* Column 1: Brands / Device Categories */}
                <div className="col-span-4 flex flex-col space-y-3">
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-1.5">
                    {isDeviceCategory ? "Chọn phân khúc" : "Chọn loại sản phẩm"}
                  </h4>
                  {isDeviceCategory ? (
                    <div className="grid grid-cols-3 gap-2">
                      {sub2List.map((sub2) => {
                        const matchedBrand = brands.find(b => 
                          b.name.toLowerCase() === sub2.name.toLowerCase() ||
                          (sub2.name.toLowerCase() === 'iphone' && b.name.toLowerCase() === 'apple')
                        );
                        const brandLogo = matchedBrand?.imageUrl;
                        const isSub2Hovered = activeSub2 && activeSub2.id === sub2.id;
                        
                        return (
                          <Link
                            key={sub2.id}
                            to={`/danh-muc/${encodeURIComponent(sub2.name.toLowerCase())}`}
                            onMouseEnter={() => setHoveredSub2Id(sub2.id)}
                            onClick={() => {
                              setHoveredRootId(null);
                              setHoveredSub2Id(null);
                              if (setIsFocused) setIsFocused(false);
                            }}
                            className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 bg-white h-11 select-none group/brand ${
                              isSub2Hovered ? 'border-primary ring-1 ring-primary/20 shadow-sm' : 'border-gray-200/80 hover:border-primary'
                            }`}
                          >
                            {brandLogo ? (
                              <img src={brandLogo} alt={sub2.name} className="h-6 max-w-full object-contain filter group-hover/brand:contrast-125 transition-all duration-200" />
                            ) : (
                              <span className="font-bold text-[11px] text-gray-700 group-hover/brand:text-primary transition-colors">{sub2.name}</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-1.5">
                      {sub2List.map((sub2) => {
                        const isSub2Hovered = activeSub2 && activeSub2.id === sub2.id;
                        return (
                          <Link
                            key={sub2.id}
                            to={`/danh-muc/${encodeURIComponent(sub2.name.toLowerCase())}`}
                            onMouseEnter={() => setHoveredSub2Id(sub2.id)}
                            onClick={() => {
                              setHoveredRootId(null);
                              setHoveredSub2Id(null);
                              if (setIsFocused) setIsFocused(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-md border transition-all duration-200 text-xs font-semibold ${
                              isSub2Hovered ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200/80 hover:border-primary text-gray-700 hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {getCategoryIcon(sub2.name, sub2.iconUrl)}
                              <span className="truncate">{sub2.name}</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Column 2: Detailed sub-models */}
                <div className="col-span-4 flex flex-col space-y-3 border-l border-gray-100 pl-6">
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-1.5">
                    {activeSub2 ? `Hãng thuộc ${activeSub2.name}` : "Dòng sản phẩm HOT"}
                  </h4>
                  {sub3List.length > 0 ? (
                    <div className="flex flex-col space-y-2">
                      {sub3List.map((sub3) => (
                        <Link
                          key={sub3.id}
                          to={`/danh-muc/${encodeURIComponent(sub3.name.toLowerCase())}`}
                          onClick={() => {
                            setHoveredRootId(null);
                            setHoveredSub2Id(null);
                            if (setIsFocused) setIsFocused(false);
                          }}
                          className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors py-0.5 block truncate"
                        >
                          {sub3.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    /* Render general accessory brands as fallback grid cards */
                    <div className="grid grid-cols-3 gap-2">
                      {filteredBrands.slice(0, 9).map((brand) => (
                        <Link
                          key={brand.id}
                          to={`/danh-muc/${encodeURIComponent(brand.name.toLowerCase())}`}
                          onClick={() => {
                            setHoveredRootId(null);
                            setHoveredSub2Id(null);
                            if (setIsFocused) setIsFocused(false);
                          }}
                          className="flex items-center justify-center p-1.5 rounded-lg border border-gray-200/80 hover:border-primary transition-all duration-200 bg-white h-9 select-none group/brand"
                        >
                          {brand.imageUrl ? (
                            <img src={brand.imageUrl} alt={brand.name} className="h-5 max-w-full object-contain filter group-hover/brand:contrast-125 transition-all duration-200" />
                          ) : (
                            <span className="font-bold text-[10px] text-gray-600 group-hover/brand:text-primary transition-colors">{brand.name}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 3: Featured Products (Cellphones style: bordered text cards with Hot badges) */}
                <div className="col-span-4 flex flex-col space-y-3 border-l border-gray-100 pl-6">
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                    <span>Sản phẩm nổi bật</span>
                    <span className="text-red-500 animate-pulse">🔥</span>
                  </h4>
                  {featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {featuredProducts.map((prod, idx) => {
                        const hasBadge = idx % 3 === 0 || prod.isFeatured;
                        const badgeText = idx % 6 === 0 ? "Hot" : "Mới";
                        const prodImage = prod.image || prod.thumbnailImage || prod.mainImage || prod.imageUrl;
                        return (
                          <Link
                            key={prod.id}
                            to={`/product/${prod.id}`}
                            onClick={() => {
                              setHoveredRootId(null);
                              setHoveredSub2Id(null);
                              if (setIsFocused) setIsFocused(false);
                            }}
                            className="relative group border border-gray-200/80 hover:border-primary hover:text-primary p-2 rounded-md text-xs bg-white text-gray-700 transition-all font-semibold shadow-sm hover:shadow cursor-pointer flex items-center gap-2.5 mt-1"
                          >
                            {hasBadge && (
                              <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded text-[8px] bg-red-500 text-white font-bold uppercase tracking-wider scale-75 shadow-sm border border-white">
                                {badgeText}
                              </span>
                            )}
                            <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 p-0.5">
                              {prodImage ? (
                                <img src={prodImage} alt={prod.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" />
                              ) : (
                                <div className="text-[6px] text-gray-300">No Image</div>
                              )}
                            </div>
                            <span className="line-clamp-2 group-hover:translate-x-0.5 transition-transform duration-200 flex-1">{prod.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Đang cập nhật...</span>
                  )}
                </div>

              </div>
            </div>
          );
        })()
      )}
    </aside>
  );
}
