import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { brandService } from '../services/brandService';

const filterData = {
  prices: ['Dưới 2 triệu', 'Từ 2 - 4 triệu', 'Từ 4 - 7 triệu', 'Từ 7 - 13 triệu', 'Từ 13 - 20 triệu', 'Trên 20 triệu'],
  types: ['Android', 'iPhone (iOS)', 'Điện thoại phổ thông', 'Điện thoại gập'],
  needs: ['Chơi game / Cấu hình cao', 'Pin khủng trên 7000 mAh', 'Chụp ảnh, quay phim', 'Livestream', 'Mỏng nhẹ'],
  ram: ['3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB'],
  resolution: ['HD+', 'Full HD+', '1.5K', '2K+', 'Retina (iPhone)'],
  refreshRate: ['60 Hz', '90 Hz', '120 Hz', '144 Hz', '165 Hz'],
  storage: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
  battery: ['Sạc nhanh (từ 20W)', 'Sạc siêu nhanh (từ 60W)', 'Sạc không dây'],
  features: ['Điện thoại AI', 'Chụp ảnh AI', 'Kháng nước, bụi', 'Hỗ trợ 5G', 'Bảo mật khuôn mặt 3D', 'Công nghệ NFC']
};

/**
 * Reusable Filter Section Component
 */
