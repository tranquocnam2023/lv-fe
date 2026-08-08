import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { warrantyService } from '../services/warrantyService';
import api from '../services/api';
import {
  ShieldCheck,
  Search,
  Smartphone,
  User,
  Phone,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  FileText,
  Store,
  Sparkles,
  Info
} from 'lucide-react';

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
        // Tự động chọn ngay biến thể nếu sản phẩm chỉ có 1 cấu hình duy nhất
        if (data.length === 1) {
          setSelectedVariantId(data[0].id.toString());
        }
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

    // Reset thông báo lỗi imei nếu nhập rỗng
    if (!val) {
      if (errorMsg === 'Mã IMEI chỉ được phép chứa các chữ số từ 0-9!' || errorMsg === 'Mã IMEI phải có đúng 15 chữ số!') {
        setErrorMsg('');
      }
      setFormData(prev => ({ ...prev, imei: '' }));
      return;
    }

    // Nếu chứa ký tự không phải chữ số
    if (/[^\d]/.test(val)) {
      setErrorMsg('Mã IMEI chỉ được phép chứa các chữ số từ 0-9!');
    } else {
      if (errorMsg === 'Mã IMEI chỉ được phép chứa các chữ số từ 0-9!') {
        setErrorMsg('');
      }
    }

    // Giới hạn tối đa 15 chữ số
    const cleanVal = val.replace(/\D/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, imei: cleanVal }));
  };

  // Xử lý gửi đơn đăng ký mua lẻ bảo hành
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.imei.length !== 15 || !/^\d{15}$/.test(formData.imei)) {
      setErrorMsg('Mã IMEI/Serial thiết bị phải có đúng 15 chữ số!');
      return;
    }

    if (!formData.receiverPhone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại liên lạc!');
      return;
    }

    if (!selectedVariantId) {
      setErrorMsg('Vui lòng nhập chọn tên thiết bị cũ của bạn!');
      return;
    }

    if (!selectedWarrantyId) {
      setErrorMsg('Vui lòng chọn gói bảo hành mở rộng bạn muốn mua!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        receiverName: formData.receiverName.trim() || 'Khách hàng',
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
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn đăng ký gói bảo hành.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── MÀN HÌNH ĐẶT MUA BẢO HÀNH THÀNH CÔNG ────────────────────────────────
  if (successData) {
    const selectedWarrantyObj = warranties.find(w => w.id === parseInt(selectedWarrantyId));
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in duration-300 font-sans">
        <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center text-green-600 mx-auto shadow-md">
          <CheckCircle size={44} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-[11px] font-black uppercase rounded-full tracking-wider">
            Đăng ký thành công
          </span>
          <h2 className="text-2xl font-black text-gray-900 uppercase">ĐẶT MUA GÓI BẢO HÀNH THÀNH CÔNG!</h2>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Mã đơn đăng ký của bạn là <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">#PS{successData.orderId}</span>
          </p>
        </div>

        {/* Khối thông tin chi tiết đơn */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left text-xs font-semibold text-gray-600 space-y-3 shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-gray-150">
            <span className="text-gray-500 font-bold">Mã đơn đăng ký:</span>
            <span className="text-blue-600 font-black text-sm">#PS{successData.orderId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Người đăng ký:</span>
            <span className="text-gray-900 font-bold">{formData.receiverName || 'Khách hàng'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Số điện thoại:</span>
            <span className="text-gray-900 font-bold">{formData.receiverPhone}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Số IMEI / Serial thiết bị:</span>
            <span className="text-gray-900 font-extrabold tracking-wider bg-gray-100 px-2 py-0.5 rounded">{formData.imei}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Thiết bị đăng ký:</span>
            <span className="text-gray-900 font-bold">{selectedProduct?.name || 'Điện thoại cũ'}</span>
          </div>

          <div className="flex justify-between border-t border-dashed border-gray-200 pt-3 mt-2">
            <span className="text-gray-500">Gói bảo hành đăng ký:</span>
            <span className="text-blue-600 font-bold">
              {selectedWarrantyObj?.name || 'Gói bảo hành mở rộng'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-bold">Mức phí bảo hiểm:</span>
            <span className="text-red-600 font-black text-base">
              {selectedWarrantyObj?.basePrice?.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>

        {/* Khối hướng dẫn thẩm định tại shop */}
        <div className="p-5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed text-left shadow-2xs space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-800 uppercase text-xs">
            <Store size={18} className="text-amber-600 shrink-0" />
            <span>📢 Quy trình thẩm định & kích hoạt tại cửa hàng:</span>
          </div>
          <p className="text-amber-800/90 font-medium pl-6">
            Vui lòng mang thiết bị cũ của bạn cùng mã đơn <b>#PS{successData.orderId}</b> đến cửa hàng <b>PhoneShop</b> gần nhất.
            Kỹ thuật viên (KTV) sẽ tiến hành kiểm tra ngoại quan & chức năng máy. Sau khi thẩm định thành công, gói bảo hành sẽ chính thức có hiệu lực!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 text-xs font-black uppercase">
          <button
            onClick={() => {
              setSuccessData(null);
              setSelectedProduct(null);
              setSelectedVariantId('');
              setWarranties([]);
              setSelectedWarrantyId('');
              setFormData({ receiverName: '', receiverPhone: '', imei: '' });
            }}
            className="px-6 py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition cursor-pointer font-extrabold"
          >
            Mua gói bảo hành khác
          </button>
          <Link
            to="/track"
            className="px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer font-extrabold"
          >
            Tra cứu đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // ─── GIAO DIỆN CHÍNH MUA LẺ BẢO HÀNH ─────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans space-y-8">
      {/* ─── HERO HEADER BANNER (PHONG CÁCH SẢN PHẨM) ────────────────────── */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <ShieldCheck size={280} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-blue-100 border border-white/20">
            <Sparkles size={14} className="text-yellow-300 animate-spin" />
            <span>Dịch Vụ Bảo Hành Mở Rộng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">MUA LẺ GÓI BẢO HÀNH MỞ RỘNG</h1>
          <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
            Bảo vệ toàn diện rơi vỡ, vào nước, lỗi nhà sản xuất cho máy cũ đã qua sử dụng của bạn. Kích hoạt nhanh chóng ngay sau khi KTV thẩm định máy tại cửa hàng!
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── THẺ DANH SÁCH GÓI BẢO HÀNH (PRODUCT CARDS GRID STYLE) ──────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600" />
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Các Gói Bảo Hành Mở Rộng Khả Dụng</h2>
          </div>
          <span className="text-xs font-bold text-gray-400">Chọn gói bảo hành mong muốn</span>
        </div>

        {/* Render danh sách gói bảo hành khả dụng */}
        {selectedVariantId && warranties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranties.map(w => {
              const isChecked = String(w.id) === String(selectedWarrantyId);
              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWarrantyId(w.id.toString())}
                  className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between ${isChecked
                      ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/30'
                      : 'border-gray-200 hover:border-blue-300 bg-white shadow-2xs'
                    }`}
                >
                  {/* Badge nhãn gói */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-md tracking-wider">
                      {w.name.includes('VIP') ? 'BẢO HÀNH VIP' : w.name.includes('Rơi vỡ') ? 'BẢO HIỂM RƠI VỠ' : 'BẢO HÀNH 1 ĐỔI 1'}
                    </span>
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {w.durationMonths} Tháng
                    </span>
                  </div>

                  {/* Tên & mô tả */}
                  <div className="space-y-2 mb-4">
                    <h3 className="text-sm font-black text-gray-900 leading-snug">{w.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3">
                      {w.description || 'Bảo vệ toàn diện thiết bị, đổi mới linh kiện chính hãng khi phát sinh sự cố.'}
                    </p>
                  </div>

                  {/* Phí bảo hiểm & Nút chọn */}
                  <div className="pt-3 border-t border-gray-150 flex items-center justify-between mt-auto">
                    <div>
                      <span className="block text-[10px] uppercase text-gray-400 font-bold">Mức phí bảo hiểm:</span>
                      <span className="text-base font-black text-red-600">{w.basePrice?.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <button
                      type="button"
                      className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${isChecked
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                    >
                      {isChecked ? 'ĐÃ CHỌN' : 'CHỌN GÓI'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-blue-50/50 border border-blue-150 rounded-2xl text-xs text-blue-800 font-semibold flex items-center gap-3">
            <Info size={20} className="text-blue-600 shrink-0" />
            <span>
              Vui lòng chọn thiết bị ở <b>Bước 3</b> bên dưới để hệ thống hiển thị danh sách các gói bảo hành mở rộng chính xác cho dòng máy của bạn.
            </span>
          </div>
        )}
      </div>

      {/* ─── FORM ĐĂNG KÝ MUA LẺ BẢO HÀNH (THỨ TỰ 3 BƯỚC MỚI) ─────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 space-y-6 shadow-xs">
          <div className="border-b border-gray-150 pb-3 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Thông Tin Đăng Ký Gói Bảo Hành</h2>
          </div>

          {/* ─── BƯỚC 1: NHẬP SỐ IMEI / SERIAL (15 CHỮ SỐ) ───────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-900 uppercase flex items-center gap-1.5">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[11px] font-black">1</span>
                <span>Bước 1: Nhập số IMEI / Serial 15 số của thiết bị</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-150">
                Nhấn *#06# trên bàn phím điện thoại để lấy IMEI
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={16}
              placeholder="Nhập chính xác 15 chữ số IMEI (Ví dụ: 863456041234567)"
              value={formData.imei}
              onChange={handleImeiChange}
              className="w-full p-3.5 border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition"
            />
            {formData.imei && formData.imei.length !== 15 && (
              <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                <AlertCircle size={13} />
                <span>Số IMEI đã nhập: {formData.imei.length}/15 chữ số</span>
              </p>
            )}
          </div>

          {/* ─── BƯỚC 2: NHẬP SỐ ĐIỆN THOẠI & THÔNG TIN LIÊN LẠC ─────────── */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-900 uppercase flex items-center gap-1.5">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[11px] font-black">2</span>
              <span>Bước 2: Nhập số điện thoại & Họ tên người đăng ký</span>
              <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-black text-gray-500 flex items-center gap-1">
                  <Phone size={12} />
                  <span>Số điện thoại liên lạc:</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Nhập số điện thoại"
                  value={formData.receiverPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverPhone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-black text-gray-500 flex items-center gap-1">
                  <User size={12} />
                  <span>Tên người đăng ký (Họ và tên):</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên đầy đủ"
                  value={formData.receiverName}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* ─── BƯỚC 3: NHẬP TÊN THIẾT BỊ CŨ CỦA BẠN (IPHONE, SAMSUNG...) ──── */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="text-xs font-black text-gray-900 uppercase flex items-center gap-1.5">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[11px] font-black">3</span>
              <span>Bước 3: Nhập tên thiết bị cũ của bạn (Điện thoại iPhone, Samsung...)</span>
              <span className="text-red-500">*</span>
            </label>

            {selectedProduct ? (
              <div className="flex items-center justify-between p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-blue-600 shrink-0" size={24} />
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-gray-900">{selectedProduct.name}</span>
                    <span className="text-[10px] text-gray-500 font-bold">Danh mục: {selectedProduct.categoryName || 'Điện thoại'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setSelectedVariantId('');
                    setWarranties([]);
                    setSelectedWarrantyId('');
                  }}
                  className="text-[11px] font-black uppercase text-red-600 hover:underline cursor-pointer"
                >
                  Thay đổi thiết bị
                </button>
              </div>
            ) : (
              <div className="space-y-2 relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Gõ tên thiết bị điện thoại cũ của bạn (ví dụ: iPhone 15 Pro, Samsung S24...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl text-xs font-bold focus:border-blue-600 outline-none"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                </div>

                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-100 text-xs font-semibold text-gray-800">
                    {productsLoading ? (
                      <div className="p-4 text-center text-gray-400">Đang tìm kiếm danh mục thiết bị...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">Không tìm thấy sản phẩm phù hợp.</div>
                    ) : (
                      filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className="w-full p-3.5 text-left hover:bg-blue-50 flex justify-between items-center cursor-pointer transition-colors"
                        >
                          <span className="font-bold text-gray-900">{p.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-black">{p.categoryName}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Chọn biến thể (Nếu thiết bị có nhiều dung lượng / màu sắc) */}
            {selectedProduct && variants.length > 1 && (
              <div className="space-y-2 animate-in slide-in-from-top-1 duration-200 pt-2">
                <label className="block text-[10px] uppercase font-black text-gray-500">Chọn cấu hình biến thể (Bộ nhớ / Màu sắc):</label>
                {variantsLoading ? (
                  <div className="p-3 text-xs font-bold text-gray-400 flex items-center gap-2 bg-gray-50 border rounded-xl">
                    <RefreshCw className="animate-spin text-blue-600" size={14} />
                    <span>Đang tải biến thể...</span>
                  </div>
                ) : (
                  <select
                    required
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-white text-xs font-bold focus:border-blue-600 outline-none cursor-pointer"
                  >
                    <option value="" disabled>-- Vui lòng chọn phiên bản bộ nhớ / màu sắc --</option>
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} - {v.price ? `${v.price.toLocaleString('vi-VN')}₫` : 'Phiên bản chính'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* ─── NOTE BOX THẨM ĐỊNH TẠI CỬA HÀNG ─────────────────────────── */}
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-start gap-2.5">
            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              📌 <b>Lưu ý quan trọng:</b> Gói bảo hành mở rộng sẽ có hiệu lực chính thức sau khi kỹ thuật viên (KTV) tại cửa hàng thẩm định ngoại quan & phần cứng thiết bị.
            </p>
          </div>

          {/* ─── KHỐI CHI TIẾT ĐIỀU KHOẢN (NGAY TRÊN NÚT MUA GÓI) ───────────── */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs text-slate-700">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5 font-black text-slate-900 uppercase">
              <ShieldAlert size={18} className="text-blue-600" />
              <span>Chi Tiết Điều Khoản & Quyền Lợi Gói Bảo Hành Mở Rộng</span>
            </div>

            <ul className="space-y-2 text-[11px] leading-relaxed font-semibold">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span><b>Phạm vi bảo hộ:</b> Miễn phí chi phí sửa chữa, thay thế linh kiện chính hãng hoặc 1 đổi 1 với các sự cố rơi vỡ, vào nước, cháy nổ linh kiện do tai nạn không mong muốn.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span><b>Ràng buộc thẩm định:</b> Do gói bảo hành mua riêng cho máy cũ, khách hàng bắt buộc chọn hình thức <b>Thẩm định & Thanh toán tại cửa hàng</b> (KTV showroom trực tiếp kiểm tra máy).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span><b>Điều kiện từ chối:</b> Từ chối bảo hành đối với các thiết bị bị biến dạng hoàn toàn không thể nhận dạng số IMEI/Serial hoặc đã bị can thiệp phần cứng trái phép ngoài showroom PhoneShop.</span>
              </li>
            </ul>
          </div>

          {/* ─── NÚT MUA GÓI BẢO HÀNH BẮT BỘC MUA TẠI CỬA HÀNG ───────────── */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl font-black transition active:scale-98 uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md border-0 mt-4"
          >
            {submitting ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                <span>ĐANG TẠO ĐƠN ĐĂNG KÝ BẢO HÀNH...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>[ MUA GÓI BẢO HÀNH MỞ RỘNG ]</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

