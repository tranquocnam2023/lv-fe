// src/components/common/skeletons/BannerSkeleton.jsx
/**
 * ============================================================================
 * COMPONENT: BannerSkeleton (Khung xương chờ cho Hero Banner)
 * ============================================================================
 * Chức năng:
 *  1. Mô phỏng vị trí hiển thị của Banner Slider/Top Banner trong lúc dữ liệu API đang được tải bất đồng bộ.
 *  2. Giữ cố định tỉ lệ khung hình (aspect-ratio: 16/9) nhằm chống nhảy/giật bố cục màn hình (Anti-CLS).
 * ============================================================================
 */

import React from 'react';

export default function BannerSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 my-4">
      {/* Container giữ tỉ lệ 16/9 cố định cho Banner */}
      <div 
        className="w-full rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse overflow-hidden shadow-sm"
        style={{ aspectRatio: '16/9', maxHeight: '420px' }}
      >
        <div className="w-full h-full flex flex-col justify-end p-6 bg-gradient-to-t from-slate-300/60 dark:from-slate-700/60 to-transparent">
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-md w-1/3 mb-3"></div>
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-1/2"></div>
        </div>
      </div>
    </div>
  );
}
