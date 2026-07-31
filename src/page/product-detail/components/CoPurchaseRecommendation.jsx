import React, { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../../services/api";
import AccessoryVariantModal from "./AccessoryVariantModal";
import MuaKemGiaSocModal from "./MuaKemGiaSocModal";

const CoPurchaseRecommendation = ({ mainProduct, mainProductPrice, selectedVariantId, onAddComboToCart, isCartPage = false }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [bigModalOpen, setBigModalOpen] = useState(false);
  const [bigModalTab, setBigModalTab] = useState(0);
  const [selectedAccessory, setSelectedAccessory] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  useEffect(() => {
    if (!mainProduct?.id) return;
    
    // Gọi API lấy thông tin chiến dịch mua kèm khả dụng cho sản phẩm này
    api.get(`/PromotionCampaign/product/${mainProduct.id}`)
      .then(res => {
        const data = res.data || res || [];
        setCampaigns(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải thông tin combo:", err);
        setLoading(false);
      });
  }, [mainProduct?.id]);

  if (loading || campaigns.length === 0) return null;

  // 1. Lấy tối đa 3 sản phẩm được set giảm giá riêng (explicit)
  const explicitProducts = [];
  campaigns.forEach(campData => {
    if (campData.addonProducts) {
      campData.addonProducts.forEach(item => {
        if (item.isExplicitlyAdded && !explicitProducts.find(x => x.id === item.id)) {
          explicitProducts.push({
            ...item,
            _campaign: campData.campaign 
          });
        }
      });
    }
  });

  const mixedItems = explicitProducts.slice(0, 3).map(p => ({ type: 'product', data: p }));

  // 2. Lấy danh sách các Card Chiến dịch (chỉ các chiến dịch có chứa ít nhất 1 sản phẩm KHÔNG phải set riêng)
  const displayCampaigns = campaigns.filter(campData => 
    campData.addonProducts && campData.addonProducts.some(p => !p.isExplicitlyAdded)
  );

  displayCampaigns.forEach((campData, index) => {
    const repProduct = campData.addonProducts.find(p => !p.isExplicitlyAdded) || campData.addonProducts[0];
    mixedItems.push({
      type: 'campaign',
      data: campData.campaign,
      image: repProduct?.thumbnailImage || repProduct?.image || repProduct?.mainImage || repProduct?.imageUrl,
      tabIndex: index + 1
    });
  });

  const displaySource = mixedItems;

  // Ở phần màn hình chính (gợi ý), lấy tối đa 2 trang
  const maxPages = 2;
  const totalPages = Math.min(maxPages, Math.ceil(displaySource.length / itemsPerPage));
  const displayedAccessories = displaySource.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const getDynamicPrice = (item) => {
    const basePrice = item.basePrice;
    let comboPrice = basePrice;
    const campaignToApply = item._campaign || campaigns[0].campaign;
    
    if (campaignToApply.discountType === 'Percentage') {
      comboPrice = basePrice * (1 - campaignToApply.discountValue / 100);
    } else if (campaignToApply.discountType === 'FixedAmount') {
      comboPrice = Math.max(0, basePrice - campaignToApply.discountValue);
    } else if (campaignToApply.discountType === 'FixedPrice') {
      comboPrice = campaignToApply.discountValue;
    }
    return { basePrice, comboPrice, campaignToApply };
  };

  return (
    <div className="border border-gray-100 rounded-2xl p-6 mt-8 mb-6 bg-white overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2.5 py-1 rounded font-black tracking-widest uppercase flex items-center gap-1">
              <span>🔥</span> Mua kèm giá sốc
            </span>
          </h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Chọn thêm các ưu đãi bên dưới để nhận mức giá tốt nhất. Giỏ hàng sẽ tự động áp dụng Combo.</p>
        </div>
        <button 
          onClick={() => { setBigModalTab(0); setBigModalOpen(true); }}
          className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors shrink-0 whitespace-nowrap bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl flex items-center gap-1"
        >
          Xem tất cả ưu đãi <ChevronRight size={16} />
        </button>
      </div>

      <div className="relative group px-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: itemsPerPage }).map((_, idx) => {
            const item = displayedAccessories[idx];
            
            if (!item) {
              return (
                <div key={`placeholder-${idx}`} className="flex border border-transparent p-4 gap-4 items-center opacity-0 pointer-events-none invisible">
                  <div className="w-16 h-16 shrink-0"></div>
                  <div className="flex-1"></div>
                </div>
              );
            }

            if (item.type === 'product') {
              const product = item.data;
              const { basePrice, comboPrice, campaignToApply } = getDynamicPrice(product);
              
              let discountText = '';
              if (campaignToApply.discountType === 'Percentage') discountText = `Giảm thêm ${campaignToApply.discountValue}%`;
              else if (campaignToApply.discountType === 'FixedAmount') discountText = `Giảm thêm ${campaignToApply.discountValue >= 1000 ? (campaignToApply.discountValue / 1000) + 'K' : campaignToApply.discountValue + 'đ'}`;
              else discountText = `Chỉ còn ${campaignToApply.discountValue.toLocaleString('vi-VN')}đ`;

              return (
                <div key={`prod-${product.id}`} className="flex bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-300 p-4 gap-4 items-center">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-transparent rounded-xl p-1">
                     <img 
                       src={product.thumbnailImage || product.image || product.mainImage || product.imageUrl || '/placeholder-image.png'} 
                       alt={product.name}
                       className="max-w-full max-h-full object-contain mix-blend-multiply hover:scale-110 transition-transform duration-300" 
                     />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <a 
                      href={`/product/${product.id}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[13px] font-bold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors mb-2 block"
                      title={product.name}
                    >
                      {product.name}
                    </a>
                    
                    <div className="flex flex-col items-start gap-1 mt-auto">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-red-600">{comboPrice.toLocaleString()}đ</span>
                        {basePrice > comboPrice && (
                          <span className="text-[11px] line-through text-gray-400 font-semibold">{basePrice.toLocaleString()}đ</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center w-full mt-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-red-600">
                          {discountText}
                        </span>
                        <button 
                          onClick={() => { setSelectedAccessory(product); setModalOpen(true); }}
                          className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-black transition-colors flex items-center justify-center gap-1 shrink-0 ml-1"
                        >
                          Chọn <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Render Campaign Card
              const campaign = item.data;
              let discountText = '';
              if (campaign.discountType === 'Percentage') discountText = `Giảm thêm ${campaign.discountValue}%`;
              else if (campaign.discountType === 'FixedAmount') discountText = `Giảm thêm ${campaign.discountValue >= 1000 ? (campaign.discountValue / 1000) + 'K' : campaign.discountValue + 'đ'}`;
              else discountText = `GIÁ SỐC`;

              return (
                <div key={`camp-${campaign.id}`} className="flex bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-red-400 hover:shadow-md transition-all duration-300 p-4 gap-4 items-center">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-transparent rounded-xl p-1">
                     <img 
                       src={item.image || '/placeholder-image.png'} 
                       alt={campaign.name}
                       className="max-w-full max-h-full object-contain mix-blend-multiply hover:scale-110 transition-transform duration-300" 
                     />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                    <div className="text-[13px] font-bold text-gray-800 line-clamp-2 mb-2" title={campaign.name}>
                      {campaign.name}
                    </div>
                    
                    <div className="flex justify-between items-center w-full mt-auto">
                      <span className="text-[12px] font-black uppercase tracking-wider text-red-600">
                        {discountText}
                      </span>
                      <button 
                        onClick={() => { setBigModalTab(item.tabIndex); setBigModalOpen(true); }}
                        className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-black transition-colors flex items-center justify-center gap-1 shrink-0 ml-1"
                      >
                        Chọn thêm <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
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
            <button 
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentPage ? 'w-4 bg-red-600' : 'w-1.5 bg-gray-200 hover:bg-gray-400'}`}
            />
          ))}
        </div>
      )}

      {selectedAccessory && (
        <AccessoryVariantModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedAccessory(null); }}
          productId={selectedAccessory.id}
          basePrice={getDynamicPrice(selectedAccessory).basePrice}
          comboPrice={getDynamicPrice(selectedAccessory).comboPrice}
          campaignId={getDynamicPrice(selectedAccessory).campaignToApply?.id}
          maxQuantityAllowed={getDynamicPrice(selectedAccessory).campaignToApply?.maxQuantityAllowed}
        />
      )}

      <MuaKemGiaSocModal 
        isOpen={bigModalOpen} 
        onClose={() => setBigModalOpen(false)} 
        campaigns={campaigns}
        initialTab={bigModalTab}
      />
    </div>
  );
};

export default CoPurchaseRecommendation;
