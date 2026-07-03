import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Trash2, Check, UploadCloud, Loader2 } from 'lucide-react';
import { useProductFormContext } from '../context/ProductFormContext';
import PriceInput from '../../PriceInput';
import { productService } from '../../../services/productService';

export default function BulkActionsPanel() {
  const [isAttrDropdownOpen, setIsAttrDropdownOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const dropdownRef = useRef(null);

  const [bulkSpecKey, setBulkSpecKey] = useState('');
  const [bulkSpecValue, setBulkSpecValue] = useState('');
  const [isBulkCustomKey, setIsBulkCustomKey] = useState(false);
  const [customBulkSpecKey, setCustomBulkSpecKey] = useState('');

  const {
    activeCombinations,
    selectedVariantKeys,
    setSelectedVariantKeys,
    selectedAttributes,
    setSelectedAttributes,
    allActiveKeys,
    activeOptions,
    handleSelectByAttribute,
    bulkPrice,
    setBulkPrice,
    bulkStock,
    setBulkStock,
    handleApplyBulkEdit,
    handleBulkStatusToggle,
    handleBulkDelete,
    variantsData,
    formData,
    updateVariantField,
    showToast
  } = useProductFormContext();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAttrDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const availableSpecKeys = useMemo(() => {
    if (!formData?.specs) return [];
    try {
      const parsed = typeof formData.specs === 'string' ? JSON.parse(formData.specs) : formData.specs;
      if (Array.isArray(parsed)) {
        const keys = [];
        parsed.forEach(group => {
          if (group.items && Array.isArray(group.items)) {
            group.items.forEach(item => {
              if (item && item.key && item.key.trim()) {
                keys.push(item.key.trim());
              }
            });
          }
        });
        return Array.from(new Set(keys));
      }
    } catch (e) {
      console.error("Lỗi parse specs để trích xuất keys:", e);
    }
    return [];
  }, [formData?.specs]);

  const handleApplyBulkSpecOverride = () => {
    const finalKey = isBulkCustomKey ? customBulkSpecKey.trim() : bulkSpecKey.trim();
    if (!finalKey) {
      return showToast("warning", "Vui lòng chọn hoặc nhập tên thông số kỹ thuật.");
    }
    if (!bulkSpecValue.trim()) {
      return showToast("warning", "Vui lòng nhập giá trị ghi đè.");
    }

    selectedVariantKeys.forEach(key => {
      const vData = variantsData[key] || {};
      const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
      const index = specsList.findIndex(s => s.key.trim().toLowerCase() === finalKey.toLowerCase());
      if (index !== -1) {
        specsList[index] = { key: finalKey, value: bulkSpecValue.trim() };
      } else {
        specsList.push({ key: finalKey, value: bulkSpecValue.trim() });
      }
      updateVariantField(key, 'specsOverrideList', specsList);
    });

    showToast("success", `Đã áp dụng ghi đè thông số '${finalKey}' cho ${selectedVariantKeys.length} biến thể.`);
    setBulkSpecValue('');
  };

  const handleRemoveBulkSpecOverride = () => {
    const finalKey = isBulkCustomKey ? customBulkSpecKey.trim() : bulkSpecKey.trim();
    if (!finalKey) {
      return showToast("warning", "Vui lòng chọn hoặc nhập tên thông số để xóa.");
    }

    if (window.confirm(`Bạn có chắc chắn muốn gỡ thông số '${finalKey}' khỏi các biến thể đang chọn?`)) {
      selectedVariantKeys.forEach(key => {
        const vData = variantsData[key] || {};
        const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
        const updated = specsList.filter(s => s.key.trim().toLowerCase() !== finalKey.toLowerCase());
        updateVariantField(key, 'specsOverrideList', updated);
      });
      showToast("success", `Đã gỡ bỏ thông số '${finalKey}' khỏi ${selectedVariantKeys.length} biến thể.`);
    }
  };

  return (
    <>
      {/* 1. Selection Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-t-md border border-admin-border mb-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-admin-text-main">
            Đã chọn <span className="text-primary text-sm font-extrabold">{selectedVariantKeys.length}</span> / {activeCombinations.length} biến thể
          </span>
          <div className="h-4 w-px bg-admin-border hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedVariantKeys(allActiveKeys)}
              className="px-2.5 py-1 text-[11px] font-bold border border-admin-border rounded bg-white text-admin-text-main hover:bg-admin-bg cursor-pointer transition-all active:scale-[0.98]"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedVariantKeys([]);
                setSelectedAttributes([]);
              }}
              className="px-2.5 py-1 text-[11px] font-bold border border-admin-border rounded bg-white text-admin-text-main hover:bg-admin-bg cursor-pointer transition-all active:scale-[0.98]"
            >
              Bỏ chọn
            </button>
          </div>

          <div className="h-4 w-px bg-admin-border hidden sm:block"></div>

          {/* Custom Dropdown: Chọn theo thuộc tính */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsAttrDropdownOpen(!isAttrDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1 border border-admin-border rounded bg-white text-admin-text-main hover:bg-admin-bg text-[11px] font-bold transition-all cursor-pointer"
            >
              <span>Chọn theo thuộc tính</span>
              <ChevronDown size={12} className="text-admin-text-muted" />
            </button>
            
            {isAttrDropdownOpen && (
              <div className="absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50">
                <div className="py-1 max-h-60 overflow-y-auto">
                  {activeOptions.map(opt => (
                    <div key={opt.id} className="py-1 border-b border-gray-50 last:border-b-0">
                      <div className="px-3 py-1 text-[10px] font-extrabold text-admin-text-muted uppercase tracking-wider bg-slate-50/50">
                        {opt.name}
                      </div>
                      <div className="px-1 py-1 space-y-0.5">
                        {opt.values.map(val => {
                          const isAttrSelected = selectedAttributes.includes(`${opt.id}:${val.text}`);
                          return (
                            <button
                              key={val.internalId}
                              type="button"
                              onClick={() => handleSelectByAttribute(opt.id, val.text)}
                              className={`flex w-full items-center justify-between px-3 py-1.5 text-xs rounded transition-colors text-left cursor-pointer ${
                                isAttrSelected
                                  ? 'text-primary bg-primary/10 hover:bg-primary/20 font-bold'
                                  : 'text-admin-text-main hover:bg-primary/10 hover:text-primary font-semibold'
                              }`}
                            >
                              <span>{val.text}</span>
                              {isAttrSelected && <Check size={12} className="text-primary font-extrabold" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Bulk Actions Panel */}
      {selectedVariantKeys.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/70 to-slate-50 border border-t-0 border-admin-border p-5 rounded-b-md space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
          {/* Header: Title and cancel action */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Chỉnh sửa hàng loạt cho <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-extrabold">{selectedVariantKeys.length}</span> biến thể đã chọn
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setBulkPrice('');
                setBulkStock('');
                setSelectedVariantKeys([]);
                setSelectedAttributes([]);
              }}
              className="px-3 py-1 text-xs border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded cursor-pointer transition-all shadow-sm active:scale-95"
            >
              Hủy chọn & Đóng
            </button>
          </div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
            {/* Column 1: Pricing & Stock */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm space-y-3">
              <h5 className="text-[11px] font-extrabold text-admin-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-blue-500 rounded-sm"></span> Giá & Tồn kho
              </h5>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 justify-between">
                  <label className="text-[11px] font-bold text-admin-text-main">Giá bán riêng:</label>
                  <div className="w-32">
                    <PriceInput
                      value={bulkPrice}
                      onChange={(val) => setBulkPrice(val)}
                      className="w-full px-2.5 py-1.5 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="Nhập giá..."
                      errorAbsolute={true}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-between">
                  <label className="text-[11px] font-bold text-admin-text-main">Tồn kho:</label>
                  <input
                    type="number"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    className="w-32 px-2.5 py-1.5 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="Tồn..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (bulkPrice === '' && bulkStock === '') {
                      return showToast("warning", "Vui lòng nhập giá hoặc số lượng tồn kho để áp dụng.");
                    }
                    if (bulkPrice !== '') {
                      const p = Number(bulkPrice);
                      if (p < 1000 || p > 500000000) {
                        return showToast("warning", "Giá bán không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ).");
                      }
                    }
                    let stockNum = undefined;
                    if (bulkStock !== '') {
                      stockNum = parseInt(bulkStock);
                      if (isNaN(stockNum) || stockNum < 0) {
                        return showToast("warning", "Số lượng tồn kho không được âm.");
                      }
                    }
                    handleApplyBulkEdit(bulkPrice !== '' ? Number(bulkPrice) : undefined, stockNum);
                    setBulkPrice('');
                    setBulkStock('');
                  }}
                  className="w-full py-1.5 bg-primary hover:bg-admin-primary-hover text-white text-xs font-bold rounded cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center justify-center gap-1"
                >
                  <span>Áp dụng số liệu</span>
                </button>
              </div>
            </div>

            {/* Column 2: Image & Status */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm space-y-3">
              <h5 className="text-[11px] font-extrabold text-admin-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-indigo-500 rounded-sm"></span> Hình ảnh & Kích hoạt
              </h5>
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-admin-border rounded bg-slate-50 hover:bg-slate-100/80 text-admin-text-main text-xs font-bold transition-all cursor-pointer shadow-sm">
                  {bulkUploading ? (
                    <Loader2 size={14} className="animate-spin text-primary" />
                  ) : (
                    <UploadCloud size={14} className="text-primary" />
                  )}
                  <span>{bulkUploading ? 'Đang tải...' : 'Upload ảnh chung'}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    disabled={bulkUploading}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setBulkUploading(true);
                      try {
                        const res = await productService.uploadLocalImage(file, 'variants');
                        if (res && res.url) {
                          let finalUrl = res.url;
                          if (finalUrl.startsWith('/')) {
                            const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
                            const hostBase = apiBase.replace('/api', '');
                            finalUrl = `${hostBase}${finalUrl}`;
                          }
                          selectedVariantKeys.forEach(key => {
                            updateVariantField(key, 'imageId', finalUrl);
                          });
                          showToast("success", `Đã upload và áp dụng ảnh cho ${selectedVariantKeys.length} biến thể.`);
                        }
                      } catch (err) {
                        showToast("error", "Lỗi upload ảnh hàng loạt", err.message);
                      } finally {
                        setBulkUploading(false);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc chắn muốn gỡ bỏ hình ảnh của ${selectedVariantKeys.length} biến thể đang chọn?`)) {
                      selectedVariantKeys.forEach(key => {
                        updateVariantField(key, 'imageId', '');
                      });
                      showToast("success", `Đã gỡ ảnh của ${selectedVariantKeys.length} biến thể.`);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-2 border border-red-100 rounded bg-red-50/40 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Trash2 size={13} />
                  <span>Gỡ ảnh đã chọn</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={handleBulkStatusToggle}
                    className="py-1.5 border border-admin-border text-primary bg-primary/5 hover:bg-primary/10 text-xs font-bold rounded cursor-pointer transition-all active:scale-[0.97]"
                  >
                    Bật/Tắt kích hoạt
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="py-1.5 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1 active:scale-[0.97]"
                  >
                    <Trash2 size={13} strokeWidth={2.5} /> Xóa khỏi bảng
                  </button>
                </div>
              </div>
            </div>

            {/* Column 3: Specs Override */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm space-y-3">
              <h5 className="text-[11px] font-extrabold text-admin-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-teal-500 rounded-sm"></span> Ghi đè thông số hàng loạt
              </h5>
              
              <div className="space-y-2.5">
                {/* Quick Badges list */}
                {availableSpecKeys.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-admin-text-muted uppercase">Gợi ý thông số nhanh:</label>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto p-1 bg-slate-50/80 rounded border border-slate-100">
                      {availableSpecKeys.map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setIsBulkCustomKey(false);
                            setBulkSpecKey(k);
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                            bulkSpecKey === k && !isBulkCustomKey
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-white border border-admin-border text-admin-text-main hover:bg-primary/5 hover:text-primary'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    {availableSpecKeys.length > 0 && !isBulkCustomKey ? (
                      <select
                        className="flex-1 px-2 py-1.5 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white focus:border-primary cursor-pointer shadow-sm h-8"
                        value={bulkSpecKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsBulkCustomKey(true);
                            setBulkSpecKey('');
                          } else {
                            setBulkSpecKey(val);
                          }
                        }}
                      >
                        <option value="">-- Chọn thông số --</option>
                        {availableSpecKeys.map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                        <option value="__custom__">✍️ Tự gõ thông số...</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Tên thông số..."
                          className="w-full px-2 py-1.5 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white focus:border-primary shadow-sm h-8"
                          value={customBulkSpecKey}
                          onChange={(e) => setCustomBulkSpecKey(e.target.value)}
                        />
                        {availableSpecKeys.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsBulkCustomKey(false);
                              setCustomBulkSpecKey('');
                            }}
                            className="text-[10px] text-primary hover:underline border-0 bg-transparent cursor-pointer font-bold shrink-0"
                          >
                            Chọn lại
                          </button>
                        )}
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Giá trị (VD: 256GB)..."
                      className="w-2/5 px-2 py-1.5 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium bg-white focus:border-primary shadow-sm h-8"
                      value={bulkSpecValue}
                      onChange={(e) => setBulkSpecValue(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleApplyBulkSpecOverride}
                      className="py-1.5 bg-primary hover:bg-admin-primary-hover text-white text-xs font-bold rounded cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center justify-center"
                    >
                      Áp dụng ghi đè
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveBulkSpecOverride}
                      className="py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-bold rounded cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center justify-center"
                    >
                      Xóa thông số này
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
