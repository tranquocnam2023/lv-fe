import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import axios from 'axios';

export default function GoongAutocomplete({
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Nhập số nhà, tên đường...',
  className = '',
  error = '',
  addressContext = ''
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOONG_API_KEY || '';

  // Đồng bộ giá trị query khi value từ component cha thay đổi
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    if (!apiKey) {
      console.warn('Goong Maps API Key chưa được cấu hình.');
      return;
    }
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Tự động bổ sung ngữ cảnh địa chỉ (Phường/Xã, Tỉnh/Thành) để thu hẹp phạm vi tìm kiếm
      let finalInput = searchQuery;
      if (addressContext) {
        const cleanInput = searchQuery.toLowerCase();
        const cleanContext = addressContext.toLowerCase();
        // Chỉ append nếu người dùng chưa tự tay gõ cụm từ đó
        if (!cleanInput.includes(cleanContext)) {
          finalInput = `${searchQuery}, ${addressContext}`;
        }
      }

      const response = await axios.get('https://rsapi.goong.io/Place/Autocomplete', {
        params: {
          api_key: apiKey,
          input: finalInput,
          limit: 10 // Tăng limit lên một chút để bù trừ các kết quả bị lọc
        }
      });
      if (response.data && response.data.predictions) {
        // Lọc bỏ các kết quả chỉ là đơn vị hành chính (Tỉnh, Huyện, Xã) mà không phải là số nhà/đường
        let filteredPredictions = response.data.predictions.filter(p => {
          const mainText = p.structured_formatting?.main_text || p.description;
          
          // Loại bỏ nếu kết quả là Phường/Xã/Quận/Huyện/Tỉnh đơn thuần
          const isJustAdminName = /^(phường|xã|thị trấn|quận|huyện|tỉnh|thành phố)\s/i.test(mainText);
          
          // Tuy nhiên nếu có số nhà (ví dụ: Đường Phường 1) thì giữ lại
          const hasNumber = /\d/.test(mainText);
          
          if (isJustAdminName && !hasNumber) {
            return false;
          }
          return true;
        });

        // Chỉ lấy tối đa 5 kết quả sau khi lọc
        setSuggestions(filteredPredictions.slice(0, 5));
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Lỗi khi tải gợi ý từ Goong API:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 450); // 450ms debounce
  };

  const handleSelectPrediction = async (prediction) => {
    setQuery(prediction.description);
    onChange(prediction.description);
    setIsOpen(false);

    if (!apiKey) return;

    setIsLoading(true);
    try {
      const response = await axios.get('https://rsapi.goong.io/Place/Detail', {
        params: {
          api_key: apiKey,
          place_id: prediction.place_id
        }
      });

      if (response.data && response.data.result) {
        const result = response.data.result;
        const location = result.geometry?.location;
        if (location) {
          onSelectLocation({
            formattedAddress: result.formatted_address || prediction.description,
            lat: location.lat,
            lng: location.lng,
            compound: result.compound || null
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin chi tiết địa điểm từ Goong API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearInput = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    onSelectLocation({
      formattedAddress: '',
      lat: null,
      lng: null,
      compound: null
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          className={`${className} w-full pr-10`}
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
          {query && (
            <button
              type="button"
              onClick={clearInput}
              className="text-gray-400 hover:text-gray-600 transition cursor-pointer p-0.5 rounded hover:bg-gray-150"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-[9px] font-medium mt-1">{error}</p>}

      {/* Suggestion list */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.map((item) => (
            <button
              key={item.place_id}
              type="button"
              onClick={() => handleSelectPrediction(item)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-2.5 transition text-xs font-semibold text-gray-700 cursor-pointer"
            >
              <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 leading-tight">
                  {item.structured_formatting?.main_text || item.description}
                </span>
                <span className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">
                  {item.structured_formatting?.secondary_text || ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
