import React, { useState } from 'react';
import { UploadCloud, Loader2, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProductFormContext } from '../context/ProductFormContext';

export default function ProductImageUpload() {
  const {
    formData,
    isDragOver,
    setIsDragOver,
    handleImageUpload,
    uploading,
    setMainImage,
    removeImage,
    setFormData
  } = useProductFormContext();

  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleMove = (from, to) => {
    if (to < 0 || to >= formData.images.length) return;
    const nextImages = [...formData.images];
    const [moved] = nextImages.splice(from, 1);
    nextImages.splice(to, 0, moved);
    
    // Recalculate isMain and order fields based on new indices
    const updated = nextImages.map((img, idx) => ({
      ...img,
      isMain: idx === 0,
      order: idx
    }));
    setFormData(prev => ({ ...prev, images: updated }));
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex)) {
      handleMove(fromIndex, toIndex);
    }
  };

  return (
    <div className="bg-white p-5 rounded-md border-0 bg-gray-50/50">
      <div className="mb-3">
        <h3 className="text-base font-bold text-admin-text-main">Hình ảnh sản phẩm (Gallery)</h3>
        <p className="text-xs text-admin-text-muted mt-0.5">Kéo thả để sắp xếp, ảnh số 1 luôn là ảnh đại diện</p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); }}
        className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center relative transition-all duration-200 min-h-[110px] ${
          isDragOver ? 'border-primary bg-primary/10' : 'border-admin-border bg-admin-bg/30 hover:border-primary/50'
        }`}
      >
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.svg"
          onChange={handleImageUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-1.5 text-primary">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-xs font-bold">Đang tải tệp lên...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-admin-text-muted text-center">
            <UploadCloud size={28} className={`mb-1.5 ${isDragOver ? 'text-primary animate-bounce' : 'text-admin-text-muted'}`} />
            <span className="text-xs font-bold text-admin-text-main">
              {isDragOver ? 'Thả ảnh vào đây!' : 'Tải ảnh lên hoặc kéo thả'}
            </span>
            <span className="text-[10px] mt-0.5 text-admin-text-muted">Hỗ trợ JPG, PNG, WEBP, SVG</span>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {formData.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {formData.images.map((img, idx) => {
            const isMain = idx === 0;
            const isDraggingThis = draggedIndex === idx;

            return (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, idx)}
                className={`relative aspect-square border rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing bg-white transition-all duration-300 ${
                  isDraggingThis ? 'opacity-40 border-primary border-2 scale-95' : 'border-admin-border hover:border-primary hover:shadow-sm'
                }`}
              >
                {/* Image Element */}
                <img
                  src={img.url}
                  alt={`Product img ${idx + 1}`}
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                />

                {/* Main Image Badge */}
                {isMain && (
                  <span className="absolute top-1 left-1 px-1 py-0.5 bg-primary text-white text-[8px] font-bold rounded shadow-sm uppercase tracking-wider z-10 select-none">
                    Ảnh chính
                  </span>
                )}

                {/* Index Indicator (Optional, for clarity) */}
                <span className="absolute bottom-1 right-1 px-1 bg-black/60 text-white text-[8px] font-mono rounded z-10 select-none">
                  #{idx + 1}
                </span>

                {/* Action Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-1 z-20">
                  <div className="flex items-center justify-between w-full">
                    {/* Star Icon to toggle Main status manually (moves to index 0) */}
                    {isMain ? (
                      <div className="p-0.5 bg-yellow-400 text-white rounded" title="Ảnh chính mặc định">
                        <Star size={10} className="fill-current" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMainImage(idx)}
                        className="p-0.5 bg-white/20 hover:bg-yellow-400 hover:text-white text-white rounded transition-colors cursor-pointer"
                        title="Đặt làm ảnh chính"
                      >
                        <Star size={10} />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-0.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors cursor-pointer ml-auto"
                      title="Xóa ảnh"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>

                  {/* Manual Arrow Move Controllers */}
                  <div className="flex items-center justify-center gap-1.5 w-full mt-auto mb-auto">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMove(idx, idx - 1)}
                        className="p-1 bg-white/90 hover:bg-white text-admin-text-main rounded-md shadow hover:text-primary transition-all active:scale-90 cursor-pointer"
                        title="Di chuyển sang trái"
                      >
                        <ChevronLeft size={10} strokeWidth={3} />
                      </button>
                    )}
                    {idx < formData.images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMove(idx, idx + 1)}
                        className="p-1 bg-white/90 hover:bg-white text-admin-text-main rounded-md shadow hover:text-primary transition-all active:scale-90 cursor-pointer"
                        title="Di chuyển sang phải"
                      >
                        <ChevronRight size={10} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
