import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { productService } from '../../../../services/productService';

export default function FixedBannerCard({ title, dimensions, bannerData, onUpdate, isPortrait = false }) {
  const [localLink, setLocalLink] = useState(bannerData.linkUrl || '');
  const [localImage, setLocalImage] = useState(bannerData.imageUrl || '');
  const [uploading, setUploading] = useState(false);

  // Đồng bộ link và ảnh khi bannerData thay đổi (ví dụ khi Admin Discard hoặc đổi ảnh từ nơi khác)
  useEffect(() => {
    setLocalLink(bannerData.linkUrl || '');
    setLocalImage(bannerData.imageUrl || '');
  }, [bannerData]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['image/svg+xml', 'image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      alert("Hệ thống chỉ hỗ trợ các định dạng: SVG, WebP, PNG, JPG/JPEG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.");
      return;
    }

    setUploading(true);
    try {
      const res = await productService.uploadLocalImage(file, 'banners');
      if (res && res.url) {
        let finalUrl = res.url;
        if (finalUrl.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
          const hostBase = apiBase.replace('/api', '');
          finalUrl = `${hostBase}${finalUrl}`;
        }
        setLocalImage(finalUrl);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi tải ảnh lên backend: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleApply = () => {
    onUpdate(localImage, localLink);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 flex flex-col bg-white shadow-sm hover:border-gray-300 transition-colors">
      <h3 className="font-bold text-gray-800 text-sm mb-1">{title}</h3>
      <span className="text-[10px] text-gray-500 mb-4 block leading-tight font-medium">{dimensions}</span>

      {/* Preview Container */}
      <div className={`bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden mb-4 relative group ${isPortrait ? 'h-52 w-32 mx-auto aspect-[1/2]' : 'w-full aspect-[21/6] h-auto'
        }`}>
        {uploading ? (
          <div className="text-gray-500 text-xs italic text-center p-3 select-none">Đang tải ảnh lên...</div>
        ) : localImage ? (
          <img
            src={localImage}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-300 text-xs italic text-center p-3 select-none">Chưa cài ảnh</div>
        )}

        {!uploading && (
          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs text-white font-semibold cursor-pointer gap-1">
            <Upload className="w-4 h-4" />
            Upload ảnh mới
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        )}
      </div>

      <div className="space-y-3.5 mt-auto">
        {/* Link URL */}
        <div>
          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Link liên kết:</label>
          <input
            type="text"
            value={localLink}
            onChange={(e) => setLocalLink(e.target.value)}
            placeholder="Đường dẫn link khi bấm vào..."
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Nút cập nhật của từng nhóm banner */}
        <button
          onClick={handleApply}
          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-2 rounded-lg border border-indigo-150 transition-colors cursor-pointer"
        >
          Cập nhật
        </button>
      </div>
    </div>
  );
}
