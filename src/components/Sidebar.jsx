import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { categoryService } from '../services/categoryService';

export default function Sidebar() {
  const [categories, setCategories] = useState([]);
  const location = useLocation();

  useEffect(() => {
    categoryService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.error("Lỗi tải danh mục sidebar:", err));
  }, []);

  return (
    <aside 
      className="w-64 flex-shrink-0 bg-white rounded-md border border-gray-200/80 p-1.5 space-y-1 h-fit"
    >
      <nav className="flex flex-col">
        {categories.map((cat, idx) => {
          const path = `/danh-muc/${encodeURIComponent(cat.name.toLowerCase())}`;
          const isActive = decodeURIComponent(location.pathname).toLowerCase() === `/danh-muc/${cat.name.toLowerCase()}`;
          
          return (
            <Link
              key={idx}
              to={path}
              className={`group flex items-center justify-between px-4 py-3.5 rounded-md transition-all duration-200 font-semibold text-sm ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">{cat.name}</span>
              <ChevronRight 
                className={`w-4 h-4 transition-all duration-200 ${
                  isActive 
                    ? 'text-primary translate-x-0.5' 
                    : 'text-gray-300 group-hover:text-primary group-hover:translate-x-0.5'
                }`} 
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
