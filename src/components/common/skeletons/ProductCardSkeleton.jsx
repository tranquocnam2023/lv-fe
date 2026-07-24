// src/components/common/skeletons/ProductCardSkeleton.jsx
/**
 * ============================================================================
 * COMPONENT: ProductCardSkeleton (Khung xương chờ cho Thẻ sản phẩm)
 * ============================================================================
 * Chức năng:
 *  1. Mô phỏng chi tiết bố cục của ProductCard (Ảnh 1:1, Tên sản phẩm, Thông số RAM/ROM, Giá tiền và Nút bấm).
 *  2. Thiết lập aspect-ratio 1/1 cho khung ảnh để giữ chỗ chính xác trước khi ảnh sản phẩm tải xong (Tránh CLS).
 *  3. Sử dụng hiệu ứng Shimmer nhấp nháy tạo cảm giác nạp trang mượt mà (Perceived Performance).
 * ============================================================================
 */

import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm animate-pulse flex flex-col justify-between h-full">
      <div>
        {/* Khung ảnh giữ tỷ lệ cố định 1/1 chống giật trang (Anti-CLS) */}
        <div 
          className="w-full bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden relative"
          style={{ aspectRatio: '1/1' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 dark:via-slate-700/50 to-transparent animate-shimmer" />
        </div>
        
        {/* Khung tên sản phẩm (2 dòng) */}
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-3"></div>

        {/* Khung thông số kỹ thuật (Tags RAM / Màn hình) */}
        <div className="flex gap-1 mb-3">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-10"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
        </div>
      </div>

      <div>
        {/* Khung hiển thị giá tiền */}
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-3"></div>
        
        {/* Khung nút xem chi tiết / chọn mua */}
        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
      </div>
    </div>
  );
}
