import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { brandService } from '../../../services/brandService';
import { categoryBrandDefaultService } from '../../../services/categoryBrandDefaultService';

export default function CategoryBrandDefaultsEditor({ categoryId, specsTemplate }) {
  const [brands, setBrands] = useState([]);
  const [configuredDefaults, setConfiguredDefaults] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [localDefaults, setLocalDefaults] = useState({}); // map of { brandId: { specKey: value } }
  const [statusMsg, setStatusMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState({ brandId: null, keyName: null });

  const handleToggleExpand = (brandId) => {
    setExpandedId(expandedId === brandId ? null : brandId);
    setSearchQuery('');
    setEditingKey({ brandId: null, keyName: null });
  };

  const handleAddSpecKey = (brandId, keyName) => {
    setLocalDefaults(prev => ({
      ...prev,
      [brandId]: {
        ...(prev[brandId] || {}),
        [keyName]: ''
      }
    }));
  };

  const handleRemoveSpecKey = (brandId, keyName) => {
    setLocalDefaults(prev => {
      const brandSpecs = { ...(prev[brandId] || {}) };
      delete brandSpecs[keyName];
      return {
        ...prev,
        [brandId]: brandSpecs
      };
    });
  };

  // Parse template groups to list all available keys
  const templateKeys = React.useMemo(() => {
    if (!specsTemplate) return [];
    try {
      const parsed = JSON.parse(specsTemplate);
      if (Array.isArray(parsed)) {
        const keys = [];
        parsed.forEach(group => {
          if (group.items && Array.isArray(group.items)) {
            group.items.forEach(item => {
              if (item && !keys.includes(item)) {
                keys.push({ groupName: group.groupName, keyName: item });
              }
            });
          }
        });
        return keys;
      }
    } catch (e) {
      console.error("Lỗi parse specsTemplate trong defaults editor:", e);
    }
    return [];
  }, [specsTemplate]);

  // Load brands and existing overrides
  useEffect(() => {
    if (!categoryId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [allBrands, existingOverrides] = await Promise.all([
          brandService.getAll(),
          categoryBrandDefaultService.getByCategory(categoryId)
        ]);

        setBrands(allBrands || []);
        
        const configured = existingOverrides || [];
        setConfiguredDefaults(configured);

        // Map existing to local state for inputs
        const initialLocal = {};
        configured.forEach(item => {
          try {
            initialLocal[item.brandId] = JSON.parse(item.defaultSpecs || '{}');
          } catch (e) {
            initialLocal[item.brandId] = {};
          }
        });
        setLocalDefaults(initialLocal);
      } catch (e) {
        console.error("Lỗi nạp cấu hình thương hiệu mặc định:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [categoryId]);

  const showStatus = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleAddBrandConfig = () => {
    if (!selectedBrandId) return;
    
    const brandIdInt = parseInt(selectedBrandId);
    // Check if already configured
    if (configuredDefaults.some(d => d.brandId === brandIdInt)) {
      showStatus('error', 'Hãng này đã được cấu hình từ trước!');
      return;
    }

    const brand = brands.find(b => b.id === brandIdInt);
    if (!brand) return;

    const newConfigItem = {
      id: 0, // Temporary ID for unsaved items
      categoryId: parseInt(categoryId),
      brandId: brand.id,
      brandName: brand.name,
      defaultSpecs: '{}'
    };

    setConfiguredDefaults(prev => [newConfigItem, ...prev]);
    setLocalDefaults(prev => ({
      ...prev,
      [brand.id]: {}
    }));
    setExpandedId(brand.id);
    setSearchQuery('');
    setEditingKey({ brandId: null, keyName: null });
    setSelectedBrandId('');
    showStatus('success', `Đã thêm khung cấu hình cho hãng ${brand.name}. Nhớ điền thông tin và bấm Lưu!`);
  };

  const handleValueChange = (brandId, keyName, val) => {
    setLocalDefaults(prev => ({
      ...prev,
      [brandId]: {
        ...(prev[brandId] || {}),
        [keyName]: val
      }
    }));
  };

  const handleSaveConfig = async (brandId) => {
    const specsForBrand = localDefaults[brandId] || {};
    // Clean empty values
    const cleanedSpecs = {};
    Object.entries(specsForBrand).forEach(([k, v]) => {
      if (v && v.trim() !== '') {
        cleanedSpecs[k] = v.trim();
      }
    });

    try {
      const res = await categoryBrandDefaultService.upsert({
        categoryId: parseInt(categoryId),
        brandId: parseInt(brandId),
        defaultSpecs: JSON.stringify(cleanedSpecs)
      });
      
      showStatus('success', res.message || 'Lưu cấu hình mặc định thành công!');
      
      // Reload overrides to get real database IDs
      const updatedOverrides = await categoryBrandDefaultService.getByCategory(categoryId);
      setConfiguredDefaults(updatedOverrides || []);
    } catch (e) {
      console.error("Lỗi khi lưu cấu hình thương hiệu:", e);
      showStatus('error', 'Lưu cấu hình thất bại. Vui lòng kiểm tra lại!');
    }
  };

  const handleDeleteConfig = async (configId, brandId, brandName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cấu hình mặc định của hãng ${brandName}?`)) return;

    try {
      if (configId > 0) {
        await categoryBrandDefaultService.delete(configId);
      }
      
      setConfiguredDefaults(prev => prev.filter(item => item.brandId !== brandId));
      setLocalDefaults(prev => {
        const copy = { ...prev };
        delete copy[brandId];
        return copy;
      });
      
      if (expandedId === brandId) setExpandedId(null);
      showStatus('success', `Đã xóa cấu hình mặc định của hãng ${brandName}`);
    } catch (e) {
      console.error("Lỗi khi xóa cấu hình mặc định:", e);
      showStatus('error', 'Xóa cấu hình thất bại.');
    }
  };

  // Get list of brands not yet configured
  const availableBrands = brands.filter(b => 
    !configuredDefaults.some(d => d.brandId === b.id)
  );

  if (!categoryId) {
    return (
      <div className="bg-slate-50 border border-admin-border rounded-md p-4 flex items-center gap-3">
        <AlertCircle size={18} className="text-admin-text-muted" />
        <span className="text-xs text-admin-text-muted font-semibold">
          Vui lòng lưu danh mục trước khi cấu hình giá trị thông số mặc định theo từng thương hiệu.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md border border-admin-border shadow-sm space-y-5">
      <div>
        <h3 className="text-base font-bold text-admin-text-main border-b border-gray-100 pb-3 font-sans flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          Cấu hình Giá trị mặc định theo Thương hiệu
        </h3>
        <p className="text-xs text-admin-text-muted mt-1">
          Hệ thống sẽ tự động điền các giá trị này khi tạo sản phẩm mới dựa trên việc kết hợp Danh mục và Thương hiệu đã chọn.
        </p>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-md text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {statusMsg.text}
        </div>
      )}

      {/* Selector to add new brand rule */}
      {templateKeys.length === 0 ? (
        <div className="text-center py-6 text-admin-text-muted text-xs border border-dashed border-admin-border rounded-md font-medium">
          Hãy thêm các thuộc tính ở phần "Khung thông số kỹ thuật mẫu" trước để cấu hình giá trị mặc định cho từng thương hiệu.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-slate-50 p-3 rounded-md border border-admin-border/50">
            <div className="flex-1 space-y-1">
              <label className="block text-[11px] font-bold text-admin-text-muted uppercase">Chọn thương hiệu cấu hình mới</label>
              <select
                className="w-full px-3 py-2 border border-admin-border rounded-md bg-white text-xs font-semibold text-admin-text-main outline-none focus:border-primary"
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
              >
                <option value="">-- Chọn thương hiệu --</option>
                {availableBrands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddBrandConfig}
              disabled={!selectedBrandId}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-md transition-colors hover:bg-admin-primary-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0 w-full sm:w-auto"
            >
              <Plus size={14} />
              Thêm quy tắc hãng
            </button>
          </div>

          {/* Configured defaults list */}
          {configuredDefaults.length === 0 ? (
            <div className="text-center py-8 text-admin-text-muted text-xs border border-dashed border-admin-border rounded-md font-medium">
              Chưa thiết lập quy tắc tự động điền theo thương hiệu nào cho danh mục này.
            </div>
          ) : (
            <div className="space-y-3">
              {configuredDefaults.map((item) => {
                const isExpanded = expandedId === item.brandId;
                const currentVals = localDefaults[item.brandId] || {};
                const filledCount = Object.values(currentVals).filter(v => v && v.trim() !== '').length;

                return (
                  <div 
                    key={item.brandId}
                    className={`border rounded-md transition-all duration-200 ${
                      isExpanded 
                        ? 'border-primary shadow-sm ring-1 ring-primary/10' 
                        : 'border-admin-border hover:border-slate-300'
                    }`}
                  >
                    {/* Accordion Header */}
                    <div 
                      onClick={() => handleToggleExpand(item.brandId)}
                      className="flex items-center justify-between p-3.5 bg-slate-50/50 cursor-pointer select-none rounded-t-md"
                    >
                      <div className="flex items-center gap-3">
                        {/* Brand Logo */}
                        {(() => {
                          const brandInfo = brands.find(b => b.id === item.brandId);
                          if (brandInfo?.imageUrl) {
                            return (
                              <div className="w-6 h-6 rounded bg-white border border-admin-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-0.5">
                                <img src={brandInfo.imageUrl} alt={item.brandName} className="w-full h-full object-contain" />
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <span className="text-xs font-extrabold text-admin-text-main uppercase">{item.brandName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 border text-admin-text-muted font-bold">
                          Đã thiết lập: {filledCount}/{templateKeys.length} thông số
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleSaveConfig(item.brandId)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Lưu cấu hình thương hiệu này"
                        >
                          <Save size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConfig(item.id, item.brandId, item.brandName)}
                          className="p-1.5 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa quy tắc của hãng này"
                        >
                          <Trash2 size={15} />
                        </button>
                        <div 
                          onClick={() => handleToggleExpand(item.brandId)}
                          className="p-1 text-admin-text-muted hover:text-admin-text-main cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Content */}
                    {isExpanded && (() => {
                      const filteredKeys = templateKeys.filter(({ keyName, groupName }) => 
                        !searchQuery ||
                        keyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        groupName.toLowerCase().includes(searchQuery.toLowerCase())
                      );

                      const groupedTemplateKeys = {};
                      filteredKeys.forEach(({ groupName, keyName }) => {
                        if (!groupedTemplateKeys[groupName]) {
                          groupedTemplateKeys[groupName] = [];
                        }
                        groupedTemplateKeys[groupName].push(keyName);
                      });

                      return (
                        <div className="p-4 border-t border-slate-100 bg-white space-y-5 animate-in fade-in duration-200">
                          {/* Search Filter */}
                          <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50 p-2.5 rounded-lg border border-admin-border/40">
                            <span className="text-[11px] font-extrabold text-admin-text-muted uppercase tracking-wider">
                              Danh sách thông số kỹ thuật ({templateKeys.length})
                            </span>
                            <input
                              type="text"
                              placeholder="🔍 Nhập từ khóa để lọc nhanh..."
                              className="px-2.5 py-1 border border-admin-border rounded text-xs font-semibold outline-none focus:border-primary w-full sm:w-64 bg-white"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>

                          {/* Unified Inline Specs Table by Group */}
                          {Object.keys(groupedTemplateKeys).length === 0 ? (
                            <div className="text-center py-5 text-xs text-admin-text-muted italic select-none">
                              Không tìm thấy thông số nào phù hợp.
                            </div>
                          ) : (
                            <div className="border border-slate-100 rounded-md divide-y divide-slate-100 bg-white">
                              {Object.entries(groupedTemplateKeys).map(([group, keys]) => (
                                <div key={group} className="flex flex-col sm:flex-row sm:items-start p-3.5 gap-3 hover:bg-slate-50/30 transition-colors">
                                  {/* Group Header Text (Left) */}
                                  <div className="sm:w-40 shrink-0 pt-1.5 pl-2">
                                    <span className="text-[11px] font-extrabold text-admin-text-main uppercase tracking-wider select-none">
                                      {group}
                                    </span>
                                  </div>
                                  
                                  {/* Inline Edit and Add Chips (Right) */}
                                  <div className="flex-1 flex flex-wrap gap-2">
                                    {keys.map((keyName) => {
                                      const isActive = Object.prototype.hasOwnProperty.call(currentVals, keyName);
                                      const val = currentVals[keyName] || '';
                                      const isEditing = editingKey.brandId === item.brandId && editingKey.keyName === keyName;

                                      if (isActive) {
                                        if (isEditing) {
                                          return (
                                            <div 
                                              key={keyName}
                                              className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary rounded-md px-2 py-0.5 text-[11px] font-bold"
                                            >
                                              <span className="text-[10px] text-primary/70">{keyName}:</span>
                                              <input
                                                type="text"
                                                value={val}
                                                onChange={(e) => handleValueChange(item.brandId, keyName, e.target.value)}
                                                onBlur={() => setEditingKey({ brandId: null, keyName: null })}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    e.target.blur();
                                                  }
                                                }}
                                                className="bg-white border border-primary/20 rounded px-1.5 py-0.5 text-xs font-semibold text-admin-text-main outline-none focus:border-primary w-32"
                                                autoFocus
                                              />
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveSpecKey(item.brandId, keyName);
                                                  setEditingKey({ brandId: null, keyName: null });
                                                }}
                                                className="text-red-500 hover:text-red-700 font-extrabold ml-1 cursor-pointer select-none"
                                                title="Xóa"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div 
                                              key={keyName}
                                              onClick={() => setEditingKey({ brandId: item.brandId, keyName })}
                                              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:border-primary/50 hover:bg-primary/20 rounded-md px-2.5 py-1 text-[11px] font-bold cursor-pointer select-none transition-all"
                                              title="Nhấp để chỉnh sửa giá trị inline"
                                            >
                                              <span>{keyName}:</span>
                                              <span className="underline decoration-dotted underline-offset-2 font-extrabold text-admin-text-main">
                                                {val || 'Chưa cấu hình'}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveSpecKey(item.brandId, keyName);
                                                }}
                                                className="text-red-400 hover:text-red-600 font-extrabold ml-1 cursor-pointer"
                                                title="Gỡ bỏ thông số này"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          );
                                        }
                                      } else {
                                        return (
                                          <button
                                            key={keyName}
                                            type="button"
                                            onClick={() => {
                                              handleAddSpecKey(item.brandId, keyName);
                                              setEditingKey({ brandId: item.brandId, keyName });
                                            }}
                                            className="px-2.5 py-1 bg-white border border-dashed border-admin-border text-admin-text-muted text-[11px] font-bold rounded-md hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all flex items-center gap-1 cursor-pointer select-none"
                                          >
                                            <span className="text-primary font-bold">+</span>
                                            <span>{keyName}</span>
                                          </button>
                                        );
                                      }
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                            <button
                              type="button"
                              onClick={() => handleSaveConfig(item.brandId)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-admin-primary-hover transition-colors cursor-pointer border-0"
                            >
                              <Save size={13} />
                              Lưu cấu hình {item.brandName}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
