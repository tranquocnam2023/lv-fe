import React from 'react';
import { Check, X } from 'lucide-react';
import WarrantySelector from '../../../components/product/WarrantySelector';

const getHexForColor = (colorName) => {
  const c = colorName.toLowerCase();
  if (c.includes('đen') || c.includes('black')) return '#1a1a1a';
  if (c.includes('titan') || c.includes('xám') || c.includes('gray')) return '#bebebe';
  if (c.includes('xanh') || c.includes('blue')) return '#4682b4';
  if (c.includes('trắng') || c.includes('white')) return '#f8f9fa';
  if (c.includes('vàng') || c.includes('gold')) return '#ffd700';
  if (c.includes('đỏ') || c.includes('red')) return '#e63946';
  if (c.includes('hồng') || c.includes('pink')) return '#ffb6c1';
  return '#bebebe';
};

export default function ProductSummaryInfo({
  product,
  displayProductName,
  displayDetails,
  attributesConfig,
  selectedAttributes,
  onAttributeClick,
  onAddToCart,
  onBuyNow,
  accessorySuggestions = [],
  selectedAccessories = [],
  onToggleAccessory,
  variantId,
  selectedWarranty,
  onSelectWarranty
}) {
  const promotions = [
    "Thu cũ Đổi mới: Trợ giá lên đến 2.000.000₫",
    "Giảm thêm 500.000₫ khi thanh toán qua VNPay-QR",
    "Tặng gói bảo hành rơi vỡ 12 tháng (Trị giá 1.500.000₫)",
    "Ưu đãi mua kèm Phụ kiện Apple giảm đến 30%"
  ];

  return (
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
                            onClick={() => onAttributeClick(attrKey, val)}
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
                        onClick={() => onAttributeClick(attrKey, val)}
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
              {displayDetails.originalPrice && displayDetails.originalPrice > displayDetails.price && (
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
 
          {/* Chọn gói bảo hành mở rộng */}
          {displayDetails.stock > 0 && product.isAvailable !== false && (
            <WarrantySelector
              variantId={variantId}
              selectedWarranty={selectedWarranty}
              onSelectWarranty={onSelectWarranty}
            />
          )}

          {/* CTAs */}
          <div className="space-y-4 pt-2">
            <button
              type="button"
              onClick={onBuyNow}
              disabled={displayDetails.stock === 0 || product.isAvailable === false}
              className={`w-full bg-gradient-to-r ${displayDetails.stock > 0 && product.isAvailable !== false ? 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'from-gray-400 to-gray-500 cursor-not-allowed'} text-white font-black py-4.5 rounded-md text-xl uppercase transition-all transform active:scale-95 flex flex-col items-center`}
            >
              {product.isAvailable === false ? 'TẠM NGƯNG KINH DOANH' : (displayDetails.stock > 0 ? 'MUA NGAY' : 'HẾT HÀNG')}
              <span className="text-[10px] font-bold opacity-80 normal-case mt-0.5">
                {product.isAvailable === false ? '(Sản phẩm tạm ngưng kinh doanh)' : (displayDetails.stock > 0 ? '(Giao tận nơi hoặc nhận tại cửa hàng)' : '(Vui lòng quay lại sau)')}
              </span>
            </button>
            <button
              type="button"
              onClick={onAddToCart}
              disabled={displayDetails.stock === 0 || product.isAvailable === false}
              className={`w-full ${displayDetails.stock > 0 && product.isAvailable !== false ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} font-black py-3.5 rounded-md text-md uppercase transition-all flex items-center justify-center gap-2`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {product.isAvailable === false ? 'SẢN PHẨM TẠM NGƯNG KINH DOANH' : 'THÊM VÀO GIỎ HÀNG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
