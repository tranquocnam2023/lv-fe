import React, { useState, useEffect } from 'react';
import { X, Trash2, Search, Save, Image as ImageIcon } from 'lucide-react';
import api from '../../../services/api';
import { productService } from '../../../services/productService';

// -- COMPONENT: SEARCHABLE SELECT --
const SearchableSelect = ({ options, placeholder, onSelect, selectedId, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(o => o.id === selectedId);

  return (
    <div className="relative">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-xl text-sm bg-white flex items-center justify-between transition-all ${disabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary border-gray-200 shadow-sm hover:shadow-md'}`}
      >
        <span className={selectedOption ? 'text-gray-900 font-semibold truncate' : 'text-gray-400 font-medium'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <div className="flex items-center gap-2 shrink-0 pl-2">
          {selectedOption && !disabled && (
             <button 
               onClick={(e) => { e.stopPropagation(); onSelect(null); }}
               className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-1 rounded-full"
             >
               <X size={14} />
             </button>
          )}
          <span className="text-gray-400 text-[10px]">▼</span>
        </div>
      </div>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/80">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Gõ tên sản phẩm để tìm nhanh..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-sm bg-transparent outline-none border-none focus:ring-0 font-medium text-gray-800"
              />
            </div>
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {filteredOptions.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400 font-medium">Không tìm thấy sản phẩm phù hợp</div>
              ) : (
                filteredOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onSelect(opt.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="px-4 py-3 hover:bg-blue-50/50 flex items-center gap-3 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  >
                    {opt.thumbnailImage ? (
                       <img src={opt.thumbnailImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 bg-white" />
                    ) : (
                       <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><ImageIcon size={16} /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-800 truncate">{opt.name}</div>
                      <div className="text-xs text-blue-600 font-bold mt-0.5">{opt.basePrice?.toLocaleString()}đ</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


// -- MAIN MODAL COMPONENT --
export default function AdminComboModal({ isOpen, onClose, onSuccess, comboData }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  // Tách State: Sản phẩm chính và Phụ kiện
  const [mainProductId, setMainProductId] = useState(null);
  const [accessoryItems, setAccessoryItems] = useState([]);

  useEffect(() => {
    productService.getAll(true)
      .then(res => setProducts(res || []))
      .catch(err => console.error("Lỗi tải sản phẩm:", err));
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (comboData) {
        // Mode Edit
        setFormData({
          name: comboData.name || '',
          description: comboData.description || '',
          startDate: comboData.startDate ? new Date(comboData.startDate).toISOString().slice(0, 16) : '',
          endDate: comboData.endDate ? new Date(comboData.endDate).toISOString().slice(0, 16) : '',
          isActive: comboData.isActive ?? true,
        });

        api.get(`/ProductCombo/${comboData.id}`)
          .then(res => {
            const data = res.data || res;
            if (data && data.items) {
              const mainItem = data.items.find(i => i.isMain);
              if (mainItem) setMainProductId(mainItem.productId);
              
              const accs = data.items.filter(i => !i.isMain).map(i => ({
                productId: i.productId,
                discountType: i.discountType || 'Percentage',
                discountValue: i.discountValue || 0
              }));
              setAccessoryItems(accs);
            }
          })
          .catch(err => console.error(err));
      } else {
        // Mode Create
        setFormData({
          name: '',
          description: '',
          startDate: new Date().toISOString().slice(0, 16),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 16),
          isActive: true,
        });
        setMainProductId(null);
        setAccessoryItems([]);
      }
    }
  }, [isOpen, comboData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mainProductId) {
      alert("Bạn phải chọn Sản phẩm chính cho Combo này!");
      return;
    }
    if (accessoryItems.length === 0) {
      alert("Combo phải có ít nhất 1 Sản phẩm phụ kiện đi kèm!");
      return;
    }

    setLoading(true);
    try {
      const itemsPayload = [
        { productId: mainProductId, isMain: true, discountType: 'Percentage', discountValue: 0 },
        ...accessoryItems.map(a => ({
           productId: a.productId,
           isMain: false,
           discountType: a.discountType,
           discountValue: Number(a.discountValue) || 0
        }))
      ];

      const payload = {
        ...formData,
        items: itemsPayload
      };

      if (comboData) {
        await api.put(`/ProductCombo/${comboData.id}`, payload);
        alert("Cập nhật Combo thành công!");
      } else {
        await api.post('/ProductCombo', payload);
        alert("Thêm Combo mới thành công!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra: " + (err.response?.data?.message || err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAccessoryChange = (productId, field, value) => {
    setAccessoryItems(accessoryItems.map(i => i.productId === productId ? { ...i, [field]: value } : i));
  };

  if (!isOpen) return null;

  const mainProduct = products.find(p => p.id === mainProductId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {comboData ? 'Chỉnh sửa Combo' : 'Tạo mới Combo'}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Thiết lập cấu hình sản phẩm bán chéo</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-[#FAFAFA]">
          <form id="combo-form" onSubmit={handleSubmit} className="space-y-10 max-w-3xl mx-auto">
            
            {/* 1. Thông tin chung */}
            <section>
              <h3 className="text-[13px] font-black text-gray-900 mb-5 uppercase tracking-widest flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span> 
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">Tên chiến dịch <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Mua iPhone 15 giảm 50% Phụ kiện"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">Mô tả hiển thị</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Nhập mô tả ngắn gọn cho khách hàng..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">Bắt đầu <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">Kết thúc <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded focus:ring-0 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                      />
                      <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Kích hoạt chiến dịch ngay</span>
                  </label>
                </div>
              </div>
            </section>

            {/* 2. Sản phẩm chính */}
            <section>
              <h3 className="text-[13px] font-black text-gray-900 mb-5 uppercase tracking-widest flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span> 
                Sản phẩm gốc
              </h3>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <SearchableSelect 
                  options={products} 
                  placeholder="Tìm và chọn sản phẩm gốc (Chỉ 1 SP)" 
                  selectedId={mainProductId}
                  onSelect={setMainProductId}
                />
                
                {mainProduct && (
                  <div className="mt-4 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-white border border-blue-100 p-4 rounded-xl">
                    <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                       <img src={mainProduct.thumbnailImage} alt={mainProduct.name} className="w-14 h-14 rounded-md object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-black text-blue-600 tracking-wider mb-1 uppercase">Đã chọn làm Sản phẩm chính</div>
                      <div className="font-bold text-gray-900 leading-tight">{mainProduct.name}</div>
                      <div className="text-sm font-semibold text-gray-500 mt-1">{mainProduct.basePrice?.toLocaleString()}đ</div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Phụ kiện */}
            <section>
              <h3 className="text-[13px] font-black text-gray-900 mb-5 uppercase tracking-widest flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span> 
                Phụ kiện đính kèm
              </h3>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="mb-6">
                  <SearchableSelect 
                    options={products.filter(p => p.id !== mainProductId && !accessoryItems.some(a => a.productId === p.id))} 
                    placeholder="Tìm và thêm sản phẩm phụ kiện..." 
                    onSelect={(pid) => {
                       if (pid) {
                          setAccessoryItems([...accessoryItems, { productId: pid, discountType: 'Percentage', discountValue: 0 }]);
                       }
                    }}
                  />
                </div>

                {accessoryItems.length > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-black text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-4">Tên sản phẩm</th>
                          <th className="px-5 py-4 w-60">Cấu hình Giảm giá</th>
                          <th className="px-5 py-4 text-right w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {accessoryItems.map(item => {
                          const prod = products.find(p => p.id === item.productId);
                          if (!prod) return null;
                          
                          return (
                            <tr key={item.productId} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {prod.thumbnailImage ? (
                                     <img src={prod.thumbnailImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 bg-white shadow-sm" />
                                  ) : (
                                     <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center"><ImageIcon size={16} className="text-gray-300" /></div>
                                  )}
                                  <div>
                                    <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{prod.name}</div>
                                    <div className="text-xs font-semibold text-gray-400 mt-0.5">{prod.basePrice?.toLocaleString()}đ</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                {/* Inline Input + Select Gộp */}
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all bg-white shadow-sm">
                                  <input
                                    type="number"
                                    value={item.discountValue}
                                    onChange={(e) => handleAccessoryChange(item.productId, 'discountValue', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 outline-none placeholder-gray-300"
                                    min="0"
                                    placeholder="0"
                                  />
                                  <div className="w-px h-6 bg-gray-200"></div>
                                  <select
                                    value={item.discountType}
                                    onChange={(e) => handleAccessoryChange(item.productId, 'discountType', e.target.value)}
                                    className="pl-3 pr-8 py-2.5 text-xs font-black text-gray-600 bg-gray-50 outline-none cursor-pointer hover:bg-gray-100 transition-colors border-none focus:ring-0"
                                  >
                                    <option value="Percentage">%</option>
                                    <option value="FixedAmount">VNĐ</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setAccessoryItems(accessoryItems.filter(a => a.productId !== item.productId))}
                                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {accessoryItems.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm font-medium text-gray-400">Chưa có phụ kiện nào được thêm</p>
                  </div>
                )}
              </div>
            </section>

          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Hủy thao tác
          </button>
          <button
            type="submit"
            form="combo-form"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save size={18} />
            )}
            {comboData ? 'Lưu thay đổi' : 'Tạo chiến dịch mới'}
          </button>
        </div>

      </div>
    </div>
  );
}
