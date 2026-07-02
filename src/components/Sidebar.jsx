import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Cpu, 
  Watch, 
  Headphones, 
  Cable, 
  Shield, 
  HardDrive, 
  ShoppingBag 
} from 'lucide-react';
import { categoryService } from '../services/categoryService';

// Mapper function to select the best icon for the category based on its name
const getCategoryIcon = (name, iconUrl) => {
  if (iconUrl) {
    return (
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        <img src={iconUrl} alt={name} className="w-full h-full object-contain" />
      </div>
    );
  }

  const normalized = name.toLowerCase();
  let IconComponent = ShoppingBag;
  
  if (normalized.includes('thoại') || normalized.includes('phone') || normalized.includes('mobile')) {
    IconComponent = Smartphone;
  } else if (normalized.includes('bảng') || normalized.includes('tablet') || normalized.includes('ipad')) {
    IconComponent = Tablet;
  } else if (normalized.includes('laptop') || normalized.includes('máy tính') || normalized.includes('computer')) {
    IconComponent = Laptop;
  } else if (normalized.includes('đeo') || normalized.includes('đồng hồ') || normalized.includes('watch') || normalized.includes('vòng đeo')) {
    IconComponent = Watch;
  } else if (normalized.includes('âm thanh') || normalized.includes('tai nghe') || normalized.includes('loa') || normalized.includes('headphones') || normalized.includes('mic')) {
    IconComponent = Headphones;
  } else if (normalized.includes('cáp') || normalized.includes('sạc') || normalized.includes('cable') || normalized.includes('củ')) {
    IconComponent = Cable;
  } else if (normalized.includes('ốp') || normalized.includes('cường lực') || normalized.includes('bao da') || normalized.includes('kính') || normalized.includes('shield')) {
    IconComponent = Shield;
  } else if (normalized.includes('lưu trữ') || normalized.includes('thẻ nhớ') || normalized.includes('ổ cứng') || normalized.includes('usb') || normalized.includes('sd')) {
    IconComponent = HardDrive;
  } else if (normalized.includes('phụ kiện') || normalized.includes('công nghệ') || normalized.includes('thiết bị')) {
    IconComponent = Cpu;
  }

  return (
    <div className="w-5 h-5 flex items-center justify-center shrink-0">
      <IconComponent className="w-full h-full text-gray-500 group-hover:text-primary transition-colors" />
    </div>
  );
};

export default function Sidebar({ isFocused, setIsFocused }) {
  const [categories, setCategories] = useState([]);
  const [hoveredRootId, setHoveredRootId] = useState(null);

  useEffect(() => {
    categoryService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.error("Lỗi tải danh mục sidebar:", err));
  }, []);

  // Filter only root categories (Level 1)
  const rootCategories = categories.filter(cat => cat.parentId === null || cat.level === 1);

  return (
    <aside 
      className={`w-64 flex-shrink-0 bg-white rounded-md border p-1.5 space-y-1 h-fit transition-all duration-300 relative ${
        isFocused 
          ? 'border-primary ring-4 ring-primary/10 shadow-2xl scale-[1.01]' 
          : 'border-gray-200/80 shadow-sm'
      }`}
      onMouseLeave={() => setHoveredRootId(null)}
    >
      <nav className="flex flex-col">
        {rootCategories.map((cat) => {
          const path = `/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}`;
          const isHovered = hoveredRootId === cat.id;
          const subcategories = categories.filter(c => c.parentId === cat.id);
          const hasSub = subcategories.length > 0;
          
          return (
            <Link
              key={cat.id}
              to={path}
              onMouseEnter={() => setHoveredRootId(cat.id)}
              onClick={() => {
                setHoveredRootId(null);
                if (setIsFocused) setIsFocused(false);
              }}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200 font-semibold text-sm ${
                isHovered
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getCategoryIcon(cat.name, cat.iconUrl)}
                <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
                  {cat.name}
                </span>
              </div>
              {hasSub && (
                <ChevronRight 
                  className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                    isHovered
                      ? 'text-primary translate-x-0.5' 
                      : 'text-gray-300 group-hover:text-primary group-hover:translate-x-0.5'
                  }`} 
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Subcategories Flyout Menu */}
      {hoveredRootId && (
        (() => {
          const activeRoot = categories.find(c => c.id === hoveredRootId);
          const sub2List = activeRoot ? categories.filter(c => c.parentId === activeRoot.id) : [];
          if (sub2List.length === 0) return null;

          return (
            <div 
              className="absolute left-full top-0 ml-2 w-[480px] bg-white border border-gray-200/80 rounded-md shadow-2xl p-6 z-[100] animate-in fade-in slide-in-from-left-2 duration-200 min-h-full flex flex-col justify-between"
              style={{ minHeight: '100%' }}
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                {sub2List.map((sub2) => {
                  const sub3List = categories.filter(c => c.parentId === sub2.id);
                  const sub2Path = `/danh-muc/${encodeURIComponent(sub2.name.toLowerCase())}`;
                  
                  return (
                    <div key={sub2.id} className="space-y-2">
                      <Link 
                        to={sub2Path} 
                        onClick={() => {
                          setHoveredRootId(null);
                          if (setIsFocused) setIsFocused(false);
                        }}
                        className="block font-bold text-xs text-gray-900 hover:text-primary uppercase tracking-wide transition-colors border-b border-gray-100 pb-1"
                      >
                        {sub2.name}
                      </Link>
                      
                      {sub3List.length > 0 ? (
                        <div className="flex flex-col space-y-1.5">
                          {sub3List.map((sub3) => {
                            const sub3Path = `/danh-muc/${encodeURIComponent(sub3.name.toLowerCase())}`;
                            return (
                              <Link
                                key={sub3.id}
                                to={sub3Path}
                                onClick={() => {
                                  setHoveredRootId(null);
                                  if (setIsFocused) setIsFocused(false);
                                }}
                                className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
                              >
                                {sub3.name}
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400 font-medium">
                          Xem tất cả sản phẩm
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      )}
    </aside>
  );
}
