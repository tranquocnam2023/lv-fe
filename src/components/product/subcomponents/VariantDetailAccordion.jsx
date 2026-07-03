import React, { useMemo } from 'react';
import { Image as ImageIcon, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { useProductFormContext } from '../context/ProductFormContext';
import PriceInput from '../../PriceInput';
import { productService } from '../../../services/productService';
import SharedLocalImageUpload from '../../SharedLocalImageUpload';

export default function VariantDetailAccordion({
  variantKey,
  displayName,
  currentSku,
  priceVal,
  stockVal,
  imgVal,
  hasSkuError
}) {
  const {
    variantsData,
    formData,
    updateVariantField,
    setExpandedVariantKey,
    showToast
  } = useProductFormContext();

  const vData = variantsData[variantKey] || {};

  // Trích xuất các key từ specs template của sản phẩm cha để gợi ý
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
      console.error("Lỗi parse specs trong accordion:", e);
    }
    return [];
  }, [formData?.specs]);

  const handleAddSpecOverride = () => {
    const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
    specsList.push({ key: '', value: '' });
    updateVariantField(variantKey, 'specsOverrideList', specsList);
  };

  const handleAddQuickSpecOverride = (specKey) => {
    const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
    const exists = specsList.some(s => s.key.trim().toLowerCase() === specKey.toLowerCase());
    if (exists) {
      showToast("warning", `Thông số '${specKey}' đã được thêm.`);
      return;
    }
    specsList.push({ key: specKey, value: '' });
    updateVariantField(variantKey, 'specsOverrideList', specsList);
  };

  const handleRemoveSpecOverride = (index) => {
    const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
    const updated = specsList.filter((_, i) => i !== index);
    updateVariantField(variantKey, 'specsOverrideList', updated);
  };

  const handleSpecOverrideChange = (index, field, value) => {
    const specsList = Array.isArray(vData.specsOverrideList) ? [...vData.specsOverrideList] : [];
    specsList[index] = {
      ...specsList[index],
      [field]: value
    };
    updateVariantField(variantKey, 'specsOverrideList', specsList);
  };

  return (
    <tr className="bg-gray-50/40">
      <td colSpan="8" className="p-4 border-b border-admin-border">
        <div className="bg-slate-50/55 hover:bg-slate-50/80 border-l-4 border-l-primary border-y border-r border-admin-border/80 shadow-inner rounded-r-lg p-5 space-y-4 transition-all duration-200">
          {/* Header: Title & Close action */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold rounded uppercase tracking-wider">Cấu hình nâng cao</span>
              <h5 className="font-extrabold text-xs text-admin-text-main">
                Biến thể: <span className="text-primary">{displayName}</span>
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setExpandedVariantKey(null)}
              className="text-xs text-admin-text-muted hover:text-admin-text-main font-bold cursor-pointer transition-colors"
            >
              Đóng chi tiết
            </button>
          </div>

          {/* 2-Column Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Pricing & Inventory */}
            <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-3">
              <h6 className="text-[10px] font-bold text-admin-text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-1.5 mb-1">
                <span className="w-1 h-2.5 bg-blue-500 rounded-sm"></span> Giá bán & Kho hàng
              </h6>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-admin-text-main mb-1">
                    Giá bán riêng (VNĐ) <span className="text-admin-text-muted font-normal cursor-help" title="Để trống nếu muốn áp dụng giá bán chung của sản phẩm">(?)</span>
                  </label>
                  <PriceInput
                    value={priceVal}
                    onChange={(val) => updateVariantField(variantKey, 'price', val)}
                    className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="Theo giá chung..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-admin-text-main mb-1">
                    Giá vốn (VNĐ) <span className="text-admin-text-muted font-normal cursor-help" title="Giá vốn nhập kho dùng để tính lợi nhuận sản phẩm">(?)</span>
                  </label>
                  <PriceInput
                    value={vData?.costPrice || ''}
                    onChange={(val) => updateVariantField(variantKey, 'costPrice', val)}
                    className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="Tính lợi nhuận..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-admin-text-main mb-1">Tồn kho biến thể</label>
                  <input
                    type="number"
                    value={stockVal}
                    onChange={(e) => updateVariantField(variantKey, 'totalStock', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold bg-white focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Identity & Media */}
            <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <h6 className="text-[10px] font-bold text-admin-text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-1.5 mb-2.5">
                  <span className="w-1 h-2.5 bg-indigo-500 rounded-sm"></span> Định danh & SKU
                </h6>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-admin-text-muted">Tên biến thể:</span>
                    <span className="text-xs font-bold text-admin-text-main">{displayName}</span>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-admin-text-main mb-1">Mã SKU biến thể</label>
                    <input
                      type="text"
                      value={currentSku}
                      onChange={(e) => updateVariantField(variantKey, 'sku', e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded outline-none text-xs font-bold ${hasSkuError ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500' : 'border-admin-border text-admin-text-main focus:border-primary'}`}
                    />
                    {hasSkuError && (
                      <span className="text-[10px] text-red-500 font-bold block mt-1">Mã SKU đã tồn tại.</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-50 w-full">
                <SharedLocalImageUpload
                  multiple={false}
                  value={imgVal}
                  onChange={(url) => updateVariantField(variantKey, 'imageId', url)}
                  folder="variants"
                  label="Hình ảnh đại diện"
                />
              </div>
            </div>
          </div>

          {/* Ghi đè thông số kỹ thuật (Specs Override) */}
          <div className="border-t border-slate-200/60 pt-3.5 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <label className="text-[10px] font-bold text-admin-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-2.5 bg-teal-500 rounded-sm"></span> Thông số ghi đè (Specs Override)
              </label>
              <button
                type="button"
                onClick={handleAddSpecOverride}
                className="text-[10px] font-bold text-primary hover:text-admin-primary-hover flex items-center gap-1 border-0 bg-transparent cursor-pointer transition-colors"
              >
                <PlusCircle size={12} /> Thêm thủ công
              </button>
            </div>

            {/* Suggestion pills */}
            {availableSpecKeys.length > 0 && (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-admin-text-muted uppercase">Gợi ý thêm nhanh thông số sản phẩm cha:</label>
                <div className="flex flex-wrap gap-1 p-1.5 bg-white rounded border border-slate-100 shadow-sm max-h-16 overflow-y-auto">
                  {availableSpecKeys.map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleAddQuickSpecOverride(k)}
                      className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-50 hover:bg-primary/10 hover:text-primary border border-admin-border text-admin-text-main transition-colors cursor-pointer"
                    >
                      + {k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Array.isArray(vData?.specsOverrideList) && vData.specsOverrideList.map((spec, specIdx) => {
                const isKeyInSpecs = availableSpecKeys.includes(spec.key);
                const isCustomKey = spec.key !== '' && !isKeyInSpecs;

                return (
                  <div key={specIdx} className="grid grid-cols-12 gap-2 items-center bg-white px-3 py-1.5 rounded-lg border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                    <div className="col-span-5">
                      {availableSpecKeys.length > 0 && !isCustomKey ? (
                        <select
                          className="w-full px-2 py-1 border border-admin-border rounded outline-none text-[11px] text-admin-text-main font-semibold bg-white focus:border-primary cursor-pointer h-7"
                          value={spec.key}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              handleSpecOverrideChange(specIdx, 'key', ' ');
                            } else {
                              handleSpecOverrideChange(specIdx, 'key', val);
                            }
                          }}
                        >
                          <option value="">-- Chọn thông số --</option>
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
                            className="w-full px-2 py-1 pr-12 border border-admin-border rounded outline-none text-[11px] text-admin-text-main font-semibold bg-white focus:border-primary h-full"
                            value={spec.key.trim() === '' ? '' : spec.key}
                            onChange={(e) => handleSpecOverrideChange(specIdx, 'key', e.target.value)}
                            required
                          />
                          {availableSpecKeys.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSpecOverrideChange(specIdx, 'key', '')}
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
                        onChange={(e) => handleSpecOverrideChange(specIdx, 'value', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecOverride(specIdx)}
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
                <div className="text-center py-2.5 text-[10px] text-admin-text-muted italic bg-white rounded-lg border border-dashed border-admin-border/50">
                  Không có thông số nào bị ghi đè.
                </div>
              )}
            </div>
          </div>

          {/* Bottom panel: Auto-Save status & Close & Apply button */}
          <div className="flex justify-between items-center border-t border-gray-200/60 pt-3 mt-4">
            <span className="text-[11px] text-green-600 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Các thay đổi được tự động ghi nhận vào biểu mẫu chung
            </span>
            <button
              type="button"
              onClick={() => setExpandedVariantKey(null)}
              className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-admin-primary-hover transition-all cursor-pointer shadow-sm active:scale-[0.97]"
            >
              Đóng & Áp dụng
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