const FilterSection = ({ title, options, selected, onSelect }) => {
  return (
    <div className="mb-6">
      <h3 className="text-[15px] font-semibold text-gray-800 mb-3">{title}</h3>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(110px, 1fr))` }}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onSelect(title, opt)}
              className={`px-2 py-2 border rounded-md text-[13px] text-center transition-colors break-words ${isSelected
                ? 'border-primary text-primary bg-primary/5'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function FilterModal({ onClose, onApply }) {
  const [brands, setBrands] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [priceRange, setPriceRange] = useState([0, 54000000]);

  useEffect(() => {
    brandService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setBrands(data.map(b => b.name));
        }
      })
      .catch(err => console.error("Lỗi tải thương hiệu cho FilterModal:", err));
  }, []);

  const toggleFilter = (category, value) => {
    if (category === 'Giá') {
      // Update slider based on selected label for better sync
      const ranges = {
        'Dưới 2 triệu': [0, 2000000],
        'Từ 2 - 4 triệu': [2000000, 4000000],
        'Từ 4 - 7 triệu': [4000000, 7000000],
        'Từ 7 - 13 triệu': [7000000, 13000000],
        'Từ 13 - 20 triệu': [13000000, 20000000],
        'Trên 20 triệu': [20000000, 60000000]
      };
      if (ranges[value]) {
        setPriceRange(ranges[value]);
      }
    }

    setSelectedFilters(prev => {
      const current = prev[category] || [];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      } else {
        // For 'Giá', typically only one range is active at a time in TGDĐ style
        if (category === 'Giá') {
          return { ...prev, [category]: [value] };
        }
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const clearAll = () => {
    setSelectedFilters({});
    setPriceRange([0, 54000000]);
  };

  const formatPrice = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
  };

  const handleApply = () => {
    // Collect all active filters
    const activeFilters = {
      ...selectedFilters,
      priceRange: priceRange
    };
    onApply(activeFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden">
      <div className="bg-white w-full max-w-3xl h-[85vh] rounded-md flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex-1 text-center">Tất cả bộ lọc</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 absolute right-4">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FilterSection title="Hãng" options={brands} selected={selectedFilters['Hãng'] || []} onSelect={toggleFilter} />

          <FilterSection title="Giá" options={filterData.prices} selected={selectedFilters['Giá'] || []} onSelect={toggleFilter} />
          {/* Custom price slider */}
          {/* ================= GIÁ + SLIDER ================= */}
          <div className="mb-6 -mt-3">

            {/* Tiêu đề nhỏ */}
            <div className="text-[13px] text-primary mb-3">
              <span>Hoặc chọn mức giá phù hợp với bạn</span>
            </div>

            <div className="flex items-center gap-4">
              <input type="text" value={formatPrice(priceRange[0])} readOnly className="border border-gray-300 rounded px-3 py-1.5 w-[120px] text-center text-sm outline-none" />
              <div className="flex-1 px-2">
                <Slider
                  range min={0} max={60000000} step={500000} value={priceRange} onChange={handlePriceChange}
                  trackStyle={[{ backgroundColor: 'var(--color-primary)', height: 2 }]}
                  handleStyle={[
                    { borderColor: 'var(--color-primary)', height: 14, width: 14, marginTop: -6, backgroundColor: '#fff' },
                    { borderColor: 'var(--color-primary)', height: 14, width: 14, marginTop: -6, backgroundColor: '#fff' }
                  ]}
                  railStyle={{ backgroundColor: '#e5e7eb', height: 2 }}
                />
              </div>
              <input type="text" value={formatPrice(priceRange[1])} readOnly className="border border-gray-300 rounded px-3 py-1.5 w-[120px] text-center text-sm outline-none" />
            </div>
            {/* ========================================================
                CẤU TRÚC 2: Thanh kéo nằm TRÊN hai mức giá              
            ======================================================== */}
            {/* 
            <div className="mb-6 px-3 pt-2 mt-2">
              <Slider
                range min={0} max={60000000} step={500000} value={priceRange} onChange={handlePriceChange}
                trackStyle={[{backgroundColor: 'var(--color-primary)', height: 2}]}
                handleStyle={[
                  { borderColor: 'var(--color-primary)', height: 14, width: 14, marginTop: -6, backgroundColor: '#fff'},
                  { borderColor: 'var(--color-primary)', height: 14, width: 14, marginTop: -6, backgroundColor: '#fff'}
                ]}
                railStyle={{ backgroundColor: '#e5e7eb', height: 2 }}
              />
            </div>
            <div className="flex items-center gap-4 justify-between">
              <input type="text" value={formatPrice(priceRange[0])} readOnly className="border border-gray-300 rounded px-3 py-1.5 w-[140px] text-center text-sm outline-none" />
              <span className="text-gray-400">-</span>
              <input type="text" value={formatPrice(priceRange[1])} readOnly className="border border-gray-300 rounded px-3 py-1.5 w-[140px] text-center text-sm outline-none" />
            </div>
            */}

            {/* ========================================================
                CẤU TRÚC 3: Thanh kéo nằm DƯỚI hai mức giá      
            ======================================================== */}
            {/* 
            <div className="flex items-center gap-4 justify-between mb-6 mt-2">
              <input type="text" value={formatPrice(priceRange[0])} readOnly className="border border-gray-300 rounded px-3 py-1.5 w-[140px] text-center text-sm outline-none" />
              <span className="text-gray-400">-</span>
              <input type="text" value={formatPrice(priceRange[1])} readOnly className="border border-gray-300 rounded px-3 py-1.5 w-[140px] text-center text-sm outline-none" />
            </div>
            <div className="px-3 pb-2">
              <Slider
                range min={0} max={60000000} step={500000} value={priceRange} onChange={handlePriceChange}
                trackStyle={[{backgroundColor: 'var(--color-primary)', height: 2}]}
                handleStyle={[
                  { borderColor: 'var(--color-primary)', height: 14, width: 14, marginTop: -6, backgroundColor: '#fff'},
                  { borderColor: 'var(--color-primary)', height: 14, width: 14, marginTop: -6, backgroundColor: '#fff'}
                ]}
                railStyle={{ backgroundColor: '#e5e7eb', height: 2 }}
              />
            </div>
            */}
          </div>

          <FilterSection title="Loại điện thoại" options={filterData.types} selected={selectedFilters['Loại điện thoại'] || []} onSelect={toggleFilter} />
          <FilterSection title="Nhu cầu" options={filterData.needs} selected={selectedFilters['Nhu cầu'] || []} onSelect={toggleFilter} />
          <FilterSection title="RAM" options={filterData.ram} selected={selectedFilters['RAM'] || []} onSelect={toggleFilter} />
          <FilterSection title="Dung lượng lưu trữ" options={filterData.storage} selected={selectedFilters['Dung lượng lưu trữ'] || []} onSelect={toggleFilter} />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 shrink-0 flex items-center justify-center gap-4 bg-white/90 backdrop-blur-sm rounded-b-md">
          <button onClick={clearAll} className="px-10 py-2.5 border border-red-500 text-red-500 rounded font-medium hover:bg-red-50 transition-colors">
            Bỏ chọn
          </button>
          <button onClick={handleApply} className="px-10 py-2.5 bg-primary text-white rounded font-medium hover:bg-secondary transition-colors uppercase">
            Xem kết quả
          </button>
        </div>
      </div>
    </div>
  );
}
