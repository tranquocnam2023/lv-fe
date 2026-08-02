import React, { useState, useEffect } from 'react';
import { warrantyService } from '../../services/warrantyService';
import { ShieldCheck, HelpCircle, XCircle } from 'lucide-react';

/**
 * ============================================================================
 * COMPONENT: WarrantySelector (Chọn gói bảo hành mở rộng)
 * ============================================================================
 * Chức năng & Giao diện (CellphoneS / TGDĐ Style):
 *  1. Tự động gọi API lấy danh sách gói bảo hành phù hợp với biến thể (variantId) đang chọn.
 *  2. Hiển thị dạng thẻ danh sách nằm ngang hoặc lưới gọn đẹp.
 *  3. Cho phép xem chi tiết điều khoản gói bảo hành qua Modal.
 *  4. Chọn hoặc bỏ chọn gói bảo hành để cộng gộp vào giỏ hàng.
 * ============================================================================
 */
export default function WarrantySelector({ variantId, selectedWarranty, onSelectWarranty }) {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTerms, setActiveTerms] = useState(null); // Lưu thông tin gói đang xem điều khoản trong modal

  useEffect(() => {
    if (!variantId) return;

    const fetchWarranties = async () => {
      setLoading(true);
      try {
        const res = await warrantyService.getWarrantiesForVariant(variantId);
        if (res && res.data) {
          setWarranties(res.data);
        } else if (res) {
          setWarranties(res);
        }
      } catch (err) {
        console.error('Lỗi khi lấy gói bảo hành:', err);
        setWarranties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWarranties();
  }, [variantId]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse mt-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (warranties.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 font-sans">
      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800 uppercase tracking-wide">
        <ShieldCheck className="text-primary shrink-0" size={18} />
        <span>Gợi ý gói bảo hành mở rộng</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {warranties.map((w) => {
          const isSelected = selectedWarranty && selectedWarranty.id === w.id;
          return (
            <div
              key={w.id}
              onClick={() => onSelectWarranty(isSelected ? null : w)}
              className={`relative border rounded-lg p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-300 select-none ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Vòng tròn chọn ở góc phải */}
              <div className="absolute top-3.5 right-3.5">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Thông tin gói */}
              <div className="pr-6 space-y-1">
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {w.name}
                </p>
                <p className="text-xs font-black text-primary">
                  +{w.basePrice?.toLocaleString('vi-VN')}₫
                </p>
              </div>

              {/* Link xem chi tiết điều khoản */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTerms(w);
                }}
                className="mt-2.5 text-[10px] text-gray-400 font-bold hover:text-primary transition-colors flex items-center gap-1 w-fit"
              >
                <HelpCircle size={11} />
                Xem điều khoản chi tiết
              </button>
            </div>
          );
        })}
      </div>

      {/* POPUP XEM CHI TIẾT ĐIỀU KHOẢN (MODAL) */}
      {activeTerms && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-100">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-primary" size={20} />
                <h3 className="text-sm font-black text-gray-900 uppercase">
                  Điều khoản: {activeTerms.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTerms(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto text-xs text-gray-600 leading-relaxed space-y-4 flex-1 font-medium">
              {activeTerms.termsHtml ? (
                <div
                  dangerouslySetInnerHTML={{ __html: activeTerms.termsHtml }}
                  className="prose prose-sm max-w-none text-gray-600"
                />
              ) : (
                <div className="whitespace-pre-line text-gray-600">
                  {activeTerms.description || 'Không có mô tả chi tiết cho gói bảo hành này.'}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50 rounded-b-lg">
              <button
                type="button"
                onClick={() => setActiveTerms(null)}
                className="px-5 py-2 bg-primary hover:bg-secondary text-white text-xs font-bold uppercase rounded transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Đồng ý & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
