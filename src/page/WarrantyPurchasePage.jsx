import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { warrantyService } from '../services/warrantyService';
import { ShieldCheck, Smartphone, User, Phone, CheckCircle, RefreshCw, AlertCircle, X, Info, Sparkles, Lock } from 'lucide-react';

export default function WarrantyPurchasePage() {
  const navigate = useNavigate();

  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State cho Gói được chọn
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [activateLater, setActivateLater] = useState(false);
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverPhone: '',
    imei: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Load tất cả gói bảo hành khả dụng
  useEffect(() => {
    setLoading(true);
    warrantyService.getAllWarranties()
      .then(res => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setWarranties(data);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách gói bảo hành:", err);
        setErrorMsg("Không thể nạp danh sách gói bảo hành.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenModal = (warranty) => {
    setSelectedWarranty(warranty);
    setActivateLater(false);
    setFormData({ receiverName: '', receiverPhone: '', imei: '' });
    setErrorMsg('');
  };

  const handleCloseModal = () => {
    setSelectedWarranty(null);
    setErrorMsg('');
  };

  const handleImeiChange = (e) => {
    const val = e.target.value;
    const cleanVal = val.replace(/\D/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, imei: cleanVal }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarranty) return;

    if (!activateLater) {
      if (formData.imei.length !== 15) {
        setErrorMsg('Mã IMEI thiết bị phải có đúng 15 chữ số! (Hoặc chọn kích hoạt sau)');
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        receiverName: formData.receiverName.trim() || 'Khách hàng',
        receiverPhone: formData.receiverPhone.trim() || '0900000000',
        imei: activateLater ? 'CHƯA_KÍCH_HOẠT' : formData.imei.trim(),
        warrantyId: selectedWarranty.id,
        variantId: 0
      };

      const res = await warrantyService.standaloneCheckout(payload);
      const data = res?.data || res;
      setSuccessData({ ...data, warranty: selectedWarranty, imei: payload.imei });
      setSelectedWarranty(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký gói bảo hành.');
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
          <h2 className="text-xl font-black text-gray-900 uppercase">Đăng ký gói bảo hành thành công!</h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Đơn hàng bảo hành <span className="font-extrabold text-gray-800">#PS{successData.orderId}</span> đã được ghi nhận.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-xl p-5 text-left text-xs font-semibold text-gray-600 space-y-2 max-w-md mx-auto">
          <div className="flex justify-between">
            <span>Mã IMEI thiết bị:</span>
            <span className="text-gray-900 font-bold">
              {successData.imei === 'CHƯA_KÍCH_HOẠT' ? (
                <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Chờ kích hoạt trong Thông Tin Cá Nhân
                </span>
              ) : (
                <span className="font-mono text-blue-600">{successData.imei}</span>
              )}
            </span>
          </div>
          <div className="flex justify-between border-t border-dashed border-gray-250 pt-2 mt-2">
            <span>Gói bảo hành:</span>
            <span className="text-blue-600 font-bold">{successData.warranty?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Thời hạn:</span>
            <span className="text-gray-900 font-bold">{successData.warranty?.durationMonths} Tháng</span>
          </div>
          <div className="flex justify-between">
            <span>Phí dịch vụ:</span>
            <span className="text-red-600 font-black">
              {successData.warranty?.basePrice?.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-150 text-blue-800 rounded-lg text-xs leading-relaxed max-w-md mx-auto text-left">
          <p className="font-bold mb-1 flex items-center gap-1">
            <Info size={14} />
            <span> Hướng dẫn quản lý bảo hành:</span>
          </p>
          <p>
            Bạn có thể truy cập trang <b>Thông Tin Cá Nhân &gt; Thiết bị &amp; Bảo hành</b> để xem chi tiết hạn bảo hành hoặc kích hoạt bổ sung mã IMEI bất kỳ lúc nào!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 text-xs font-black uppercase">
          <button
            onClick={() => setSuccessData(null)}
            className="px-5 py-3 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition cursor-pointer"
          >
            Mua gói khác
          </button>
          <Link
            to="/auth"
            className="px-5 py-3 bg-primary text-white rounded-md hover:bg-secondary transition flex items-center justify-center gap-1 shadow cursor-pointer text-center"
          >
            Vào quản lý bảo hành của tôi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 font-sans space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-8 text-white text-center space-y-3 shadow-lg relative overflow-hidden">
        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-yellow-300 mx-auto shadow-inner border border-white/20">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Dịch Vụ Bảo Hành Mở Rộng Chính Hãng</h1>
        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl mx-auto font-medium leading-relaxed">
          Bảo vệ toàn diện cho điện thoại, laptop &amp; thiết bị công nghệ của bạn. Chọn mua gói bảo hành trực tiếp và kích hoạt IMEI bất kỳ lúc nào!
        </p>
        <div className="inline-flex items-center gap-2 bg-white/15 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-yellow-200 border border-white/20">
          <Sparkles size={13} />
          <span>Kích hoạt IMEI nhanh chóng &bull; Bảo hành toàn quốc 1 đổi 1</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Gói bảo hành */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-xs font-bold text-gray-400">
          <RefreshCw className="animate-spin text-primary" size={24} />
          <span>Đang nạp các gói bảo hành...</span>
        </div>
      ) : warranties.length === 0 ? (
        <div className="p-12 text-center text-xs font-bold text-gray-400 bg-gray-50 rounded-xl border border-dashed">
          Hiện tại chưa có gói bảo hành nào được mở bán.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warranties.map(w => (
            <div
              key={w.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-150">
                    Mã gói: {w.code}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    Thời hạn {w.durationMonths} Tháng
                  </span>
                </div>
                <h3 className="text-base font-black text-gray-900 group-hover:text-primary transition-colors">
                  {w.name}
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {w.description || 'Gói bảo hiểm mở rộng chính hãng bảo vệ sự cố điện tử, rơi vỡ ngấm nước.'}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Phí đăng ký:</span>
                  <span className="text-lg font-black text-red-600">
                    {w.basePrice?.toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenModal(w)}
                  className="w-full py-3 bg-primary hover:bg-secondary text-white rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-98 shadow cursor-pointer border-0 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={16} />
                  <span>Đăng ký &amp; Nhập IMEI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal đăng ký gói & nhập IMEI */}
      {selectedWarranty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer border-0"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase">Đăng ký: {selectedWarranty.name}</h3>
                <span className="text-xs font-bold text-red-600">Phí dịch vụ: {selectedWarranty.basePrice?.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-700">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black text-gray-400 flex items-center gap-1">
                  <User size={12} />
                  <span>Họ tên khách hàng:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên người mua"
                  value={formData.receiverName}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverName: e.target.value }))}
                  className="w-full p-2.5 border border-gray-250 rounded-lg text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black text-gray-400 flex items-center gap-1">
                  <Phone size={12} />
                  <span>Số điện thoại:</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Nhập số điện thoại"
                  value={formData.receiverPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverPhone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full p-2.5 border border-gray-250 rounded-lg text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Tùy chọn Kích hoạt sau */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={activateLater}
                    onChange={(e) => setActivateLater(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 cursor-pointer"
                  />
                  <span className="font-bold text-gray-800 text-xs">Tôi muốn kích hoạt mã IMEI sau trong trang Cá Nhân</span>
                </label>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed pl-6">
                  Tùy chọn này cho phép bạn mua gói bảo hành trước, sau đó đăng nhập và nhập mã IMEI 15 số bất kỳ lúc nào để bắt đầu kích hoạt bảo hành.
                </p>
              </div>

              {/* Ô nhập IMEI nếu không tick activateLater */}
              {!activateLater && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="block text-[10px] uppercase font-black text-gray-400 flex items-center gap-1">
                    <Smartphone size={12} />
                    <span>Mã IMEI thiết bị (15 chữ số):</span>
                  </label>
                  <input
                    type="text"
                    required={!activateLater}
                    maxLength={15}
                    placeholder="Bấm *#06# trên điện thoại để xem 15 số IMEI"
                    value={formData.imei}
                    onChange={handleImeiChange}
                    className="w-full p-2.5 border border-gray-250 rounded-lg text-xs font-mono outline-none focus:border-primary"
                  />
                  {formData.imei && formData.imei.length < 15 && (
                    <span className="text-[10px] text-amber-600 font-bold">Đã nhập {formData.imei.length}/15 chữ số</span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary hover:bg-secondary disabled:bg-gray-400 text-white rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-98 cursor-pointer border-0 shadow mt-2"
              >
                {submitting ? 'Đang đăng ký...' : 'Xác Nhận Đăng Ký Bảo Hành'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
