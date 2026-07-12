import React from 'react';
import { LayoutGrid } from 'lucide-react';
import BannerSection from '../../../../components/BannerSection';

export default function BannerLivePreview({ draftBanners }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50">
        <div className="text-xs text-gray-400 font-mono mb-2.5 uppercase tracking-wider text-center select-none">
          GIAO DIỆN XEM TRƯỚC TRANG CHỦ (THỬ NGHIỆM)
        </div>
        <div className="bg-white border rounded-lg shadow-inner overflow-hidden min-h-[500px]">

          {/* Mock Header */}
          <div className="bg-gray-950 text-white px-6 py-3 flex justify-between items-center text-xs opacity-85 select-none">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
              <LayoutGrid className="w-4 h-4" />
              <span>PhoneShop</span>
            </div>
            <div className="flex gap-6 text-gray-300">
              <span>Trang chủ</span>
              <span>Sản phẩm</span>
              <span>Khuyến mãi</span>
              <span>Giới thiệu</span>
            </div>
          </div>

          {/* BannerSection được render động với draftBanners */}
          <div className="relative mt-2 admin-preview-mode px-36">
            <BannerSection bannersData={draftBanners} showSlider={true} showSideBanners={true} showTopBanner={true} />
          </div>

          {/* Mock Homepage Content */}
          <div className="p-6 max-w-[1200px] mx-auto opacity-35 select-none mt-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-5"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-gray-100 rounded-lg p-3 space-y-3">
                <div className="h-28 bg-gray-100 rounded-md"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="border border-gray-100 rounded-lg p-3 space-y-3">
                <div className="h-28 bg-gray-100 rounded-md"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
              <div className="border border-gray-100 rounded-lg p-3 space-y-3">
                <div className="h-28 bg-gray-100 rounded-md"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="border border-gray-100 rounded-lg p-3 space-y-3">
                <div className="h-28 bg-gray-100 rounded-md"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
