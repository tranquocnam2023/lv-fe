import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Breadcrumb from '../components/Breadcrumb';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { categoryService } from '../services/categoryService';
import api from '../services/api';
import { GitCompare, ChevronLeft, ChevronRight, X, Maximize2, Check } from 'lucide-react';

// Subcomponents
import ProductGallery from './product-detail/components/ProductGallery';
import ProductSummaryInfo from './product-detail/components/ProductSummaryInfo';
import ProductSpecsTab from './product-detail/components/ProductSpecsTab';
import ProductSpecsModal from './product-detail/components/ProductSpecsModal';
import ProductReviews from './product-detail/components/ProductReviews';

const getMergedSpecs = (baseSpecsStr, specsOverrideStr) => {
  if (!baseSpecsStr) return null;
  
  let baseSpecs = [];
  try {
    baseSpecs = JSON.parse(baseSpecsStr);
    if (!Array.isArray(baseSpecs)) return null;
  } catch (e) {
    console.error("Error parsing base specs:", e);
    return null;
  }

  if (!specsOverrideStr) return baseSpecs;

  let overrides = {};
  try {
    overrides = JSON.parse(specsOverrideStr);
    if (typeof overrides !== 'object' || overrides === null) {
      return baseSpecs;
    }
  } catch (e) {
    console.error("Error parsing specs override:", e);
    return baseSpecs;
  }

  const overridesMap = {};
  Object.entries(overrides).forEach(([key, val]) => {
    overridesMap[key.toLowerCase().trim()] = val;
  });

  return baseSpecs.map(group => {
    if (!group.items || !Array.isArray(group.items)) return group;

    const mergedItems = group.items.map(item => {
      if (!item.key) return item;
      const normalizedKey = item.key.toLowerCase().trim();

      let newValue = item.value;
      
      if (overridesMap[normalizedKey] !== undefined) {
        newValue = overridesMap[normalizedKey];
      } 
      else if (normalizedKey === 'rom' || normalizedKey.includes('bộ nhớ trong') || normalizedKey === 'internal storage') {
        const romOverrideKey = Object.keys(overridesMap).find(k => k === 'rom' || k.includes('bộ nhớ trong') || k === 'internal storage');
        if (romOverrideKey) {
          newValue = overridesMap[romOverrideKey];
        }
      }
      else if (normalizedKey === 'ram' || normalizedKey === 'bộ nhớ ram') {
        const ramOverrideKey = Object.keys(overridesMap).find(k => k === 'ram' || k === 'bộ nhớ ram');
        if (ramOverrideKey) {
          newValue = overridesMap[ramOverrideKey];
        }
      }

      return {
        ...item,
        value: newValue
      };
    });

    return {
      ...group,
      items: mergedItems
    };
  });
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('specs');
  const [loading, setLoading] = useState(true);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);

  // States chọn biến thể
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [variants, setVariants] = useState([]);
  const [categories, setCategories] = useState([]);

  // States Thư viện hình ảnh động
  const [activeImage, setActiveImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isFading, setIsFading] = useState(false);

  // States Đánh giá & bình luận
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const selectedColor = selectedAttributes["Màu sắc"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('màu'))?.[1] || '';

  // Phân tách ảnh chung (Master Images)
  const getMasterImages = (prod) => {
    if (!prod) return [];
    let list = [];
    
    if (prod.videoUrl) {
      list.push({ type: 'video', url: prod.videoUrl });
    }

    const baseImg = prod.image || prod.thumbnailImage || prod.mainImage;
    if (baseImg) {
      list.push({ type: 'image', url: baseImg });
    }

    try {
      if (prod.images) {
        let otherImgs = [];
        if (Array.isArray(prod.images)) {
          otherImgs = prod.images;
        } else if (typeof prod.images === 'string') {
          if (prod.images.trim().startsWith('[')) {
            otherImgs = JSON.parse(prod.images);
          } else {
            otherImgs = prod.images.split(',').map(img => img.trim());
          }
        }
        if (Array.isArray(otherImgs)) {
          otherImgs.forEach(img => {
            if (img && img !== baseImg && !list.some(item => item.url === img)) {
              list.push({ type: 'image', url: img });
            }
          });
        }
      }
    } catch (e) {
      console.error("Lỗi phân tách ảnh sản phẩm:", e);
    }

    while (list.length < 4 && baseImg) {
      list.push({ type: 'image', url: baseImg });
    }
    return list;
  };

  // Helper to parse key from attributes JSON string case-insensitively
  const getAttributeValue = (attributesStr, targetKey) => {
    if (!attributesStr) return '';
    try {
      const parsed = JSON.parse(attributesStr);
      const targetKeyNormalized = targetKey.toLowerCase().trim();
      for (const key of Object.keys(parsed)) {
        if (key.toLowerCase().trim() === targetKeyNormalized) {
          return parsed[key];
        }
      }
    } catch (e) {
      console.error("Lỗi parse attributes JSON:", e);
    }
    return '';
  };

  // Tải dữ liệu Product, danh sách Variants & Categories
  useEffect(() => {
    setLoading(true);
    Promise.all([
      productService.getById(id),
      api.get(`/ProductVariant?productId=${id}`).catch(() => []),
      categoryService.getAll().catch(() => [])
    ])
      .then(([productData, variantData, categoryData]) => {
        if (productData) {
          const normalized = {
            ...productData,
            price: productData.price || productData.basePrice || 0,
            image: productData.image || productData.thumbnailImage || productData.mainImage,
            stockQuantity: productData.availableStock ?? productData.totalStock ?? productData.stockQuantity ?? productData.stock ?? 0
          };
          setProduct(normalized);
          const masterImgs = getMasterImages(normalized);
          setGalleryImages(masterImgs);
          setActiveImage(masterImgs[0]);

          if (Array.isArray(variantData)) {
            setVariants(variantData);
          }
          if (Array.isArray(categoryData)) {
            setCategories(categoryData);
          }
        } else {
          setProduct(null);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy chi tiết sản phẩm:", err);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Tự động chọn biến thể hoạt động đầu tiên làm mặc định khi tải trang
  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedAttributes).length === 0) {
      const defaultVar = variants.find(v => v.isActive !== false) || variants[0];
      if (defaultVar && defaultVar.attributes) {
        try {
          const parsed = JSON.parse(defaultVar.attributes);
          const initialSelections = {};
          Object.entries(parsed).forEach(([key, val]) => {
            const kLower = key.toLowerCase();
            if (kLower !== 'sku') {
              initialSelections[key.trim()] = String(val).trim();
            }
          });
          setSelectedAttributes(initialSelections);
        } catch (e) {
          console.error("Lỗi parse attributes cho default variant:", e);
        }
      }
    }
  }, [variants, selectedAttributes]);

  // Thiết lập tab hiển thị mặc định tuỳ thuộc vào mô tả sản phẩm
  useEffect(() => {
    if (product) {
      const hasDesc = product.description && product.description.trim() !== '';
      setActiveTab(hasDesc ? 'specs' : 'info');
    }
  }, [product]);

  const fetchProductReviews = () => {
    reviewService.getByProductId(id)
      .then(res => {
        if (Array.isArray(res)) {
          setReviews(res);
        }
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách đánh giá:", err);
      });
  };

  useEffect(() => {
    fetchProductReviews();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Lỗi parse user:", e);
      }
    }
  }, [id]);

  // Thống kê đánh giá
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        average: 5,
        total: 0,
        counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        satisfiedPercent: 100
      };
    }
    const total = reviews.length;
    let sum = 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      sum += r.rating;
      const rate = Math.round(r.rating);
      if (counts[rate] !== undefined) {
        counts[rate]++;
      }
    });
    const average = parseFloat((sum / total).toFixed(1));
    const percentages = {};
    for (let i = 1; i <= 5; i++) {
      percentages[i] = Math.round((counts[i] / total) * 100);
    }
    const satisfiedPercent = Math.round(((counts[5] + counts[4]) / total) * 100);
    return { average, total, counts, percentages, satisfiedPercent };
  }, [reviews]);

  // Cuộn trang lên đầu khi tải xong
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product]);

  // Phân tích các thuộc tính động từ tất cả variants
  const attributesConfig = useMemo(() => {
    const config = {};
    
    variants.forEach(v => {
      let parsed = {};
      if (v.attributes) {
        try {
          parsed = JSON.parse(v.attributes);
        } catch (e) {
          console.error("Lỗi parse attributes:", e);
        }
      }
      
      if (Object.keys(parsed).length === 0 && v.name && v.name.includes(' - ')) {
        const parts = v.name.split(' - ');
        if (parts.length > 1) {
          parsed["Dung lượng RAM - ROM"] = parts[1].trim();
        }
        if (parts.length > 2) {
          parsed["Màu sắc"] = parts[2].trim();
        }
      }

      Object.entries(parsed).forEach(([key, val]) => {
        const kLower = key.toLowerCase().trim();
        if (kLower === 'sku' || kLower === 'chargetax' || kLower === 'costprice') return;
        const trimmedKey = key.trim();
        const trimmedVal = String(val).trim();
        if (trimmedKey && trimmedVal && trimmedVal !== 'Mặc định') {
          if (!config[trimmedKey]) {
            config[trimmedKey] = new Set();
          }
          config[trimmedKey].add(trimmedVal);
        }
      });
    });

    const result = {};
    Object.entries(config).forEach(([key, set]) => {
      result[key] = Array.from(set);
    });
    return result;
  }, [variants]);

  // Tìm biến thể khớp với các thuộc tính đang chọn
  const selectedVariant = useMemo(() => {
    if (!product || variants.length === 0) return null;

    const requiredKeys = Object.keys(attributesConfig);
    const hasAllSelections = requiredKeys.every(k => !!selectedAttributes[k]);
    if (!hasAllSelections) return null;

    return variants.find(v => {
      let parsedAttrs = {};
      if (v.attributes) {
        try {
          parsedAttrs = JSON.parse(v.attributes);
        } catch (e) {
          console.error("Lỗi parse attributes:", e);
        }
      }
      
      return requiredKeys.every(key => {
        const val = selectedAttributes[key];
        const vVal = Object.entries(parsedAttrs).find(([k]) => k.toLowerCase().trim() === key.toLowerCase().trim())?.[1];
        return String(vVal || '').toLowerCase().trim() === String(val).toLowerCase().trim();
      });
    });
  }, [product, selectedAttributes, variants, attributesConfig]);

  // Tìm biến thể khớp tốt nhất (hỗ trợ khớp một phần khi chọn chưa đủ thuộc tính)
  const matchedVariant = useMemo(() => {
    if (!product || variants.length === 0) return null;

    const activeSelections = Object.entries(selectedAttributes).filter(([_, val]) => !!val);
    if (activeSelections.length === 0) {
      return variants.find(v => v.isActive !== false) || variants[0];
    }

    return variants.find(v => {
      let parsedAttrs = {};
      if (v.attributes) {
        try {
          parsedAttrs = JSON.parse(v.attributes);
        } catch (e) {
          console.error("Lỗi parse attributes:", e);
        }
      }
      
      return activeSelections.every(([key, val]) => {
        const vVal = Object.entries(parsedAttrs).find(([k]) => k.toLowerCase().trim() === key.toLowerCase().trim())?.[1];
        return String(vVal || '').toLowerCase().trim() === String(val).toLowerCase().trim();
      });
    });
  }, [product, selectedAttributes, variants]);

  // Lấy thông số kỹ thuật đã gộp
  const mergedSpecs = useMemo(() => {
    if (!product) return null;
    return getMergedSpecs(product.specs, matchedVariant?.specsOverride);
  }, [product, matchedVariant]);

  // Cấu hình hiển thị tên sản phẩm động
  const displayProductName = useMemo(() => {
    if (!product) return '';
    const targetVar = matchedVariant || selectedVariant;
    if (!targetVar) return product.name;

    let parsedAttrs = {};
    if (targetVar.attributes) {
      try {
        parsedAttrs = JSON.parse(targetVar.attributes);
      } catch (e) {
        console.error(e);
      }
    }

    const nonColorParts = [];
    Object.entries(parsedAttrs).forEach(([key, val]) => {
      const kLower = key.toLowerCase().trim();
      if (kLower !== 'sku' && kLower !== 'chargetax' && kLower !== 'costprice' && !kLower.includes('màu') && !kLower.includes('color')) {
        nonColorParts.push(String(val));
      }
    });

    if (nonColorParts.length > 0) {
      return `${product.name} ${nonColorParts.join(' ')}`;
    }
    return product.name;
  }, [product, matchedVariant, selectedVariant]);

  // Tính toán Giá và Tồn kho hiển thị thời gian thực theo biến thể
  const displayDetails = useMemo(() => {
    if (!product) return { price: 0, originalPrice: 0, stock: 0 };

    const parsedVariants = variants.map(v => {
      const parsedAttrs = {};
      if (v.attributes) {
        try {
          Object.entries(JSON.parse(v.attributes)).forEach(([k, val]) => {
            parsedAttrs[k.toLowerCase().trim()] = String(val).toLowerCase().trim();
          });
        } catch (e) {
          console.error("Lỗi parse attributes:", e);
        }
      }
      
      if (Object.keys(parsedAttrs).length === 0 && v.name && v.name.includes(' - ')) {
        const parts = v.name.split(' - ');
        if (parts.length > 1) {
          parsedAttrs["dung lượng ram - rom"] = parts[1].toLowerCase().trim();
        }
        if (parts.length > 2) {
          parsedAttrs["màu sắc"] = parts[2].toLowerCase().trim();
        }
      }

      return {
        ...v,
        parsedAttrs,
        availableStock: v.totalStock - v.reservedStock
      };
    });

    const hasSelections = Object.values(selectedAttributes).some(v => !!v);

    if (hasSelections) {
      const matchedVariants = parsedVariants.filter(v => {
        for (const [key, val] of Object.entries(selectedAttributes)) {
          if (!val) continue;
          const normalizedKey = key.toLowerCase().trim();
          const normalizedVal = val.toLowerCase().trim();
          if (v.parsedAttrs[normalizedKey] !== normalizedVal) {
            return false;
          }
        }
        return true;
      });

      if (matchedVariants.length > 0) {
        const firstMatch = matchedVariants[0];
        const finalStock = matchedVariants.reduce((sum, v) => sum + v.availableStock, 0);

        return {
          price: firstMatch.price,
          originalPrice: firstMatch.price * 1.12,
          stock: finalStock
        };
      }
    }

    return {
      price: product.price,
      originalPrice: product.originalPrice || (product.price * 1.1),
      stock: product.stockQuantity
    };
  }, [product, selectedAttributes, variants]);

  // Xử lý chọn thuộc tính
  const handleAttributeClick = (key, value) => {
    setSelectedAttributes(prev => {
      const next = { ...prev };
      const isColorAttr = key.toLowerCase().includes('màu') || key.toLowerCase().includes('color');

      if (next[key] === value) {
        delete next[key];
        
        if (isColorAttr) {
          setIsFading(true);
          setTimeout(() => {
            const masterImgs = getMasterImages(product);
            setGalleryImages(masterImgs);
            setActiveImage(masterImgs[0]);
            setIsFading(false);
          }, 150);
        }
      } else {
        next[key] = value;

        if (isColorAttr) {
          setIsFading(true);
          setTimeout(() => {
            const matchedVariant = variants.find(v => {
              let vColor = getAttributeValue(v.attributes, key) || '';
              if (!vColor && v.name && v.name.includes(' - ')) {
                const parts = v.name.split(' - ');
                if (parts.length > 2) {
                  vColor = parts[2];
                }
              }
              return vColor.toLowerCase().trim() === value.toLowerCase().trim();
            });

            if (matchedVariant && matchedVariant.imageId) {
              const varImg = matchedVariant.imageId;
              const varImgObj = { type: 'image', url: varImg };
              const masterImgs = getMasterImages(product);
              let newGallery = [...masterImgs];
              const videoIndex = newGallery.findIndex(item => item.type === 'video');
              const mainImgIndex = videoIndex !== -1 ? 1 : 0;
              if (newGallery.length > mainImgIndex) {
                newGallery[mainImgIndex] = varImgObj;
              } else {
                newGallery.push(varImgObj);
              }
              setGalleryImages(newGallery);
              setActiveImage(varImgObj);
            } else {
              const masterImgs = getMasterImages(product);
              setGalleryImages(masterImgs);
              setActiveImage(masterImgs[0]);
            }
            setIsFading(false);
          }, 150);
        }
      }
      return next;
    });
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = () => {
    for (const attrKey of Object.keys(attributesConfig)) {
      if (!selectedAttributes[attrKey]) {
        alert(`Vui lòng chọn ${attrKey} trước khi thêm vào giỏ hàng!`);
        return;
      }
    }
    if (product) {
      addToCart({
        ...product,
        price: displayDetails.price,
        selectedAttributes: { ...selectedAttributes },
        selectedColor: selectedAttributes["Màu sắc"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('màu'))?.[1] || null,
        selectedStorage: selectedAttributes["Dung lượng RAM - ROM"] || selectedAttributes["Dung Lượng RAM - ROM"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('dung lượng') || k.toLowerCase().includes('bộ nhớ') || k.toLowerCase().includes('ram') || k.toLowerCase().includes('rom'))?.[1] || null
      });
      alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
    }
  };

  // Mua ngay
  const handleBuyNow = () => {
    for (const attrKey of Object.keys(attributesConfig)) {
      if (!selectedAttributes[attrKey]) {
        alert(`Vui lòng chọn ${attrKey} trước khi tiến hành đặt hàng!`);
        return;
      }
    }
    if (product) {
      addToCart({
        ...product,
        price: displayDetails.price,
        selectedAttributes: { ...selectedAttributes },
        selectedColor: selectedAttributes["Màu sắc"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('màu'))?.[1] || null,
        selectedStorage: selectedAttributes["Dung lượng RAM - ROM"] || selectedAttributes["Dung Lượng RAM - ROM"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('dung lượng') || k.toLowerCase().includes('bộ nhớ') || k.toLowerCase().includes('ram') || k.toLowerCase().includes('rom'))?.[1] || null
      });
      navigate('/cart');
    }
  };

  const breadcrumbItems = useMemo(() => {
    if (!product) return [];
    
    const items = [];
    let currentCategoryId = product.categoryId;
    
    if (categories && categories.length > 0) {
      while (currentCategoryId) {
        const cat = categories.find(c => c.id === currentCategoryId);
        if (cat) {
          items.unshift({
            label: cat.name,
            path: `/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}`
          });
          currentCategoryId = cat.parentId;
        } else {
          break;
        }
      }
    } else {
      items.push({
        label: 'Điện thoại',
        path: '/'
      });
    }
    
    items.push({ label: product.name });
    return items;
  }, [product, categories]);

  if (loading) return <div className="py-20 text-center font-bold text-gray-500">Đang tải thông tin sản phẩm...</div>;
  if (!product) return <div className="py-20 text-center font-bold text-red-500">Sản phẩm không tồn tại.</div>;

  return (
    <div className="flex flex-col w-full pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <Breadcrumb items={breadcrumbItems} />

        {/* Tiêu đề sản phẩm - MOBILE: text-2xl, DESKTOP: text-3xl */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 mt-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{displayProductName || product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => {
                  const ratingVal = i + 1;
                  const isFilled = ratingVal <= Math.round(stats.average);
                  return (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={isFilled ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="w-4 h-4 text-yellow-400"
                    >
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                    </svg>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews');
                  const el = document.getElementById('product-tabs-container');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-blue-600 font-bold hover:underline focus:outline-none"
              >
                {stats.total} đánh giá
              </button>
              <span className="text-sm text-gray-400">|</span>
              <span className={`text-sm font-bold ${displayDetails.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {displayDetails.stock > 0 ? `Còn ${displayDetails.stock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* CỘT TRÁI: THƯ VIỆN ẢNH ĐỘNG */}
          <ProductGallery 
            product={product}
            selectedColor={selectedColor}
            galleryImages={galleryImages}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
          />

          {/* CỘT PHẢI: KHU VỰC CHỌN BIẾN THỂ & ĐẶT MUA */}
          <ProductSummaryInfo 
            product={product}
            displayProductName={displayProductName}
            displayDetails={displayDetails}
            attributesConfig={attributesConfig}
            selectedAttributes={selectedAttributes}
            onAttributeClick={handleAttributeClick}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </div>

        {/* Khu vực Tabs chi tiết mô tả / Thông số / Reviews */}
        <div className="bg-white rounded-md overflow-hidden mt-12 border border-gray-100" id="product-tabs-container">
          <div className="flex bg-gray-50/50 border-b border-gray-100">
            {product.description && product.description.trim() !== '' && (
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-4 font-bold text-xs transition-all relative tracking-wider ${activeTab === 'specs' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                THÔNG TIN SẢN PHẨM
                {activeTab === 'specs' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full"></div>}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-4 font-bold text-xs transition-all relative tracking-wider ${activeTab === 'info' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              THÔNG SỐ KỸ THUẬT
              {activeTab === 'info' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-4 font-bold text-xs transition-all relative tracking-wider ${activeTab === 'reviews' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ĐÁNH GIÁ & BÌNH LUẬN ({stats.total})
              {activeTab === 'reviews' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'specs' && (
              <div className="prose prose-blue max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                {product.description ? (
                  <div 
                    className="rich-text-content"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }} 
                  />
                ) : (
                  <>
                    <h3 className="text-xl font-black text-gray-800 mb-4">Trải nghiệm đẳng cấp cùng {product.name}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      Sản phẩm mang đến sự đột phá về mặt hiệu năng với con chip thế hệ mới nhất,
                      kết hợp cùng hệ thống camera chuyên nghiệp giúp bạn bắt trọn mọi khoảnh khắc.
                      Thiết kế titan siêu bền và nhẹ tạo nên vẻ ngoài sang trọng bậc nhất.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                      <div className="bg-gray-50 p-5 rounded-md">
                        <h4 className="font-bold text-blue-700 mb-2 text-sm">Màn hình sống động</h4>
                        <p className="text-xs text-gray-600">Công nghệ LTPO giúp tiết kiệm pin tối đa trong khi vẫn đảm bảo tần số quét 120Hz mượt mà.</p>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-md border border-gray-100">
                        <h4 className="font-bold text-blue-700 mb-2 text-sm">Pin ấn tượng</h4>
                        <p className="text-xs text-gray-600">Thời lượng sử dụng lên đến 30 giờ phát video liên tục, hỗ trợ sạc siêu nhanh.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <ProductSpecsTab 
                mergedSpecs={mergedSpecs}
                onOpenModal={() => setIsSpecsModalOpen(true)}
              />
            )}

            {activeTab === 'reviews' && (
              <ProductReviews 
                productId={id}
                reviews={reviews}
                currentUser={currentUser}
                stats={stats}
                onReviewSubmitted={fetchProductReviews}
                productName={displayProductName || product.name}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODAL THÔNG SỐ KỸ THUẬT ĐẦY ĐỦ */}
      <ProductSpecsModal 
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
        mergedSpecs={mergedSpecs}
        productName={displayProductName || product.name}
      />
    </div>
  );
}
