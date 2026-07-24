import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * Component SearchableSelect dùng chung cho toàn bộ giao diện Admin.
 * Cho phép gõ tìm kiếm từ khóa theo Tên hoặc Mã ID sản phẩm.
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = '-- Chọn sản phẩm --',
  colorTheme = 'blue',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(o => String(o.id) === String(value));

  // Tự động đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lọc sản phẩm theo từ khóa (ID hoặc Name)
  const filteredOptions = options.filter(o =>
    (o.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.id ? String(o.id) : '').includes(searchTerm)
  );

  const activeBorderColor = colorTheme === 'amber' ? 'focus:border-amber-500' : 'focus:border-blue-500';

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : selectedOption
            ? 'border-gray-300 text-gray-900 shadow-sm cursor-pointer'
            : 'border-gray-200 text-gray-400 hover:border-gray-400 cursor-pointer'
        }`}
      >
        <span className="truncate pr-2 font-bold text-gray-800">
          {selectedOption ? `#${selectedOption.id} - ${selectedOption.name}` : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchTerm('');
              }}
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150 min-w-[280px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              autoFocus
              className={`w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none ${activeBorderColor}`}
              placeholder="Gõ tên hoặc mã ID sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1">
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                !value ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {placeholder}
            </div>

            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs font-semibold text-gray-400">
                Không tìm thấy sản phẩm nào khớp từ khóa
              </div>
            ) : (
              filteredOptions.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    onChange(String(p.id));
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    String(value) === String(p.id)
                      ? 'bg-red-600 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="opacity-75 mr-1 font-mono">#{p.id}</span> - {p.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
