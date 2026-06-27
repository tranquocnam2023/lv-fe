import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function SearchableSelect({
  placeholder = 'Chọn...',
  searchPlaceholder = '🔍 Tìm nhanh...',
  options = [],
  value = '',
  onChange,
  disabled = false,
  required = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when dropdown closes or opens
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.id) === String(value));
  const displayLabel = selectedOption ? (selectedOption.fullName || selectedOption.name) : placeholder;

  const filteredOptions = options.filter(opt => {
    const optName = (opt.fullName || opt.name || '').toLowerCase();
    const searchLower = search.toLowerCase();
    return optName.includes(searchLower) || String(opt.id) === String(value);
  });

  const handleSelect = (optionId) => {
    if (onChange) {
      onChange(optionId);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border border-gray-300 px-3 py-2.5 rounded-md text-sm font-semibold text-gray-800 text-left focus:outline-none focus:border-primary transition disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed ${
          isOpen ? 'border-primary ring-1 ring-primary/20' : ''
        }`}
      >
        <span className={selectedOption ? 'text-gray-805' : 'text-gray-400 font-medium'}>
          {displayLabel}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-250 rounded-md shadow-lg max-h-64 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Input Container */}
          <div className="p-2 border-b border-gray-100 flex items-center bg-gray-50 shrink-0">
            <Search size={14} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-gray-850 placeholder-gray-400 focus:outline-none"
            />
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.id) === String(value);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{opt.fullName || opt.name}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-gray-450 font-medium">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden input for HTML5 validation if required */}
      {required && !value && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => {}}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />
      )}
    </div>
  );
}
