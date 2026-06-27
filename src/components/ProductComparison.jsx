import React, { useState, useEffect } from 'react';
import { X, GitCompare, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';

// formatPrice helper if format helper is missing or path is different
const formatVND = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export default function ProductComparison() {
  const [compareList, setCompareList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('compare_products') || '[]');
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  // Sync compare items from localStorage
  const loadCompareList = () => {
    try {
      const items = JSON.parse(localStorage.getItem('compare_products') || '[]');
      setCompareList(items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {

    // Listen for custom events to add products to comparison
    const handleAddCompare = (e) => {
      const product = e.detail;
      setCompareList(prev => {
        if (prev.some(item => item.id === product.id)) {
          alert('Sản phẩm này đã có trong danh sách so sánh!');
          return prev;
        }
        if (prev.length >= 3) {
          alert('Bạn chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc!');
          return prev;
        }
        const newList = [...prev, product];
        localStorage.setItem('compare_products', JSON.stringify(newList));
        return newList;
      });
    };

    window.addEventListener('add-to-compare', handleAddCompare);
    window.addEventListener('sync-compare', loadCompareList);
    return () => {
      window.removeEventListener('add-to-compare', handleAddCompare);
      window.removeEventListener('sync-compare', loadCompareList);
    };
  }, []);

  const removeFromCompare = (productId) => {
    const newList = compareList.filter(item => item.id !== productId);
    localStorage.setItem('compare_products', JSON.stringify(newList));
    setCompareList(newList);
  };

  const clearAll = () => {
    localStorage.setItem('compare_products', '[]');
    setCompareList([]);
    setIsOpen(false);
  };

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating compare status bar at bottom of the page */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md shadow-2xl border border-gray-150 px-6 py-4 rounded-2xl flex items-center gap-6 max-w-4xl animate-fade-in font-sans">
        <div className="flex items-center gap-2 text-primary font-bold text-sm shrink-0">
          <GitCompare size={20} className="animate-pulse" />
          <span>So sánh ({compareList.length}/3)</span>
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          {compareList.map(prod => (
            <div key={prod.id} className="relative group flex items-center gap-2 bg-gray-50 border border-gray-200 pl-2 pr-7 py-1 rounded-xl shrink-0">
              <img 
                src={prod.thumbnailImage || prod.mainImage || '/placeholder.png'} 
                alt={prod.name} 
                className="w-8 h-8 object-contain rounded bg-white"
              />
              <span className="text-xs font-bold text-gray-700 max-w-[120px] truncate">{prod.name}</span>
              <button 
                onClick={() => removeFromCompare(prod.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md hover:shadow-lg transition-all"
          >
            So sánh ngay
            <ArrowRight size={14} />
          </button>
          <button 
            onClick={clearAll}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-100 transition-colors"
            title="Xóa tất cả"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Full-screen Comparison Detail Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <GitCompare size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Bảng So Sánh Sản Phẩm</h3>
                  <p className="text-xs text-gray-500 font-medium">Đối chiếu cấu hình, thông số và giá bán trực quan</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Comparison Matrix */}
            <div className="flex-1 overflow-auto p-8">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-1/4 pb-6 text-left text-sm font-bold text-gray-400">Tiêu chí</th>
                    {compareList.map(prod => (
                      <th key={prod.id} className="pb-6 px-4 text-center align-top">
                        <div className="flex flex-col items-center gap-3 relative">
                          <button 
                            onClick={() => removeFromCompare(prod.id)}
                            className="absolute -top-2 right-4 p-1.5 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                            title="Xóa khỏi so sánh"
                          >
                            <X size={14} />
                          </button>
                          <img 
                            src={prod.thumbnailImage || prod.mainImage || '/placeholder.png'} 
                            alt={prod.name} 
                            className="w-28 h-28 object-contain p-2 border border-gray-100 bg-gray-50 rounded-2xl"
                          />
                          <span className="text-sm font-bold text-gray-900 line-clamp-2 px-2 max-h-[40px] leading-tight">
                            {prod.name}
                          </span>
                        </div>
                      </th>
                    ))}
                    {/* Placeholder columns if < 3 items */}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <th key={i} className="pb-6 px-4 text-center align-top opacity-50">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 h-[200px]">
                          <GitCompare size={32} className="text-gray-300 mb-2" />
                          <span className="text-xs font-semibold text-gray-400">Thêm sản phẩm khác để so sánh</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Price */}
                  <tr>
                    <td className="py-4 text-sm font-bold text-gray-500">Giá bán</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="py-4 px-4 text-center text-base font-extrabold text-primary">
                        {formatVND(prod.basePrice)}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="py-4 px-4" />)}
                  </tr>

                  {/* Brand */}
                  <tr>
                    <td className="py-4 text-sm font-bold text-gray-500">Thương hiệu</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="py-4 px-4 text-center text-sm font-semibold text-gray-700">
                        {prod.brand?.name || 'Đang cập nhật'}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="py-4 px-4" />)}
                  </tr>

                  {/* Category */}
                  <tr>
                    <td className="py-4 text-sm font-bold text-gray-500">Danh mục</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="py-4 px-4 text-center text-sm font-semibold text-gray-700">
                        {prod.category?.name || 'Đang cập nhật'}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="py-4 px-4" />)}
                  </tr>

                  {/* Code */}
                  <tr>
                    <td className="py-4 text-sm font-bold text-gray-500">Mã sản phẩm</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="py-4 px-4 text-center text-xs font-mono font-semibold text-gray-500 bg-gray-50/50 rounded-lg">
                        {prod.productCode || 'N/A'}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="py-4 px-4" />)}
                  </tr>

                  {/* Description Excerpt */}
                  <tr>
                    <td className="py-4 text-sm font-bold text-gray-500 align-top">Mô tả ngắn</td>
                    {compareList.map(prod => (
                      <td key={prod.id} className="py-4 px-4 text-xs text-gray-500 text-left leading-relaxed align-top max-w-[200px]">
                        <p className="line-clamp-4">
                          {prod.description ? prod.description.replace(/<[^>]*>/g, '') : 'Không có mô tả chi tiết từ nhà sản xuất.'}
                        </p>
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="py-4 px-4" />)}
                  </tr>

                  {/* Action Button */}
                  <tr>
                    <td className="py-6 text-sm font-bold text-gray-500" />
                    {compareList.map(prod => (
                      <td key={prod.id} className="py-6 px-4 text-center">
                        <button
                          onClick={() => {
                            window.location.href = `/product/${prod.slug}`;
                          }}
                          className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                        >
                          <ShoppingCart size={14} />
                          Xem chi tiết / Mua
                        </button>
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="py-6 px-4" />)}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>* Các thông tin so sánh được trích xuất trực tiếp từ dữ liệu sản phẩm thực tế.</span>
              <button 
                onClick={clearAll}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                Xóa tất cả danh sách so sánh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
