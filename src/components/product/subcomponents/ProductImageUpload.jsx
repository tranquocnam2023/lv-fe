import React from 'react';
import { UploadCloud, Loader2, Trash2 } from 'lucide-react';
import { useProductFormContext } from '../context/ProductFormContext';

export default function ProductImageUpload() {
  const {
    formData,
    isDragOver,
    setIsDragOver,
    handleImageUpload,
    uploading,
    setMainImage,
    updateImageOrder,
    removeImage
  } = useProductFormContext();

  return (
    <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50">
      <h3 className="text-lg font-bold text-admin-text-main mb-4">Khối C - Hình ảnh sản phẩm (Gallery)</h3>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={() => setIsDragOver(false)}
        className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center relative transition-colors mb-4 ${isDragOver ? 'border-primary bg-primary/10' : 'border-admin-border bg-admin-bg/30'}`}
      >
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.svg"
          onChange={handleImageUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-primary">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-sm font-bold">Đang tải...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-admin-text-muted text-center">
            <UploadCloud size={32} className={`mb-2 ${isDragOver ? 'text-primary animate-bounce' : ''}`} />
            <span className="text-sm font-bold text-admin-text-main">
              {isDragOver ? 'Thả ảnh vào đây!' : 'Tải ảnh từ máy tính hoặc kéo thả'}
            </span>
            <span className="text-xs mt-1">Chọn hoặc thả nhiều ảnh cùng lúc</span>
          </div>
        )}
      </div>

      {formData.images.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-admin-border text-[10px] text-admin-text-muted uppercase">
                <th className="pb-2">Preview</th>
                <th className="pb-2 text-center w-24">Đại diện</th>
                <th className="pb-2 text-center w-16">Thứ tự</th>
                <th className="pb-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {formData.images.map((img, idx) => (
                <tr key={idx} className="border-b border-admin-border last:border-0">
                  <td className="py-2">
                    <img src={img.url} alt="preview" className="w-10 h-10 object-cover rounded bg-gray-100" />
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="radio"
                      name="mainImage"
                      checked={img.isMain}
                      onChange={() => setMainImage(idx)}
                      className="w-4 h-4 text-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="number"
                      value={img.order}
                      onChange={(e) => updateImageOrder(idx, e.target.value)}
                      className="w-10 px-1 py-1 text-center border border-admin-border rounded outline-none focus:border-primary text-xs"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => removeImage(idx)} className="text-admin-text-muted hover:text-admin-danger p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
