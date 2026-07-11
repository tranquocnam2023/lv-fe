import React, { useState } from 'react';
import { UploadCloud, Loader2, Trash2, Star, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { productService } from '../services/productService';

export default function SharedLocalImageUpload({
  multiple = false,
  value, // string (single) or array of { url, isMain, order } (multiple)
  onChange,
  folder = 'general',
  label,
  disabled = false,
  compact = false
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Placeholder hiển thị khi không có ảnh hoặc sau khi xóa
  const NO_IMAGE_URL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f8fafc" stroke="%23e2e8f0" stroke-width="2"/><path d="M30 35 h40 a 5 5 0 0 1 5 5 v25 a 5 5 0 0 1 -5 5 h-40 a 5 5 0 0 1 -5 -5 v-25 a 5 5 0 0 1 5 -5 z" fill="none" stroke="%23cbd5e1" stroke-width="2"/><circle cx="42" cy="47" r="4" fill="%23cbd5e1"/><path d="M30 62 l12 -12 l10 10 l14 -14 l8 8" fill="none" stroke="%23cbd5e1" stroke-width="2"/></svg>';
  const isNoImage = (url) => !url || url === NO_IMAGE_URL || url === '/no_image.png' || url.includes('no_image.png');

  // Helper to ensure VITE_API_URL is appended if the URL is relative
  const getAbsoluteUrl = (url) => {
    if (!url || isNoImage(url)) return NO_IMAGE_URL;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:7279/api';
    const hostBase = apiBase.replace('/api', '');
    return `${hostBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      if (multiple) {
        const currentImages = Array.isArray(value) ? [...value] : [];
        for (const file of files) {
          if (file.size > 2 * 1024 * 1024) {
            alert(`Tệp "${file.name}" quá lớn (>2MB).`);
            continue;
          }
          const res = await productService.uploadLocalImage(file, folder);
          if (res && res.url) {
            const absoluteUrl = getAbsoluteUrl(res.url);
            currentImages.push({
              url: absoluteUrl,
              isMain: currentImages.length === 0,
              order: currentImages.length
            });
          }
        }
        onChange(currentImages);
      } else {
        const file = files[0];
        if (file.size > 2 * 1024 * 1024) {
          alert(`Tệp "${file.name}" quá lớn (>2MB).`);
          setUploading(false);
          return;
        }
        const res = await productService.uploadLocalImage(file, folder);
        if (res && res.url) {
          onChange(getAbsoluteUrl(res.url));
        }
      }
    } catch (err) {
      alert("Lỗi tải ảnh lên: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSingle = () => {
    onChange('');
  };

  const handleRemoveMultiple = (index) => {
    if (!Array.isArray(value)) return;
    const nextImages = value.filter((_, i) => i !== index);
    const updated = nextImages.map((img, idx) => ({
      ...img,
      isMain: idx === 0,
      order: idx
    }));
    onChange(updated);
  };

  const handleSetMain = (index) => {
    if (!Array.isArray(value) || index < 0 || index >= value.length) return;
    const nextImages = [...value];
    const [selected] = nextImages.splice(index, 1);
    nextImages.unshift(selected);
    const updated = nextImages.map((img, idx) => ({
      ...img,
      isMain: idx === 0,
      order: idx
    }));
    onChange(updated);
  };

  const handleMove = (from, to) => {
    if (!Array.isArray(value) || to < 0 || to >= value.length) return;
    const nextImages = [...value];
    const [moved] = nextImages.splice(from, 1);
    nextImages.splice(to, 0, moved);
    const updated = nextImages.map((img, idx) => ({
      ...img,
      isMain: idx === 0,
      order: idx
    }));
    onChange(updated);
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

  // Render Compact Single Image Mode (e.g. for grid cells)
  if (compact && !multiple) {
    const previewUrl = getAbsoluteUrl(value) || NO_IMAGE_URL;
    const showDelete = !isNoImage(value);
    return (
      <div className="relative w-8 h-8 rounded border border-admin-border bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer group shadow-sm">
        {uploading ? (
          <Loader2 className="animate-spin text-primary" size={14} />
        ) : (
          <>
            {showDelete ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = NO_IMAGE_URL; }}
              />
            ) : (
              <ImageIcon className="text-gray-300 w-4 h-4 animate-in fade-in" />
            )}
            {showDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleRemoveSingle();
                }}
                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-0 cursor-pointer"
                title="Xóa hình"
              >
                <Trash2 size={12} />
              </button>
            )}
            {/* Cho phép upload ảnh mới khi đang hiển thị no_image */}
            {!showDelete && (
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                disabled={uploading || disabled}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // Render Single Image Mode
  if (!multiple) {
    const previewUrl = getAbsoluteUrl(value) || NO_IMAGE_URL;
    const showDelete = !isNoImage(value);

    return (
      <div className="flex flex-col items-center sm:flex-row gap-6 p-4 bg-admin-bg rounded-md border border-admin-border border-dashed w-full">
        <div className="w-24 h-24 bg-white rounded-md border border-admin-border flex items-center justify-center overflow-hidden flex-shrink-0 relative">
          {uploading ? (
            <Loader2 className="animate-spin text-primary" size={24} />
          ) : (
            showDelete ? (
              <img
                src={previewUrl}
                alt="Preview Logo"
                className="w-full h-full object-contain p-2"
                onError={(e) => { e.currentTarget.src = NO_IMAGE_URL; }}
              />
            ) : (
              <ImageIcon className="text-gray-300 w-10 h-10 animate-in fade-in" />
            )
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          {label && <h4 className="font-bold text-admin-text-main mb-1">{label}</h4>}
          <p className="text-xs text-admin-text-muted mb-3">Chỉ hỗ trợ WebP, SVG, PNG, JPG/JPEG. Tối đa 2MB.</p>
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <label className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-admin-border text-admin-text-main text-sm font-bold rounded-md cursor-pointer hover:bg-slate-50 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <UploadCloud size={16} />
              Tải ảnh lên
              <input
                type="file"
                accept=".svg,.webp,.png,.jpg,.jpeg"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading || disabled}
              />
            </label>
            {showDelete && (
              <button
                type="button"
                onClick={handleRemoveSingle}
                disabled={disabled}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-md cursor-pointer hover:bg-red-100 transition-colors border-0"
              >
                <Trash2 size={16} />
                Xóa hình
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Multiple Images Mode (Gallery)
  const images = Array.isArray(value) ? value : [];

  return (
    <div className="bg-white p-5 rounded-md border-0 bg-gray-50/50 w-full">
      <div className="mb-3">
        {label && <h3 className="text-base font-bold text-admin-text-main">{label}</h3>}
        <p className="text-xs text-admin-text-muted mt-0.5">Kéo thả để sắp xếp, ảnh số 1 luôn là ảnh đại diện</p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); }}
        className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center relative transition-all duration-200 min-h-[110px] ${
          isDragOver ? 'border-primary bg-primary/10' : 'border-admin-border bg-admin-bg/30 hover:border-primary/50'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.svg"
          onChange={handleImageUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={uploading || disabled}
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
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {images.map((img, idx) => {
            const isMain = idx === 0;
            const isDraggingThis = draggedIndex === idx;

            return (
              <div
                key={idx}
                draggable={!disabled}
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

                {/* Index Indicator */}
                <span className="absolute bottom-1 right-1 px-1 bg-black/60 text-white text-[8px] font-mono rounded z-10 select-none">
                  #{idx + 1}
                </span>

                {/* Action Hover Overlay */}
                {!disabled && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-1 z-20">
                    <div className="flex items-center justify-between w-full">
                      {/* Star Icon to toggle Main status */}
                      {isMain ? (
                        <div className="p-0.5 bg-yellow-400 text-white rounded" title="Ảnh chính mặc định">
                          <Star size={10} className="fill-current" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetMain(idx)}
                          className="p-0.5 bg-white/20 hover:bg-yellow-400 hover:text-white text-white rounded transition-colors cursor-pointer border-0"
                          title="Đặt làm ảnh chính"
                        >
                          <Star size={10} />
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMultiple(idx)}
                        className="p-0.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors cursor-pointer ml-auto border-0"
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
                          className="p-1 bg-white/90 hover:bg-white text-admin-text-main rounded-md shadow hover:text-primary transition-all active:scale-90 cursor-pointer border-0"
                          title="Di chuyển sang trái"
                        >
                          <ChevronLeft size={10} strokeWidth={3} />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMove(idx, idx + 1)}
                          className="p-1 bg-white/90 hover:bg-white text-admin-text-main rounded-md shadow hover:text-primary transition-all active:scale-90 cursor-pointer border-0"
                          title="Di chuyển sang phải"
                        >
                          <ChevronRight size={10} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
