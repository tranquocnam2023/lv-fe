import React, { useState, useEffect } from 'react';
import { Plus, X, Layers } from 'lucide-react';

export default function CategorySpecsTemplateEditor({ value, onChange }) {
  const [groups, setGroups] = useState([]);
  const [tagInputs, setTagInputs] = useState({}); // Lưu text nhập của từng group input
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  // Load ban đầu từ value JSON string
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setGroups(parsed);
          return;
        }
      } catch (e) {
        console.error("Lỗi parse specs template:", e);
      }
    }
    setGroups([]);
  }, [value]);

  // Kích hoạt callback khi groups thay đổi
  const triggerChange = (newGroups) => {
    setGroups(newGroups);
    if (newGroups.length === 0) {
      onChange('');
    } else {
      onChange(JSON.stringify(newGroups));
    }
  };

  const handleAddGroup = () => {
    const newGroups = [
      ...groups,
      { groupName: '', items: [] }
    ];
    triggerChange(newGroups);
    setActiveTabIdx(newGroups.length - 1); // Chuyển sang tab mới
  };

  const handleRemoveGroup = (gIdx) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhóm thông số mẫu này?")) {
      const newGroups = groups.filter((_, idx) => idx !== gIdx);
      triggerChange(newGroups);
      setActiveTabIdx(prev => {
        if (gIdx <= prev) {
          return Math.max(0, prev - 1);
        }
        return prev;
      });
    }
  };

  const handleGroupNameChange = (gIdx, name) => {
    const newGroups = groups.map((g, idx) => {
      if (idx === gIdx) {
        return { ...g, groupName: name };
      }
      return g;
    });
    triggerChange(newGroups);
  };

  const handleTagInputChange = (gIdx, text) => {
    setTagInputs(prev => ({
      ...prev,
      [gIdx]: text
    }));
  };

  const handleAddTag = (gIdx) => {
    const text = tagInputs[gIdx]?.trim();
    if (!text) return;

    // Tránh trùng tag trong nhóm
    const currentGroup = groups[gIdx];
    if (currentGroup.items.includes(text)) {
      setTagInputs(prev => ({ ...prev, [gIdx]: '' }));
      return;
    }

    const newGroups = groups.map((g, idx) => {
      if (idx === gIdx) {
        return {
          ...g,
          items: [...g.items, text]
        };
      }
      return g;
    });

    triggerChange(newGroups);
    setTagInputs(prev => ({ ...prev, [gIdx]: '' }));
  };

  const handleKeyDown = (gIdx, e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(gIdx);
    }
  };

  const handleRemoveTag = (gIdx, tagToRemove) => {
    const newGroups = groups.map((g, idx) => {
      if (idx === gIdx) {
        return {
          ...g,
          items: g.items.filter(item => item !== tagToRemove)
        };
      }
      return g;
    });
    triggerChange(newGroups);
  };

  const safeActiveTabIdx = Math.min(activeTabIdx, Math.max(0, groups.length - 1));
  const activeGroup = groups[safeActiveTabIdx];

  return (
    <div className="space-y-4 border border-admin-border rounded-md p-4 bg-slate-50/40">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h4 className="text-sm font-bold text-admin-text-main">Khung thông số kỹ thuật mẫu (Tùy chọn)</h4>
          <p className="text-xs text-admin-text-muted mt-0.5">
            Định nghĩa các nhóm và thuộc tính mẫu để tự động áp dụng khi tạo sản phẩm thuộc danh mục này.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddGroup}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-md transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          Thêm nhóm mẫu
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 text-admin-text-muted text-xs border border-dashed border-admin-border rounded-md bg-white font-medium">
          Chưa cấu hình khung thông số mẫu. Khi tạo sản phẩm mới sẽ cần nhập thủ công.
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* TABS CONTAINER (RESPONSIVE SCROLL) */}
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-admin-border">
            {groups.map((group, idx) => {
              const name = group.groupName.trim() || `Nhóm ${idx + 1}`;
              const isActive = safeActiveTabIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTabIdx(idx)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all duration-200 flex items-center gap-2 border flex-shrink-0 cursor-pointer ${
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

          {/* ACTIVE PANEL WITH TRANSITION EFFECT */}
          {activeGroup && (
            <div 
              key={safeActiveTabIdx} // Remounts panel on tab change to trigger animation
              className="bg-white border border-admin-border rounded-md p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              {/* Group Name input & Remove button */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between border-b border-slate-100 pb-3">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-admin-text-muted uppercase whitespace-nowrap">Tên nhóm mẫu:</span>
                  <input
                    type="text"
                    required
                    placeholder="VD: MÀN HÌNH, BỘ VI XỬ LÝ..."
                    className="w-full max-w-md px-3 py-2 border border-admin-border rounded-md focus:border-primary outline-none text-xs font-bold uppercase text-admin-text-main bg-white"
                    value={activeGroup.groupName}
                    onChange={(e) => handleGroupNameChange(safeActiveTabIdx, e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(safeActiveTabIdx)}
                  className="self-end sm:self-auto flex items-center gap-1 px-2.5 py-1.5 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded-md transition-colors text-xs font-bold cursor-pointer"
                  title="Xóa nhóm này"
                >
                  <X size={14} />
                  Xóa nhóm
                </button>
              </div>

              {/* Tags Editor */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-admin-text-muted uppercase">
                  Các thuộc tính mẫu (Ấn Enter hoặc Dấu phẩy để thêm)
                </label>
                
                {/* Tag items */}
                {activeGroup.items.length === 0 ? (
                  <div className="text-slate-400 text-xs italic pb-1">Chưa có thuộc tính nào trong nhóm này. Hãy thêm ở dưới.</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activeGroup.items.map((item, iIdx) => (
                      <span
                        key={iIdx}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-primary/5 border border-primary/20 text-primary rounded-full text-xs font-bold animate-in zoom-in-95 duration-150"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(safeActiveTabIdx, item)}
                          className="text-primary hover:bg-primary/10 rounded-full p-0.5 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VD: Công nghệ màn hình, Kích thước..."
                    className="flex-1 px-3 py-2 border border-admin-border rounded-md focus:border-primary outline-none text-xs text-admin-text-main font-medium bg-white"
                    value={tagInputs[safeActiveTabIdx] || ''}
                    onChange={(e) => handleTagInputChange(safeActiveTabIdx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(safeActiveTabIdx, e)}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(safeActiveTabIdx)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-admin-text-main text-xs font-bold rounded-md transition-colors cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
