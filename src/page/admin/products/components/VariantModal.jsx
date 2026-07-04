import React from 'react';
import { X, PlusCircle, MinusCircle, Trash2 } from 'lucide-react';
import SharedLocalImageUpload from '../../../../components/SharedLocalImageUpload';

export default function VariantModal({
  setShowModal,
  editingVariant,
  handleSave,
  products,
  selectedProductId,
  setSelectedProductId,
  generatedVariantName,
  generatedSku,
  variantPrice,
  setVariantPrice,
  selectedProduct,
  variantStock,
  setVariantStock,
  isActive,
  setIsActive,
  handleAddAttribute,
  attributes,
  handleAttributeChange,
  handleRemoveAttribute,
  handleAddSpecOverride,
  specsOverride,
  handleSpecOverrideChange,
  handleRemoveSpecOverride,
  imageInputMethod,
  setImageInputMethod,
  handleFileChange,
  uploading,
  variantImage,
  setVariantImage
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-md w-full max-w-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 shadow-2xl border border-admin-border">
        <div className="p-6 border-b border-admin-border flex justify-between items-center bg-admin-bg">
          <h3 className="text-xl font-bold text-admin-text-main">{editingVariant ? 'Cập nhật Biến thể' : 'Thêm Biến thể mới'}</h3>
          <button 
            onClick={() => setShowModal(false)} 
            className="text-admin-text-muted hover:text-admin-danger transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center p-1 hover:bg-admin-border rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Selection */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-admin-text-muted uppercase mb-2">Sản phẩm gốc *</label>
              <select
                className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main bg-white font-semibold shadow-sm"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
              >
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Variant Name & SKU Preview */}
            <div>
              <label className="block text-xs font-bold text-admin-text-muted uppercase mb-2">Tên biến thể (Tự động sinh)</label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-3 border border-admin-border bg-admin-bg rounded-md outline-none text-admin-text-main font-semibold select-all"
                value={generatedVariantName}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-admin-text-muted uppercase mb-2">Mã SKU (Tự động sinh)</label>
              <input
                type="text"
                readOnly
                className="w-full px-4 py-3 border border-admin-border bg-admin-bg rounded-md outline-none text-red-600 font-mono font-bold select-all"
                value={generatedSku}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-admin-text-muted uppercase mb-2">Giá bán (Để trống = Theo sản phẩm gốc)</label>
              <input
                type="number"
                placeholder={selectedProduct ? `Giá gốc: ${(selectedProduct.basePrice || selectedProduct.price || 0).toLocaleString('vi-VN')} ₫` : 'Giá bán'}
                className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-semibold shadow-sm"
                value={variantPrice}
                onChange={(e) => setVariantPrice(e.target.value)}
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-bold text-admin-text-muted uppercase mb-2">Tồn kho ban đầu</label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-semibold bg-white shadow-sm"
                value={variantStock}
                onChange={(e) => setVariantStock(e.target.value)}
                required
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-2 md:col-span-2 select-none">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-admin-border text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-admin-text-main cursor-pointer">Hoạt động (Is Active)</label>
            </div>

            {/* Dynamic Attributes section */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-admin-text-muted uppercase">Thuộc tính của biến thể (Dynamic Attributes)</label>
                <button
                  type="button"
                  onClick={handleAddAttribute}
                  className="text-xs font-bold text-primary hover:text-admin-primary-hover flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                >
                  <PlusCircle size={14} /> Thêm thuộc tính
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 border border-admin-border rounded-md p-3 bg-gray-50/50">
                {attributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-2.5 rounded-md border border-admin-border shadow-sm">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Tên thuộc tính (VD: Màu sắc)"
                        className="w-full px-3 py-1.5 border border-admin-border rounded-md text-xs font-bold outline-none focus:border-primary"
                        value={attr.key}
                        onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Giá trị (VD: Đen)"
                        className="w-full px-3 py-1.5 border border-admin-border rounded-md text-xs outline-none focus:border-primary"
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(index)}
                      className="text-admin-danger hover:text-red-700 transition-colors p-1 border-0 bg-transparent cursor-pointer flex items-center justify-center"
                      title="Xóa thuộc tính"
                    >
                      <MinusCircle size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs Override section */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-admin-text-muted uppercase">Ghi đè thông số kỹ thuật (Specs Override)</label>
                <button
                  type="button"
                  onClick={handleAddSpecOverride}
                  className="text-xs font-bold text-primary hover:text-admin-primary-hover flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                >
                  <PlusCircle size={14} /> Thêm ghi đè
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 border border-admin-border rounded-md p-3 bg-gray-50/50">
                {specsOverride.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-2.5 rounded-md border border-admin-border shadow-sm">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Tên thông số (VD: Bộ nhớ trong (ROM))"
                        className="w-full px-3 py-1.5 border border-admin-border rounded-md text-xs font-bold outline-none focus:border-primary"
                        value={spec.key}
                        onChange={(e) => handleSpecOverrideChange(index, 'key', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Giá trị ghi đè (VD: 512GB)"
                        className="w-full px-3 py-1.5 border border-admin-border rounded-md text-xs outline-none focus:border-primary"
                        value={spec.value}
                        onChange={(e) => handleSpecOverrideChange(index, 'value', e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecOverride(index)}
                      className="text-admin-danger hover:text-red-700 transition-colors p-1 border-0 bg-transparent cursor-pointer flex items-center justify-center"
                      title="Xóa ghi đè"
                    >
                      <MinusCircle size={18} />
                    </button>
                  </div>
                ))}
                {specsOverride.length === 0 && (
                  <div className="text-center py-4 text-xs text-admin-text-muted italic select-none">
                    Không có thông số nào bị ghi đè. Biến thể sẽ dùng thông số mặc định của sản phẩm cha.
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload/URL Input */}
            <div className="md:col-span-2">
              <SharedLocalImageUpload
                multiple={false}
                value={variantImage}
                onChange={(url) => setVariantImage(url)}
                folder="variants"
                label="Hình ảnh biến thể"
              />
            </div>
          </div>

          {/* Inventory history (Mocked table) */}
          <div className="border border-admin-border rounded-md overflow-hidden mt-6">
            <div className="bg-gray-50 px-4 py-2 border-b border-admin-border text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Lịch sử tồn kho
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white text-gray-400 border-b border-admin-border">
                    <th className="px-4 py-2 font-bold uppercase">Loại</th>
                    <th className="px-4 py-2 font-bold uppercase">Số lượng</th>
                    <th className="px-4 py-2 font-bold uppercase">Tồn trước</th>
                    <th className="px-4 py-2 font-bold uppercase">Tồn sau</th>
                    <th className="px-4 py-2 font-bold uppercase">Ghi chú</th>
                    <th className="px-4 py-2 font-bold uppercase">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border text-gray-600">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-bold text-green-600">NHẬP KHO</td>
                    <td className="px-4 py-2 font-bold">{variantStock}</td>
                    <td className="px-4 py-2">0</td>
                    <td className="px-4 py-2">{variantStock}</td>
                    <td className="px-4 py-2">Khởi tạo tồn kho ban đầu</td>
                    <td className="px-4 py-2 text-admin-text-muted">{new Date().toLocaleDateString('vi-VN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-admin-border select-none">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-3 bg-admin-bg text-admin-text-main border border-admin-border rounded-md font-bold hover:bg-admin-border transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 cursor-pointer border-0"
            >
              Lưu Lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
