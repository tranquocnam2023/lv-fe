import { useParams, Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import api from '../services/api';
import { GitCompare, ChevronLeft, ChevronRight, Maximize2, X, Check } from 'lucide-react';

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

  // States chọn biến thể
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [variants, setVariants] = useState([]);

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

  // Tải dữ liệu Product & danh sách Variants
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    productService.getById(id)
      .then(async (data) => {
        if (data) {
          const normalized = {
            ...data,
            price: data.price || data.basePrice || 0,
            image: data.image || data.thumbnailImage || data.mainImage,
            stockQuantity: data.availableStock ?? data.totalStock ?? data.stockQuantity ?? data.stock ?? 0
          };
          setProduct(normalized);
          setActiveImage(normalized.image);

          // Lấy dải ảnh mặc định (Ảnh chung)
          const masterImgs = getMasterImages(normalized);
          setGalleryImages(masterImgs);

          // Gọi API tải danh sách biến thể
          try {
            const vData = await api.get(`/ProductVariant?productId=${data.id}`);
            if (Array.isArray(vData)) {
              setVariants(vData);
            }
          } catch (vErr) {
            console.error("Lỗi lấy danh sách biến thể:", vErr);
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

  // Cuộn trang lên đầu khi tải xong
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product]);

  // Trích xuất các tuỳ chọn màu sắc động từ các biến thể (variants) của API
  const colorVariants = React.useMemo(() => {
    if (variants.length === 0) {
      return [
        { name: 'Đen bóng', hex: '#1a1a1a' },
        { name: 'Titan Tự nhiên', hex: '#bebebe' },
        { name: 'Xanh dương', hex: '#4682b4' },
        { name: 'Trắng Pearl', hex: '#f8f9fa' }
      ];
    }

    const extracted = [];
    const colorsSeen = new Set();

    variants.forEach(v => {
      let parsedAttr = {};
      try { parsedAttr = v.attributes ? JSON.parse(v.attributes) : {}; } catch { /* ignore JSON parsing error */ }
      let colorName = parsedAttr["Màu sắc"] || '';
      
      // Fallback
      if (!colorName && v.name && v.name.includes(' - ')) {
        const parts = v.name.split(' - ');
        colorName = parts[1] || '';
      }
      colorName = colorName.trim();

      if (colorName && !colorsSeen.has(colorName) && colorName !== 'Mặc định') {
        colorsSeen.add(colorName);
        extracted.push({
          name: colorName,
          hex: getHexForColor(colorName)
        });
      }
    });

    return extracted.length > 0 ? extracted : [
      { name: 'Đen bóng', hex: '#1a1a1a' },
      { name: 'Titan Tự nhiên', hex: '#bebebe' },
      { name: 'Xanh dương', hex: '#4682b4' },
      { name: 'Trắng Pearl', hex: '#f8f9fa' }
    ];
  }, [variants]);

  // Trích xuất các tuỳ chọn dung lượng động từ variants
  const storageVariants = React.useMemo(() => {
    if (variants.length === 0) {
      return ['128GB', '256GB', '512GB', '1TB'];
    }
    const storages = new Set();
    variants.forEach(v => {
      let parsedAttr = {};
      try { parsedAttr = v.attributes ? JSON.parse(v.attributes) : {}; } catch { /* ignore JSON parsing error */ }
      let storagePart = parsedAttr["Dung Lượng RAM - ROM"] || '';

      // Fallback
      if (!storagePart && v.name && v.name.includes(' - ')) {
        const parts = v.name.split(' - ');
        storagePart = parts[0] || '';
      }
      storagePart = storagePart.trim();

      if (storagePart) {
        storages.add(storagePart);
      }
    });
    return storages.size > 0 ? Array.from(storages) : ['128GB', '256GB', '512GB', '1TB'];
  }, [variants]);

  // Tính toán Giá và Tồn kho hiển thị thời gian thực theo biến thể
  const displayDetails = React.useMemo(() => {
    if (!product) return { price: 0, originalPrice: 0, stock: 0 };

    if (selectedColor || selectedStorage) {
      // Tìm variant khớp màu sắc và dung lượng
      const matched = variants.find(v => {
        let parsedAttr = {};
        try { parsedAttr = v.attributes ? JSON.parse(v.attributes) : {}; } catch { /* ignore JSON parsing error */ }
        let vColor = parsedAttr["Màu sắc"] || '';
        let vStorage = parsedAttr["Dung Lượng RAM - ROM"] || '';
        
        // Fallback
        if (!vColor && !vStorage && v.name && v.name.includes(' - ')) {
            const parts = v.name.split(' - ');
            vStorage = parts[0] || '';
            vColor = parts[1] || '';
        }

        const matchesColor = selectedColor ? vColor.toLowerCase().includes(selectedColor.toLowerCase()) : true;
        const matchesStorage = selectedStorage ? vStorage.toLowerCase().includes(selectedStorage.toLowerCase()) : true;
        
        return matchesColor && matchesStorage;
      });

      if (matched) {
        return {
          price: matched.price,
          originalPrice: matched.price * 1.12,
          stock: matched.totalStock - matched.reservedStock
        };
      }
    }

    return {
      price: product.price,
      originalPrice: product.originalPrice || (product.price * 1.1),
      stock: product.stockQuantity
    };
  }, [product, selectedColor, selectedStorage, variants]);

  // Xử lý chọn màu sắc & Hủy chọn (Deselect)
  const handleColorClick = (colorName) => {
    // 1. Trường hợp click lại màu đang chọn -> HỦY CHỌN (Deselect)
    if (selectedColor === colorName) {
      setIsFading(true);
      setTimeout(() => {
        setSelectedColor('');
        setActiveImage(product.image);

        // Reset dải ảnh thumbnail về bộ ảnh chung
        const masterImgs = getMasterImages(product);
        setGalleryImages(masterImgs);
        setIsFading(false);
      }, 150);
      return;
    }

    // 2. Chọn màu mới
    setIsFading(true);
    setTimeout(() => {
      setSelectedColor(colorName);

      // Tìm hình ảnh của màu sắc biến thể vừa chọn
      const matchedVariant = variants.find(v => {
        let parsedAttr = {};
        try { parsedAttr = v.attributes ? JSON.parse(v.attributes) : {}; } catch { /* ignore JSON parsing error */ }
        let vColor = parsedAttr["Màu sắc"] || '';
        if (!vColor && v.name && v.name.includes(' - ')) {
            vColor = v.name.split(' - ')[1] || '';
        }
        return vColor.toLowerCase().includes(colorName.toLowerCase());
      });

      if (matchedVariant && matchedVariant.imageId) {
        const varImg = matchedVariant.imageId;
        setActiveImage(varImg);

        // Cập nhật thư viện ảnh: ảnh biến thể đưa lên đầu, kèm theo ảnh chung
        const masterImgs = getMasterImages(product);
        setGalleryImages([varImg, ...masterImgs.slice(1)]);
      } else {
        setActiveImage(product.image);
        setGalleryImages(getMasterImages(product));
      }
      setIsFading(false);
    }, 150);
  };

  // Xử lý chọn dung lượng & Hủy chọn
  const handleStorageClick = (storage) => {
    if (selectedStorage === storage) {
      setSelectedStorage('');
    } else {
      setSelectedStorage(storage);
    }
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
    if (!selectedColor) {
      alert('Vui lòng chọn màu sắc trước khi thêm vào giỏ hàng!');
      return;
    }
    if (!selectedStorage) {
      alert('Vui lòng chọn dung lượng trước khi thêm vào giỏ hàng!');
      return;
    }
    if (product) {
      addToCart({
        ...product,
        price: displayDetails.price, // Cập nhật đúng giá của biến thể đã chọn
        selectedStorage,
        selectedColor
      });
      alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
    }
  };

  // Mua ngay
  const handleBuyNow = () => {
    if (!selectedColor) {
      alert('Vui lòng chọn màu sắc trước khi tiến hành đặt hàng!');
      return;
    }
    if (!selectedStorage) {
      alert('Vui lòng chọn dung lượng trước khi tiến hành đặt hàng!');
      return;
    }
    if (product) {
      addToCart({
        ...product,
        price: displayDetails.price,
        selectedStorage,
        selectedColor
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

  if (loading) return <div className="py-20 text-center font-bold text-gray-500">Đang tải thông tin sản phẩm...</div>;
  if (!product) return <div className="py-20 text-center font-bold text-red-500">Sản phẩm không tồn tại.</div>;

  const breadcrumbItems = [
    { label: 'Điện thoại', link: '/' },
    { label: product.brand || 'Thương hiệu', link: `/danh-muc/${(product.brand || '').toLowerCase()}` },
    { label: product.name }
  ];

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

        {/* Tiêu đề sản phẩm */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 mt-4 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-blue-600 font-bold">142 đánh giá</span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-blue-600 font-bold">52 hỏi đáp</span>
              <span className="text-sm text-gray-400">|</span>
              <span className={`text-sm font-bold ${displayDetails.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {displayDetails.stock > 0 ? `Còn ${displayDetails.stock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* CỘT TRÁI: THƯ VIỆN ẢNH ĐỘNG (Ảnh chính + Thumbnails + Lightbox) */}
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

            {/* Content Tabs (Specs / Info) */}
            <div className="bg-white rounded-md overflow-hidden">
              <div className="flex bg-gray-50/50">
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`flex-1 py-4 font-bold text-xs transition-all relative tracking-wider ${activeTab === 'specs' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  ĐẶC ĐIỂM NỔI BẬT
                  {activeTab === 'specs' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-4 font-bold text-xs transition-all relative tracking-wider ${activeTab === 'info' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  THÔNG SỐ KỸ THUẬT
                  {activeTab === 'info' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full"></div>}
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'specs' ? (
                  <div className="prose prose-blue max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  </div>
                ) : (
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
                {/* 1. Chọn Dung lượng */}
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Dung lượng:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {storageVariants.map((storage) => {
                      const isSelected = selectedStorage === storage;
                      return (
                        <button
                          key={storage}
                          type="button"
                          onClick={() => handleStorageClick(storage)}
                          className={`py-3 rounded-md font-black transition-all ${isSelected
                            ? 'text-blue-600 bg-blue-50 transform scale-[1.02]'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                          {storage}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Chọn Màu sắc: Vòng tròn màu HEX (HEX pickingcolor) */}
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Màu sắc:</h4>
                  <div className="flex flex-wrap items-center gap-5">
                    {colorVariants.map((color) => {
                      const isSelected = selectedColor === color.name;
                      return (
                        <div key={color.name} className="flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleColorClick(color.name)}
                            className={`w-11 h-11 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${isSelected
                              ? 'scale-110'
                              : 'opacity-80 hover:opacity-100'
                              }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          >
                            {isSelected && (
                              <Check
                                size={16}
                                className={color.hex === '#f8f9fa' ? 'text-gray-800 stroke-[3.5]' : 'text-white stroke-[3.5]'}
                              />
                            )}
                          </button>
                          <span className="text-[10px] font-bold text-gray-500 tracking-tight">{color.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
