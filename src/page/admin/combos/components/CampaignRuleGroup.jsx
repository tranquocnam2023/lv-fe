import React from 'react';
import { Plus, Trash2, Info, HelpCircle } from 'lucide-react';
import SearchableSelect from '../../../../components/common/SearchableSelect';

/**
 * Component quản lý nhóm quy tắc (Dùng chung cho cả Sản phẩm chính và Phụ kiện mua kèm).
 */
export default function CampaignRuleGroup({
  sectionTitle,
  sectionSubtitle,
  icon: Icon,
  colorTheme = 'blue', // 'blue' | 'amber'
  rules = [],
  onAddRule,
  onRemoveRule,
  onUpdateRule,
  products = [],
  getFilteredCategories,
  getFilteredBrands,
  emptyMessage = 'Chưa thêm quy tắc nào.',
  emptySubMessage = '',
  addButtonLabel = 'Thêm nhóm điều kiện',
  emptyAddButtonLabel = 'Thêm quy tắc đầu tiên',
  productLabel = 'Sản phẩm cụ thể',
  productPlaceholder = '-- Bất kỳ sản phẩm nào --',
  categoryLabel = 'Thuộc Danh mục',
  categoryPlaceholder = '-- Bất kỳ danh mục nào --',
  brandLabel = 'Thuộc Thương hiệu',
  brandPlaceholder = '-- Bất kỳ thương hiệu nào --',
  infoTitle,
  infoContent
}) {
  const isAmber = colorTheme === 'amber';

  const badgeBg = isAmber ? 'bg-amber-100/80 text-amber-800' : 'bg-blue-100/80 text-blue-700';
  const infoBg = isAmber ? 'bg-amber-50/70 border-amber-100 text-amber-950' : 'bg-blue-50/70 border-blue-100 text-blue-900';
  const infoIconColor = isAmber ? 'text-amber-600' : 'text-blue-600';
  const addBtnBg = isAmber ? 'bg-amber-50 hover:bg-amber-100 text-amber-800' : 'bg-blue-50 hover:bg-blue-100 text-blue-700';
  const iconColor = isAmber ? 'text-amber-600' : 'text-blue-600';
  const focusBorderColor = isAmber ? 'focus:border-amber-500' : 'focus:border-blue-500';

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            {Icon && <Icon size={20} className={iconColor} />}
            <span>{sectionTitle}</span>
          </h2>
          {sectionSubtitle && (
            <p className="text-xs text-gray-500 font-medium mt-1">{sectionSubtitle}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onAddRule}
          className={`px-4 py-2 ${addBtnBg} rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer`}
        >
          <Plus size={16} strokeWidth={3} />
          <span>{addButtonLabel}</span>
        </button>
      </div>

      {/* Info Box */}
      {infoContent && (
        <div className={`p-4 border rounded-2xl flex items-start gap-3 text-xs ${infoBg}`}>
          {isAmber ? <HelpCircle size={18} className={`shrink-0 mt-0.5 ${infoIconColor}`} /> : <Info size={18} className={`shrink-0 mt-0.5 ${infoIconColor}`} />}
          <div className="space-y-1.5 leading-relaxed">
            {infoTitle && <p className="font-bold text-sm">{infoTitle}</p>}
            {infoContent}
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className={`p-8 border-2 border-dashed rounded-2xl text-center ${isAmber ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'}`}>
          <p className={`font-bold text-sm ${isAmber ? 'text-red-600' : 'text-gray-700'}`}>{emptyMessage}</p>
          {emptySubMessage && <p className="text-xs text-gray-500 mt-1">{emptySubMessage}</p>}
          <button
            type="button"
            onClick={onAddRule}
            className={`mt-4 px-4 py-2 ${isAmber ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' : 'bg-white border border-gray-300 hover:border-blue-500 text-blue-700 shadow-sm'} rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer`}
          >
            <Plus size={14} strokeWidth={3} />
            <span>{emptyAddButtonLabel}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, idx) => (
            <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 relative group">
              <div className="flex justify-between items-center">
                <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${badgeBg}`}>
                  Nhóm điều kiện #{idx + 1}
                </span>
                {(rules.length > 1 || !isAmber) && (
                  <button
                    type="button"
                    onClick={() => onRemoveRule(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa nhóm này"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Sản phẩm cụ thể */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">{productLabel}</label>
                  <SearchableSelect
                    options={products}
                    value={rule.productId}
                    onChange={(val) => onUpdateRule(idx, 'productId', val)}
                    placeholder={productPlaceholder}
                    colorTheme={colorTheme}
                  />
                </div>

                {/* 2. Danh mục */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">{categoryLabel}</label>
                  <select
                    disabled={Boolean(rule.productId)}
                    className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none ${focusBorderColor} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                    value={rule.categoryId}
                    onChange={(e) => onUpdateRule(idx, 'categoryId', e.target.value)}
                  >
                    <option value="">{categoryPlaceholder}</option>
                    {getFilteredCategories(rule.brandId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Thương hiệu */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">{brandLabel}</label>
                  <select
                    disabled={Boolean(rule.productId)}
                    className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none ${focusBorderColor} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                    value={rule.brandId}
                    onChange={(e) => onUpdateRule(idx, 'brandId', e.target.value)}
                  >
                    <option value="">{brandPlaceholder}</option>
                    {getFilteredBrands(rule.categoryId).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
