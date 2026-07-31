import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Tỉ lệ giảm giá phụ kiện mua kèm hiển thị trên giao diện (giảm 10%).
// LƯU Ý: Giá trị giảm giá thực tế và giới hạn số lượng mua kèm (MaxQuantityAllowed) sẽ do Back-End tính toán và áp đặt khi tạo đơn hàng.
const BUNDLE_DISCOUNT_RATE = 0.9;

export default function FrequentlyBoughtTogether({ accessorySuggestions = [], onSelectAccessory }) {
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  if (!accessorySuggestions || accessorySuggestions.length === 0) return null;

  const handleScroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' 
        ? -sliderRef.current.clientWidth 
        : sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleGoToAccessoryProduct = (e, accId) => {
    e.stopPropagation();
    navigate(`/product/${accId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showNavigation = accessorySuggestions.length > 4;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs mt-8 mb-6 relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-black text-gray-900 tracking-tight">
          Sản phẩm thường mua cùng
        </h3>
      </div>

      {/* Slide Carousel 1 Hàng (Tính toán chính xác width để hiển thị đúng 4 Card/trang, tuyệt đối không bị khuất) */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-0.5 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {accessorySuggestions.map((acc) => {
            const originalPrice = acc.price || acc.basePrice || 0;
            const comboPrice = originalPrice * BUNDLE_DISCOUNT_RATE;
            const rating = acc.averageRating ?? acc.rating ?? 5;

            return (
              <div
                key={acc.id}
                className="w-[calc((100%-1rem)/2)] sm:w-[calc((100%-3*1rem)/4)] shrink-0 snap-start border border-gray-100/80 hover:border-blue-300 rounded-2xl p-4 flex flex-col justify-between bg-white shadow-2xs hover:shadow-md transition-all duration-300 group/card cursor-pointer"
                onClick={(e) => handleGoToAccessoryProduct(e, acc.id)}
              >
                {/* Khu vực Hình ảnh */}
                <div className="w-full h-36 bg-gray-50/60 rounded-xl p-2.5 flex items-center justify-center relative mb-3 group-hover/card:bg-slate-50 transition-colors overflow-hidden">
                  <img
                    src={acc.image || acc.thumbnailImage || acc.mainImage || acc.imageUrl || '/no_image.png'}
                    alt={acc.name}
                    className="max-w-full max-h-full object-contain group-hover/card:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Tên sản phẩm & Khối giá */}
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <h4
                      className="text-xs font-bold text-gray-800 group-hover/card:text-blue-600 line-clamp-2 min-h-[36px] leading-snug transition-colors"
                      title={acc.name}
                    >
                      {acc.name}
                    </h4>

                    {/* Khối Giá tiền chuẩn TGDD: Giá KM ở trên, Giá gốc & %-giảm ở dòng dưới */}
                    <div className="mt-2.5 flex flex-col gap-0.5">
                      <div className="text-sm font-black text-red-600">
                        {comboPrice.toLocaleString('vi-VN')}₫
                      </div>
                      {originalPrice > comboPrice && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span className="text-gray-400 line-through">
                            {originalPrice.toLocaleString('vi-VN')}₫
                          </span>
                          <span className="text-red-500 font-extrabold">
                            -10%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Đánh giá Sao */}
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-2">
                      <Star size={12} className="fill-amber-400 stroke-amber-400" />
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Nút Thêm vào giỏ + */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAccessory(acc);
                    }}
                    className="w-full mt-4 py-2 px-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Thêm vào giỏ</span>
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nút trượt Trái / Phải (Chỉ xuất hiện khi danh sách nhiều hơn 4 sản phẩm) */}
        {showNavigation && (
          <>
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
              title="Trượt sang trái"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
              title="Trượt sang phải"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
