import React from 'react';
import { Check, X, ShoppingCart, ShieldCheck, Award, Gift, Truck, RefreshCw } from 'lucide-react';
import WarrantySelector from '../../../components/product/WarrantySelector';
import WishlistButton from '../../../components/product/WishlistButton';

// Hàm xử lý logic/sự kiện: getHexForColor
const getHexForColor = (colorName) => {
  // Khai báo biến/hằng số: c - Dùng trong logic xử lý của component
  const c = colorName.toLowerCase();
  if (c.includes('đen') || c.includes('black')) return '#18181b';
  if (c.includes('titan') || c.includes('xám') || c.includes('gray')) return '#64748b';
  if (c.includes('xanh') || c.includes('blue')) return '#2563eb';
  if (c.includes('trắng') || c.includes('white')) return '#ffffff';
  if (c.includes('vàng') || c.includes('gold')) return '#eab308';
  if (c.includes('đỏ') || c.includes('red')) return '#dc2626';
  if (c.includes('hồng') || c.includes('pink')) return '#ec4899';
  return '#94a3b8';
};

export default function ProductSummaryInfo({
  product,
  displayDetails,
  attributesConfig,
  selectedAttributes,
  onAttributeClick,
  onAddToCart,
  onBuyNow,
  variantId,
  selectedWarranty,
  onSelectWarranty
}) {
  // Khai báo biến/hằng số: promotions - Dùng trong logic xử lý của component
  const promotions = [
    { title: "Thu cũ Đổi mới", desc: "Trợ giá lên đến 2.000.000₫" },
    { title: "Thanh toán VNPay-QR", desc: "Giảm thêm 500.000₫ cho đơn hàng từ 4.000.000₫" },
    { title: "Bảo hành mở rộng", desc: "Tặng gói bảo hành rơi vỡ 12 tháng (Trị giá 1.500.000₫)" },
    { title: "Mua kèm phụ kiện", desc: "Ưu đãi mua kèm Phụ kiện chính hãng giảm đến 30%" }
  ];

  // Hàm xử lý logic/sự kiện: calculateDiscountPercent
  const calculateDiscountPercent = () => {
    if (displayDetails.originalPrice && displayDetails.originalPrice > displayDetails.price) {
      return Math.round(((displayDetails.originalPrice - displayDetails.price) / displayDetails.originalPrice) * 100);
    }
    return 0;
  };

  // Khai báo biến/hằng số: discountPercent - Dùng trong logic xử lý của component
  const discountPercent = calculateDiscountPercent();

  return (
    <div className="lg:col-span-5 space-y-4 font-sans text-slate-800">
      <div className="sticky top-6 space-y-4">
        
        {/* Cảnh báo tạm ngưng */}
        {product.isAvailable === false && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
              <X size={16} />
            </div>
            <div>
              <h5 className="font-bold text-rose-700 text-xs uppercase tracking-wide">Sản phẩm tạm ngưng kinh doanh</h5>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Danh mục sản phẩm này hiện đang tạm ngưng hoạt động. Quý khách vui lòng tham khảo các dòng sản phẩm khác.
              </p>
            </div>
          </div>
        )}

        {/* THUỘC TÍNH BIẾN THỂ (MÀU SẮC / DUNG LƯỢNG) */}
        {Object.entries(attributesConfig).map(([attrKey, values]) => {
          // Khai báo biến/hằng số: isColorAttr - Dùng trong logic xử lý của component
          const isColorAttr = attrKey.toLowerCase().includes('màu') || attrKey.toLowerCase().includes('color');

          if (isColorAttr) {
            return (
              <div key={attrKey} className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-extrabold text-slate-700 uppercase text-[11px] tracking-wider">{attrKey}:</span>
                  <span className="text-slate-900 font-black">{selectedAttributes[attrKey] || 'Chưa chọn'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {values.map((val) => {
                    // Khai báo biến/hằng số: isSelected - Dùng trong logic xử lý của component
                    const isSelected = selectedAttributes[attrKey] === val;
                    // Khai báo biến/hằng số: hexColor - Dùng trong logic xử lý của component
                    const hexColor = getHexForColor(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onAttributeClick(attrKey, val)}
                        className={`relative p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-red-600 bg-red-50/20 text-slate-900 ring-1 ring-red-600/30'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ backgroundColor: hexColor }}
                        />
                        <div className="leading-tight">
                          <span className="block text-xs font-bold text-slate-900">{val}</span>
                          <span className="block text-[10px] font-extrabold text-red-600">
                            {displayDetails.price.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        {isSelected && (
                          <span className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-lg px-1 py-0.5">
                            <Check size={9} className="stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Dung lượng / Kích thước
          return (
            <div key={attrKey} className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-extrabold text-slate-700 uppercase text-[11px] tracking-wider">{attrKey}:</span>
                <span className="text-slate-900 font-black">{selectedAttributes[attrKey] || 'Chưa chọn'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {values.map((val) => {
                  // Khai báo biến/hằng số: isSelected - Dùng trong logic xử lý của component
                  const isSelected = selectedAttributes[attrKey] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onAttributeClick(attrKey, val)}
                      className={`relative py-2 px-3 rounded-xl text-center border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-red-600 bg-red-50/20 text-red-600 font-extrabold ring-1 ring-red-600/30'
                          : 'border-slate-200 bg-white text-slate-700 font-bold hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{val}</span>
                      <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">
                        {displayDetails.price.toLocaleString('vi-VN')}₫
                      </span>
                      {isSelected && (
                        <span className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-lg px-1 py-0.5">
                          <Check size={9} className="stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* KHUNG GIÁ SẢN PHẨM CHUẨN RETAIL */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-baseline flex-wrap gap-2.5">
            <span className="text-3xl font-black text-red-600 tracking-tight">
              {displayDetails.price.toLocaleString('vi-VN')}₫
            </span>
            {displayDetails.originalPrice && displayDetails.originalPrice > displayDetails.price && (
              <span className="text-sm text-slate-400 line-through font-bold">
                {displayDetails.originalPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
            {discountPercent > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                -{discountPercent}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>{displayDetails.stock > 0 ? `Còn hàng (Giao nhanh 2H)` : 'Tạm hết hàng'}</span>
          </div>
        </div>

        {/* KHUYẾN MÃI ĐẶC BIỆT */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="bg-slate-100/90 px-4 py-2.5 text-slate-900 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <Gift size={15} className="text-red-600" />
              <span>Khuyến mại đặc biệt</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">Chính hãng</span>
          </div>
          <div className="p-3.5 space-y-2.5 text-xs text-slate-700">
            {promotions.map((p, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <p className="leading-snug">
                  <strong className="text-slate-900 font-bold">{p.title}: </strong>
                  <span>{p.desc}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CHỌN GÓI BẢO HÀNH MỞ RỘNG */}
        {displayDetails.stock > 0 && product.isAvailable !== false && (
          <WarrantySelector
            variantId={variantId}
            selectedWarranty={selectedWarranty}
            onSelectWarranty={onSelectWarranty}
          />
        )}

        {/* CỤM NÚT ĐẶT MUA HÀNG CHUẨN RETAIL */}
        <div className="space-y-2.5 pt-1">
          {/* Nút MUA NGAY ĐỎ CHÍNH HÃNG */}
          <button
            type="button"
            onClick={onBuyNow}
            disabled={displayDetails.stock === 0 || product.isAvailable === false}
            className={`w-full ${
              displayDetails.stock > 0 && product.isAvailable !== false
                ? 'bg-red-600 hover:bg-red-700 shadow-sm'
                : 'bg-slate-300 cursor-not-allowed'
            } text-white rounded-xl py-3.5 px-4 font-black transition-all flex flex-col items-center justify-center border-0 cursor-pointer select-none`}
          >
            <span className="text-base uppercase tracking-wider font-black">
              {product.isAvailable === false ? 'TẠM NGƯNG KINH DOANH' : displayDetails.stock > 0 ? 'MUA NGAY' : 'HẾT HÀNG'}
            </span>
            <span className="text-[11px] font-normal opacity-90">
              {displayDetails.stock > 0 ? 'Giao tận nơi hoặc nhận tại cửa hàng' : 'Vui lòng quay lại sau'}
            </span>
          </button>



          {/* Nút THÊM VÀO GIỎ HÀNG & YÊU THÍCH */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddToCart}
              disabled={displayDetails.stock === 0 || product.isAvailable === false}
              className={`flex-1 py-3 rounded-xl border-2 font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
                displayDetails.stock > 0 && product.isAvailable !== false
                  ? 'border-red-600 text-red-600 bg-white hover:bg-red-50/50'
                  : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={17} />
              <span>THÊM VÀO GIỎ HÀNG</span>
            </button>

            <WishlistButton
              productId={product.id || product.Id}
              className="h-11 w-11 shrink-0 rounded-xl border-2 border-slate-200 hover:border-rose-400 flex items-center justify-center"
              iconSize={20}
            />
          </div>
        </div>

        {/* UY TÍN CỬA HÀNG */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs text-slate-700">
          <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Quyền lợi mua hàng tại PhoneShop:</div>
          <div className="space-y-1.5 text-[11px] text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-slate-700 shrink-0" />
              <span>Giao hàng tận nơi miễn phí cho đơn từ 500.000₫</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-slate-700 shrink-0" />
              <span>Bảo hành chính hãng 12 tháng tại hệ thống ủy quyền</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-slate-700 shrink-0" />
              <span>1 đổi 1 trong 30 ngày nếu phát sinh lỗi nhà sản xuất</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
