import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Image as ImageIcon, Trash2, Check, UploadCloud, Loader2, X, PlusCircle, MinusCircle } from 'lucide-react';
import { useProductFormContext } from '../context/ProductFormContext';
import PriceInput from '../../PriceInput';
import { productService } from '../../../services/productService';
import { generateProductCode } from '../../../utils/codeGenerator';

export default function ProductVariantsMatrix() {
  const [isAttrDropdownOpen, setIsAttrDropdownOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const dropdownRef = useRef(null);

  const [bulkSpecKey, setBulkSpecKey] = useState('');
  const [bulkSpecValue, setBulkSpecValue] = useState('');
  const [isBulkCustomKey, setIsBulkCustomKey] = useState(false);
  const [customBulkSpecKey, setCustomBulkSpecKey] = useState('');

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

  const {
    activeCombinations,
    selectedVariantKeys,
    setSelectedVariantKeys,
    selectedAttributes,
    setSelectedAttributes,
    allActiveKeys,
    isAllSelected,
    isSomeSelected,
    handleToggleSelectAll,
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
    brands,
    formData,
    generateVariantSku,
    updateVariantField,
    expandedVariantKey,
    setExpandedVariantKey,
    duplicateSkuKeys,
    excludedKeys,
    setExcludedKeys,
    showToast
  } = useProductFormContext();

  // Tự động đóng mục xem chi tiết biến thể đang mở khi admin chọn hàng loạt biến thể
  useEffect(() => {
    if (selectedVariantKeys.length > 0) {
      setExpandedVariantKey(null);
    }
  }, [selectedVariantKeys.length, setExpandedVariantKey]);

  const handleAddSpecOverride = (key) => {
    const vData = variantsData[key] || {};
    const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
    specsList.push({ key: '', value: '' });
    updateVariantField(key, 'specsOverrideList', specsList);
  };

  const handleRemoveSpecOverride = (key, index) => {
    const vData = variantsData[key] || {};
    const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
    const updated = specsList.filter((_, i) => i !== index);
    updateVariantField(key, 'specsOverrideList', updated);
  };

  const handleSpecOverrideChange = (key, index, field, value) => {
    const vData = variantsData[key] || {};
    const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
    specsList[index] = {
      ...specsList[index],
      [field]: value
    };
    updateVariantField(key, 'specsOverrideList', specsList);
  };

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
      {activeCombinations.length > 0 && (
        <div className="p-4 rounded-md bg-white">
          <h4 className="text-sm font-bold text-admin-text-main mb-3">Danh sách các biến thể sinh ra</h4>

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
            <div className="p-4 bg-blue-50/60 border border-t-0 border-admin-border space-y-3 animate-in slide-in-from-top-2 duration-200 mb-0">
              {/* Top row: Summary + Cancel/Apply actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-xs font-extrabold text-blue-900">
                    CHỈNH SỬA HÀNG LOẠT ({selectedVariantKeys.length} biến thể đang chọn)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkPrice('');
                      setBulkStock('');
                      setSelectedVariantKeys([]);
                      setSelectedAttributes([]);
                    }}
                    className="px-2.5 py-1 border border-admin-border text-admin-text-main hover:bg-admin-bg text-[11px] font-bold rounded cursor-pointer transition-all"
                  >
                    Hủy chọn
                  </button>
                </div>
              </div>

              {/* Bottom row: Bulk Edit Controls Grid */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
                {/* Group 1: Price & Stock */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-admin-text-muted font-bold uppercase">Giá bán:</span>
                    <div className="w-28">
                      <PriceInput
                        value={bulkPrice}
                        onChange={(val) => setBulkPrice(val)}
                        className="w-full px-2 py-1 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white"
                        placeholder="Nhập giá..."
                        errorAbsolute={true}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-admin-text-muted font-bold uppercase">Tồn kho:</span>
                    <input
                      type="number"
                      value={bulkStock}
                      onChange={(e) => setBulkStock(e.target.value)}
                      className="w-16 px-2 py-1 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white"
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
                    className="px-3 py-1 bg-primary hover:bg-admin-primary-hover text-white text-[11px] font-bold rounded cursor-pointer transition-all active:scale-[0.97]"
                  >
                    Cập nhật số liệu
                  </button>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block h-6 w-px bg-blue-200"></div>

                {/* Group 2: Images (Upload / Delete) */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-admin-text-muted font-bold uppercase">Hình ảnh:</span>
                  
                  <label className="flex items-center gap-1 px-2.5 py-1 border border-admin-border rounded bg-white text-admin-text-main hover:bg-slate-50 text-[11px] font-bold transition-all cursor-pointer shadow-sm">
                    {bulkUploading ? (
                      <Loader2 size={12} className="animate-spin text-primary" />
                    ) : (
                      <UploadCloud size={12} className="text-primary" />
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
                          e.target.value = ''; // Reset input
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
                    className="flex items-center gap-1 px-2.5 py-1 border border-red-200 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Trash2 size={12} />
                    <span>Gỡ ảnh đã chọn</span>
                  </button>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block h-6 w-px bg-blue-200"></div>

                {/* Group 3: Toggle / Delete */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkStatusToggle}
                    className="px-2.5 py-1 border border-admin-border text-primary bg-primary/5 hover:bg-primary/10 text-[11px] font-bold rounded cursor-pointer transition-all active:scale-[0.97]"
                  >
                    Bật/Tắt kích hoạt
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="px-2.5 py-1 border border-admin-border text-red-700 bg-red-50 hover:bg-red-100 text-[11px] font-bold rounded cursor-pointer transition-all flex items-center gap-1 active:scale-[0.97]"
                  >
                    <Trash2 size={12} /> Xóa khỏi bảng
                  </button>
                </div>

                {/* Group 4: Bulk Specs Override */}
                <div className="w-full border-t border-blue-200/40 pt-3 mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-[11px] text-blue-900 font-bold uppercase tracking-wider">
                    Ghi đè thông số hàng loạt:
                  </span>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {availableSpecKeys.length > 0 && !isBulkCustomKey ? (
                      <select
                        className="px-2.5 py-1.5 border border-admin-border rounded outline-none text-[11px] text-admin-text-main font-semibold bg-white focus:border-primary cursor-pointer shadow-sm"
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
                        <option value="">-- Chọn thuộc tính ghi đè --</option>
                        {availableSpecKeys.map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                        <option value="__custom__">✍️ Tự gõ thuộc tính khác...</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Tên thông số tự gõ..."
                          className="px-2.5 py-1.5 border border-admin-border rounded outline-none text-[11px] text-admin-text-main font-semibold bg-white focus:border-primary w-40 shadow-sm"
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
                            className="text-[10px] text-primary hover:underline border-0 bg-transparent cursor-pointer font-bold"
                          >
                            Quay lại chọn
                          </button>
                        )}
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Nhập giá trị (VD: 256GB)..."
                      className="px-2.5 py-1.5 border border-admin-border rounded outline-none text-[11px] text-admin-text-main font-medium bg-white focus:border-primary w-48 shadow-sm"
                      value={bulkSpecValue}
                      onChange={(e) => setBulkSpecValue(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={handleApplyBulkSpecOverride}
                      className="px-3 py-1.5 bg-primary hover:bg-admin-primary-hover text-white text-[11px] font-bold rounded cursor-pointer transition-all active:scale-[0.97] shadow-sm"
                    >
                      Áp dụng ghi đè
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveBulkSpecOverride}
                      className="px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-[11px] font-bold rounded cursor-pointer transition-all active:scale-[0.97] shadow-sm"
                    >
                      Xóa thuộc tính này
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-muted font-bold bg-slate-50/30">
                  <th className="pb-2 px-2 w-10 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      checked={isAllSelected}
                      ref={el => {
                        if (el) {
                          el.indeterminate = isSomeSelected;
                        }
                      }}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="pb-2 px-2 w-14">Hình ảnh</th>
                  <th className="pb-2 px-2">Tên biến thể</th>
                  <th className="pb-2 px-2 w-48">Mã SKU</th>
                  <th className="pb-2 px-2 w-32">Giá bán (VNĐ)</th>
                  <th className="pb-2 px-2 w-24">Tồn kho</th>
                  <th className="pb-2 px-2 text-center w-24">Kích hoạt</th>
                  <th className="pb-2 px-2 text-right w-36">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {activeCombinations.map((comb, combIdx) => {
                  const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
                  const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
                  const vData = variantsData[key];

                  const selectedBrand = brands.find(b => b.id === Number(formData.brandId));
                  const brandCode = selectedBrand?.brandCode || 'GEN';
                  const productCode = formData.productCode.trim() || generateProductCode(formData.name, 20);

                  const combName = comb.map(p => p.valueText).join(' - ');
                  const defaultSku = generateVariantSku(brandCode, productCode, comb);
                  const defaultName = `${formData.name} - ${combName}`;

                  const displayName = vData?.name !== undefined ? vData.name : defaultName;
                  const currentSku = vData?.sku !== undefined ? vData.sku : defaultSku;
                  const priceVal = vData?.price !== undefined ? vData.price : '';
                  const stockVal = vData?.totalStock !== undefined ? vData.totalStock : 0;
                  const imgVal = vData?.imageId || '';
                  const isExpanded = expandedVariantKey === key;
                  const hasSkuError = duplicateSkuKeys.has(key);

                  return (
                    <React.Fragment key={key}>
                      <tr className={`border-b border-admin-border hover:bg-admin-bg/30 ${isExpanded ? 'bg-primary/5' : ''} ${selectedVariantKeys.includes(key) ? 'bg-blue-50/20 hover:bg-blue-50/30' : ''}`}>
                        {/* 0. Checkbox */}
                        <td className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            checked={selectedVariantKeys.includes(key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVariantKeys(prev => [...prev, key]);
                              } else {
                                setSelectedVariantKeys(prev => prev.filter(k => k !== key));
                              }
                            }}
                          />
                        </td>
                        {/* 1. Hình ảnh */}
                        <td className="py-3 px-2">
                          <div className="relative w-8 h-8 rounded border border-admin-border bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer group">
                            {imgVal ? (
                              <img src={imgVal} alt="Variant" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-admin-text-muted w-4 h-4" />
                            )}
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.svg"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                try {
                                  const res = await productService.uploadLocalImage(file, 'variants');
                                  if (res && res.url) {
                                    let finalUrl = res.url;
                                    if (finalUrl.startsWith('/')) {
                                      const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
                                      const hostBase = apiBase.replace('/api', '');
                                      finalUrl = `${hostBase}${finalUrl}`;
                                    }
                                    updateVariantField(key, 'imageId', finalUrl);
                                  }
                                } catch (err) {
                                  alert("Lỗi tải ảnh: " + err.message);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-1"
                            />
                            {imgVal && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  updateVariantField(key, 'imageId', '');
                                }}
                                className="absolute top-0 right-0 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow flex items-center justify-center w-3.5 h-3.5"
                                title="Xóa hình ảnh"
                              >
                                <X size={8} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 2. Tên biến thể */}
                        <td className="py-3 px-2 font-bold text-admin-text-main">
                          {displayName}
                        </td>

                        {/* 3. SKU */}
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={currentSku}
                            onChange={(e) => updateVariantField(key, 'sku', e.target.value)}
                            className={`w-full px-2 py-1 border rounded outline-none text-xs font-bold ${hasSkuError ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500' : 'border-admin-border text-admin-text-main focus:border-primary'}`}
                            placeholder="Mã SKU..."
                          />
                          {hasSkuError && (
                            <span className="text-[10px] text-red-500 font-bold block mt-0.5">Mã SKU đã tồn tại.</span>
                          )}
                        </td>

                        {/* 4. Giá bán */}
                        <td className="py-3 px-2">
                          <PriceInput
                            value={priceVal}
                            onChange={(val) => updateVariantField(key, 'price', val)}
                            className="w-full px-2 py-1 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold"
                            placeholder="Theo giá gốc SP..."
                          />
                        </td>

                        {/* 5. Tồn kho */}
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            value={stockVal}
                            onChange={(e) => updateVariantField(key, 'totalStock', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold"
                          />
                        </td>

                        {/* 5.5. Kích hoạt (Toggle switch) */}
                        <td className="py-3 px-2 text-center">
                          <div className="flex justify-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={vData?.isActive !== false}
                                onChange={(e) => updateVariantField(key, 'isActive', e.target.checked)}
                              />
                              <div className="w-9 h-5 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </td>

                        {/* 6. Thao tác */}
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedVariantKey(isExpanded ? null : key)}
                              className="px-2.5 py-1 text-xs border border-admin-border text-primary hover:bg-primary/5 rounded font-bold transition-all cursor-pointer"
                            >
                              {isExpanded ? 'Đóng' : 'Sửa chi tiết'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc chắn muốn xóa biến thể "${displayName}"?`)) {
                                  setExcludedKeys(prev => [...prev, key]);
                                  if (isExpanded) setExpandedVariantKey(null);
                                }
                              }}
                              className="p-1.5 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded transition-all cursor-pointer"
                              title="Xóa biến thể"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Detailed Inline Accordion Block */}
                      {isExpanded && (
                        <tr className="bg-gray-50/40">
                          <td colSpan="8" className="p-4 border-b border-admin-border">
                            <div className="bg-white p-5 rounded border border-admin-border/80 space-y-4">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <h5 className="font-bold text-xs text-admin-text-main uppercase tracking-wider">
                                  Cấu hình nâng cao cho: <span className="text-primary">{displayName}</span>
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => setExpandedVariantKey(null)}
                                  className="text-xs text-admin-text-muted hover:text-admin-text-main font-bold cursor-pointer"
                                >
                                  Đóng chi tiết
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cột Trái */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-admin-text-main mb-1">Tên hiển thị biến thể</label>
                                    <input
                                      type="text"
                                      value={displayName}
                                      onChange={(e) => updateVariantField(key, 'name', e.target.value)}
                                      className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-admin-text-main mb-1">Mã SKU (Manual)</label>
                                    <input
                                      type="text"
                                      value={currentSku}
                                      onChange={(e) => updateVariantField(key, 'sku', e.target.value)}
                                      className={`w-full px-3 py-2 border rounded outline-none text-xs font-semibold ${hasSkuError ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500' : 'border-admin-border text-admin-text-main focus:border-primary'}`}
                                    />
                                    {hasSkuError && (
                                      <span className="text-[11px] text-red-500 font-bold block mt-1">Mã SKU đã tồn tại.</span>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-admin-text-main mb-1">Hình ảnh biến thể</label>
                                    <div className="flex items-center gap-3">
                                      <div className="relative w-14 h-14 rounded border border-admin-border bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer group">
                                        {imgVal ? (
                                          <img src={imgVal} alt="Variant" className="w-full h-full object-cover" />
                                        ) : (
                                          <ImageIcon className="text-admin-text-muted w-5 h-5" />
                                        )}
                                        <input
                                          type="file"
                                          accept=".jpg,.jpeg,.png,.webp,.svg"
                                          onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            try {
                                              const res = await productService.uploadLocalImage(file, 'variants');
                                              if (res && res.url) {
                                                let finalUrl = res.url;
                                                if (finalUrl.startsWith('/')) {
                                                  const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
                                                  const hostBase = apiBase.replace('/api', '');
                                                  finalUrl = `${hostBase}${finalUrl}`;
                                                }
                                                updateVariantField(key, 'imageId', finalUrl);
                                              }
                                            } catch (err) {
                                              alert("Lỗi tải ảnh: " + err.message);
                                            }
                                          }}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] text-admin-text-muted font-medium">Nhấp vào ô để thay đổi ảnh biến thể</span>
                                        {imgVal && (
                                          <button
                                            type="button"
                                            onClick={() => updateVariantField(key, 'imageId', '')}
                                            className="px-2.5 py-1 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold w-fit transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                          >
                                            <Trash2 size={11} />
                                            Xóa hình ảnh
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Cột Phải */}
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-bold text-admin-text-main mb-1">Giá bán riêng (VNĐ)</label>
                                      <PriceInput
                                        value={priceVal}
                                        onChange={(val) => updateVariantField(key, 'price', val)}
                                        className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium"
                                        placeholder="Giá gốc SP..."
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-admin-text-main mb-1">Giá vốn (Cost per item)</label>
                                      <PriceInput
                                        value={vData?.costPrice || ''}
                                        onChange={(val) => updateVariantField(key, 'costPrice', val)}
                                        className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium"
                                        placeholder="Tính lợi nhuận..."
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-bold text-admin-text-main mb-1">Tồn kho</label>
                                      <input
                                        type="number"
                                        value={stockVal}
                                        onChange={(e) => updateVariantField(key, 'totalStock', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Ghi đè thông số kỹ thuật (Specs Override) */}
                              <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-bold text-admin-text-muted uppercase tracking-wider">
                                    Thông số ghi đè (Specs Override)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleAddSpecOverride(key)}
                                    className="text-[10px] font-bold text-primary hover:text-admin-primary-hover flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                                  >
                                    <PlusCircle size={12} /> Thêm ghi đè
                                  </button>
                                </div>

                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {Array.isArray(vData?.specsOverrideList) && vData.specsOverrideList.map((spec, specIdx) => {
                                    const isKeyInSpecs = availableSpecKeys.includes(spec.key);
                                    const isCustomKey = spec.key !== '' && !isKeyInSpecs;

                                    return (
                                      <div key={specIdx} className="grid grid-cols-12 gap-2 items-center bg-slate-50/30 px-2 py-1 rounded border border-admin-border/30 hover:bg-slate-50 transition-colors">
                                        <div className="col-span-5">
                                          {availableSpecKeys.length > 0 && !isCustomKey ? (
                                            <select
                                              className="w-full px-2 py-1 border border-admin-border rounded outline-none text-[11px] text-admin-text-main font-semibold bg-white focus:border-primary cursor-pointer h-7"
                                              value={spec.key}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '__custom__') {
                                                  handleSpecOverrideChange(key, specIdx, 'key', ' ');
                                                } else {
                                                  handleSpecOverrideChange(key, specIdx, 'key', val);
                                                }
                                              }}
                                            >
                                              <option value="">-- Chọn thuộc tính --</option>
                                              {availableSpecKeys.map(k => (
                                                <option key={k} value={k}>{k}</option>
                                              ))}
                                              <option value="__custom__">✍️ Nhập khác...</option>
                                            </select>
                                          ) : (
                                            <div className="relative flex items-center h-7">
                                              <input
                                                type="text"
                                                placeholder="Tên thông số..."
                                                className="w-full px-2 py-1 pr-14 border border-admin-border rounded outline-none text-[11px] text-admin-text-main font-semibold bg-white focus:border-primary h-full"
                                                value={spec.key.trim() === '' ? '' : spec.key}
                                                onChange={(e) => handleSpecOverrideChange(key, specIdx, 'key', e.target.value)}
                                                required
                                              />
                                              {availableSpecKeys.length > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleSpecOverrideChange(key, specIdx, 'key', '')}
                                                  className="absolute right-1.5 text-[9px] text-primary hover:underline border-0 bg-transparent cursor-pointer font-bold"
                                                >
                                                  Chọn lại
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="col-span-6">
                                          <input
                                            type="text"
                                            placeholder="Giá trị ghi đè (VD: 512GB)..."
                                            className="w-full px-2 py-1 border border-admin-border rounded outline-none text-[11px] text-admin-text-main font-medium bg-white focus:border-primary h-7"
                                            value={spec.value}
                                            onChange={(e) => handleSpecOverrideChange(key, specIdx, 'value', e.target.value)}
                                            required
                                          />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveSpecOverride(key, specIdx)}
                                            className="text-admin-danger hover:text-red-700 transition-colors p-1 border-0 bg-transparent cursor-pointer flex items-center justify-center flex-shrink-0"
                                            title="Xóa ghi đè"
                                          >
                                            <MinusCircle size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {(!Array.isArray(vData?.specsOverrideList) || vData.specsOverrideList.length === 0) && (
                                    <div className="text-center py-2 text-[10px] text-admin-text-muted italic bg-slate-50/20 rounded border border-dashed border-admin-border/50">
                                      Không có thông số nào bị ghi đè.
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bottom panel with Auto-Save status and Hoàn tất button */}
                              <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-4">
                                <span className="text-[11px] text-green-600 font-bold flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                  Các thay đổi được tự động ghi nhận vào biểu mẫu chung
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedVariantKey(null)}
                                  className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-admin-primary-hover transition-colors cursor-pointer"
                                >
                                  Hoàn tất
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {excludedKeys.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md flex items-center justify-between">
              <span className="text-xs text-admin-text-muted font-medium">Đang ẩn {excludedKeys.length} biến thể không kinh doanh.</span>
              <button
                type="button"
                onClick={() => setExcludedKeys([])}
                className="text-xs font-bold text-primary hover:text-admin-primary-hover cursor-pointer"
              >
                Khôi phục tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
