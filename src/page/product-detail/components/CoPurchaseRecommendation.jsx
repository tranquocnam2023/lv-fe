import React, { useState, useEffect, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../../services/api";
import AccessoryVariantModal from "./AccessoryVariantModal";
import MuaKemGiaSocModal from "./MuaKemGiaSocModal";
import { calcComboPrice } from "../../../utils/comboPrice";

// Component React: CoPurchaseRecommendation - Quản lý giao diện và logic xử lý của CoPurchaseRecommendation
const CoPurchaseRecommendation = ({ mainProduct, isCartPage = false, cartItems = [] }) => {
  // State: campaigns - Quản lý trạng thái và dữ liệu của campaigns trong giao diện
  const [campaigns, setCampaigns] = useState([]);
  // State: loading - Quản lý trạng thái và dữ liệu của loading trong giao diện
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  // State: bigModalOpen - Quản lý trạng thái và dữ liệu của bigModalOpen trong giao diện
  const [bigModalOpen, setBigModalOpen] = useState(false);
  // State: bigModalTab - Quản lý trạng thái và dữ liệu của bigModalTab trong giao diện
  const [bigModalTab, setBigModalTab] = useState(0);
  // State: selectedAccessory - Quản lý trạng thái và dữ liệu của selectedAccessory trong giao diện
  const [selectedAccessory, setSelectedAccessory] = useState(null);

  // State: currentPage - Quản lý trạng thái và dữ liệu của currentPage trong giao diện
  const [currentPage, setCurrentPage] = useState(0);
  // Khai báo biến/hằng số: itemsPerPage - Dùng trong logic xử lý của component
  const itemsPerPage = 4;

  // Danh sách sản phẩm chính được suy ra từ props, không cần state riêng.
  // Trước đây nằm trong effect và khi rỗng thì gọi setCampaigns([])/setLoading(false) - tức
  // dùng effect để tính giá trị dẫn xuất. Nay tính thẳng lúc render, effect chỉ còn lo gọi API.
  const mainProductList = useMemo(() => {
    if (isCartPage && cartItems && cartItems.length > 0) {
      return cartItems.filter(i => !i.isAddon);
    }
    if (mainProduct?.id) return [mainProduct];
    return [];
  }, [isCartPage, cartItems, mainProduct]);

  const hasMainProduct = mainProductList.length > 0;

  useEffect(() => {
    if (!hasMainProduct) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- effect này gọi API; bật cờ
    // đang tải ngay từ đầu là đúng vòng đời của việc tải dữ liệu.
    setLoading(true);

    const uniqueProducts = [];
    const seenIds = new Set();
    mainProductList.forEach(p => {
      const pId = p.id || p.productId;
      if (pId && !seenIds.has(pId)) {
        seenIds.add(pId);
        uniqueProducts.push(p);
      }
    });

    Promise.all(
      uniqueProducts.map(p => {
        const pId = p.id || p.productId;
        return api.get(`/PromotionCampaign/product/${pId}`)
          .then(res => {
            const data = res.data || res || [];
            if (Array.isArray(data)) {
              return data.map(camp => ({
                ...camp,
                parentProduct: p
              }));
            }
            return [];
          })
          .catch(err => {
            console.error(`Lỗi khi tải thông tin combo cho sản phẩm ${pId}:`, err);
            return [];
          });
      })
    ).then(results => {
      const allCampaigns = results.flat();
      setCampaigns(allCampaigns);
      setLoading(false);
    }).catch(err => {
      console.error("Lỗi khi tải thông tin combo:", err);
      setLoading(false);
    });
  }, [hasMainProduct, mainProduct?.id, isCartPage, JSON.stringify(cartItems?.map(i => i.id || i.productId))]);

  // Không có sản phẩm chính thì không hiển thị gì, kể cả khi campaigns còn dữ liệu của lần trước
  if (!hasMainProduct || loading || campaigns.length === 0) return null;

  // 1. Lấy tất cả sản phẩm được set giảm giá riêng (explicit)
  const explicitProducts = [];
  campaigns.forEach(campData => {
    if (campData.addonProducts) {
      campData.addonProducts.forEach(item => {
        if (item.isExplicitlyAdded && !explicitProducts.find(x => x.id === item.id && x._parentProduct?.id === campData.parentProduct?.id)) {
          explicitProducts.push({
            ...item,
            _campaign: campData.campaign,
            _parentProduct: campData.parentProduct
          });
        }
      });
    }
  });

  // Hàm thực thi logic: mixedItems
  const mixedItems = explicitProducts.map(p => ({ 
    type: 'product', 
    data: p,
    parentProduct: p._parentProduct
  }));

  // 2. Lấy danh sách các Card Chiến dịch
  const displayCampaigns = campaigns.filter(campData => 
    campData.addonProducts && campData.addonProducts.some(p => !p.isExplicitlyAdded)
  );

  displayCampaigns.forEach((campData, index) => {
    const repProduct = campData.addonProducts.find(p => !p.isExplicitlyAdded) || campData.addonProducts[0];
    mixedItems.push({
      type: 'campaign',
      data: campData.campaign,
      image: repProduct?.thumbnailImage || repProduct?.image || repProduct?.mainImage || repProduct?.imageUrl,
      parentProduct: campData.parentProduct,
      tabIndex: index + (explicitProducts.length > 0 ? 1 : 0)
    });
  });

  // Khai báo biến/hằng số: displaySource - Dùng trong logic xử lý của component
  const displaySource = mixedItems;

  // Tính tổng số trang để cho phép chuyển hết tất cả các combo
  const totalPages = Math.ceil(displaySource.length / itemsPerPage);
  // Khai báo biến/hằng số: displayedAccessories - Dùng trong logic xử lý của component
  const displayedAccessories = displaySource.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  // Hàm xử lý logic/sự kiện: getDynamicPrice
  const getDynamicPrice = (item) => {
    const basePrice = item.basePrice;
    let comboPrice = basePrice;
    const campaignToApply = item._campaign || campaigns[0]?.campaign;
    
    if (campaignToApply) {
      comboPrice = calcComboPrice(basePrice, campaignToApply);
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
          className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors shrink-0 whitespace-nowrap bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
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
              // Tính % giảm thực tế trên giá đã áp trần MaxDiscountAmount để badge không lệch với giá hiển thị
              if (campaignToApply.discountType === 'Percentage') discountText = `Giảm thêm ${basePrice > 0 ? Math.round((basePrice - comboPrice) / basePrice * 100) : campaignToApply.discountValue}%`;
              else if (campaignToApply.discountType === 'FixedAmount') discountText = `Giảm thêm ${campaignToApply.discountValue >= 1000 ? (campaignToApply.discountValue / 1000) + 'K' : campaignToApply.discountValue + 'đ'}`;
              else discountText = `Chỉ còn ${campaignToApply.discountValue.toLocaleString('vi-VN')}đ`;

              return (
                <div key={`prod-${product.id}-${product._parentProduct?.id || 'default'}`} className="flex bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-300 p-4 gap-4 items-center">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-transparent rounded-xl p-1">
                     <img 
                       src={product.thumbnailImage || product.image || product.mainImage || product.imageUrl || '/placeholder-image.png'} 
                       alt={product.name}
                       className="max-w-full max-h-full object-contain mix-blend-multiply hover:scale-110 transition-transform duration-300" 
                     />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <a 
                        href={`/product/${product.id}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[13px] font-bold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors block"
                        title={product.name}
                      >
                        {product.name}
                      </a>
                      {product._parentProduct?.name && (
                        <div className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">
                          Theo SP: <span className="text-gray-600 font-bold">{product._parentProduct.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-start gap-1 mt-auto pt-2">
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
                          className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-black transition-colors flex items-center justify-center gap-1 shrink-0 ml-1 cursor-pointer"
                        >
                          Chọn <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              const campaign = item.data;
              let discountText = '';
              if (campaign.discountType === 'Percentage') discountText = `Giảm thêm ${campaign.discountValue}%`;
              else if (campaign.discountType === 'FixedAmount') discountText = `Giảm thêm ${campaign.discountValue >= 1000 ? (campaign.discountValue / 1000) + 'K' : campaign.discountValue + 'đ'}`;
              else discountText = `GIÁ SỐC`;

              return (
                <div key={`camp-${campaign.id}-${item.parentProduct?.id || 'default'}`} className="flex bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-red-400 hover:shadow-md transition-all duration-300 p-4 gap-4 items-center">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-transparent rounded-xl p-1">
                     <img 
                       src={item.image || '/placeholder-image.png'} 
                       alt={campaign.name}
                       className="max-w-full max-h-full object-contain mix-blend-multiply hover:scale-110 transition-transform duration-300" 
                     />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                    <div>
                      <div className="text-[13px] font-bold text-gray-800 line-clamp-2" title={campaign.name}>
                        {campaign.name}
                      </div>
                      {item.parentProduct?.name && (
                        <div className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">
                          Theo SP: <span className="text-gray-600 font-bold">{item.parentProduct.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center w-full mt-auto pt-2">
                      <span className="text-[12px] font-black uppercase tracking-wider text-red-600">
                        {discountText}
                      </span>
                      <button 
                        onClick={() => { setBigModalTab(item.tabIndex); setBigModalOpen(true); }}
                        className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-black transition-colors flex items-center justify-center gap-1 shrink-0 ml-1 cursor-pointer"
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
              className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-3 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 shadow-md rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-3 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 shadow-md rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
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
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentPage ? 'w-4 bg-red-600' : 'w-1.5 bg-gray-200 hover:bg-gray-400'}`}
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
          parentProductId={selectedAccessory._parentProduct?.id || mainProduct?.id}
        />
      )}

      <MuaKemGiaSocModal 
        isOpen={bigModalOpen} 
        onClose={() => setBigModalOpen(false)} 
        campaigns={campaigns}
        initialTab={bigModalTab}
        parentProductId={mainProduct?.id}
      />
    </div>
  );
};

export default CoPurchaseRecommendation;
