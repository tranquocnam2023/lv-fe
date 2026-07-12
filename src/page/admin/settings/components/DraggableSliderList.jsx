import React from 'react';
import { GripVertical, Upload, Eye, EyeOff, Trash2, Plus } from 'lucide-react';

export default function DraggableSliderList({
  sliderItems,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onAddSliderClick,
  addSliderInputRef,
  onUploadAndAddSlider,
  onReplaceImage,
  onToggleActive,
  onDeleteSlider,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium italic">
          * Kéo thẻ chứa biểu tượng <GripVertical className="w-3 h-3 inline text-gray-400" /> để đổi thứ tự ảnh chạy. Click vào ảnh để upload file mới thay thế.
        </span>

        <div className="relative">
          <button
            onClick={onAddSliderClick}
            className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer animate-in fade-in duration-300"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm Banner Slider
          </button>
          <input
            type="file"
            accept="image/*"
            ref={addSliderInputRef}
            className="hidden"
            onChange={onUploadAndAddSlider}
          />
        </div>
      </div>

      {/* BẢNG DANH SÁCH BANNER SLIDER */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-12">Sắp xếp</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Ảnh Banner</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Trạng thái</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-16">Xóa</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sliderItems.map((item, index) => (
              <tr
                key={item.id}
                draggable="true"
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                className={`hover:bg-gray-50/50 transition-colors ${draggedIndex === index ? 'opacity-40 bg-indigo-50/30' : ''}`}
              >
                {/* Cột Kéo thả */}
                <td className="px-4 py-3 text-center whitespace-nowrap cursor-grab active:cursor-grabbing">
                  <div className="flex justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>
                </td>

                {/* Cột Ảnh & Chọn thay thế */}
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="relative group w-36 aspect-[16/7] rounded overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={item.imageUrl}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold cursor-pointer gap-1">
                      <Upload className="w-3 h-3" />
                      Thay ảnh
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onReplaceImage(e, item.id)}
                      />
                    </label>
                  </div>
                </td>

                {/* Cột Trạng thái */}
                <td className="px-6 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => onToggleActive(item.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${item.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/50'
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200/60'
                      }`}
                  >
                    {item.isActive ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Đang hoạt động
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Đã tắt
                      </>
                    )}
                  </button>
                </td>

                {/* Cột Xóa */}
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => onDeleteSlider(item.id)}
                    className="text-gray-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {sliderItems.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-sm text-gray-500 italic">
                  Không có banner slider nào được bật hoặc thêm vào. Hãy nhấn "Thêm Banner Slider".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
