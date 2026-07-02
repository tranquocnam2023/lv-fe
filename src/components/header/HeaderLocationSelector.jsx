import React from 'react';
import { THEME } from '../../utils/theme';

export default function HeaderLocationSelector({
  selectedLocation,
  setSelectedLocation,
  isDropdownOpen,
  setIsDropdownOpen,
  displayLocations
}) {
  return (
    <div className="relative shrink-0 ml-4">
      <div 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center px-3 py-1.5 rounded cursor-pointer hover:bg-opacity-80 transition text-[11px] leading-tight text-white select-none"
        style={{ backgroundColor: THEME.secondary }}
      >
        <span className="truncate max-w-[120px]">
          Xem giá, tồn kho tại: <br/> 
          <span className="font-bold text-[13px]">{selectedLocation} ▾</span>
        </span>
      </div>

      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-white border border-gray-100 rounded-md shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150 no-scrollbar">
            {displayLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setSelectedLocation(loc);
                  localStorage.setItem('selectedLocation', loc);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer border-0 ${
                  selectedLocation === loc ? 'text-primary bg-primary/5 font-black' : 'text-gray-700'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
