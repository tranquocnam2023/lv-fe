import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { warrantyService } from '../services/warrantyService';
import api from '../services/api';
import { ShieldCheck, Search, Smartphone, User, Phone, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { THEME } from '../utils/theme';

export default function WarrantyPurchasePage() {
  const navigate = useNavigate();

  // Dữ liệu sản phẩm & tìm kiếm
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Chọn biến thể & tải các gói bảo hành
  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [warranties, setWarranties] = useState([]);
  const [warrantiesLoading, setWarrantiesLoading] = useState(false);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState('');

  // Thông tin đăng ký mua
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverPhone: '',
    imei: ''
  });

  // State trạng thái xử lý
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Nạp danh sách tất cả sản phẩm
  useEffect(() => {
    setProductsLoading(true);
    productService.getAll()
      .then(res => {
        if (Array.isArray(res)) setProducts(res);
        else if (res?.data) setProducts(res.data);
      })
      .catch(err => console.error("Lỗi lấy sản phẩm:", err))
      .finally(() => setProductsLoading(false));
  }, []);

  // Lọc sản phẩm theo tìm kiếm
  const filteredProducts = searchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Tải các biến thể khi click chọn sản phẩm
  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSearchQuery('');
    setSelectedVariantId('');
    setVariants([]);
    setWarranties([]);
    setSelectedWarrantyId('');
    setErrorMsg('');
    setVariantsLoading(true);

    api.get(`/ProductVariant?productId=${prod.id}`)
      .then(res => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setVariants(data);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg('Không thể tải thông tin biến thể của sản phẩm.');
      })
      .finally(() => setVariantsLoading(false));
  };

  // Tải các gói bảo hành phù hợp khi chọn biến thể
  useEffect(() => {
    if (!selectedVariantId) {
      setWarranties([]);
      setSelectedWarrantyId('');
      return;
    }

    setWarrantiesLoading(true);
    setSelectedWarrantyId('');
    warrantyService.getWarrantiesForVariant(selectedVariantId)
      .then(res => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setWarranties(data);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg('Không thể tải các gói bảo hành phù hợp.');
      })
      .finally(() => setWarrantiesLoading(false));
  }, [selectedVariantId]);

  // Xử lý thay đổi số IMEI
  const handleImeiChange = (e) => {
    const val = e.target.value;
    
    // Nếu rỗng, reset lỗi imei nếu có
    if (!val) {
      if (errorMsg === 'Mã IMEI chỉ được phép chứa các chữ số từ 0-9!' || errorMsg === 'Mã IMEI phải có đúng 15 chữ số!') {
        setErrorMsg('');
      }
      setFormData(prev => ({ ...prev, imei: '' }));
      return;
    }

    // Nếu chứa bất kỳ ký tự nào không phải số
    if (/[^\d]/.test(val)) {
      setErrorMsg('Mã IMEI chỉ được phép chứa các chữ số từ 0-9!');
    } else {
      // Nếu hợp lệ (chỉ chứa số)
      if (errorMsg === 'Mã IMEI chỉ được phép chứa các chữ số từ 0-9!') {
        setErrorMsg('');
      }
    }

    // giới hạn 15 ký tự trong IMEI
    const cleanVal = val.replace(/\D/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, imei: cleanVal }));
  };

  // Xử lý gửi đơn đặt mua lẻ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVariantId) {
      setErrorMsg('Vui lòng chọn thiết bị và biến thể sản phẩm!');
      return;
    }
    if (!selectedWarrantyId) {
      setErrorMsg('Vui lòng chọn gói bảo hành bạn muốn mua!');
      return;
    }
    if (formData.imei.length !== 15) {
      setErrorMsg('Mã IMEI thiết bị phải có đúng 15 chữ số!');
      return;
    }
    if (!/^\d{15}$/.test(formData.imei)) {
      setErrorMsg('Mã IMEI thiết bị phải có đúng 15 chữ số!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        receiverName: formData.receiverName.trim(),
        receiverPhone: formData.receiverPhone.trim(),
        imei: formData.imei.trim(),
        warrantyId: parseInt(selectedWarrantyId),
        variantId: parseInt(selectedVariantId)
      };

      const res = await warrantyService.standaloneCheckout(payload);
      const data = res?.data || res;
      setSuccessData(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn đặt mua bảo hành.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in duration-300 font-sans">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-md">
          <CheckCircle size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900 uppercase">Đặt mua gói bảo hành thành công!</h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Đơn hàng số <span className="font-extrabold text-gray-800">#PS{successData.orderId}</span> đã được ghi nhận vào hệ thống.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-xl p-5 text-left text-xs font-semibold text-gray-600 space-y-2 max-w-md mx-auto">
          <div className="flex justify-between">
            <span>Khách hàng:</span>
            <span className="text-gray-900 font-bold">{formData.receiverName}</span>
          </div>
          <div className="flex justify-between">
            <span>Số điện thoại:</span>
            <span className="text-gray-900 font-bold">{formData.receiverPhone}</span>
          </div>
          <div className="flex justify-between">
            <span>Số IMEI thiết bị:</span>
            <span className="text-gray-900 font-bold">{formData.imei}</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-gray-250 pt-2 mt-2">
            <span>Gói đăng ký mua:</span>
            <span className="text-blue-600 font-bold">
              {warranties.find(w => w.id === parseInt(selectedWarrantyId))?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Mức phí bảo hiểm:</span>
            <span className="text-red-600 font-black">
              {warranties.find(w => w.id === parseInt(selectedWarrantyId))?.basePrice?.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-150 text-blue-800 rounded-lg text-xs leading-relaxed max-w-md mx-auto text-left">
          <p className="font-bold mb-1">📢 Quy trình tiếp theo:</p>
          <p>
            Vui lòng mang thiết bị của bạn cùng mã đơn hàng này đến cửa hàng gần nhất của <b>PhoneShop</b> để kỹ thuật viên thẩm định ngoại quan thiết bị. 
            Sau khi thẩm định thành công, bạn sẽ tiến hành thanh toán phí gói bảo hiểm và nhận kích hoạt.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 text-xs font-black uppercase">
          <button
            onClick={() => {
              setSuccessData(null);
              setSelectedProduct(null);
              setProductDetails(null);
              setSelectedVariantId('');
              setWarranties([]);
              setSelectedWarrantyId('');
              setFormData({ receiverName: '', receiverPhone: '', imei: '' });
            }}
            className="px-5 py-3 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition cursor-pointer"
          >
            Mua gói khác
          </button>
          <Link
            to="/track"
            className="px-5 py-3 bg-primary text-white rounded-md hover:bg-secondary transition flex items-center justify-center gap-1 shadow cursor-pointer"
          >
            Tra cứu đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 font-sans space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
          <ShieldCheck size={26} />
        </div>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Mua Lẻ Gói Bảo Hành Mở Rộng</h2>
        <p className="text-xs text-gray-500 font-medium">
          Đăng ký bảo hiểm rơi vỡ, vào nước cho máy cũ đã qua sử dụng của bạn cực kỳ nhanh chóng.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bước 1: Tìm và chọn thiết bị */}
        <div className="bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-2xs">
          <h3 className="text-sm font-black text-gray-900 uppercase border-b border-gray-100 pb-2">Bước 1: Chọn thiết bị của bạn</h3>
          
          {selectedProduct ? (
            <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="text-primary shrink-0" size={20} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900">{selectedProduct.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold">Danh mục: {selectedProduct.categoryName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setProductDetails(null);
                  setSelectedVariantId('');
                  setWarranties([]);
                  setSelectedWarrantyId('');
                }}
                className="text-[10px] font-black uppercase text-red-500 hover:underline cursor-pointer"
              >
                Thay đổi
              </button>
            </div>
          ) : (
            <div className="space-y-3 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Gõ tìm kiếm điện thoại của bạn (ví dụ: iPhone 15, S24...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-250 rounded-lg text-xs font-semibold focus:border-primary outline-none"
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={15} />
              </div>
              
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                  {productsLoading ? (
                    <div className="p-3 text-center text-gray-400">Đang tìm kiếm...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-3 text-center text-gray-400">Không tìm thấy sản phẩm phù hợp.</div>
                  ) : (
                    filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full p-3 text-left hover:bg-gray-50 flex justify-between items-center cursor-pointer transition-colors"
                      >
                        <span>{p.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{p.categoryName}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chọn biến thể (Color / Storage) */}
          {selectedProduct && (
            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
              <label className="block text-[10px] uppercase font-black text-gray-400">Chọn biến thể (Màu sắc / Bộ nhớ):</label>
              {variantsLoading ? (
                <div className="p-3 text-xs font-bold text-gray-400 flex items-center gap-1.5 bg-gray-50 border border-gray-250 rounded-lg">
                  <RefreshCw className="animate-spin text-primary" size={13} />
                  <span>Đang tải danh sách biến thể...</span>
                </div>
              ) : variants.length === 0 ? (
                <div className="p-3 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-lg">
                  Sản phẩm này chưa được cấu hình biến thể nào!
                </div>
              ) : (
                <select
                  required
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full p-3 border border-gray-250 rounded-lg bg-white text-xs font-semibold focus:border-primary outline-none"
                >
                  <option value="" disabled>-- Vui lòng chọn biến thể sản phẩm --</option>
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} - {v.price ? `${v.price.toLocaleString('vi-VN')}₫` : 'Liên hệ'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Bước 2: Chọn gói bảo hành */}
        {selectedVariantId && (
          <div className="bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-2xs animate-in slide-in-from-top-1 duration-250">
            <h3 className="text-sm font-black text-gray-900 uppercase border-b border-gray-100 pb-2">Bước 2: Chọn gói bảo hành mở rộng</h3>
            
            {warrantiesLoading ? (
              <div className="p-8 text-center flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                <RefreshCw className="animate-spin text-primary" size={15} />
                <span>Đang tải các gói bảo hành khả dụng cho thiết bị này...</span>
              </div>
            ) : warranties.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                Hiện tại không có gói bảo hành nào khả dụng cho thiết bị này.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {warranties.map(w => {
                  const isChecked = String(w.id) === String(selectedWarrantyId);
                  return (
                    <label
                      key={w.id}
                      className={`relative flex flex-col justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedWarranty"
                        required
                        value={w.id}
                        checked={isChecked}
                        onChange={(e) => setSelectedWarrantyId(e.target.value)}
                        className="absolute right-3 top-3 w-4 h-4 text-blue-600 border-gray-300 cursor-pointer"
                      />
                      <div className="space-y-1.5 pr-6">
                        <span className="block text-xs font-black text-gray-900 leading-snug">{w.name}</span>
                        <span className="block text-[10px] text-gray-500 leading-normal line-clamp-2">{w.description}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-2.5">
                        <span className="text-[10px] text-gray-400 font-bold">Thời gian: {w.durationMonths} Tháng</span>
                        <span className="text-xs font-black text-red-600">{w.basePrice?.toLocaleString('vi-VN')}₫</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bước 3: Điền thông tin */}
        {selectedWarrantyId && (
          <div className="bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-2xs animate-in slide-in-from-top-1 duration-250">
            <h3 className="text-sm font-black text-gray-900 uppercase border-b border-gray-100 pb-2">Bước 3: Thông tin thẩm định & Thanh toán</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-black text-gray-400 flex items-center gap-1">
                  <User size={12} />
                  <span>Họ tên khách hàng:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ tên đầy đủ"
                  value={formData.receiverName}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverName: e.target.value }))}
                  className="w-full p-2.5 border border-gray-250 rounded-lg text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-black text-gray-400 flex items-center gap-1">
                  <Phone size={12} />
                  <span>Số điện thoại:</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Nhập số điện thoại liên lạc"
                  value={formData.receiverPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverPhone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full p-2.5 border border-gray-250 rounded-lg text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] uppercase font-black text-gray-400 flex items-center gap-1">
                  <Smartphone size={12} />
                  <span>Mã IMEI thiết bị máy cũ (15 chữ số):</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={16} // Cho phép gõ thêm ký tự thứ 16 để kích hoạt validation báo lỗi (nhưng handleImeiChange vẫn slice về 15)
                  placeholder="Vui lòng nhấn *#06# trên điện thoại để lấy 15 số IMEI"
                  value={formData.imei}
                  onChange={handleImeiChange}
                  className="w-full p-2.5 border border-gray-250 rounded-lg text-xs font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-lg font-black transition active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 group cursor-pointer border-0 mt-2 shadow"
            >
              {submitting ? 'ĐANG TẠO ĐƠN ĐĂNG KÝ...' : 'ĐĂNG KÝ ĐẶT MUA BẢO HÀNH'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
