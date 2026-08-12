import React, { useState } from 'react';
import { X, Check, Calculator, ShieldCheck, CreditCard, Building2, ChevronRight } from 'lucide-react';

export default function InstallmentModal({
  isOpen,
  onClose,
  product,
  displayPrice = 0,
  selectedAttributes = {},
  selectedWarranty = null,
  initialType = 'company',
  onConfirmInstallment
}) {
  if (!isOpen || !product) return null;

  const [type, setType] = useState(initialType); // 'company' | 'card'
  const [prepayPercent, setPrepayPercent] = useState(30); // 20%, 30%, 50%
  const [months, setMonths] = useState(6); // 6, 9, 12 tháng
  const [provider, setProvider] = useState('Home Credit'); // 'Home Credit', 'FE Credit', 'MCredit'
  const [bank, setBank] = useState('Techcombank'); // 'Techcombank', 'VPBank', 'Vietcombank', 'Sacombank'

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [error, setError] = useState('');

  // Tính toán tiền trả góp
  const totalPrice = (displayPrice || 0) + (selectedWarranty?.price || 0);
  const prepayAmount = Math.round((totalPrice * prepayPercent) / 100);
  const remainingAmount = totalPrice - prepayAmount;
  const monthlyPayment = Math.round(remainingAmount / months);
  const totalInstallmentPaid = prepayAmount + (monthlyPayment * months);
  const differenceAmount = totalInstallmentPaid - totalPrice;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Vui lòng nhập Họ tên và Số điện thoại để làm hồ sơ trả góp.');
      return;
    }

    const installmentDetails = {
      type: type === 'company' ? `Trả góp qua ${provider}` : `Trả góp qua thẻ ${bank}`,
      prepayPercent,
      prepayAmount,
      months,
      monthlyPayment,
      totalPrice,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim()
    };

    onConfirmInstallment(installmentDetails);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-150 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2">
              <Calculator className="text-red-600" size={20} />
              <span>Dự Toán &amp; Đặt Hàng Trả Góp 0%</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {product.name} ({Object.values(selectedAttributes).filter(Boolean).join(' - ')})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer border-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs chọn loại trả góp */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setType('company')}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer border-0 ${
              type === 'company' ? 'bg-white text-red-600 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={16} />
            <span>Qua Công Ty Tài Chính</span>
          </button>

          <button
            type="button"
            onClick={() => setType('card')}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer border-0 ${
              type === 'card' ? 'bg-white text-blue-600 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard size={16} />
            <span>Qua Thẻ Tín Dụng (0%)</span>
          </button>
        </div>

        {/* Lựa chọn Nhà cung cấp / Ngân hàng */}
        {type === 'company' ? (
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase">1. Chọn Đơn vị tài chính:</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              {['Home Credit', 'FE Credit', 'MCredit'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    provider === p ? 'border-2 border-red-600 bg-red-50/30 text-red-600 font-black' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase">1. Chọn Ngân hàng phát hành thẻ:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
              {['Techcombank', 'VPBank', 'Vietcombank', 'Sacombank'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBank(b)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    bank === b ? 'border-2 border-blue-600 bg-blue-50/30 text-blue-600 font-black' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lựa chọn Mức trả trước & Kỳ hạn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase">2. Số tiền trả trước:</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {[20, 30, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setPrepayPercent(pct)}
                  className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    prepayPercent === pct ? 'border-2 border-slate-900 bg-slate-900 text-white font-black' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {pct}% ({Math.round((totalPrice * pct) / 100).toLocaleString('vi-VN')}₫)
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase">3. Kỳ hạn trả góp:</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {[6, 9, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    months === m ? 'border-2 border-slate-900 bg-slate-900 text-white font-black' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {m} tháng
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KHUNG BẢNG TÍNH CHI TIẾT SỐ TIỀN */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Giá niêm yết sản phẩm:</span>
            <span className="font-bold text-slate-900">{totalPrice.toLocaleString('vi-VN')}₫</span>
          </div>
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Số tiền trả trước ({prepayPercent}%):</span>
            <span className="font-extrabold text-slate-900">{prepayAmount.toLocaleString('vi-VN')}₫</span>
          </div>
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Số tiền vay trả góp ({100 - prepayPercent}%):</span>
            <span className="font-extrabold text-slate-900">{remainingAmount.toLocaleString('vi-VN')}₫</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-black text-sm text-red-600">
            <span>Góp mỗi tháng ({months} tháng):</span>
            <span className="text-base">{monthlyPayment.toLocaleString('vi-VN')}₫ / tháng</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold pt-1">
            <span>Chênh lệch so với mua thẳng:</span>
            <span className="text-emerald-600 font-bold">0₫ (Trả góp 0% lãi suất)</span>
          </div>
        </div>

        {/* FORM NHẬP THÔNG TIN KHÁCH HÀNG */}
        <form onSubmit={handleConfirm} className="space-y-3 pt-1">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên người đăng ký *</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:border-red-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
              <input
                type="tel"
                placeholder="0912345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:border-red-600 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-md"
          >
            <span>XÁC NHẬN ĐẶT HÀNG TRẢ GÓP #{months} THÁNG</span>
            <ChevronRight size={16} />
          </button>
        </form>

      </div>
    </div>
  );
}
