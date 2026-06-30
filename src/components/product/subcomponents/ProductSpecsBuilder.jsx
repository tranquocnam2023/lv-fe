import React, { useState } from 'react';
import { Plus, Trash2, FolderPlus, PlusCircle, LayoutGrid, Layers } from 'lucide-react';
import { useProductFormContext } from '../context/ProductFormContext';

export default function ProductSpecsBuilder() {
  const { formData, setFormData } = useProductFormContext();
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  // Chuẩn hóa specs về dạng mảng
  const getNormalizedSpecs = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '' || trimmed === '[]') return [];
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const specsGroups = getNormalizedSpecs(formData.specs);

  const updateSpecs = (newSpecs) => {
    setFormData(prev => ({
      ...prev,
      specs: JSON.stringify(newSpecs)
    }));
  };

  // Actions
  const addGroup = () => {
    const nextSpecs = [
      ...specsGroups,
      { groupName: '', items: [{ key: '', value: '' }] }
    ];
    updateSpecs(nextSpecs);
    setActiveTabIdx(nextSpecs.length - 1); // Tự chuyển sang tab mới
  };

  const removeGroup = (gIdx) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ nhóm thông số này?")) {
      const nextSpecs = specsGroups.filter((_, idx) => idx !== gIdx);
      updateSpecs(nextSpecs);
      setActiveTabIdx(prev => {
        if (gIdx <= prev) {
          return Math.max(0, prev - 1);
        }
        return prev;
      });
    }
  };

  const updateGroupName = (gIdx, value) => {
    const nextSpecs = specsGroups.map((g, idx) => 
      idx === gIdx ? { ...g, groupName: value } : g
    );
    updateSpecs(nextSpecs);
  };

  const addSpecItem = (gIdx) => {
    const nextSpecs = specsGroups.map((g, idx) => {
      if (idx === gIdx) {
        return {
          ...g,
          items: [...g.items, { key: '', value: '' }]
        };
      }
      return g;
    });
    updateSpecs(nextSpecs);
  };

  const removeSpecItem = (gIdx, iIdx) => {
    const nextSpecs = specsGroups.map((g, idx) => {
      if (idx === gIdx) {
        return {
          ...g,
          items: g.items.filter((_, itemIdx) => itemIdx !== iIdx)
        };
      }
      return g;
    });
    updateSpecs(nextSpecs);
  };

  const updateSpecItemField = (gIdx, iIdx, field, value) => {
    const nextSpecs = specsGroups.map((g, idx) => {
      if (idx === gIdx) {
        const newItems = g.items.map((item, itemIdx) => 
          itemIdx === iIdx ? { ...item, [field]: value } : item
        );
        return { ...g, items: newItems };
      }
      return g;
    });
    updateSpecs(nextSpecs);
  };

  // Excel-Style Keyboard Navigation Helper
  const handleValueKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('.specs-value-input'));
      const currentIndex = inputs.indexOf(e.target);
      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
        inputs[currentIndex + 1].select();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('.specs-value-input'));
      const currentIndex = inputs.indexOf(e.target);
      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
        inputs[currentIndex + 1].select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('.specs-value-input'));
      const currentIndex = inputs.indexOf(e.target);
      if (currentIndex !== -1 && currentIndex > 0) {
        inputs[currentIndex - 1].focus();
        inputs[currentIndex - 1].select();
      }
    }
  };

  // Chỉ số tab hiện tại hợp lệ
  const safeActiveTabIdx = Math.min(activeTabIdx, Math.max(0, specsGroups.length - 1));
  const activeGroup = specsGroups[safeActiveTabIdx];

  return (
    <div className="bg-white p-6 rounded-md border border-admin-border bg-slate-50/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-admin-text-main flex items-center gap-2">
            <LayoutGrid className="text-primary" size={20} />
            Thông số kỹ thuật sản phẩm
          </h3>
          <p className="text-xs text-admin-text-muted font-medium mt-1">
            Nhập thông số kỹ thuật chi tiết theo nhóm. Nhấp chọn tab bên dưới để chuyển đổi nhóm nhập liệu.
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/25 rounded-md hover:bg-primary/20 text-xs font-bold transition-all cursor-pointer"
        >
          <FolderPlus size={15} />
          Thêm nhóm thông số mới
        </button>
      </div>

      {specsGroups.length === 0 ? (
        <div className="border border-dashed border-admin-border rounded-md p-10 text-center text-admin-text-muted text-xs font-bold bg-white">
          Chưa có thông số kỹ thuật nào. Chọn danh mục sản phẩm hoặc bấm nút thêm nhóm để bắt đầu.
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* THANH TAB LIÊN KẾT */}
          <div className="flex flex-wrap gap-2 border-b border-admin-border pb-3">
            {specsGroups.map((group, idx) => {
              const name = group.groupName.trim() || `Nhóm ${idx + 1}`;
              const isActive = safeActiveTabIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTabIdx(idx)}
                  className={`px-4 py-2 text-xs font-bold rounded-md transition-all duration-200 flex items-center gap-2 border cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-admin-text-main border-admin-border hover:bg-slate-50 hover:text-primary'
                  }`}
                >
                  <Layers size={13} className={isActive ? 'text-white' : 'text-admin-text-muted'} />
                  <span className="uppercase">{name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-admin-text-muted'
                  }`}>
                    {group.items?.length || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* KHUNG NHẬP LIỆU NHÓM TÁC VỤ */}
          {activeGroup && (
            <div 
              key={safeActiveTabIdx} // Sử dụng key để React remount kích hoạt lại CSS Animation
              className="bg-white rounded-md border border-admin-border overflow-hidden shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
            >
              
              {/* Header Nhóm */}
              <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 border-b border-admin-border justify-between">
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-xs font-black text-admin-text-muted uppercase tracking-wider">
                    Tên Nhóm:
                  </span>
                  <input
                    type="text"
                    required
                    value={activeGroup.groupName}
                    onChange={(e) => updateGroupName(safeActiveTabIdx, e.target.value)}
                    className="w-full max-w-sm px-3 py-1.5 border border-admin-border rounded focus:border-primary focus:bg-white outline-none text-xs font-bold text-admin-text-main bg-white uppercase"
                    placeholder="VD: MÀN HÌNH, CAMERA..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeGroup(safeActiveTabIdx)}
                  className="text-admin-text-muted hover:text-admin-danger hover:bg-red-50 p-1.5 rounded transition-colors"
                  title="Xóa nhóm này"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Bảng thông số con (Excel-style) */}
              <div className="divide-y divide-admin-border">
                {/* Table Header */}
                <div className="grid grid-cols-12 bg-slate-50/50 text-[10px] font-black text-admin-text-muted uppercase tracking-wider px-5 py-2">
                  <div className="col-span-5 border-r border-admin-border/60 pr-4">Thuộc tính (Khóa)</div>
                  <div className="col-span-6 px-4">Giá trị tương ứng</div>
                  <div className="col-span-1 text-center">Xóa</div>
                </div>

                {/* Rows */}
                {activeGroup.items && activeGroup.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-admin-text-muted font-medium bg-white">
                    Nhóm này chưa có thuộc tính nào. Bấm nút bên dưới để thêm thuộc tính.
                  </div>
                ) : (
                  activeGroup.items.map((item, iIdx) => (
                    <div key={iIdx} className="grid grid-cols-12 items-center hover:bg-slate-50/50 transition-colors">
                      
                      {/* Key Input */}
                      <div className="col-span-5 border-r border-admin-border/60 py-1.5 pl-5 pr-4">
                        <input
                          type="text"
                          required
                          value={item.key}
                          onChange={(e) => updateSpecItemField(safeActiveTabIdx, iIdx, 'key', e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1.5 text-xs font-semibold text-admin-text-main rounded border border-transparent hover:border-admin-border/40 focus:border-primary outline-none transition-all"
                          placeholder="Tên thuộc tính mẫu..."
                        />
                      </div>

                      {/* Value Input */}
                      <div className="col-span-6 py-1.5 px-4">
                        <input
                          type="text"
                          required
                          value={item.value}
                          onChange={(e) => updateSpecItemField(safeActiveTabIdx, iIdx, 'value', e.target.value)}
                          onKeyDown={handleValueKeyDown}
                          className="specs-value-input w-full bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1.5 text-xs text-admin-text-main rounded border border-transparent hover:border-admin-border/40 focus:border-primary outline-none transition-all font-medium"
                          placeholder="Nhập giá trị (Nhấn Enter để chuyển dòng)..."
                        />
                      </div>

                      {/* Remove Action */}
                      <div className="col-span-1 flex justify-center py-1.5">
                        <button
                          type="button"
                          onClick={() => removeSpecItem(safeActiveTabIdx, iIdx)}
                          className="text-admin-text-muted hover:text-admin-danger hover:bg-red-50 p-1.5 rounded transition-colors"
                          title="Xóa thông số này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Thêm thuộc tính */}
              <div className="px-5 py-3 bg-slate-50/30 border-t border-admin-border flex justify-start">
                <button
                  type="button"
                  onClick={() => addSpecItem(safeActiveTabIdx)}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:text-admin-primary-hover transition-colors cursor-pointer"
                >
                  <PlusCircle size={14} />
                  Thêm thuộc tính trong nhóm
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
