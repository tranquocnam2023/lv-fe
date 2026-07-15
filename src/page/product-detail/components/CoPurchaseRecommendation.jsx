import React, { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../../services/api";
import AccessoryVariantModal from "./AccessoryVariantModal";

const CoPurchaseRecommendation = ({ mainProduct, mainProductPrice, selectedVariantId, onAddComboToCart }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  useEffect(() => {
    if (!mainProduct?.id) return;
    
    // Gọi API lấy thông tin combo đi kèm sản phẩm chính
    api.get(`/ProductCombo/product/${mainProduct.id}`)
      .then(res => {
        const data = res.data || res || [];
        setCombos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải thông tin combo:", err);
        setLoading(false);
      });
  }, [mainProduct?.id]);

  if (loading || combos.length === 0) return null;

  const currentCombo = combos[0]; // Lấy combo đầu tiên làm đại diện hiển thị

  const getDynamicPrice = (item) => {
    if (!item.isMain || !mainProductPrice) {
      return { basePrice: item.basePrice, comboPrice: item.comboPrice };
    }
    
    const basePrice = mainProductPrice;
    let comboPrice = basePrice;
    if (item.discountType === 'Percentage') {
      comboPrice = basePrice * (1 - item.discountValue / 100);
    } else if (item.discountType === 'Fixed') {
      comboPrice = Math.max(0, basePrice - item.discountValue);
    }
    return { basePrice, comboPrice };
  };

  const accessories = currentCombo.items.filter(item => !item.isMain);
  const totalPages = Math.ceil(accessories.length / itemsPerPage);
  const displayedAccessories = accessories.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="border border-gray-100 rounded-2xl p-6 mt-8 mb-6 bg-white overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2.5 py-1 rounded font-black tracking-widest uppercase flex items-center gap-1">
              <span>🔥</span> Mua kèm giá sốc
            </span>
          </h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Chọn thêm phụ kiện bên dưới để nhận mức giá ưu đãi nhất. Giỏ hàng sẽ tự động áp dụng Combo.</p>
        </div>
      </div>

      <div className="relative group px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: itemsPerPage }).map((_, idx) => {
            const item = displayedAccessories[idx];
            
            // Render placeholder để giữ nguyên chiều cao của lưới
            if (!item) {
              return (
                <div key={`placeholder-${idx}`} className="flex border border-transparent p-4 gap-4 items-center opacity-0 pointer-events-none invisible">
                  <div className="w-20 h-20 shrink-0"></div>
                  <div className="flex-1"></div>
                </div>
              );
            }

            const { basePrice, comboPrice } = getDynamicPrice(item);
            const discountPercent = Math.round((1 - comboPrice / basePrice) * 100);
            
            return (
              <div key={item.productId} className="flex bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-300 p-4 gap-4 items-center">
                <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-transparent rounded-xl p-1">
                   <img 
                     src={item.thumbnailImage || '/placeholder-image.png'} 
                     alt={item.productName}
                     className="max-w-full max-h-full object-contain mix-blend-multiply hover:scale-110 transition-transform duration-300" 
                   />
                </div>
                
                <div className="flex-1 min-w-0">
                  <a 
                    href={`/product/${item.productId}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[13px] font-bold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors mb-2 block"
                    title={item.productName}
                  >
                    {item.productName}
                  </a>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-base font-black text-red-600">{comboPrice.toLocaleString()}đ</span>
                    {basePrice > comboPrice && (
                      <span className="text-[11px] line-through text-gray-400 font-semibold">{basePrice.toLocaleString()}đ</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-red-600">
                      Giảm thêm {discountPercent}%
                    </span>
                    <button 
                      onClick={() => { setSelectedAccessory(item); setModalOpen(true); }}
                      className="flex items-center gap-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1.5 rounded-full text-[11px] font-black transition-colors uppercase tracking-wider border border-transparent"
                    >
                       Chọn thêm <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <>
            <button 
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-3 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 shadow-md rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-3 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 shadow-md rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-5">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentPage ? 'w-4 bg-red-600' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>
      )}

      {selectedAccessory && (
        <AccessoryVariantModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedAccessory(null); }}
          productId={selectedAccessory.productId}
          basePrice={getDynamicPrice(selectedAccessory).basePrice}
          comboPrice={getDynamicPrice(selectedAccessory).comboPrice}
        />
      )}
    </div>
  );
};

export default CoPurchaseRecommendation;
