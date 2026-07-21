// Trang chi tiết sản phẩm
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Breadcrumb from '../components/Breadcrumb';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { categoryService } from '../services/categoryService';
import api from '../services/api';
import { GitCompare, ChevronLeft, ChevronRight, X, Maximize2, Check, ExternalLink } from 'lucide-react';

// Subcomponents
import ProductGallery from './product-detail/components/ProductGallery';
import ProductSummaryInfo from './product-detail/components/ProductSummaryInfo';
import ProductSpecsTab from './product-detail/components/ProductSpecsTab';
import ProductSpecsModal from './product-detail/components/ProductSpecsModal';
import ProductReviews from './product-detail/components/ProductReviews';
import CoPurchaseRecommendation from './product-detail/components/CoPurchaseRecommendation';

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

// Tỉ lệ giảm giá phụ kiện mua kèm (0.9 = giảm 10%, 0.8 = giảm 20%, 0.5 = giảm 50%)
const BUNDLE_DISCOUNT_RATE = 0.9;

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

  // States gợi ý mua kèm phụ kiện
  const [accessorySuggestions, setAccessorySuggestions] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState([]);

  // Ref và Handler cho Thanh trượt Carousel Phụ kiện mua kèm
  const accSliderRef = React.useRef(null);
  const handleScrollAcc = (direction) => {
    if (accSliderRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      accSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Chuyển sang trang bán chi tiết của phụ kiện khi bấm vào tên / ảnh phụ kiện
  const handleGoToAccessoryProduct = (e, accId) => {
    e.stopPropagation();
    navigate(`/product/${accId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // States Thư viện hình ảnh động
  const [activeImage, setActiveImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isFading, setIsFading] = useState(false);

  // States Đánh giá & bình luận
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const selectedColor = selectedAttributes["Màu sắc"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('màu'))?.[1] || '';

  // Toggle phụ kiện mua kèm
  const handleToggleAccessory = (acc) => {
    setSelectedAccessories(prev => {
      const exists = prev.some(item => item.id === acc.id);
      if (exists) {
        return prev.filter(item => item.id !== acc.id);
      } else {
        return [...prev, acc];
      }
    });
  };

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

  // Tải dữ liệu Product, danh sách Variants & Categories & Accessories
  useEffect(() => {
    setLoading(true);
    Promise.all([
      productService.getById(id),
      api.get(`/ProductVariant?productId=${id}`).catch(() => []),
      categoryService.getAll().catch(() => []),
      productService.getAll().catch(() => [])
    ])
      .then(([productData, variantData, categoryData, allProducts]) => {
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

          // Cấu hình thủ công danh sách phụ kiện đi kèm theo ý muốn của Admin (Key: ProductID chính, Value: Danh sách ProductID phụ kiện)
          const MANUAL_BUNDLE_CONFIG = {
            "1": [72, 73, 74, 75, 76], // Samsung S25 Ultra -> Gợi ý Kính cường lực S25 Ultra, Kính camera S25 Ultra, Ốp lưng S25 Ultra Spigen, Ốp lưng UAG S25 Ultra, Củ sạc 45W
            "2": [50, 49, 43], // Xiaomi 17T -> Gợi ý Sạc dự phòng Xiaomi, Sạc dự phòng Anker, Tai nghe Sony
          };

          // Lọc danh sách phụ kiện mua kèm gợi ý (ưu tiên cấu hình của Admin, nếu không có sẽ tự động gợi ý cùng hãng)
          if (Array.isArray(allProducts)) {
            let suggestions = [];
            const manualIds = MANUAL_BUNDLE_CONFIG[String(id)];

            if (manualIds && manualIds.length > 0) {
              // Lấy chính xác các phụ kiện theo cấu hình thủ công của Admin
              suggestions = allProducts.filter(p => manualIds.includes(p.id) && p.isAvailable !== false);
            } else {
              // Tự động gợi ý phụ kiện cùng hãng hoặc hãng thứ 3 (LOẠI BỎ tuyệt đối phụ kiện của hãng điện thoại đối thủ)
              const PHONE_BRAND_KEYWORDS = {
                apple: ['apple', 'iphone', 'ipad', 'airpods', 'magsafe', 'earpods'],
                samsung: ['samsung', 'galaxy', 'buds'],
                xiaomi: ['xiaomi', 'redmi', 'poco'],
                oppo: ['oppo', 'reno'],
                vivo: ['vivo'],
                realme: ['realme']
              };

              // Xác định hãng của sản phẩm chính hiện tại
              const mainProdNameLower = normalized.name.toLowerCase();
              let currentBrandKey = '';
              for (const [bKey, keywordsList] of Object.entries(PHONE_BRAND_KEYWORDS)) {
                if (keywordsList.some(kw => mainProdNameLower.includes(kw))) {
                  currentBrandKey = bKey;
                  break;
                }
              }

              // Tổng hợp danh sách các từ khóa của các hãng đối thủ cần loại bỏ
              const rivalKeywords = [];
              for (const [bKey, keywordsList] of Object.entries(PHONE_BRAND_KEYWORDS)) {
                if (bKey !== currentBrandKey) {
                  rivalKeywords.push(...keywordsList);
                }
              }

              const keywords = ["sạc", "tai nghe", "loa", "dự phòng", "cáp", "ốp", "kính", "jbl", "anker", "sony", "baseus", "spigen", "zealot", "pin", "củ sạc", "adapter"];

              const validAccessories = allProducts.filter(p => {
                if (p.id === parseInt(id)) return false;
                if (p.isAvailable === false) return false;
                const nameLower = p.name.toLowerCase();

                // 1. Phải là món thuộc loại phụ kiện
                const isAccessory = keywords.some(kw => nameLower.includes(kw));
                if (!isAccessory) return false;

                // 2. Không được chứa tên/dòng sản phẩm của hãng điện thoại đối thủ!
                const isRivalAccessory = rivalKeywords.some(rk => nameLower.includes(rk));
                if (isRivalAccessory) return false;

                return true;
              });

              // Trích xuất từ khóa tên dòng sản phẩm (ví dụ "s25", "s24", "15 pro"...) để ưu tiên phụ kiện đúng đời máy
              const modelTokens = mainProdNameLower.match(/(s\d+|note\d+|z\s*fold\d*|z\s*flip\d*|iphone\s*\d+|ipad\s*\w+)/gi) || [];

              // Ưu tiên phụ kiện cùng hãng và cùng đời sản phẩm lên đầu
              const sameBrandAccs = validAccessories.filter(p => p.brandId === normalized.brandId || (currentBrandKey && p.name.toLowerCase().includes(currentBrandKey)));
              sameBrandAccs.sort((a, b) => {
                const aMatchesModel = modelTokens.some(tok => a.name.toLowerCase().includes(tok.toLowerCase()));
                const bMatchesModel = modelTokens.some(tok => b.name.toLowerCase().includes(tok.toLowerCase()));
                if (aMatchesModel && !bMatchesModel) return -1;
                if (!aMatchesModel && bMatchesModel) return 1;
                return 0;
              });

              const thirdPartyAccs = validAccessories.filter(p => !sameBrandAccs.includes(p));
              suggestions = [...sameBrandAccs, ...thirdPartyAccs];
            }

            suggestions = suggestions.slice(0, 12);
            setAccessorySuggestions(suggestions);
            setSelectedAccessories([]); // Reset selected khi chuyển sản phẩm
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
          //muốn chia 2,3 giá điện thoại trên trang chi tiết gì đó thì vô đây
          //price: firstMatch.price / 2,
          price: firstMatch.price,
          originalPrice: firstMatch.price * 1.12,
          stock: finalStock
        };
      }
    }
    // giá gốc khi chưa chọn giá, thì không chia gì cả
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
      // Thêm sản phẩm chính
      addToCart({
        ...product,
        price: displayDetails.price,
        selectedAttributes: { ...selectedAttributes },
        selectedColor: selectedAttributes["Màu sắc"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('màu'))?.[1] || null,
        selectedStorage: selectedAttributes["Dung lượng RAM - ROM"] || selectedAttributes["Dung Lượng RAM - ROM"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('dung lượng') || k.toLowerCase().includes('bộ nhớ') || k.toLowerCase().includes('ram') || k.toLowerCase().includes('rom'))?.[1] || null
      });

      // Thêm các phụ kiện được chọn mua kèm (sử dụng tỉ lệ BUNDLE_DISCOUNT_RATE)
      const BUNDLE_DISCOUNT_RATE = 0.9; // Giảm 10% (muốn 10% thì sửa thành 0.90)
      selectedAccessories.forEach(acc => {
        const originalPrice = acc.price || acc.basePrice || 0;
        const discountPrice = originalPrice * BUNDLE_DISCOUNT_RATE;
        addToCart({
          ...acc,
          price: discountPrice,
          selectedAttributes: {},
          selectedColor: null,
          selectedStorage: null
        });
      });

      alert('Đã thêm sản phẩm chính' + (selectedAccessories.length > 0 ? ` và ${selectedAccessories.length} phụ kiện mua kèm` : '') + ' vào giỏ hàng thành công!');
      setSelectedAccessories([]);
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

      selectedAccessories.forEach(acc => {
        const originalPrice = acc.price || acc.basePrice || 0;
        const discountPrice = originalPrice * BUNDLE_DISCOUNT_RATE;
        addToCart({
          ...acc,
          price: discountPrice,
          selectedAttributes: {},
          selectedColor: null,
          selectedStorage: null
        });
      });

      setSelectedAccessories([]);
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
            path: `/danh-muc/${cat.slug || encodeURIComponent(cat.name.toLowerCase())}`
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
          {/* CỘT TRÁI: THƯ VIỆN ẢNH ĐỘNG & GỢI Ý MUA KÈM PHỤ KIỆN */}
          <div className="lg:col-span-7 space-y-6">
            <ProductGallery
              product={product}
              selectedColor={selectedColor}
              galleryImages={galleryImages}
              activeImage={activeImage}
              setActiveImage={setActiveImage}
            />

            {/* Box mua kèm giá sốc (Gợi ý phụ kiện đi kèm) với Thanh trượt Carousel */}
            {accessorySuggestions && accessorySuggestions.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 mt-6 shadow-sm relative group">
                {/* Header thanh trượt */}
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                        Mua kèm giá sốc (Gợi ý phụ kiện đi kèm)
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium">Kéo ngang hoặc bấm nút mũi tên để xem tất cả {accessorySuggestions.length} phụ kiện đi kèm</p>
                    </div>
                  </div>

                  {/* Nút điều hướng Trượt Trái / Trượt Phải */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleScrollAcc('left')}
                      className="p-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm active:scale-95 disabled:opacity-30"
                      title="Trượt sang trái"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScrollAcc('right')}
                      className="p-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm active:scale-95 disabled:opacity-30"
                      title="Trượt sang phải"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Thanh trượt Carousel sản phẩm Phụ kiện */}
                <div
                  ref={accSliderRef}
                  className="flex gap-3.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1.5 px-0.5 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {accessorySuggestions.map(acc => {
                    const isSelected = selectedAccessories.some(a => a.id === acc.id);
                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleToggleAccessory(acc)}
                        className={`w-[175px] sm:w-[190px] shrink-0 snap-start border rounded-xl p-3 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isSelected
                            ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/30 shadow-sm'
                            : 'border-gray-200 hover:border-orange-300 bg-white'
                          }`}
                      >
                        <div className="flex flex-col items-center w-full">
                          {/* Badge Tiết kiệm & Checkbox */}
                          <div className="w-full flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                              Giảm 10%
                            </span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white'
                              }`}>
                              {isSelected && <Check size={10} className="stroke-[3.5]" />}
                            </div>
                          </div>

                          {/* Image (Click chuyển thẳng trang bán phụ kiện) */}
                          <div
                            onClick={(e) => handleGoToAccessoryProduct(e, acc.id)}
                            className="w-20 h-20 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-1 mb-2 border border-gray-100 group/img cursor-pointer hover:border-blue-400 transition-all relative shadow-2xs"
                            title={`Xem trang bán ${acc.name}`}
                          >
                            <img
                              src={acc.image || acc.thumbnailImage || '/no_image.png'}
                              alt={acc.name}
                              className="max-w-full max-h-full object-contain group-hover/img:scale-110 transition-transform duration-200"
                            />
                            <span className="absolute bottom-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm">
                              <ExternalLink size={9} />
                            </span>
                          </div>

                          {/* Name (Click vào chữ chuyển thẳng trang bán phụ kiện) */}
                          <a
                            href={`/product/${acc.id}`}
                            onClick={(e) => handleGoToAccessoryProduct(e, acc.id)}
                            className="text-xs font-bold text-gray-800 hover:text-blue-600 hover:underline line-clamp-2 min-h-[32px] leading-tight text-center flex items-center justify-center gap-1 group/title cursor-pointer transition-colors"
                            title={`Bấm vào đây để chuyển sang trang bán ${acc.name}`}
                          >
                            <span>{acc.name}</span>
                            <ExternalLink size={11} className="text-gray-400 group-hover/title:text-blue-600 shrink-0 opacity-60 group-hover/title:opacity-100 transition-opacity" />
                          </a>
                        </div>

                        {/* Price Box */}
                        <div className="w-full mt-2.5 pt-2 border-t border-gray-100 flex flex-col items-center">
                          <span className="text-xs text-red-600 font-black">
                            {((acc.price || acc.basePrice || 0) * BUNDLE_DISCOUNT_RATE).toLocaleString('vi-VN')}₫
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">
                            {(acc.price || acc.basePrice || 0).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer thông tin số lượng đã chọn */}
                {selectedAccessories.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center bg-orange-50/20 p-3 rounded-lg border border-orange-100">
                    <span className="text-xs text-gray-700 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                      Đã chọn mua kèm: <span className="text-orange-600 font-black text-sm">{selectedAccessories.length}</span> phụ kiện
                    </span>
                    <span className="text-xs font-black text-red-600">
                      Tổng cộng thêm: +{selectedAccessories.reduce((sum, item) => sum + ((item.price || item.basePrice || 0) * BUNDLE_DISCOUNT_RATE), 0).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

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

        {/* GỢI Ý MUA KÈM COMBO */}
        <CoPurchaseRecommendation
          mainProduct={product}
          mainProductPrice={displayDetails.price}
          selectedVariantId={matchedVariant?.id || selectedVariant?.id}
          onAddComboToCart={() => { }}
        />

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
