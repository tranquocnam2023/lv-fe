import React, { useState } from 'react';
import { Loader2, Image as ImageIcon, X, ChevronUp, ChevronDown, FolderPlus, Edit, Trash2 } from 'lucide-react';
import { categoryService } from '../../../../services/categoryService';
import { productService } from '../../../../services/productService';

export default function CategoryRow({ category, level = 1, onEdit, onAddSubCategory, onDelete, allCategories = [], onRefresh }) {
  const [expanded, setExpanded] = useState(true);
  const [details, setDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);

  React.useEffect(() => {
    if (allCategories && allCategories.length > 0) {
      const subCats = allCategories.filter(c => c.parentId === category.id);
      setDetails(subCats);
    }
  }, [allCategories, category.id]);

  const handleDeleteIconInline = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hình ảnh/icon của danh mục "${category.name}"?`)) return;

    try {
      const payload = {
        name: category.name,
        slug: category.slug || '',
        categoryCode: category.categoryCode,
        description: category.description || '',
        iconUrl: '',
        parentId: category.parentId || null,
        isActive: category.isActive !== false,
        specsTemplate: category.specsTemplate || ''
      };
      await categoryService.update(category.id, payload);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Lỗi xóa hình ảnh/icon: ' + err.message);
    }
  };

  const handleUploadIconInline = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['image/svg+xml', 'image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      return alert('Hệ thống chỉ hỗ trợ SVG, WebP, PNG, JPG/JPEG.');
    }
    
    if (file.size > 2 * 1024 * 1024) {
      return alert('Vui lòng chọn ảnh nhỏ hơn 2MB.');
    }

    setInlineUploading(true);
    try {
      const res = await productService.uploadLocalImage(file, 'categories');
      if (res && res.url) {
        let finalUrl = res.url;
        if (finalUrl.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
          const hostBase = apiBase.replace('/api', '');
          finalUrl = `${hostBase}${finalUrl}`;
        }
        
        const payload = {
          name: category.name,
          slug: category.slug || '',
          categoryCode: category.categoryCode,
          description: category.description || '',
          iconUrl: finalUrl,
          parentId: category.parentId || null,
          isActive: category.isActive !== false,
          specsTemplate: category.specsTemplate || ''
        };
        await categoryService.update(category.id, payload);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi tải ảnh: ' + err.message);
    } finally {
      setInlineUploading(false);
    }
  };

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const getLevelBadgeColor = (lvl) => {
    if (lvl === 1) return 'bg-admin-border text-admin-text-main';
    if (lvl === 2) return 'bg-primary/10 text-primary';
    return 'bg-success/10 text-success';
  };

  const checkInheritedInactive = (cat) => {
    let parentId = cat.parentId;
    while (parentId) {
      const parent = allCategories.find(c => c.id === parentId);
      if (!parent) break;
      if (parent.isActive === false) return true;
      parentId = parent.parentId;
    }
    return false;
  };

  const inheritedInactive = checkInheritedInactive(category);
  const isSelfInactive = category.isActive === false;
  const isInactive = inheritedInactive || isSelfInactive;
  const currentLevel = category.level || level;

  const getDirectoryPath = (cat) => {
    const parts = [];
    let current = cat;
    while (current) {
      parts.unshift(current.name);
      if (current.parentId) {
        current = allCategories.find(c => c.id === current.parentId);
      } else {
        current = null;
      }
    }
    if (parts.length <= 1) return '';
    return parts.join(' \\ ');
  };

  return (
    <>
      <tr className={`hover:bg-admin-bg transition-colors group border-b border-admin-border ${isInactive ? 'opacity-65 grayscale bg-slate-50/50' : ''}`}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            {currentLevel > 1 && (
              <span className="text-admin-text-muted font-mono select-none flex-shrink-0 mr-1 text-sm tracking-widest">
                {currentLevel === 2 ? '├──' : '└──'}
              </span>
            )}
            <div className="relative w-10 h-10 rounded-md bg-white border border-admin-border flex items-center justify-center overflow-hidden flex-shrink-0 group/icon cursor-pointer hover:border-primary transition-colors">
              {inlineUploading ? (
                <Loader2 className="animate-spin text-primary animate-in fade-in duration-300" size={16} />
              ) : category.iconUrl ? (
                <>
                  <img src={category.iconUrl} alt={category.name} className="w-full h-full object-contain p-1" />
                  <button
                    type="button"
                    onClick={handleDeleteIconInline}
                    className="absolute top-0 right-0 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-bl opacity-0 group-hover/icon:opacity-100 transition-opacity z-20 cursor-pointer shadow flex items-center justify-center w-4 h-4 border-0"
                    title="Xóa icon"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </>
              ) : (
                <ImageIcon className="text-admin-text-muted" size={20} />
              )}
              {!inlineUploading && (
                <input
                  type="file"
                  accept=".svg,.webp,.png,.jpg,.jpeg"
                  onChange={handleUploadIconInline}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  title={category.iconUrl ? "Nhấp để thay đổi icon" : "Nhấp để tải lên icon"}
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-admin-text-main">{category.name}</span>
                {category.categoryCode && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getLevelBadgeColor(currentLevel)}`}>
                    {category.categoryCode}
                  </span>
                )}
                {inheritedInactive && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-admin-danger/10 text-admin-danger">
                    Kế thừa ẩn
                  </span>
                )}
                {isSelfInactive && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-admin-danger/25 text-admin-danger border border-admin-danger/35">
                    Đang ẩn
                  </span>
                )}
              </div>
              {getDirectoryPath(category) && (
                <span className="block text-xs text-admin-text-muted mt-0.5">{getDirectoryPath(category)}</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          <span className="text-sm font-semibold text-admin-text-main">
            {category.subCategoriesCount || 0} <span className="text-admin-text-muted font-normal">danh mục con</span>
          </span>
        </td>
        <td className="px-6 py-4 text-center">
          <span className="text-sm font-semibold text-admin-text-main">
            {(category.productsCount || 0).toLocaleString('vi-VN')} <span className="text-admin-text-muted font-normal">Sản phẩm</span>
          </span>
        </td>
        <td className="px-6 py-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <label className={`relative inline-flex items-center ${inheritedInactive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={inheritedInactive ? false : (category.isActive !== false)} 
                disabled={inheritedInactive}
                readOnly 
              />
              <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
            </label>
            {inheritedInactive && (
              <span className="text-[9px] text-admin-danger font-bold block max-w-[120px] text-center leading-tight">
                Danh mục cha đang tắt
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            {currentLevel < 3 && (
              <button
                onClick={() => onAddSubCategory(category.id, currentLevel + 1, category.name)}
                className="p-2 text-success hover:bg-success/10 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
                title={`Thêm danh mục con cho ${category.name}`}
              >
                <FolderPlus size={18} />
              </button>
            )}
            <button
              onClick={() => onEdit(category)}
              className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
              title="Chỉnh sửa"
            >
              <Edit size={18} />
            </button>
            {category.subCategoriesCount === 0 && category.productsCount === 0 && (
              <button
                onClick={() => onDelete(category.id)}
                className="p-2 text-admin-danger hover:bg-admin-danger/10 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
                title="Xóa danh mục"
              >
                <Trash2 size={18} />
              </button>
            )}
            {category.subCategoriesCount > 0 && (
              <button
                onClick={handleToggle}
                className={`p-2 rounded-md transition-all cursor-pointer border-0 ${expanded ? 'bg-primary text-white' : 'text-admin-text-muted hover:text-primary hover:bg-admin-bg bg-transparent'}`}
                title={expanded ? 'Thu gọn' : 'Xem danh mục con'}
              >
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {/* Expanded Row containing child CategoryRows */}
      {expanded && details && details.length > 0 && (
        <tr className="bg-slate-50/40">
          <td colSpan="5" className="p-0 border-b border-admin-border">
            <div className="pl-12 pr-6 py-1 border-l-2 border-dashed border-primary/20 ml-12">
              {loadingDetails ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {details.map(sub => (
                      <CategoryRow 
                        key={sub.id} 
                        category={sub} 
                        level={currentLevel + 1}
                        onEdit={onEdit}
                        onAddSubCategory={onAddSubCategory}
                        onDelete={onDelete}
                        allCategories={allCategories}
                        onRefresh={onRefresh}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
