import React from 'react';
import { Link } from 'react-router-dom';

export default function HeaderSearchBar({
  searchContainerRef,
  searchQuery,
  setSearchQuery,
  setShowDropdown,
  handleKeyDown,
  handleSearchSubmit,
  shouldShowDropdown,
  filteredProducts
}) {
  return (
    <div ref={searchContainerRef} className="flex-1 max-w-xl mx-4 min-w-[200px] relative">
      <div className="flex items-center w-full h-10 rounded bg-white overflow-hidden shadow-inner">
        <input 
          type="text" 
          placeholder="Bạn tìm gì..." 
          className="w-full h-full text-gray-800 px-3 outline-none font-medium"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
        />
        <button 
          onClick={handleSearchSubmit}
          className="h-full px-4 text-gray-600 bg-white hover:bg-gray-100 transition cursor-pointer border-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
      </div>

      {/* Live Search Dropdown */}
      {shouldShowDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-md shadow-2xl z-50 overflow-hidden text-gray-800 animate-in fade-in slide-in-from-top-2 duration-150">
          {filteredProducts.length > 0 ? (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                Sản phẩm gợi ý ({filteredProducts.length})
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                {filteredProducts.slice(0, 5).map((product) => {
                  let finalDiscount = product.discount;
                  if (!finalDiscount && product.originalPrice && product.originalPrice > product.price) {
                    finalDiscount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                  }
                  
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 shrink-0 overflow-hidden flex items-center justify-center bg-white rounded border border-gray-100 p-1">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="object-contain w-full h-full group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-red-600">
                            {product.price ? product.price.toLocaleString('vi-VN') : '0'}₫
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <span className="text-[10px] text-gray-400 line-through">
                                {product.originalPrice.toLocaleString('vi-VN')}₫
                              </span>
                              {finalDiscount > 0 && (
                                <span className="text-[9px] bg-red-50 text-red-600 font-bold px-1 rounded">
                                  -{finalDiscount}%
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {filteredProducts.length > 5 && (
                <button
                  onClick={handleSearchSubmit}
                  className="w-full text-center block py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-black text-primary border-t border-gray-100 cursor-pointer transition-all border-0"
                >
                  Xem tất cả {filteredProducts.length} kết quả cho "{searchQuery}"
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-gray-500 font-semibold select-none">
              Không tìm thấy sản phẩm cho "<span className="text-red-500">{searchQuery}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
