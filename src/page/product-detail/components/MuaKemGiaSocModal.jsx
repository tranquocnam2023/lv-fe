import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Plus } from 'lucide-react';
import AccessoryVariantModal from './AccessoryVariantModal';
import { calcComboPrice } from '../../../utils/comboPrice';

export default function MuaKemGiaSocModal({ isOpen, onClose, campaigns, initialTab = 0, parentProductId = null }) {
  // State: activeTab - Quản lý trạng thái và dữ liệu của activeTab trong giao diện
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // State: selectedAccessory - Quản lý trạng thái và dữ liệu của selectedAccessory trong giao diện
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  // State: variantModalOpen - Quản lý trạng thái và dữ liệu của variantModalOpen trong giao diện
  const [variantModalOpen, setVariantModalOpen] = useState(false);

  if (!isOpen || !campaigns || campaigns.length === 0) return null;

  // 1. Xây dựng danh sách Nổi bật (các sản phẩm được Admin set giảm giá riêng - isExplicitlyAdded)
  const featuredAccessories = [];
  campaigns.forEach(campData => {
    if (campData.addonProducts) {
      campData.addonProducts.forEach(item => {
        if (item.isExplicitlyAdded && !featuredAccessories.find(x => x.id === item.id && x._parentProduct?.id === campData.parentProduct?.id)) {
          featuredAccessories.push({
            ...item,
            _campaign: campData.campaign,
            _parentProduct: campData.parentProduct
          });
        }
      });
    }
  });

  // 2. Lấy tất cả chiến dịch có chứa phụ kiện mua kèm
  const displayCampaigns = campaigns.filter(campData =>
    campData.addonProducts && campData.addonProducts.length > 0
  );

  const hasFeaturedTab = featuredAccessories.length > 0;
  const isFeaturedTab = hasFeaturedTab && activeTab === 0;
  const campaignIndex = hasFeaturedTab ? activeTab - 1 : activeTab;
  
  const currentCampaignData = isFeaturedTab 
    ? null 
    : (displayCampaigns[campaignIndex] || displayCampaigns[0]);
    
  const currentCampaign = currentCampaignData ? currentCampaignData.campaign : null;
  const accessories = isFeaturedTab 
    ? featuredAccessories 
    : (currentCampaignData?.addonProducts?.map(p => ({
        ...p,
        _parentProduct: currentCampaignData.parentProduct
      })) || []);

  // Hàm xử lý logic/sự kiện: getDynamicPrice
  const getDynamicPrice = (item) => {
    const basePrice = item.basePrice;
    let comboPrice = basePrice;
    const campaignToApply = item._campaign || currentCampaign;

    if (campaignToApply) {
      comboPrice = calcComboPrice(basePrice, campaignToApply);
    }
    return { basePrice, comboPrice, campaignToApply };
  };

  return (
    <>
      <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-gray-50 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text">🔥 Mua kèm giá sốc</span>
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Chọn các phụ kiện bên dưới để nhận mức giá ưu đãi hấp dẫn.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors cursor-pointer"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tabs */}
          {(displayCampaigns.length > 0 || hasFeaturedTab) && (
            <div className="bg-white px-6 border-b border-gray-100 shrink-0 flex gap-6 overflow-x-auto hide-scrollbar">
              {hasFeaturedTab && (
                <button
                  onClick={() => setActiveTab(0)}
                  className={`py-4 font-black text-sm whitespace-nowrap transition-colors relative cursor-pointer ${activeTab === 0
                      ? 'text-red-600'
                      : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  ⭐ Nổi bật
                  {activeTab === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />
                  )}
                </button>
              )}

              {displayCampaigns.map((campData, index) => {
                const tabIdx = hasFeaturedTab ? index + 1 : index;
                const isSelected = activeTab === tabIdx;
                const parentName = campData.parentProduct?.name;

                return (
                  <button
                    key={`${campData.campaign.id}-${campData.parentProduct?.id || index}`}
                    onClick={() => setActiveTab(tabIdx)}
                    className={`py-4 font-black text-sm whitespace-nowrap transition-colors relative cursor-pointer ${isSelected
                        ? 'text-red-600'
                        : 'text-gray-500 hover:text-gray-800'
                      }`}
                  >
                    <span>{campData.campaign.name}</span>
                    {parentName && (
                      <span className="ml-1.5 text-[11px] font-medium text-gray-400">({parentName})</span>
                    )}
                    {isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content (Grid Sản phẩm phụ) */}
          <div className="flex-1 overflow-y-auto p-6">
            {accessories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="text-4xl mb-2">😢</div>
                <p className="font-semibold">Chiến dịch này chưa có phụ kiện nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {accessories.map((item, itemIdx) => {
                  const { basePrice, comboPrice, campaignToApply } = getDynamicPrice(item);
                  let discountBadgeText = '';
                  // Tính % giảm thực tế trên giá đã áp trần MaxDiscountAmount để badge không lệch với giá hiển thị
                  if (campaignToApply?.discountType === 'Percentage') discountBadgeText = `-${basePrice > 0 ? Math.round((basePrice - comboPrice) / basePrice * 100) : campaignToApply.discountValue}%`;
                  else if (campaignToApply?.discountType === 'FixedAmount') discountBadgeText = `-${campaignToApply.discountValue >= 1000 ? (campaignToApply.discountValue / 1000) + 'K' : campaignToApply.discountValue + 'đ'}`;
                  else discountBadgeText = 'GIÁ SỐC';

                  const parentName = item._parentProduct?.name || currentCampaignData?.parentProduct?.name;

                  return (
                    <div key={`${item.id}-${item._parentProduct?.id || itemIdx}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-red-400 hover:shadow-lg transition-all duration-300 flex flex-col group relative">
                      {/* Badge discount */}
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md z-10">
                        {discountBadgeText}
                      </div>

                      <div className="w-full h-40 flex items-center justify-center p-4 bg-transparent relative overflow-hidden">
                        <img
                          src={item.thumbnailImage || item.image || item.mainImage || item.imageUrl || '/placeholder-image.png'}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                        />
                        <a
                          href={`/product/${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[2px]"
                          title="Xem chi tiết sản phẩm ở tab mới"
                        >
                          <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            Xem chi tiết <ExternalLink size={14} />
                          </span>
                        </a>
                      </div>

                      <div className="p-4 flex flex-col flex-1 border-t border-gray-50">
                        <h4 className="text-sm font-bold text-gray-800 line-clamp-2 mb-1 min-h-[38px]">
                          {item.name}
                        </h4>

                        {parentName && (
                          <div className="text-[10px] text-gray-400 font-semibold truncate mb-2">
                            Theo SP: <span className="text-gray-600 font-bold">{parentName}</span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-2 mb-4 mt-auto">
                          <span className="text-lg font-black text-red-600">{comboPrice.toLocaleString()}đ</span>
                          {basePrice > comboPrice && (
                            <span className="text-xs line-through text-gray-400 font-semibold">{basePrice.toLocaleString()}đ</span>
                          )}
                        </div>

                        <div>
                          <button
                            onClick={() => {
                              setSelectedAccessory(item);
                              setVariantModalOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-4 py-2.5 rounded-xl text-sm font-black transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Chọn <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedAccessory && (
        <AccessoryVariantModal
          isOpen={variantModalOpen}
          onClose={() => { setVariantModalOpen(false); setSelectedAccessory(null); }}
          productId={selectedAccessory.id}
          basePrice={getDynamicPrice(selectedAccessory).basePrice}
          comboPrice={getDynamicPrice(selectedAccessory).comboPrice}
          campaignId={getDynamicPrice(selectedAccessory).campaignToApply?.id}
          maxQuantityAllowed={getDynamicPrice(selectedAccessory).campaignToApply?.maxQuantityAllowed}
          parentProductId={selectedAccessory._parentProduct?.id || currentCampaignData?.parentProduct?.id || parentProductId}
        />
      )}
    </>
  );
}
