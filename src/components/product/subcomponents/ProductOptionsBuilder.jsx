import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useProductFormContext } from '../context/ProductFormContext';

export default function ProductOptionsBuilder() {
  const {
    options,
    addOptionRow,
    removeOptionRow,
    updateOptionName,
    updateValueText,
    handleValueKeyDown,
    removeOptionValue,
    handleDoneOption,
    handleEditOption,
    AVAILABLE_ATTRIBUTES
  } = useProductFormContext();

  return (
    <div className="p-4 rounded-md bg-white">
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
        <h4 className="text-sm font-bold text-admin-text-main">Cấu hình thuộc tính biến thể</h4>
        {options.length < 4 && (
          <button
            type="button"
            onClick={addOptionRow}
            className="text-xs font-bold text-primary hover:text-admin-primary-hover flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Thêm tùy chọn thuộc tính
          </button>
        )}
      </div>

      <div className="space-y-5">
        {options.map((opt, optIdx) => (
          <div key={opt.id} className="border border-admin-border rounded-md p-4 bg-gray-50/10">
            {opt.isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
                  <div className="w-64">
                    <select
                      value={opt.name}
                      onChange={(e) => updateOptionName(opt.id, e.target.value)}
                      className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none bg-white text-admin-text-main focus:border-primary font-semibold"
                    >
                      <option value="">-- Chọn thuộc tính --</option>
                      {AVAILABLE_ATTRIBUTES.filter(attr => attr === opt.name || !options.some(o => o.name === attr)).map(attr => (
                        <option key={attr} value={attr}>{attr}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOptionRow(opt.id)}
                    className="p-1.5 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 values-container">
                  <label className="block text-xs font-bold text-admin-text-main mb-1">Các giá trị thuộc tính:</label>
                  {opt.values.map((val, vIdx) => (
                    <div key={val.internalId} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={val.text}
                        onChange={(e) => updateValueText(opt.id, val.internalId, e.target.value)}
                        onKeyDown={(e) => handleValueKeyDown(e, opt, val.internalId, vIdx)}
                        placeholder={vIdx === opt.values.length - 1 ? "+ Nhập giá trị mới..." : "Giá trị thuộc tính..."}
                        className="flex-1 px-3 py-2 border border-admin-border rounded-md text-xs outline-none bg-white focus:border-primary value-input font-medium"
                      />
                      {vIdx !== opt.values.length - 1 && (
                        <button
                          type="button"
                          onClick={() => removeOptionValue(opt.id, val.internalId)}
                          className="p-1.5 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => handleDoneOption(opt.id)}
                      className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-admin-primary-hover transition-colors cursor-pointer"
                    >
                      Xong
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-sm text-admin-text-main">{opt.name}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {opt.values.map(val => (
                      <span key={val.internalId} className="px-2.5 py-1 bg-white border border-admin-border rounded text-xs font-bold text-admin-text-main">
                        {val.text}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleEditOption(opt.id)}
                  className="px-3 py-1.5 border border-admin-border text-primary hover:bg-admin-bg text-xs font-bold rounded transition-colors cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
