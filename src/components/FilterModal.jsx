//Modal lọc sản phẩm
import React, { useState, useEffect } from 'react';
import { X, Sliders } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { brandService } from '../services/brandService';

// Dữ liệu cấu hình bộ lọc tĩnh phía Client
const filterData = {
  prices: ['Dưới 2 triệu', 'Từ 2 - 4 triệu', 'Từ 4 - 7 triệu', 'Từ 7 - 13 triệu', 'Từ 13 - 20 triệu', 'Trên 20 triệu'],
  // Loại điện thoại: Chỉ giữ lại Android và iPhone (iOS) theo yêu cầu thiết kế
  types: ['Android', 'iPhone (iOS)'],
  // RAM: Chỉ hiển thị các mức dung lượng phổ biến từ 6 GB đến 16 GB
  ram: ['6 GB', '8 GB', '12 GB', '16 GB'],
  // Dung lượng bộ nhớ: Chỉ giữ lại các mức từ 128 GB trở lên (loại bỏ 64 GB lỗi thời)
  storage: ['128 GB', '256 GB', '512 GB', '1 TB']
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
          // Khai báo biến/hằng số: isSelected - Dùng trong logic xử lý của component
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

// Khai báo biến/hằng số: MIN_PRICE - Dùng trong logic xử lý của component
const MIN_PRICE = 0;        // Giới hạn giá tối thiểu trên bộ lọc kéo (mặc định: 0)
// Khai báo biến/hằng số: MAX_PRICE - Dùng trong logic xử lý của component
const MAX_PRICE = 60000000; // Giới hạn giá tối đa trên bộ lọc kéo. Sửa số này để đổi giá tối đa

export default function FilterModal({ onClose, onApply }) {
  // State: brands - Quản lý trạng thái và dữ liệu của brands trong giao diện
  const [brands, setBrands] = useState([]);
  // State: selectedFilters - Quản lý trạng thái và dữ liệu của selectedFilters trong giao diện
  const [selectedFilters, setSelectedFilters] = useState({});
  // State: priceRange - Quản lý trạng thái và dữ liệu của priceRange trong giao diện
  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE]);

  // States for custom price inputs editing
  const [minFocused, setMinFocused] = useState(false);
  // State: maxFocused - Quản lý trạng thái và dữ liệu của maxFocused trong giao diện
  const [maxFocused, setMaxFocused] = useState(false);
  // State: minInputVal - Quản lý trạng thái và dữ liệu của minInputVal trong giao diện
  const [minInputVal, setMinInputVal] = useState("");
  // State: maxInputVal - Quản lý trạng thái và dữ liệu của maxInputVal trong giao diện
  const [maxInputVal, setMaxInputVal] = useState("");

  // Hàm xử lý logic/sự kiện: formatPrefix
  const formatPrefix = (value) => {
    if (value === undefined || value === null || value === "") return "";
    // Khai báo biến/hằng số: clean - Dùng trong logic xử lý của component
    const clean = value.toString().replace(/\D/g, '');
    if (clean === "") return "";
    // Khai báo biến/hằng số: num - Dùng trong logic xử lý của component
    const num = parseInt(clean, 10);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Hàm xử lý logic/sự kiện: handleMinFocus
  const handleMinFocus = () => {
    setMinFocused(true);
    setMinInputVal(priceRange[0] === MIN_PRICE ? "0" : (priceRange[0] / 1000).toString());
  };

  // Hàm xử lý logic/sự kiện: handleMinBlur
  const handleMinBlur = () => {
    setMinFocused(false);
    let val = parseInt(minInputVal.replace(/\D/g, ''), 10);
    if (isNaN(val)) val = MIN_PRICE / 1000;
    if (val < MIN_PRICE / 1000) val = MIN_PRICE / 1000;
    if (val > MAX_PRICE / 1000) val = MAX_PRICE / 1000;

    setPriceRange(prev => {
      // Khai báo biến/hằng số: newMin - Dùng trong logic xử lý của component
      const newMin = Math.min(val * 1000, prev[1]);
      return [newMin, prev[1]];
    });
  };

  // Hàm xử lý logic/sự kiện: handleMinChange
  const handleMinChange = (e) => {
    // Khai báo biến/hằng số: val - Dùng trong logic xử lý của component
    const val = e.target.value.replace(/\D/g, '');
    setMinInputVal(val);

    let numeric = parseInt(val, 10);
    if (isNaN(numeric)) numeric = MIN_PRICE / 1000;
    if (numeric < MIN_PRICE / 1000) numeric = MIN_PRICE / 1000;
    if (numeric > MAX_PRICE / 1000) numeric = MAX_PRICE / 1000;
    setPriceRange(prev => [Math.min(numeric * 1000, prev[1]), prev[1]]);
  };

  // Hàm xử lý logic/sự kiện: handleMaxFocus
  const handleMaxFocus = () => {
    setMaxFocused(true);
    setMaxInputVal(priceRange[1] === MIN_PRICE ? "0" : (priceRange[1] / 1000).toString());
  };

  // Hàm xử lý logic/sự kiện: handleMaxBlur
  const handleMaxBlur = () => {
    setMaxFocused(false);
    let val = parseInt(maxInputVal.replace(/\D/g, ''), 10);
    if (isNaN(val)) val = MIN_PRICE / 1000;
    if (val < MIN_PRICE / 1000) val = MIN_PRICE / 1000;
    if (val > MAX_PRICE / 1000) val = MAX_PRICE / 1000;

    setPriceRange(prev => {
      // Khai báo biến/hằng số: newMax - Dùng trong logic xử lý của component
      const newMax = Math.max(val * 1000, prev[0]);
      return [prev[0], newMax];
    });
  };

  // Hàm xử lý logic/sự kiện: handleMaxChange
  const handleMaxChange = (e) => {
    // Khai báo biến/hằng số: val - Dùng trong logic xử lý của component
    const val = e.target.value.replace(/\D/g, '');
    setMaxInputVal(val);

    let numeric = parseInt(val, 10);
    if (isNaN(numeric)) numeric = MIN_PRICE / 1000;
    if (numeric < MIN_PRICE / 1000) numeric = MIN_PRICE / 1000;
    if (numeric > MAX_PRICE / 1000) numeric = MAX_PRICE / 1000;
    setPriceRange(prev => [prev[0], Math.max(numeric * 1000, prev[0])]);
  };

  useEffect(() => {
    brandService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setBrands(data.map(b => b.name));
        }
      })
      .catch(err => console.error("Lỗi tải thương hiệu cho FilterModal:", err));
  }, []);

  // Hàm xử lý logic/sự kiện: toggleFilter
  const toggleFilter = (category, value) => {
    if (category === 'Giá') {
      // Update slider based on selected label for better sync
      const ranges = {
        'Dưới 2 triệu': [0, 2000000],
        'Từ 2 - 4 triệu': [2000000, 4000000],
        'Từ 4 - 7 triệu': [4000000, 7000000],
        'Từ 7 - 13 triệu': [7000000, 13000000],
        'Từ 13 - 20 triệu': [13000000, 20000000],
        'Trên 20 triệu': [20000000, MAX_PRICE]
      };
      if (ranges[value]) {
        setPriceRange(ranges[value]);
      }
    }

    setSelectedFilters(prev => {
      // Khai báo biến/hằng số: current - Dùng trong logic xử lý của component
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

  // Hàm thực thi logic: clearAll
  const clearAll = () => {
    setSelectedFilters({});
    setPriceRange([MIN_PRICE, MAX_PRICE]);
  };

  // Hàm xử lý logic/sự kiện: formatPrice
  const formatPrice = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Hàm xử lý logic/sự kiện: handlePriceChange
  const handlePriceChange = (value) => {
    setPriceRange(value);
  };

  // Hàm xử lý logic/sự kiện: handleApply
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
          <div className="mb-6 mt-2 flex flex-col sm:flex-row items-start sm:items-start gap-2 sm:gap-4">
            {/* Cột trái: Tiêu đề nhỏ */}
            <div className="flex items-center gap-1.5 text-[13px] text-gray-700 h-8 font-medium whitespace-nowrap">
              <Sliders size={16} className="text-primary" />
              <span>Hoặc chọn mức giá phù hợp với bạn</span>
            </div>

            {/* Cột phải: Slider nằm trên, các ô nhập nằm dưới căn chỉnh chính xác trục dọc */}
            <div className="flex-1 flex flex-col gap-3 min-w-[260px] max-w-[320px] sm:max-w-none w-full mx-auto sm:mx-0">
              {/* Slider nằm trên, với padding 55px hai bên để thanh trượt khớp với tâm của 2 ô input rộng 110px */}
              <div className="px-[55px] h-8 flex items-center">
                <Slider
                  range min={MIN_PRICE} max={MAX_PRICE} step={500000} value={priceRange} onChange={handlePriceChange}
                  trackStyle={[{ backgroundColor: 'var(--color-primary)', height: 4 }]}
                  handleStyle={[
                    { border: '2.5px solid var(--color-primary)', height: 16, width: 16, marginTop: -6, backgroundColor: '#fff', opacity: 1, boxShadow: 'none' },
                    { border: '2.5px solid var(--color-primary)', height: 16, width: 16, marginTop: -6, backgroundColor: '#fff', opacity: 1, boxShadow: 'none' }
                  ]}
                  railStyle={{ backgroundColor: '#e5e7eb', height: 4 }}
                />
              </div>

              {/* Hai ô nhập giá trị nằm dưới, căn chỉnh theo trục dọc với Slider */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center justify-end border border-gray-300 rounded-md px-2 py-1 w-[110px] bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <input
                    type="text"
                    value={minFocused ? formatPrefix(minInputVal) : formatPrefix(priceRange[0] / 1000)}
                    onFocus={handleMinFocus}
                    onBlur={handleMinBlur}
                    onChange={handleMinChange}
                    className="w-full text-right bg-transparent border-none outline-none p-0 text-[13px] font-semibold text-gray-800 pr-0.5"
                  />
                  <span className="text-gray-400 text-[13px] font-semibold select-none pr-1">.000đ</span>
                </div>

                <div className="w-5 h-[1px] bg-gray-300 flex-shrink-0"></div>

                <div className="flex items-center justify-end border border-gray-300 rounded-md px-2 py-1 w-[110px] bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <input
                    type="text"
                    value={maxFocused ? formatPrefix(maxInputVal) : formatPrefix(priceRange[1] / 1000)}
                    onFocus={handleMaxFocus}
                    onBlur={handleMaxBlur}
                    onChange={handleMaxChange}
                    className="w-full text-right bg-transparent border-none outline-none p-0 text-[13px] font-semibold text-gray-800 pr-0.5"
                  />
                  <span className="text-gray-400 text-[13px] font-semibold select-none pr-1">.000đ</span>
                </div>
              </div>
            </div>
          </div>

          <FilterSection title="Loại điện thoại" options={filterData.types} selected={selectedFilters['Loại điện thoại'] || []} onSelect={toggleFilter} />
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
