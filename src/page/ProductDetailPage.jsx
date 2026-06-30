import { useParams, Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { categoryService } from '../services/categoryService';
import api from '../services/api';
import { GitCompare, ChevronLeft, ChevronRight, Maximize2, X, Check, Star, ThumbsUp, MessageSquare, AlertCircle } from 'lucide-react';


// Unused theme removed

// Hàm phụ trợ phân loại màu sang mã HEX tương đương
const getHexForColor = (colorName) => {
  const c = colorName.toLowerCase();
  if (c.includes('đen') || c.includes('black')) return '#1a1a1a';
  if (c.includes('titan') || c.includes('xám') || c.includes('gray')) return '#bebebe';
  if (c.includes('xanh') || c.includes('blue')) return '#4682b4';
  if (c.includes('trắng') || c.includes('white')) return '#f8f9fa';
  if (c.includes('vàng') || c.includes('gold')) return '#ffd700';
  if (c.includes('đỏ') || c.includes('red')) return '#e63946';
  if (c.includes('hồng') || c.includes('pink')) return '#ffb6c1';
  return '#bebebe'; // Mặc định là titan/xám
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('specs');
  const [loading, setLoading] = useState(true);

  // States cho hệ thống đánh giá sản phẩm (Review & Rating)
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [writeRating, setWriteRating] = useState(5);
  const [writeComment, setWriteComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);


  // States chọn biến thể
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [variants, setVariants] = useState([]);
  const [categories, setCategories] = useState([]);

  // Helpers to resolve selected color & storage for backward compatibility and JSX display
  const selectedColor = selectedAttributes["Màu sắc"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('màu'))?.[1] || '';
  const selectedStorage = selectedAttributes["Dung lượng RAM - ROM"] || selectedAttributes["Dung Lượng RAM - ROM"] || Object.entries(selectedAttributes).find(([k]) => k.toLowerCase().includes('dung lượng') || k.toLowerCase().includes('bộ nhớ') || k.toLowerCase().includes('ram') || k.toLowerCase().includes('rom'))?.[1] || '';

  // States Thư viện hình ảnh động
  const [activeImage, setActiveImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [isFading, setIsFading] = useState(false);

  // States Lightbox popup "Xem hình thực tế"
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxActiveIndex, setLightboxActiveIndex] = useState(0);

  // Phân tách ảnh chung (Master Images)
  const getMasterImages = (prod) => {
    if (!prod) return [];
    let list = [];
    try {
      if (prod.images) {
        if (Array.isArray(prod.images)) {
          list = prod.images;
        } else if (typeof prod.images === 'string') {
          if (prod.images.trim().startsWith('[')) {
            list = JSON.parse(prod.images);
          } else {
            list = prod.images.split(',').map(img => img.trim());
          }
        }
      }
    } catch (e) {
      console.error("Lỗi phân tách ảnh sản phẩm:", e);
    }

    if (list.length === 0) {
      list = [prod.image || prod.thumbnailImage || prod.mainImage];
    }

    // Đảm bảo dải thumbnail có tối thiểu 4 hình ảnh phong phú
    const baseImg = prod.image || prod.thumbnailImage || prod.mainImage;
    while (list.length < 4) {
      list.push(baseImg);
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
          setActiveImage(normalized.image);

          // Lấy dải ảnh mặc định (Ảnh chung)
          const masterImgs = getMasterImages(normalized);
          setGalleryImages(masterImgs);

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

  const stats = React.useMemo(() => {
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setReviewError("Vui lòng đăng nhập để gửi đánh giá.");
      return;
    }
    // if (currentUser.role === 'Admin') {
    //   setReviewError("Tài khoản Quản trị viên không được phép viết đánh giá sản phẩm.");
    //   return;
    // }
    if (!writeComment || writeComment.trim().length < 10) {
      setReviewError("Nội dung đánh giá phải có tối thiểu 10 ký tự.");
      return;
    }
    
    setIsSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await reviewService.create({
        productId: parseInt(id),
        rating: writeRating,
        comment: writeComment
      });
      setReviewSuccess("Cảm ơn bạn đã gửi đánh giá! Đánh giá của bạn đã được ghi nhận.");
      setWriteComment('');
      setWriteRating(5);
      setShowReviewForm(false);
      fetchProductReviews();
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      setReviewError(err.message || err || "Có lỗi xảy ra khi gửi đánh giá. Vui lòng kiểm tra lại đơn hàng của bạn.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Cuộn trang lên đầu khi tải xong
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product]);

  // 1. Phân tích các thuộc tính động từ tất cả variants
  const attributesConfig = React.useMemo(() => {
    const config = {}; // { [key: string]: Set<string> }
    
    variants.forEach(v => {
      let parsed = {};
      if (v.attributes) {
        try {
          parsed = JSON.parse(v.attributes);
        } catch (e) {
          console.error("Lỗi parse attributes:", e);
        }
      }
      
      // Fallback nếu không có JSON attributes nhưng có định dạng tên chứa " - "
      if (Object.keys(parsed).length === 0 && v.name && v.name.includes(' - ')) {
        const parts = v.name.split(' - ');
        if (parts.length > 1) {
          parsed["Màu sắc"] = parts[1].trim();
        }
        if (parts.length > 2) {
          parsed["Dung lượng RAM - ROM"] = parts[2].trim();
        }
      }

      Object.entries(parsed).forEach(([key, val]) => {
        if (key === 'SKU' || key === 'chargeTax') return;
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

  // Tính toán Giá và Tồn kho hiển thị thời gian thực theo biến thể
  const displayDetails = React.useMemo(() => {
    if (!product) return { price: 0, originalPrice: 0, stock: 0 };

    // Phân tích các biến thể thành cấu trúc chuẩn
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
      
      // Fallback
      if (Object.keys(parsedAttrs).length === 0 && v.name && v.name.includes(' - ')) {
        const parts = v.name.split(' - ');
        if (parts.length > 1) {
          parsedAttrs["màu sắc"] = parts[1].toLowerCase().trim();
        }
        if (parts.length > 2) {
          parsedAttrs["dung lượng ram - rom"] = parts[2].toLowerCase().trim();
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
      // Tìm các biến thể thỏa mãn bộ lọc hiện tại
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
            setActiveImage(product.image);
            setGalleryImages(getMasterImages(product));
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
                if (parts.length > 1) {
                  vColor = parts[1];
                }
              }
              return vColor.toLowerCase().trim() === value.toLowerCase().trim();
            });

            if (matchedVariant && matchedVariant.imageId) {
              const varImg = matchedVariant.imageId;
              setActiveImage(varImg);
              const masterImgs = getMasterImages(product);
              setGalleryImages([varImg, ...masterImgs.slice(1)]);
            } else {
              setActiveImage(product.image);
              setGalleryImages(getMasterImages(product));
            }
            setIsFading(false);
          }, 150);
        }
      }
      return next;
    });
  };

  // Nhấp ảnh thumbnail để xem
  const handleThumbnailClick = (img) => {
    setIsFading(true);
    setTimeout(() => {
      setActiveImage(img);
      setIsFading(false);
    }, 120);
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

  // Lightbox navigation
  const handleLightboxPrev = () => {
    setLightboxActiveIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleLightboxNext = () => {
    setLightboxActiveIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const breadcrumbItems = React.useMemo(() => {
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
      // Fallback
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

  const promotions = [
    "Thu cũ Đổi mới: Trợ giá lên đến 2.000.000₫",
    "Giảm thêm 500.000₫ khi thanh toán qua VNPay-QR",
    "Tặng gói bảo hành rơi vỡ 12 tháng (Trị giá 1.500.000₫)",
    "Ưu đãi mua kèm Phụ kiện Apple giảm đến 30%"
  ];

  // main image carousel navigation
  const handleMainImagePrev = () => {
    const currentIndex = galleryImages.indexOf(activeImage);
    if (currentIndex === -1) return;
    const prevIndex = currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1;
    setIsFading(true);
    setTimeout(() => {
      setActiveImage(galleryImages[prevIndex]);
      setIsFading(false);
    }, 120);
  };

  const handleMainImageNext = () => {
    const currentIndex = galleryImages.indexOf(activeImage);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1;
    setIsFading(true);
    setTimeout(() => {
      setActiveImage(galleryImages[nextIndex]);
      setIsFading(false);
    }, 120);
  };

  return (
    <div className="flex flex-col w-full pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <Breadcrumb items={breadcrumbItems} />

        {/* Tiêu đề sản phẩm - MOBILE: text-2xl, DESKTOP: text-3xl */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 mt-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{product.name}</h1>
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

        {/* MOBILE: 1-column layout, stacked sections | DESKTOP: 2-column layout (Image Left, Specs Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* CỘT TRÁI - DESKTOP: 7 cols width, MOBILE: Stacked full width */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-md p-8 flex flex-col items-center relative group">
              {/* Khung ảnh chính có hiệu ứng fade-in mượt mà */}
              <div className="relative w-full aspect-square max-w-[420px] mb-6 flex items-center justify-center overflow-hidden">
                {/* Left/Right Carousel Control overlay */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={handleMainImagePrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white text-gray-800 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
                      title="Ảnh trước"
                    >
                      <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={handleMainImageNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white text-gray-800 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
                      title="Ảnh tiếp theo"
                    >
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                  </>
                )}

                <img
                  src={activeImage}
                  alt={product.name}
                  className={`max-w-full max-h-full object-contain transition-all duration-200 transform ${isFading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                    }`}
                />

                {product.discount && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-base px-3.5 py-1.5 rounded-md transform rotate-3 z-10">
                    -{product.discount}%
                  </div>
                )}
              </div>

              {/* Dải ảnh nhỏ bên dưới */}
              <div className="w-full space-y-4">
                <div className="flex gap-3 overflow-x-auto w-full py-2 justify-center scroll-smooth">
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleThumbnailClick(img)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md p-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 ${activeImage === img
                        ? 'bg-blue-50 opacity-100 scale-105'
                        : 'opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={img} className="w-full h-full object-contain" alt="" />
                    </div>
                  ))}
                </div>

                {/* Nút Xem hình thực tế (Lightbox) */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setLightboxActiveIndex(galleryImages.indexOf(activeImage) !== -1 ? galleryImages.indexOf(activeImage) : 0);
                      setIsLightboxOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 rounded-full text-xs font-black transition-colors"
                  >
                    <Maximize2 size={13} />
                    <span>Xem hình thực tế {selectedColor && `màu ${selectedColor}`}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Tabs (Specs / Info / Reviews) */}
            <div className="bg-white rounded-md overflow-hidden" id="product-tabs-container">
              <div className="flex bg-gray-50/50 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`flex-1 py-4 font-bold text-xs transition-all relative tracking-wider ${activeTab === 'specs' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  ĐẶC ĐIỂM NỔI BẬT
                  {activeTab === 'specs' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full"></div>}
                </button>
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
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <table className="w-full">
                      <tbody>
                        {[
                          { label: 'Kích thước màn hình', value: product.specs?.[0] || '6.7 inch' },
                          { label: 'Công nghệ màn hình', value: product.specs?.[1] || 'OLED' },
                          { label: 'RAM', value: product.specs?.[2] || '8GB' },
                          { label: 'Bộ nhớ trong', value: product.specs?.[3] || '128GB' },
                          { label: 'Camera sau', value: '48MP + 12MP + 12MP' },
                          { label: 'Camera trước', value: '12MP' },
                          { label: 'Chipset', value: 'A18 Pro (Dự kiến)' },
                          { label: 'Dung lượng pin', value: '4422 mAh' }
                        ].map((row, idx) => (
                          <tr key={idx} className="group">
                            <td className="py-3.5 font-bold text-gray-500 w-1/3 group-hover:text-blue-600 transition-colors text-xs">{row.label}</td>
                            <td className="py-3.5 text-gray-800 font-semibold text-xs">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Bảng thống kê đánh giá (TGDĐ Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 bg-gray-50 rounded-xl p-6 md:p-8 items-center gap-6 md:gap-10 border border-gray-100">
                      {/* Cột trái: Điểm trung bình */}
                      <div className="md:col-span-5 text-center border-b md:border-b-0 md:border-r border-gray-200/80 pb-6 md:pb-0 md:pr-10">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-5xl font-black text-orange-500 tracking-tight">{stats.average}</span>
                          <span className="text-2xl font-bold text-gray-400">/5</span>
                        </div>
                        <div className="flex justify-center text-yellow-400 my-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={20}
                              fill={i < Math.round(stats.average) ? "currentColor" : "none"}
                              stroke="currentColor"
                              className="text-yellow-400"
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-blue-600">{stats.total} đánh giá thực tế</p>
                        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{stats.satisfiedPercent}% khách hàng hài lòng</p>
                      </div>

                      {/* Cột phải: Thanh tỉ lệ % */}
                      <div className="md:col-span-7 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="flex items-center text-xs font-bold text-gray-600 gap-3">
                            <span className="w-3 text-right">{star}</span>
                            <Star size={12} fill="currentColor" className="text-yellow-400 shrink-0" />
                            <div className="flex-1 bg-gray-200/70 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${stats.percentages[star]}%` }}
                              ></div>
                            </div>
                            <span className="w-10 text-right text-gray-400 font-semibold">{stats.percentages[star]}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Khu vực nút Viết đánh giá & Form */}
                    <div className="border-t border-b border-gray-100 py-6 flex flex-col items-center">
                      {!showReviewForm ? (
                        <div className="text-center space-y-3">
                          <p className="text-xs text-gray-400 font-medium">Bạn đã từng mua và trải nghiệm sản phẩm này?</p>
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser) {
                                setReviewError("Vui lòng đăng nhập tài khoản Khách hàng để viết đánh giá.");
                              // } else if (currentUser.role === 'Admin') {
                              //   setReviewError("Tài khoản Quản trị viên không được phép đánh giá sản phẩm.");
                              } else {
                                setReviewError('');
                                setShowReviewForm(true);
                              }
                            }}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-md transition-all uppercase tracking-wider shadow-sm"
                          >
                            Viết đánh giá của bạn
                          </button>
                          {reviewError && (
                            <p className="text-red-500 text-xs font-bold flex items-center gap-1 justify-center mt-2 animate-bounce">
                              <AlertCircle size={14} />
                              <span>{reviewError}</span>
                            </p>
                          )}
                          {reviewSuccess && (
                            <p className="text-green-600 text-xs font-bold flex items-center gap-1 justify-center mt-2">
                              <Check size={14} className="bg-green-100 text-green-600 rounded-full p-0.5" />
                              <span>{reviewSuccess}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitReview} className="w-full max-w-xl bg-gray-50 rounded-xl p-6 border border-gray-200/60 space-y-4 animate-in zoom-in-95 duration-200">
                          <h4 className="font-black text-gray-800 text-sm">Đánh giá sản phẩm {product.name}</h4>
                          
                          {/* Chọn sao */}
                          <div className="space-y-1">
                            <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider">Số sao của bạn *</label>
                            <div className="flex gap-2 text-gray-300">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setWriteRating(star)}
                                  className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                  <Star
                                    size={24}
                                    fill={star <= writeRating ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    className={star <= writeRating ? "text-yellow-400" : "text-gray-300"}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nhập bình luận */}
                          <div className="space-y-1">
                            <label className="block text-[10px] text-gray-400 font-black uppercase tracking-wider">Ý kiến chia sẻ *</label>
                            <textarea
                              rows="3"
                              value={writeComment}
                              onChange={(e) => setWriteComment(e.target.value)}
                              placeholder="Mời bạn chia sẻ cảm nhận về thiết kế, tính năng, hiệu năng máy (Tối thiểu 10 ký tự)..."
                              className="w-full bg-white border border-gray-200 rounded-md p-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            ></textarea>
                          </div>

                          {reviewError && (
                            <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                              <AlertCircle size={14} className="shrink-0" />
                              <span>{reviewError}</span>
                            </p>
                          )}

                          <div className="flex items-center gap-3 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowReviewForm(false);
                                setReviewError('');
                              }}
                              className="px-4 py-2 text-gray-500 hover:text-gray-800 text-xs font-bold transition"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingReview}
                              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black rounded-md uppercase tracking-wider transition"
                            >
                              {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Danh sách bình luận khách hàng */}
                    <div className="space-y-6 divide-y divide-gray-100">
                      {reviews.length > 0 ? (
                        reviews.map((rev) => (
                          <div key={rev.id} className="pt-6 first:pt-0 space-y-2">
                            {/* Tên & Huy hiệu Đã mua */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-gray-800 text-xs">{rev.username}</span>
                              <span className="inline-flex items-center gap-0.5 bg-green-50 border border-green-200 text-green-600 px-2 py-0.5 rounded text-[9px] font-bold">
                                <Check size={10} strokeWidth={3} />
                                <span>Đã mua tại PhoneShop</span>
                              </span>
                            </div>

                            {/* Số sao & Thời gian */}
                            <div className="flex items-center gap-3">
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    fill={i < rev.rating ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    className="text-yellow-400 shrink-0"
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-gray-400 font-semibold">
                                {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>

                            {/* Ý kiến */}
                            <p className="text-gray-700 text-xs font-medium leading-relaxed">
                              {rev.comment}
                            </p>

                            {/* Nút hành động */}
                            <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
                              <button className="flex items-center gap-1.5 hover:text-blue-600 transition">
                                <ThumbsUp size={11} />
                                <span>Hữu ích</span>
                              </button>
                              <span className="text-gray-200">|</span>
                              <span>Đã dùng khoảng 1 ngày</span>
                            </div>

                            {/* Khung phản hồi của QTV */}
                            {rev.adminReply && (
                              <div className="bg-gray-50 border border-gray-200/50 border-l-4 border-l-blue-500 rounded-r-md p-4 mt-3 ml-2 space-y-1.5">
                                <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                                  <MessageSquare size={13} className="shrink-0" />
                                  <span>Phản hồi của QTV</span>
                                </p>
                                <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                                  {rev.adminReply}
                                </p>
                                {rev.repliedAt && (
                                  <p className="text-[9px] text-gray-400 font-bold tracking-tight">
                                    Phản hồi lúc {new Date(rev.repliedAt).toLocaleDateString('vi-VN')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-400 space-y-2">
                          <MessageSquare className="mx-auto opacity-30" size={48} strokeWidth={1} />
                          <p className="text-xs font-bold text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
                          <p className="text-[11px] text-gray-400 font-medium">Hãy là người đầu tiên trải nghiệm và chia sẻ nhận xét!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* CỘT PHẢI: KHU VỰC CHỌN BIẾN THỂ & ĐẶT MUA */}
          <div className="lg:col-span-5 space-y-8">
            <div className="sticky top-10 space-y-6">
              <div className="bg-white rounded-md p-8 space-y-8">
                {product.isAvailable === false && (
                  <div className="bg-admin-danger/10 rounded-md p-5 flex gap-3 items-start animate-in fade-in duration-200">
                    <div className="w-8 h-8 rounded-full bg-admin-danger/15 text-admin-danger flex items-center justify-center font-bold flex-shrink-0">
                      <X size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-admin-danger text-sm">Sản phẩm tạm ngưng kinh doanh</h5>
                      <p className="text-xs text-admin-text-main/80 mt-1">
                        Danh mục của sản phẩm này hiện đang tạm ngưng hoạt động. Quý khách vui lòng tham khảo các dòng sản phẩm khác.
                      </p>
                    </div>
                  </div>
                )}
                {/* Các thuộc tính biến thể động */}
                {Object.entries(attributesConfig).map(([attrKey, values]) => {
                  const isColorAttr = attrKey.toLowerCase().includes('màu') || attrKey.toLowerCase().includes('color');
                  
                  if (isColorAttr) {
                    return (
                      <div key={attrKey} className="space-y-3">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{attrKey}:</h4>
                        <div className="flex flex-wrap items-center gap-5">
                          {values.map((val) => {
                            const isSelected = selectedAttributes[attrKey] === val;
                            const hexColor = getHexForColor(val);
                            return (
                              <div key={val} className="flex flex-col items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAttributeClick(attrKey, val)}
                                  className={`w-11 h-11 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${isSelected
                                    ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-blue-500'
                                    : 'opacity-80 hover:opacity-100'
                                    }`}
                                  style={{ backgroundColor: hexColor }}
                                  title={val}
                                >
                                  {isSelected && (
                                    <Check
                                      size={16}
                                      className={hexColor === '#f8f9fa' ? 'text-gray-800 stroke-[3.5]' : 'text-white stroke-[3.5]'}
                                    />
                                  )}
                                </button>
                                <span className="text-[10px] font-bold text-gray-500 tracking-tight">{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Đối với các thuộc tính thông thường khác (Dung lượng, Kích thước, Phiên bản, v.v.)
                  return (
                    <div key={attrKey} className="space-y-3">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{attrKey}:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {values.map((val) => {
                          const isSelected = selectedAttributes[attrKey] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleAttributeClick(attrKey, val)}
                              className={`py-3 rounded-md font-black transition-all ${isSelected
                                ? 'text-blue-600 bg-blue-50 transform scale-[1.02] border-2 border-blue-500'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                                }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Hiển thị Giá và Tồn kho động */}
                <div className="bg-gray-50 rounded-md p-6 space-y-2">
                  <div className="flex items-baseline flex-wrap gap-3">
                    <span className="text-3xl font-black text-red-600">
                      {displayDetails.price.toLocaleString('vi-VN')}₫
                    </span>
                    {displayDetails.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {displayDetails.originalPrice.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    {displayDetails.originalPrice > displayDetails.price && (
                      <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase whitespace-nowrap">
                        TIẾT KIỆM {((displayDetails.originalPrice - displayDetails.price) || 0).toLocaleString('vi-VN')}₫
                      </span>
                    )}
                    <span className={`text-xs font-bold italic ${displayDetails.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {displayDetails.stock > 0 ? `Sẵn hàng (Còn ${displayDetails.stock} máy)` : 'Tạm hết hàng'}
                    </span>
                  </div>
                </div>

                {/* Khuyến mãi */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-500">
                      <path fillRule="evenodd" d="M12.964 2.815a.75.75 0 0 1 .494.314l3.426 5.138a.75.75 0 0 1-.161.944l-4.999 4.074a.75.75 0 0 1-.947 0l-4.999-4.074a.75.75 0 0 1-.161-.944l3.426-5.138a.75.75 0 0 1 .494-.314l1.2-.12a.75.75 0 0 1 .184 0l1.2.12Zm-3.411 9.421 2.22 1.81a.75.75 0 0 0 .954 0l2.22-1.81 2.304 3.456a.75.75 0 0 1-.16.944l-4.75 3.87a.75.75 0 0 1-.954 0l-4.75-3.87a.75.75 0 0 1-.16-.944l2.304-3.456Z" clipRule="evenodd" />
                    </svg>
                    KHUYẾN MÃI
                  </h4>
                  <div className="space-y-3">
                    {promotions.map((promo, idx) => (
                      <div key={idx} className="flex gap-3 items-start group">
                        <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600 mt-0.5 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{promo}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-4 pt-2">
                  <button
                    onClick={handleBuyNow}
                    disabled={displayDetails.stock === 0 || product.isAvailable === false}
                    className={`w-full bg-gradient-to-r ${displayDetails.stock > 0 && product.isAvailable !== false ? 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'from-gray-400 to-gray-500 cursor-not-allowed'} text-white font-black py-4.5 rounded-md text-xl uppercase transition-all transform active:scale-95 flex flex-col items-center`}
                  >
                    {product.isAvailable === false ? 'TẠM NGƯNG KINH DOANH' : (displayDetails.stock > 0 ? 'MUA NGAY' : 'HẾT HÀNG')}
                    <span className="text-[10px] font-bold opacity-80 normal-case mt-0.5">
                      {product.isAvailable === false ? '(Sản phẩm tạm ngưng kinh doanh)' : (displayDetails.stock > 0 ? '(Giao tận nơi hoặc nhận tại cửa hàng)' : '(Vui lòng quay lại sau)')}
                    </span>
                  </button>
                   <button
                    onClick={handleAddToCart}
                    disabled={displayDetails.stock === 0 || product.isAvailable === false}
                    className={`w-full ${displayDetails.stock > 0 && product.isAvailable !== false ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} font-black py-3.5 rounded-md text-md uppercase transition-all flex items-center justify-center gap-2`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                    {product.isAvailable === false ? 'SẢN PHẨM TẠM NGƯNG KINH DOANH' : 'THÊM VÀO GIỎ HÀNG'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const event = new CustomEvent('add-to-compare', {
                        detail: {
                          id: product.id,
                          name: product.name,
                          thumbnailImage: product.image,
                          basePrice: product.price,
                          originalPrice: product.originalPrice,
                          discount: product.discount,
                          stockQuantity: product.stockQuantity,
                          brand: { name: product.brand },
                          category: { name: product.category },
                          description: product.description,
                          productCode: product.productCode
                        }
                      });
                      window.dispatchEvent(event);
                    }}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-black py-3 rounded-md text-sm uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <GitCompare size={16} />
                    SO SÁNH SẢN PHẨM NÀY
                  </button>
                </div>
              </div>

              {/* cửa hàng gần bạn */}
              <div className="bg-gray-50 rounded-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Hỗ trợ nhanh</p>
                    <p className="text-base font-black text-gray-800">Tìm cửa hàng gần bạn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP LIGHTBOX "XEM HÌNH THỰC TẾ" (Fullscreen Carousel Modal) */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header Lightbox */}
          <div className="flex items-center justify-between text-white py-2 shrink-0">
            <span className="font-bold text-xs uppercase tracking-widest text-gray-400">
              Hình thực tế {selectedColor ? `màu ${selectedColor}` : 'sản phẩm'} ({lightboxActiveIndex + 1}/{galleryImages.length})
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Content: Carousel Container */}
          <div className="flex-1 flex items-center justify-between relative max-h-[70vh] md:max-h-[75vh]">
            {/* Button Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); handleLightboxPrev(); }}
              className="absolute left-2 md:left-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors focus:outline-none"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>

            {/* Large Active Image wrapper */}
            <div
              className="w-full h-full flex items-center justify-center px-12 md:px-20"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryImages[lightboxActiveIndex]}
                alt=""
                className="max-w-full max-h-full object-contain rounded-md animate-in zoom-in-95 duration-200"
              />
            </div>

            {/* Button Next */}
            <button
              onClick={(e) => { e.stopPropagation(); handleLightboxNext(); }}
              className="absolute right-2 md:right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors focus:outline-none"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </div>

          {/* Bottom strip: Thumbnails carousel scroll */}
          <div
            className="py-4 shrink-0 w-full flex justify-center gap-3 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxActiveIndex(idx)}
                className={`w-14 h-14 rounded-md p-1 bg-white cursor-pointer transition-all ${lightboxActiveIndex === idx
                  ? 'opacity-100 scale-105'
                  : 'opacity-50 hover:opacity-80'
                  }`}
              >
                <img src={img} className="w-full h-full object-contain rounded" alt="" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
