// src/components/common/skeletons/CategorySkeleton.jsx
/**
 * ============================================================================
 * COMPONENT: CategorySkeleton (Khung xương chờ cho Dải danh mục sản phẩm)
 * ============================================================================
 * Chức năng:
 *  1. Mô phỏng dải biểu tượng danh mục nổi bật (Icon hình tròn + Tên danh mục bên dưới).
 *  2. Hỗ trợ truyền prop `count` linh hoạt theo số lượng danh mục muốn hiển thị chờ.
 * ============================================================================
 */

import React from 'react';

export default function CategorySkeleton({ count = 8 }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 my-6">
      {/* Khung tiêu đề section */}
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-4 animate-pulse"></div>
      
      {/* Lưới các icon danh mục */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
