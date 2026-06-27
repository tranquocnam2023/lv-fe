import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import FilterModal from './FilterModal';
import { brandService } from '../services/brandService';

export default function FilterBar({ selectedBrand, onSelectBrand, onApplyFilter, onClearAll }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickBrands, setQuickBrands] = useState([]);

  useEffect(() => {
    brandService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setQuickBrands(data.map(b => b.name));
        }
      })
      .catch(err => console.error("Lỗi tải thương hiệu cho FilterBar:", err));
  }, []);

  return (
    <>
      <div 
        className="flex flex-wrap items-center gap-2 mb-4 p-2 rounded-md border border-bordercustom bg-white"
      >
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 border rounded text-sm transition-colors font-medium border-gray-300 text-gray-700 bg-white hover:border-primary hover:text-primary cursor-pointer"
        >
          <Filter size={16} /> <span className="hidden sm:inline">Lọc</span>
        </button>
        
        {/* Quick Brands */}
        {quickBrands.map(brand => (
          <button 
            key={brand} 
            onClick={() => onSelectBrand(selectedBrand === brand ? null : brand)}
            className={`px-3 py-1.5 border rounded-md text-[13px] transition-all duration-200 cursor-pointer ${
              selectedBrand === brand 
              ? 'font-bold shadow-inner bg-primary/10 text-primary border-primary' 
              : 'hover:bg-gray-50 border-gray-200 text-gray-700 bg-white'
            }`}
          >
            {brand}
          </button>
        ))}

        {selectedBrand && (
          <button 
            onClick={() => onSelectBrand(null)}
            className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-red-500 hover:text-red-700 transition-colors font-medium border border-red-100 rounded bg-red-50/30 cursor-pointer"
          >
            <X size={14} /> Xóa hãng: {selectedBrand}
          </button>
        )}

        {onClearAll && (
          <button 
            onClick={onClearAll}
            className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-gray-500 hover:text-red-600 transition-colors font-medium border border-gray-200 rounded hover:border-red-200 hover:bg-red-50 cursor-pointer"
          >
            <X size={14} /> Xóa tất cả lọc
          </button>
        )}
      </div>

      {isModalOpen && (
        <FilterModal 
          onClose={() => setIsModalOpen(false)} 
          onApply={(filters) => {
             onApplyFilter(filters);
             setIsModalOpen(false);
          }} 
        />
      )}
    </>
  );
}
