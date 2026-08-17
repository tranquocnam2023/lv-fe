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
import { Check, ShoppingCart } from 'lucide-react';

// Subcomponents
import ProductGallery from './product-detail/components/ProductGallery';
import ProductSummaryInfo from './product-detail/components/ProductSummaryInfo';
import ProductSpecsTab from './product-detail/components/ProductSpecsTab';
import ProductSpecsModal from './product-detail/components/ProductSpecsModal';
import ProductReviews from './product-detail/components/ProductReviews';
import CoPurchaseRecommendation from './product-detail/components/CoPurchaseRecommendation';
import FrequentlyBoughtTogether from './product-detail/components/FrequentlyBoughtTogether';
import AccessoryVariantModal from './product-detail/components/AccessoryVariantModal';
import InstallmentModal from './product-detail/components/InstallmentModal';

// Hàm xử lý logic/sự kiện: getMergedSpecs
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

  // Cấu hình/Hằng số/Dịch vụ dữ liệu: overridesMap
  const overridesMap = {};
  Object.entries(overrides).forEach(([key, val]) => {
    overridesMap[key.toLowerCase().trim()] = val;
  });

  return baseSpecs.map(group => {
    if (!group.items || !Array.isArray(group.items)) return group;

    // Hàm thực thi logic: mergedItems
    const mergedItems = group.items.map(item => {
      if (!item.key) return item;
      // Khai báo biến/hằng số: normalizedKey - Dùng trong logic xử lý của component
      const normalizedKey = item.key.toLowerCase().trim();

      let newValue = item.value;

      if (overridesMap[normalizedKey] !== undefined) {
        newValue = overridesMap[normalizedKey];
      }
      else if (normalizedKey === 'rom' || normalizedKey.includes('bộ nhớ trong') || normalizedKey === 'internal storage') {
        // Hàm thực thi logic: romOverrideKey
        const romOverrideKey = Object.keys(overridesMap).find(k => k === 'rom' || k.includes('bộ nhớ trong') || k === 'internal storage');
        if (romOverrideKey) {
          newValue = overridesMap[romOverrideKey];
        }
      }
      else if (normalizedKey === 'ram' || normalizedKey === 'bộ nhớ ram') {
        // Hàm thực thi logic: ramOverrideKey
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

// Tỉ lệ giảm giá phụ kiện mua kèm hiển thị trên giao diện (giảm 10%). 
// LƯU Ý: Giá trị giảm giá thực tế và giới hạn số lượng mua kèm (MaxQuantityAllowed) sẽ do Back-End tính toán và áp đặt khi tạo đơn hàng.
const BUNDLE_DISCOUNT_RATE = 0.9;

export default function ProductDetailPage() {
  // Khai báo giải nén các thuộc tính/hàm (id) từ Hook / Context / Props
  const { id } = useParams();
  // Hook điều hướng trang (useNavigate) để chuyển hướng Route
  const navigate = useNavigate();
  // Khai báo giải nén các thuộc tính/hàm (addToCart) từ Hook / Context / Props
  const { addToCart } = useCart();

  // State: product - Quản lý trạng thái và dữ liệu của product trong giao diện
  const [product, setProduct] = useState(null);
  // State: activeTab - Quản lý trạng thái và dữ liệu của activeTab trong giao diện
  const [activeTab, setActiveTab] = useState('specs');
  // State: loading - Quản lý trạng thái và dữ liệu của loading trong giao diện
  const [loading, setLoading] = useState(true);
  // State: isSpecsModalOpen - Quản lý trạng thái và dữ liệu của isSpecsModalOpen trong giao diện
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  // State: isInstallmentModalOpen - Quản lý trạng thái và dữ liệu của isInstallmentModalOpen trong giao diện
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  // State: installmentModalType - Quản lý trạng thái và dữ liệu của installmentModalType trong giao diện
  const [installmentModalType, setInstallmentModalType] = useState('company');

  // State: selectedAttributes - Quản lý trạng thái và dữ liệu của selectedAttributes trong giao diện
  const [selectedAttributes, setSelectedAttributes] = useState({});
  // State: variants - Quản lý trạng thái và dữ liệu của variants trong giao diện
  const [variants, setVariants] = useState([]);
  // State: categories - Quản lý trạng thái và dữ liệu của categories trong giao diện
  const [categories, setCategories] = useState([]);
  // State: selectedWarranty - Quản lý trạng thái và dữ liệu của selectedWarranty trong giao diện
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  // Tự động hủy chọn bảo hành cũ khi đổi biến thể sản phẩm
  useEffect(() => {
    setSelectedWarranty(null);
  }, [selectedAttributes]);

  // States gợi ý mua kèm phụ kiện
  const [accessorySuggestions, setAccessorySuggestions] = useState([]);
  // State: selectedAccessoryForModal - Quản lý trạng thái và dữ liệu của selectedAccessoryForModal trong giao diện
  const [selectedAccessoryForModal, setSelectedAccessoryForModal] = useState(null);
  // State: isAccessoryModalOpen - Quản lý trạng thái và dữ liệu của isAccessoryModalOpen trong giao diện
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);

  // States Thư viện hình ảnh động
  const [activeImage, setActiveImage] = useState(null);
  // State: galleryImages - Quản lý trạng thái và dữ liệu của galleryImages trong giao diện
  const [galleryImages, setGalleryImages] = useState([]);
  // State: isFading - Quản lý trạng thái và dữ liệu của isFading trong giao diện
  const [isFading, setIsFading] = useState(false);

  // States Đánh giá & bình luận
  const [reviews, setReviews] = useState([]);
  // State: currentUser - Quản lý trạng thái và dữ liệu của currentUser trong giao diện
  const [currentUser, setCurrentUser] = useState(null);

  // Hàm thực thi logic: selectedColor
  const selectedColor = selectedAttributes["Màu sắc"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('màu'))?.[1] || '';

  // Toggle phụ kiện mua kèm
  const handleToggleAccessory = (acc) => {
    setSelectedAccessories(prev => {
      // Hàm thực thi logic: exists
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

    // Khai báo biến/hằng số: baseImg - Dùng trong logic xử lý của component
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

    // while (list.length < 4 && baseImg) {
    //   list.push({ type: 'image', url: baseImg });
    // }
    return list;
  };

  // Helper to parse key from attributes JSON string case-insensitively
  const getAttributeValue = (attributesStr, targetKey) => {
    if (!attributesStr) return '';
    try {
      // Khai báo biến/hằng số: parsed - Dùng trong logic xử lý của component
      const parsed = JSON.parse(attributesStr);
      // Khai báo biến/hằng số: targetKeyNormalized - Dùng trong logic xử lý của component
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
    const fetchProductData = async () => {
      try {
        const getProductReq = isNaN(id) ? productService.getBySlug(id) : productService.getById(id);
        const productData = await getProductReq;

        if (productData) {
          // Khai báo biến/hằng số: normalized - Dùng trong logic xử lý của component
          const normalized = {
            ...productData,
            price: productData.price || productData.basePrice || 0,
            image: productData.image || productData.thumbnailImage || productData.mainImage,
            stockQuantity: productData.availableStock ?? productData.totalStock ?? productData.stockQuantity ?? productData.stock ?? 0
          };
          setProduct(normalized);
          // Khai báo biến/hằng số: masterImgs - Dùng trong logic xử lý của component
          const masterImgs = getMasterImages(normalized);
          setGalleryImages(masterImgs);
          setActiveImage(masterImgs[0]);

          const [variantData, categoryData, allProducts] = await Promise.all([
            api.get(`/ProductVariant?productId=${normalized.id}`).catch(() => []),
            categoryService.getAll().catch(() => []),
            productService.getAll().catch(() => [])
          ]);

          if (Array.isArray(variantData)) {
            setVariants(variantData);
          }
          if (Array.isArray(categoryData)) {
            setCategories(categoryData);
          }

          // QUY TẮC HIỂN THỊ: 
          // - Hiện: Điện thoại, Tablet, Laptop, Watch... và Danh mục "Tai nghe"
          // - Ẩn: Danh mục "Loa" và các loại "Phụ kiện" (sạc, cáp, ốp, kính, bao da...)
          const HIDE_RECOMMENDATION_KEYWORDS = ["loa", "speaker", "phụ kiện", "accessory", "sạc", "cáp", "ốp", "kính", "dán", "pin", "dự phòng", "adapter", "củ sạc", "bao da", "cường lực"];

          // Khai báo biến/hằng số: productCatNames - Dùng trong logic xử lý của component
          const productCatNames = [];
          let currentCatId = normalized.categoryId;
          if (Array.isArray(categoryData) && categoryData.length > 0) {
            while (currentCatId) {
              // Hàm thực thi logic: foundCat
              const foundCat = categoryData.find(c => c.id === currentCatId);
              if (foundCat) {
                productCatNames.push((foundCat.name || '').toLowerCase());
                currentCatId = foundCat.parentId;
              } else {
                break;
              }
            }
          }

          // Kiểm tra xem sản phẩm hiện tại có thuộc nhóm bị ẨN (Loa, Phụ kiện) hay không
          const isHideCategory = HIDE_RECOMMENDATION_KEYWORDS.some(kw => {
            // Khai báo biến/hằng số: inName - Dùng trong logic xử lý của component
            const inName = (normalized.name || '').toLowerCase().includes(kw);
            // Hàm thực thi logic: inCategory
            const inCategory = productCatNames.some(cName => cName.includes(kw));
            return inName || inCategory;
          });

          if (isHideCategory) {
            setAccessorySuggestions([]);
          } else if (Array.isArray(allProducts)) {
            let suggestions = [];

            // 1. Cấu hình thủ công danh sách phụ kiện theo ID (nếu có)
            const MANUAL_BUNDLE_CONFIG = {
              "1": [72, 73, 74, 75, 76],
              "2": [50, 49, 43],
            };

            // Khai báo biến/hằng số: manualIds - Dùng trong logic xử lý của component
            const manualIds = MANUAL_BUNDLE_CONFIG[String(id)];
            if (manualIds && manualIds.length > 0) {
              // Hàm thực thi logic: manualProds
              const manualProds = allProducts.filter(p => manualIds.includes(p.id) && p.isAvailable !== false);
              suggestions.push(...manualProds);
            }

            // 2. Tự động gợi ý phụ kiện cùng hãng hoặc hãng thứ 3 nếu chưa đạt tối đa 8 sản phẩm
            if (suggestions.length < 8) {
              // Khai báo biến/hằng số: PHONE_BRAND_KEYWORDS - Dùng trong logic xử lý của component
              const PHONE_BRAND_KEYWORDS = {
                apple: ['apple', 'iphone', 'ipad', 'airpods', 'magsafe', 'earpods'],
                samsung: ['samsung', 'galaxy', 'buds'],
                xiaomi: ['xiaomi', 'redmi', 'poco'],
                oppo: ['oppo', 'reno'],
                vivo: ['vivo'],
                realme: ['realme']
              };

              // Khai báo biến/hằng số: mainProdNameLower - Dùng trong logic xử lý của component
              const mainProdNameLower = normalized.name.toLowerCase();
              let currentBrandKey = '';
              for (const [bKey, keywordsList] of Object.entries(PHONE_BRAND_KEYWORDS)) {
                if (keywordsList.some(kw => mainProdNameLower.includes(kw))) {
                  currentBrandKey = bKey;
                  break;
                }
              }

              // Khai báo biến/hằng số: rivalKeywords - Dùng trong logic xử lý của component
              const rivalKeywords = [];
              for (const [bKey, keywordsList] of Object.entries(PHONE_BRAND_KEYWORDS)) {
                if (bKey !== currentBrandKey) {
                  rivalKeywords.push(...keywordsList);
                }
              }

              // Khai báo biến/hằng số: keywords - Dùng trong logic xử lý của component
              const keywords = ["sạc", "tai nghe", "loa", "dự phòng", "cáp", "ốp", "kính", "jbl", "anker", "sony", "baseus", "spigen", "zealot", "pin", "củ sạc", "adapter"];

              // Hàm thực thi logic: validAccessories
              const validAccessories = allProducts.filter(p => {
                if (p.id === parseInt(id)) return false;
                if (p.isAvailable === false) return false;
                if (suggestions.some(s => s.id === p.id)) return false;
                // Khai báo biến/hằng số: nameLower - Dùng trong logic xử lý của component
                const nameLower = p.name.toLowerCase();

                // 1. Phải là món thuộc loại phụ kiện
                const isAccessory = keywords.some(kw => nameLower.includes(kw));
                if (!isAccessory) return false;

                // 2. Không được chứa tên/dòng sản phẩm của hãng điện thoại đối thủ
                const isRivalAccessory = rivalKeywords.some(rk => nameLower.includes(rk));
                if (isRivalAccessory) return false;

                return true;
              });

              // Khai báo biến/hằng số: modelTokens - Dùng trong logic xử lý của component
              const modelTokens = mainProdNameLower.match(/(s\d+|note\d+|z\s*fold\d*|z\s*flip\d*|iphone\s*\d+|ipad\s*\w+)/gi) || [];

              // Hàm thực thi logic: sameBrandAccs
              const sameBrandAccs = validAccessories.filter(p => p.brandId === normalized.brandId || (currentBrandKey && p.name.toLowerCase().includes(currentBrandKey)));
              sameBrandAccs.sort((a, b) => {
                // Hàm thực thi logic: aMatchesModel
                const aMatchesModel = modelTokens.some(tok => a.name.toLowerCase().includes(tok.toLowerCase()));
                // Hàm thực thi logic: bMatchesModel
                const bMatchesModel = modelTokens.some(tok => b.name.toLowerCase().includes(tok.toLowerCase()));
                if (aMatchesModel && !bMatchesModel) return -1;
                if (!aMatchesModel && bMatchesModel) return 1;
                return 0;
              });

              // Hàm thực thi logic: thirdPartyAccs
              const thirdPartyAccs = validAccessories.filter(p => !sameBrandAccs.includes(p));
              suggestions.push(...sameBrandAccs, ...thirdPartyAccs);
            }

            // 3. Chỉ dự phòng nếu số lượng sản phẩm phù hợp bị ít hơn 4 (tối thiểu 4 sản phẩm)
            if (suggestions.length < 4) {
              // Khai báo biến/hằng số: keywords - Dùng trong logic xử lý của component
              const keywords = ["sạc", "tai nghe", "loa", "dự phòng", "cáp", "ốp", "kính", "jbl", "anker", "sony", "baseus", "spigen", "zealot", "pin", "củ sạc", "adapter"];
              // Hàm thực thi logic: generalAccessories
              const generalAccessories = allProducts.filter(p => {
                if (p.id === parseInt(id)) return false;
                if (p.isAvailable === false) return false;
                if (suggestions.some(s => s.id === p.id)) return false;
                // Khai báo biến/hằng số: nameLower - Dùng trong logic xử lý của component
                const nameLower = p.name.toLowerCase();
                return keywords.some(kw => nameLower.includes(kw));
              });
              suggestions.push(...generalAccessories);
            }

            // Cắt tối đa 8 sản phẩm (nếu tìm thấy 5, 6, 7 món phù hợp thì giữ đúng 5, 6, 7 món)
            suggestions = suggestions.slice(0, 8).map(p => ({
              ...p,
              image: p.image || p.thumbnailImage || p.mainImage || p.imageUrl,
              price: p.price || p.basePrice || 0
            }));
            setAccessorySuggestions(suggestions);
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Lỗi lấy chi tiết sản phẩm:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id]);

  // Tự động chọn biến thể hoạt động đầu tiên làm mặc định khi tải trang
  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedAttributes).length === 0) {
      // Hàm thực thi logic: defaultVar
      const defaultVar = variants.find(v => v.isActive !== false) || variants[0];
      if (defaultVar && defaultVar.attributes) {
        try {
          // Khai báo biến/hằng số: parsed - Dùng trong logic xử lý của component
          const parsed = JSON.parse(defaultVar.attributes);
          // Khai báo biến/hằng số: initialSelections - Dùng trong logic xử lý của component
          const initialSelections = {};
          Object.entries(parsed).forEach(([key, val]) => {
            // Khai báo biến/hằng số: kLower - Dùng trong logic xử lý của component
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
      // Khai báo biến/hằng số: hasDesc - Dùng trong logic xử lý của component
      const hasDesc = product.description && product.description.trim() !== '';
      setActiveTab(hasDesc ? 'specs' : 'info');
    }
  }, [product]);

  // Hàm xử lý logic/sự kiện: fetchProductReviews
  const fetchProductReviews = (targetId) => {
    const target = targetId || product?.id || id;
    if (!target) return;
    reviewService.getByProductId(target)
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
    if (product?.id) {
      fetchProductReviews(product.id);
    } else if (id && !isNaN(id)) {
      fetchProductReviews(id);
    }

    // Khai báo biến/hằng số: userStr - Dùng trong logic xử lý của component
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Lỗi parse user:", e);
      }
    }
  }, [id, product?.id]);

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
    // Khai báo biến/hằng số: total - Dùng trong logic xử lý của component
    const total = reviews.length;
    let sum = 0;
    // Khai báo biến/hằng số: counts - Dùng trong logic xử lý của component
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      sum += r.rating;
      // Khai báo biến/hằng số: rate - Dùng trong logic xử lý của component
      const rate = Math.round(r.rating);
      if (counts[rate] !== undefined) {
        counts[rate]++;
      }
    });
    // Khai báo biến/hằng số: average - Dùng trong logic xử lý của component
    const average = parseFloat((sum / total).toFixed(1));
    // Khai báo biến/hằng số: percentages - Dùng trong logic xử lý của component
    const percentages = {};
    for (let i = 1; i <= 5; i++) {
      percentages[i] = Math.round((counts[i] / total) * 100);
    }
    // Khai báo biến/hằng số: satisfiedPercent - Dùng trong logic xử lý của component
    const satisfiedPercent = Math.round(((counts[5] + counts[4]) / total) * 100);
    return { average, total, counts, percentages, satisfiedPercent };
  }, [reviews]);

  // Cuộn trang lên đầu khi tải xong
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product]);

  // Phân tích các thuộc tính động từ tất cả variants
  const attributesConfig = useMemo(() => {
    // Cấu hình/Hằng số/Dịch vụ dữ liệu: config
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
        // Khai báo biến/hằng số: parts - Dùng trong logic xử lý của component
        const parts = v.name.split(' - ');
        if (parts.length > 1) {
          parsed["Dung lượng RAM - ROM"] = parts[1].trim();
        }
        if (parts.length > 2) {
          parsed["Màu sắc"] = parts[2].trim();
        }
      }

      Object.entries(parsed).forEach(([key, val]) => {
        // Khai báo biến/hằng số: kLower - Dùng trong logic xử lý của component
        const kLower = key.toLowerCase().trim();
        if (kLower === 'sku' || kLower === 'chargetax' || kLower === 'costprice') return;
        // Khai báo biến/hằng số: trimmedKey - Dùng trong logic xử lý của component
        const trimmedKey = key.trim();
        // Khai báo biến/hằng số: trimmedVal - Dùng trong logic xử lý của component
        const trimmedVal = String(val).trim();
        if (trimmedKey && trimmedVal && trimmedVal !== 'Mặc định') {
          if (!config[trimmedKey]) {
            config[trimmedKey] = new Set();
          }
          config[trimmedKey].add(trimmedVal);
        }
      });
    });

    // Khai báo biến/hằng số: result - Dùng trong logic xử lý của component
    const result = {};
    Object.entries(config).forEach(([key, set]) => {
      result[key] = Array.from(set);
    });
    return result;
  }, [variants]);

  // Tìm biến thể khớp với các thuộc tính đang chọn
  const selectedVariant = useMemo(() => {
    if (!product || variants.length === 0) return null;

    // Khai báo biến/hằng số: requiredKeys - Dùng trong logic xử lý của component
    const requiredKeys = Object.keys(attributesConfig);
    // Hàm thực thi logic: hasAllSelections
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
        // Khai báo biến/hằng số: val - Dùng trong logic xử lý của component
        const val = selectedAttributes[key];
        // Hàm thực thi logic: vVal
        const vVal = Object.entries(parsedAttrs).find(([k]) => k.toLowerCase().trim() === key.toLowerCase().trim())?.[1];
        return String(vVal || '').toLowerCase().trim() === String(val).toLowerCase().trim();
      });
    });
  }, [product, selectedAttributes, variants, attributesConfig]);

  // Tìm biến thể khớp tốt nhất (hỗ trợ khớp một phần khi chọn chưa đủ thuộc tính)
  const matchedVariant = useMemo(() => {
    if (!product || variants.length === 0) return null;

    // Hàm thực thi logic: activeSelections
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
        // Hàm thực thi logic: vVal
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

  // Cấu hình hiển thị tên sản phẩm động (chống lặp chữ khi tên gốc đã chứa dung lượng/màu)
  const displayProductName = useMemo(() => {
    if (!product) return '';
    // Khai báo biến/hằng số: targetVar - Dùng trong logic xử lý của component
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

    // Khai báo biến/hằng số: nonColorParts - Dùng trong logic xử lý của component
    const nonColorParts = [];
    Object.entries(parsedAttrs).forEach(([key, val]) => {
      // Khai báo biến/hằng số: kLower - Dùng trong logic xử lý của component
      const kLower = key.toLowerCase().trim();
      if (kLower !== 'sku' && kLower !== 'chargetax' && kLower !== 'costprice' && !kLower.includes('màu') && !kLower.includes('color')) {
        const valStr = String(val).trim();
        if (valStr && !product.name.toLowerCase().includes(valStr.toLowerCase())) {
          nonColorParts.push(valStr);
        }
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

    // Hàm thực thi logic: parsedVariants
    const parsedVariants = variants.map(v => {
      // Khai báo biến/hằng số: parsedAttrs - Dùng trong logic xử lý của component
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
        // Khai báo biến/hằng số: parts - Dùng trong logic xử lý của component
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
        // FE tính availableStock để hiển thị hàng còn; BE dùng để check tồn thực tế khi checkout và giữ chỗ qua ReservedStock.
        availableStock: v.totalStock - v.reservedStock
      };
    });

    // Hàm thực thi logic: hasSelections
    const hasSelections = Object.values(selectedAttributes).some(v => !!v);

    if (hasSelections) {
      // Hàm thực thi logic: matchedVariants
      const matchedVariants = parsedVariants.filter(v => {
        for (const [key, val] of Object.entries(selectedAttributes)) {
          if (!val) continue;
          // Khai báo biến/hằng số: normalizedKey - Dùng trong logic xử lý của component
          const normalizedKey = key.toLowerCase().trim();
          // Khai báo biến/hằng số: normalizedVal - Dùng trong logic xử lý của component
          const normalizedVal = val.toLowerCase().trim();
          if (v.parsedAttrs[normalizedKey] !== normalizedVal) {
            return false;
          }
        }
        return true;
      });

      if (matchedVariants.length > 0) {
        // Khai báo biến/hằng số: firstMatch - Dùng trong logic xử lý của component
        const firstMatch = matchedVariants[0];
        // Hàm thực thi logic: finalStock
        const finalStock = matchedVariants.reduce((sum, v) => sum + v.availableStock, 0);

        // Khai báo biến/hằng số: ratio - Dùng trong logic xử lý của component
        const ratio = (product.originalPrice && product.price && product.originalPrice > product.price)
          ? (product.originalPrice / product.price)
          : 1;

        return {
          //muốn chia 2,3 giá điện thoại trên trang chi tiết gì đó thì vô đây
          //price: firstMatch.price / 2,
          price: firstMatch.price,
          originalPrice: firstMatch.price * ratio,
          stock: finalStock
        };
      }
    }
    // giá gốc khi chưa chọn giá, thì không chia gì cả
    return {
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      stock: product.stockQuantity
    };
  }, [product, selectedAttributes, variants]);

  // Xử lý chọn thuộc tính
  const handleAttributeClick = (key, value) => {
    setSelectedAttributes(prev => {
      // Khai báo biến/hằng số: next - Dùng trong logic xử lý của component
      const next = { ...prev };
      // Khai báo biến/hằng số: isColorAttr - Dùng trong logic xử lý của component
      const isColorAttr = key.toLowerCase().includes('màu') || key.toLowerCase().includes('color');

      if (next[key] === value) {
        delete next[key];

        if (isColorAttr) {
          setIsFading(true);
          setTimeout(() => {
            // Khai báo biến/hằng số: masterImgs - Dùng trong logic xử lý của component
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
            // Hàm thực thi logic: matchedVariant
            const matchedVariant = variants.find(v => {
              let vColor = getAttributeValue(v.attributes, key) || '';
              if (!vColor && v.name && v.name.includes(' - ')) {
                // Khai báo biến/hằng số: parts - Dùng trong logic xử lý của component
                const parts = v.name.split(' - ');
                if (parts.length > 2) {
                  vColor = parts[2];
                }
              }
              return vColor.toLowerCase().trim() === value.toLowerCase().trim();
            });

            if (matchedVariant && matchedVariant.imageId) {
              // Khai báo biến/hằng số: varImg - Dùng trong logic xử lý của component
              const varImg = matchedVariant.imageId;
              // Khai báo biến/hằng số: varImgObj - Dùng trong logic xử lý của component
              const varImgObj = { type: 'image', url: varImg };
              // Khai báo biến/hằng số: masterImgs - Dùng trong logic xử lý của component
              const masterImgs = getMasterImages(product);
              let newGallery = [...masterImgs];
              // Hàm thực thi logic: videoIndex
              const videoIndex = newGallery.findIndex(item => item.type === 'video');
              // Khai báo biến/hằng số: mainImgIndex - Dùng trong logic xử lý của component
              const mainImgIndex = videoIndex !== -1 ? 1 : 0;
              if (newGallery.length > mainImgIndex) {
                newGallery[mainImgIndex] = varImgObj;
              } else {
                newGallery.push(varImgObj);
              }
              setGalleryImages(newGallery);
              setActiveImage(varImgObj);
            } else {
              // Khai báo biến/hằng số: masterImgs - Dùng trong logic xử lý của component
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
        selectedStorage: selectedAttributes["Dung lượng RAM - ROM"] || selectedAttributes["Dung Lượng RAM - ROM"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('dung lượng') || k.toLowerCase().includes('bộ nhớ') || k.toLowerCase().includes('ram') || k.toLowerCase().includes('rom'))?.[1] || null,
        selectedWarranty: selectedWarranty
      });
      // Alert removed to rely on custom toast
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
        selectedStorage: selectedAttributes["Dung lượng RAM - ROM"] || selectedAttributes["Dung Lượng RAM - ROM"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('dung lượng') || k.toLowerCase().includes('bộ nhớ') || k.toLowerCase().includes('ram') || k.toLowerCase().includes('rom'))?.[1] || null,
        selectedWarranty: selectedWarranty
      });

      navigate('/cart');
    }
  };

  // Xác nhận đăng ký mua trả góp
  const handleConfirmInstallment = (installmentDetails) => {
    setIsInstallmentModalOpen(false);
    if (product) {
      addToCart({
        ...product,
        price: displayDetails.price,
        selectedAttributes: { ...selectedAttributes },
        selectedWarranty: selectedWarranty,
        installmentInfo: installmentDetails
      });
      navigate('/cart');
    }
  };

  // Hàm thực thi logic: breadcrumbItems
  const breadcrumbItems = useMemo(() => {
    if (!product) return [];

    // Khai báo biến/hằng số: items - Dùng trong logic xử lý của component
    const items = [];
    let currentCategoryId = product.categoryId;

    if (categories && categories.length > 0) {
      while (currentCategoryId) {
        // Hàm thực thi logic: cat
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

        {/* Tiêu đề sản phẩm & Badges thương hiệu */}
        <div className="pb-4 mb-6 border-b border-gray-150 mt-2 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-red-600 text-white font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {product.brand?.name || product.brandName || product.BrandName || 'Chính hãng'}
            </span>
            <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
              <Check size={12} className="stroke-[3]" />
              Hàng chính hãng VN/A
            </span>
            <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">
              Mã SP: PS-{product.id}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {displayProductName || product.name}
          </h1>

          <div className="flex items-center flex-wrap gap-4 text-xs font-bold text-gray-600">
            <div className="flex items-center gap-1">
              <span className="text-amber-500 font-black text-sm mr-0.5">{stats.average}</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => {
                  // Khai báo biến/hằng số: ratingVal - Dùng trong logic xử lý của component
                  const ratingVal = i + 1;
                  // Khai báo biến/hằng số: isFilled - Dùng trong logic xử lý của component
                  const isFilled = ratingVal <= Math.round(stats.average);
                  return (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={isFilled ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="w-4 h-4 text-amber-400"
                    >
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                    </svg>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reviews');
                // Khai báo biến/hằng số: el - Dùng trong logic xử lý của component
                const el = document.getElementById('product-tabs-container');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {stats.total} đánh giá
            </button>
            <span className="text-gray-300">|</span>
            <span className={displayDetails.stock > 0 ? 'text-emerald-700' : 'text-red-500'}>
              {displayDetails.stock > 0 ? `Tình trạng: Còn ${displayDetails.stock} máy` : 'Tình trạng: Tạm hết hàng'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: THƯ VIỆN ẢNH ĐỘNG & CAM KẾT CỬA HÀNG */}
          <div className="lg:col-span-7 space-y-6">
            <ProductGallery
              product={product}
              selectedColor={selectedColor}
              galleryImages={galleryImages}
              activeImage={activeImage}
              setActiveImage={setActiveImage}
            />

            {/* 4 CAM KẾT DỊCH VỤ CỦA CỬA HÀNG */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                  <Check size={18} className="stroke-[3]" />
                </div>
                <div>
                  <h5 className="font-black text-xs text-gray-900">Bảo hành 12 tháng</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">Chính hãng tại trung tâm ủy quyền toàn quốc</p>
                </div>
              </div>

              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check size={18} className="stroke-[3]" />
                </div>
                <div>
                  <h5 className="font-black text-xs text-gray-900">1 đổi 1 trong 30 ngày</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">Nếu phát sinh lỗi phần cứng từ nhà sản xuất</p>
                </div>
              </div>

            </div>
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
            onOpenInstallmentModal={(type) => {
              setInstallmentModalType(type);
              setIsInstallmentModalOpen(true);
            }}
            variantId={matchedVariant?.id || selectedVariant?.id}
            selectedWarranty={selectedWarranty}
            onSelectWarranty={setSelectedWarranty}
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

        {/* SẢN PHẨM THƯỜNG MUA CÙNG (CHUẨN PHONG CÁCH THẾ GIỚI DI ĐỘNG) */}
        <FrequentlyBoughtTogether
          accessorySuggestions={accessorySuggestions}
          onSelectAccessory={(acc) => {
            setSelectedAccessoryForModal(acc);
            setIsAccessoryModalOpen(true);
          }}
        />
      </div>

      {/* MODAL CHỌN BIẾN THỂ PHỤ KIỆN THƯỜNG MUA CÙNG */}
      {selectedAccessoryForModal && (
        <AccessoryVariantModal
          isOpen={isAccessoryModalOpen}
          onClose={() => {
            setIsAccessoryModalOpen(false);
            setSelectedAccessoryForModal(null);
          }}
          productId={selectedAccessoryForModal.id}
          basePrice={selectedAccessoryForModal.price || selectedAccessoryForModal.basePrice || 0}
          comboPrice={selectedAccessoryForModal.price || selectedAccessoryForModal.basePrice || 0}
          hideQuantity={true}
        />
      )}

      {/* MODAL THÔNG SỐ KỸ THUẬT ĐẦY ĐỦ */}
      <ProductSpecsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
        mergedSpecs={mergedSpecs}
        productName={displayProductName || product.name}
      />

      {/* MODAL TÍNH TIỀN VÀ ĐẶT HÀNG TRẢ GÓP */}
      <InstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        product={product}
        displayPrice={displayDetails.price}
        selectedAttributes={selectedAttributes}
        selectedWarranty={selectedWarranty}
        initialType={installmentModalType}
        onConfirmInstallment={handleConfirmInstallment}
      />

      {/* THANH THAO TÁC NÚT MUA CỐ ĐỊNH DƯỚI ĐÁY MÀN HÌNH DI ĐỘNG (MOBILE STICKY ACTION BAR) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2.5 md:hidden animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col pl-1 shrink-0">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Giá ưu đãi:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-red-600 tracking-tight">
              {displayDetails.price.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={displayDetails.stock === 0 || product.isAvailable === false}
            className={`px-3 py-2.5 rounded-xl border font-black text-[11px] uppercase flex items-center justify-center gap-1 transition cursor-pointer select-none shrink-0 ${displayDetails.stock > 0 && product.isAvailable !== false
              ? 'border-red-600 text-red-600 bg-white active:bg-red-50'
              : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
            title="Thêm vào giỏ hàng"
          >
            <ShoppingCart size={16} />
            <span className="hidden xs:inline">Thêm giỏ</span>
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={displayDetails.stock === 0 || product.isAvailable === false}
            className={`flex-1 max-w-[170px] py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center border-0 text-white cursor-pointer select-none ${displayDetails.stock > 0 && product.isAvailable !== false
              ? 'bg-red-600 active:bg-red-700 shadow-sm'
              : 'bg-gray-300 cursor-not-allowed'
              }`}
          >
            {product.isAvailable === false ? 'TẠM NGƯNG' : displayDetails.stock > 0 ? 'MUA NGAY' : 'HẾT HÀNG'}
          </button>
        </div>
      </div>
    </div>
  );
}
