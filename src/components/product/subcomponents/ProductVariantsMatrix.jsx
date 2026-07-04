import React, { useEffect } from 'react';
import { Image as ImageIcon, Trash2, X } from 'lucide-react';
import { useProductFormContext } from '../../../context/ProductFormContext';
import PriceInput from '../../PriceInput';
import { productService } from '../../../services/productService';
import { generateProductCode } from '../../../utils/codeGenerator';
import BulkActionsPanel from './BulkActionsPanel';
import VariantDetailAccordion from './VariantDetailAccordion';
import SharedLocalImageUpload from '../../SharedLocalImageUpload';

export default function ProductVariantsMatrix() {
  const {
    activeCombinations,
    selectedVariantKeys,
    setSelectedVariantKeys,
    setSelectedAttributes,
    variantsData,
    brands,
    formData,
    generateVariantSku,
    updateVariantField,
    expandedVariantKey,
    setExpandedVariantKey,
    duplicateSkuKeys,
    excludedKeys,
    setExcludedKeys
  } = useProductFormContext();

  // Tự động đóng mục xem chi tiết biến thể đang mở khi admin chọn hàng loạt biến thể
  useEffect(() => {
    if (selectedVariantKeys.length > 0) {
      setExpandedVariantKey(null);
    }
  }, [selectedVariantKeys.length, setExpandedVariantKey]);

  return (
    <>
      {activeCombinations.length > 0 && (
        <div className="p-4 rounded-md bg-white">
          <h4 className="text-sm font-bold text-admin-text-main mb-3">Danh sách các biến thể sinh ra</h4>

          {/* 1 & 2. Toolbar & Bulk Actions Panel */}
          <BulkActionsPanel />

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-muted font-bold bg-slate-50/30">
                  <th className="pb-2 px-2 w-10 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      checked={selectedVariantKeys.length === activeCombinations.length && activeCombinations.length > 0}
                      ref={el => {
                        if (el) {
                          el.indeterminate = selectedVariantKeys.length > 0 && selectedVariantKeys.length < activeCombinations.length;
                        }
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Chọn tất cả các key biến thể hoạt động
                          const keys = activeCombinations.map(comb => {
                            const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
                            return sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
                          });
                          setSelectedVariantKeys(keys);
                        } else {
                          setSelectedVariantKeys([]);
                          setSelectedAttributes([]);
                        }
                      }}
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
                        <td className="py-3 px-2">
                          <SharedLocalImageUpload
                            multiple={false}
                            compact={true}
                            value={imgVal}
                            onChange={(url) => updateVariantField(key, 'imageId', url)}
                            folder="variants"
                          />
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
                        <VariantDetailAccordion
                          variantKey={key}
                          displayName={displayName}
                          currentSku={currentSku}
                          priceVal={priceVal}
                          stockVal={stockVal}
                          imgVal={imgVal}
                          hasSkuError={hasSkuError}
                        />
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
