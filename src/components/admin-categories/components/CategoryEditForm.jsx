import React from 'react';
import { ArrowLeft, Loader2, Save, UploadCloud, Trash2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import CategorySpecsTemplateEditor from '../../CategorySpecsTemplateEditor';

export default function CategoryEditForm({
  editingCategory,
  parentName,
  setIsModalOpen,
  saving,
  uploading,
  formData,
  setFormData,
  isCodeEditable,
  setIsCodeEditable,
  catErrorMessage,
  lockParentRoot,
  allCategories,
  isDescendantOrSelf,
  getFullDirectoryForSelect,
  handleImageUpload,
  handleSave,
  formError
}) {
  const checkInheritedInactiveForId = (parentId) => {
    let currentId = parentId;
    while (currentId) {
      const parent = allCategories.find(c => c.id === parseInt(currentId));
      if (!parent) break;
      if (parent.isActive === false) return true;
      currentId = parent.parentId;
    }
    return false;
  };

  const inheritedInactiveModal = checkInheritedInactiveForId(formData.parentId);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 font-sans">
      {/* Top Header Sticky with Glassmorphism */}
      <div className="sticky top-0 z-40 bg-admin-bg/90 backdrop-blur-sm -mt-4 pt-4 pb-4 -mx-8 px-8 border-b border-admin-border/40 flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setIsModalOpen(false)} 
            className="p-2 bg-white rounded-full text-admin-text-muted hover:text-admin-text-main border border-admin-border transition-colors cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-admin-text-main">
              {editingCategory 
                ? `Cập nhật danh mục: ${editingCategory.name}` 
                : parentName 
                  ? `Thêm danh mục con cho: ${parentName}` 
                  : 'Thêm danh mục gốc mới'
              }
            </h2>
            <p className="text-xs text-admin-text-muted font-medium mt-0.5">
              {editingCategory 
                ? 'Quản lý thông tin chi tiết và cấu hình thông số của danh mục này' 
                : 'Định nghĩa tên, mã danh mục và thiết lập bộ thông số kỹ thuật mẫu'
              }
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2.5 border border-admin-border text-admin-text-main rounded-md font-bold hover:bg-admin-bg transition-colors text-sm cursor-pointer bg-white"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer border-0"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Lưu danh mục
          </button>
        </div>
      </div>

      {/* Form Body - Grid Layout */}
      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left & Middle Column (Basic Info & Specifications) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Card 1: Basic Info */}
          <div className="bg-white p-6 rounded-md border border-admin-border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-admin-text-main border-b border-gray-100 pb-3 font-sans">Thông tin cơ bản</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text-muted uppercase mb-2">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Điện thoại, Tai nghe..."
                  className="w-full px-4 py-2.5 border border-admin-border rounded-md focus:border-primary outline-none text-sm text-admin-text-main font-semibold"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-admin-text-muted uppercase">Mã (CategoryCode)</label>
                  {editingCategory && !isCodeEditable && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Việc đổi mã danh mục sẽ không cập nhật lại các mã SKU đã tạo trước đó. Bạn vẫn muốn sửa?")) {
                          setIsCodeEditable(true);
                        }
                      }}
                      className="text-[10px] text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer"
                    >
                      Sửa mã
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Tự động tạo nếu để trống"
                  className="w-full px-4 py-2.5 border border-admin-border rounded-md focus:border-primary outline-none text-sm text-admin-text-main font-semibold uppercase disabled:bg-admin-bg disabled:text-admin-text-muted"
                  value={formData.categoryCode}
                  onChange={(e) => setFormData({...formData, categoryCode: e.target.value.toUpperCase().replace(/\s+/g, '')})}
                  disabled={!isCodeEditable}
                />
                {catErrorMessage && <p className="text-admin-danger text-xs font-bold mt-1">{catErrorMessage}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-text-muted uppercase mb-2">Phân cấp (Danh mục cha)</label>
                <select
                  className="w-full px-4 py-2.5 border border-admin-border rounded-md focus:border-primary outline-none text-sm text-admin-text-main font-semibold bg-white disabled:bg-admin-bg disabled:text-admin-text-muted disabled:cursor-not-allowed"
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                  disabled={lockParentRoot}
                >
                  <option value="">-- Là danh mục gốc (Cấp 1) --</option>
                  {allCategories
                    .filter(c => {
                      if (editingCategory) {
                        return !isDescendantOrSelf(c, editingCategory.id);
                      }
                      return true;
                    })
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {getFullDirectoryForSelect(c)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-text-muted uppercase mb-2">Trạng thái hiển thị</label>
                <label className={`flex items-center gap-3 px-4 py-2.5 border border-admin-border rounded-md bg-slate-50/50 select-none ${inheritedInactiveModal ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={inheritedInactiveModal ? false : formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      disabled={inheritedInactiveModal}
                    />
                    <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                  </div>
                  <span className="text-sm font-bold text-admin-text-main">
                    {inheritedInactiveModal ? 'Đã ẩn (Kế thừa từ cha)' : (formData.isActive ? 'Đang hoạt động' : 'Đã ẩn')}
                  </span>
                </label>
                {inheritedInactiveModal && (
                  <span className="text-[10px] text-admin-danger font-bold mt-1 block">
                    Danh mục cha đang bị ẩn, không thể kích hoạt danh mục này.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Description */}
          <div className="bg-white p-6 rounded-md border border-admin-border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-admin-text-main border-b border-gray-100 pb-3 font-sans">Mô tả danh mục</h3>
            <textarea
              rows="4"
              placeholder="Mô tả tóm tắt giới thiệu về danh mục này..."
              className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-sm text-admin-text-main font-semibold resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Card 3: Specifications Template Editor */}
          <div className="bg-white p-6 rounded-md border border-admin-border shadow-sm">
            <CategorySpecsTemplateEditor
              value={formData.specsTemplate}
              onChange={(val) => setFormData(prev => ({ ...prev, specsTemplate: val }))}
            />
          </div>

        </div>

        {/* Right Column: Avatar Upload */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-md border border-admin-border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-admin-text-main border-b border-gray-100 pb-3 font-sans">Ảnh đại diện danh mục</h3>
            
            <div className="flex flex-col items-center p-6 bg-slate-50/50 rounded-md border border-dashed border-admin-border">
              <div className="w-32 h-32 bg-white rounded-md border border-admin-border flex items-center justify-center overflow-hidden mb-4 shadow-inner">
                {uploading ? (
                  <Loader2 className="animate-spin text-primary" size={32} />
                ) : formData.iconUrl ? (
                  <img src={formData.iconUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="text-admin-text-muted" size={40} />
                )}
              </div>
              <div className="text-center space-y-1 mb-4 select-none">
                <p className="text-xs font-bold text-admin-text-main">Hỗ trợ JPG, PNG, WEBP, SVG</p>
                <p className="text-[10px] text-admin-text-muted">Kích thước file tối đa 2MB</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-center">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-admin-border text-admin-text-main text-sm font-bold rounded-md cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <UploadCloud size={16} />
                  Tải ảnh lên
                  <input 
                    type="file" 
                    accept=".jpg,.jpeg,.png,.webp,.svg" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    disabled={uploading}
                  />
                </label>
                {formData.iconUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, iconUrl: '' }))}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-md cursor-pointer hover:bg-red-100 transition-colors shadow-sm border-0"
                  >
                    <Trash2 size={16} />
                    Xóa hình
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Form Error Banner */}
      {formError && (
        <div className="p-4 bg-admin-danger/10 border border-admin-danger/30 rounded-md flex gap-3 items-start animate-in fade-in duration-200">
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
    </div>
  );
}
