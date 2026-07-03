import React from 'react';
import { Edit, Plus, X, AlertCircle, Loader2, UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import { generateSlug } from '../../../utils/codeGenerator';
import SharedLocalImageUpload from '../../SharedLocalImageUpload';

export default function BrandModal({
  isModalOpen,
  setIsModalOpen,
  editingBrand,
  saving,
  uploading,
  isCodeEditable,
  setIsCodeEditable,
  catErrorMessage,
  formData,
  setFormData,
  formError,
  handleImageUpload,
  handleSave
}) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-indigo-950/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-md w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-admin-border flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-admin-text-main flex items-center gap-2">
            {editingBrand ? <Edit size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
            {editingBrand ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu mới'}
          </h3>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-admin-text-muted hover:text-admin-danger hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6">
          {formError && (
            <div className="mb-6 p-4 bg-admin-danger/10 border border-admin-danger/30 rounded-md flex gap-3 items-start animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-full bg-admin-danger/15 text-admin-danger flex items-center justify-center font-bold flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-admin-danger text-sm">{formError.message}</h5>
                {formError.details && formError.details.length > 0 && (
                  <ul className="list-none text-xs text-admin-text-main mt-2 space-y-1.5 bg-white/60 p-3 rounded-md border border-admin-danger/10">
                    {formError.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-admin-danger mt-0.5">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload Area */}
            <div className="md:col-span-2">
              <SharedLocalImageUpload
                multiple={false}
                value={formData.imageUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                folder="brands"
                label="Logo thương hiệu *"
              />
            </div>

            {/* Form Fields */}
            <div className="md:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Tên thương hiệu *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Samsung, Apple, Xiaomi..."
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  }))}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-admin-text-main">Mã (BrandCode)</label>
                  {editingBrand && !isCodeEditable && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Việc đổi mã thương hiệu sẽ không cập nhật lại các mã SKU đã tạo trước đó ở các sản phẩm. Bạn vẫn muốn sửa?")) {
                          setIsCodeEditable(true);
                        }
                      }}
                      className="text-xs text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer"
                    >
                      Thay đổi mã
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Tự động tạo nếu để trống"
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-medium uppercase disabled:bg-admin-bg disabled:text-admin-text-muted"
                  value={formData.brandCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandCode: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  disabled={!isCodeEditable}
                />
                {catErrorMessage && <p className="text-admin-danger text-xs font-bold mt-1">{catErrorMessage}</p>}
              </div>
            </div>

            <div className="md:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Đường dẫn (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: samsung, apple..."
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-medium"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Trạng thái hoạt động</label>
                <label className="flex items-center gap-3 p-3 border border-admin-border rounded-md bg-slate-50 cursor-pointer select-none">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                  </div>
                  <span className="text-sm font-bold text-admin-text-main">
                    {formData.isActive ? 'Đang hoạt động' : 'Tạm dừng/Ẩn'}
                  </span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-admin-text-main mb-2">Mô tả thương hiệu</label>
              <textarea
                rows="3"
                placeholder="Mô tả tóm tắt về hãng..."
                className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-medium resize-none"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-admin-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 bg-admin-bg text-admin-text-main rounded-md font-bold hover:bg-admin-border transition-colors cursor-pointer border-0"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer border-0"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? "Đang lưu..." : (editingBrand ? "Cập nhật" : "Tạo mới")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
