import React, { useState, useEffect } from 'react';
import { Search, FolderOpen, Image as ImageIcon, ChevronDown, ChevronUp, Plus, X, Edit, Loader2, UploadCloud, Trash2, AlertCircle, AlertTriangle, HelpCircle, FolderPlus } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService'; // Cho uploadLocalImage
import { generateBrandOrCategoryCode, generateSlug } from '../utils/codeGenerator';

// Component đệ quy hiển thị 1 dòng danh mục và (tùy chọn) bảng danh mục con bên dưới
const CategoryRow = ({ category, level = 1, onEdit, onAddSubCategory, onDelete, allCategories = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleToggle = async () => {
    if (!expanded && !details) {
      setLoadingDetails(true);
      try {
        const res = await categoryService.getDetails(category.id, true);
        setDetails(res.subCategories || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetails(false);
      }
    }
    setExpanded(!expanded);
  };

  const getLevelBadgeColor = (lvl) => {
    if (lvl === 1) return 'bg-admin-border text-admin-text-main';
    if (lvl === 2) return 'bg-primary/10 text-primary';
    return 'bg-success/10 text-success';
  };

  // Check if any ancestor is inactive
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
  const currentLevel = category.level || level;

  return (
    <>
      <tr className={`hover:bg-admin-bg transition-colors group border-b border-admin-border ${inheritedInactive ? 'opacity-60 grayscale bg-gray-50/50' : ''}`}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            {currentLevel > 1 && (
              <span className="text-admin-text-muted font-mono select-none flex-shrink-0 mr-1 text-sm tracking-widest">
                {currentLevel === 2 ? '├──' : '└──'}
              </span>
            )}
            <div className="w-10 h-10 rounded-md bg-white border border-admin-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {category.iconUrl ? (
                <img src={category.iconUrl} alt={category.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="text-admin-text-muted" size={20} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-admin-text-main">{category.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getLevelBadgeColor(currentLevel)}`}>
                  Cấp {currentLevel}
                </span>
                {inheritedInactive && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-admin-danger/10 text-admin-danger">
                    Kế thừa ẩn
                  </span>
                )}
              </div>
              {category.categoryCode && (
                <span className="block text-xs text-admin-text-muted mt-0.5">Mã: {category.categoryCode}</span>
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
                className="p-2 text-success hover:bg-success/10 rounded-md transition-colors"
                title={`Thêm danh mục con cho ${category.name}`}
              >
                <FolderPlus size={18} />
              </button>
            )}
            <button
              onClick={() => onEdit(category)}
              className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="Chỉnh sửa"
            >
              <Edit size={18} />
            </button>
            {category.subCategoriesCount === 0 && category.productsCount === 0 && (
              <button
                onClick={() => onDelete(category.id)}
                className="p-2 text-admin-danger hover:bg-admin-danger/10 rounded-md transition-colors"
                title="Xóa danh mục"
              >
                <Trash2 size={18} />
              </button>
            )}
            {category.subCategoriesCount > 0 && (
              <button
                onClick={handleToggle}
                className={`p-2 rounded-md transition-all ${expanded ? 'bg-primary text-white' : 'text-admin-text-muted hover:text-primary hover:bg-admin-bg'}`}
                title={expanded ? 'Thu gọn' : 'Xem danh mục con'}
              >
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {/* Expanded Row */}
      {expanded && (
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
                    {details && details.length > 0 ? (
                      details.map(sub => (
                        <CategoryRow 
                          key={sub.id} 
                          category={sub} 
                          level={currentLevel + 1}
                          onEdit={onEdit}
                          onAddSubCategory={onAddSubCategory}
                          onDelete={onDelete}
                          allCategories={allCategories}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-admin-text-muted text-sm">
                          Chưa có danh mục con nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function AdminCategories() {
  const [rootCategories, setRootCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryCode: '',
    description: '',
    iconUrl: '',
    parentId: '',
    isActive: true
  });
  const [catErrorMessage, setCatErrorMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [hideParentSelect, setHideParentSelect] = useState(false);
  const [lockParentRoot, setLockParentRoot] = useState(false);
  const [isCodeEditable, setIsCodeEditable] = useState(true);
  const [parentName, setParentName] = useState('');

  // Custom Toast & Modal Form Error states
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'warning', message: '', description: '' }
  const [formError, setFormError] = useState(null); // { message: '', details: [] }

  const showToast = (type, message, description = '') => {
    setToast({ type, message, description });
  };

  const parseError = (err) => {
    let msg = typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err);
    if (err && err.response && err.response.data) {
      msg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || JSON.stringify(err.response.data));
    }
    if (typeof err === 'object' && err.errors) msg = JSON.stringify(err.errors);
    
    let parsed = {
      message: msg,
      details: []
    };

    const msgLower = msg.toLowerCase();
    if (msgLower.includes("vòng lặp gia phả") || msgLower.includes("loop") || msgLower.includes("ancestor")) {
      parsed.message = "Phát hiện vòng lặp gia phả (Nghịch lý phả hệ)";
      parsed.details = [
        "Lý do: Bạn đang chọn một danh mục con hoặc cháu của chính danh mục này làm cha của nó.",
        "Hành động bị chặn: Tránh vòng lặp vô hạn hệ thống và lỗi hiển thị giao diện.",
        "Cách khắc phục: Chọn một danh mục cha khác cao hơn, hoặc đặt làm '-- Là danh mục gốc (Cấp 1) --'."
      ];
    } else if (msgLower.includes("vượt quá giới hạn") || msgLower.includes("over-depth") || msgLower.includes("tối đa 3 cấp")) {
      parsed.message = "Vượt quá giới hạn phân cấp (Tối đa 3 cấp)";
      parsed.details = [
        "Lý do: Cấu trúc hiện tại có quá nhiều cấp con cháu (độ sâu hiện tại của cây này khi cộng thêm cấp của cha mới sẽ lớn hơn 3).",
        "Hành động bị chặn: Tránh phá vỡ cấu trúc hiển thị sơ đồ 3 cấp.",
        "Cách khắc phục: Hãy di chuyển danh mục cha mới lên cấp cao hơn, hoặc di chuyển các danh mục con hiện tại sang nhánh khác trước."
      ];
    } else if (msgLower.includes("mã này đã tồn tại") || msgLower.includes("trùng mã") || msgLower.includes("categorycode")) {
      parsed.message = "Mã danh mục (CategoryCode) đã tồn tại";
      parsed.details = [
        "Lý do: Mỗi danh mục phải có một mã định danh duy nhất.",
        "Hành động bị chặn: Không được phép lưu trùng mã.",
        "Cách khắc phục: Thay đổi mã danh mục khác, hoặc xóa trắng trường mã để hệ thống tự động sinh mã."
      ];
    } else if (msgLower.includes("sản phẩm") || msgLower.includes("product")) {
      parsed.message = "Không thể thực hiện thao tác";
      parsed.details = [
        "Lý do: Danh mục này đang chứa các sản phẩm liên kết trực tiếp.",
        "Hành động bị chặn: Không cho phép xóa hoặc ẩn danh mục chứa sản phẩm để đảm bảo tính toàn vẹn dữ liệu.",
        "Cách khắc phục: Di chuyển toàn bộ sản phẩm thuộc danh mục này sang danh mục khác trước khi thực hiện."
      ];
    } else if (msgLower.includes("danh mục con") || msgLower.includes("subcategory")) {
      parsed.message = "Không thể thực hiện thao tác";
      parsed.details = [
        "Lý do: Danh mục này đang chứa các danh mục con trực thuộc.",
        "Hành động bị chặn: Không thể xóa danh mục cha khi vẫn còn danh mục con.",
        "Cách khắc phục: Hãy xóa các danh mục con trước, hoặc đổi danh mục cha của chúng sang nhóm khác."
      ];
    } else {
      parsed.details = [
        "Chi tiết lỗi từ máy chủ: " + msg,
        "Vui lòng kiểm tra lại kết nối mạng hoặc thông tin nhập liệu."
      ];
    }

    return parsed;
  };

  const isDescendantOrSelf = (cat, targetId) => {
    if (!targetId) return false;
    if (cat.id === targetId) return true;
    let parent = allCategories.find(c => c.id === cat.parentId);
    while (parent) {
      if (parent.id === targetId) return true;
      parent = allCategories.find(c => c.id === parent.parentId);
    }
    return false;
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      categoryService.getRoots(true).catch(() => []),
      categoryService.getAll(true).catch(() => [])
    ])
      .then(([rootsData, allData]) => {
        setRootCategories(Array.isArray(rootsData) ? rootsData : []);
        setAllCategories(Array.isArray(allData) ? allData : []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.type === 'success' ? 4000 : 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        const activeElem = document.activeElement;
        if (activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA' || activeElem.isContentEditable)) {
          return;
        }
        e.preventDefault();
        handleOpenModal(null, '', false, true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenModal = (category = null, defaultParentId = '', hideParent = false, lockParentToRoot = false, parentNameVal = '') => {
    setFormError(null);
    setParentName(parentNameVal);
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        categoryCode: category.categoryCode || '',
        description: category.description || '',
        iconUrl: category.iconUrl || '',
        parentId: category.parentId || '',
        isActive: category.isActive !== false
      });
      setIsCodeEditable(false);
      setLockParentRoot(false);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        categoryCode: '',
        description: '',
        iconUrl: '',
        parentId: defaultParentId,
        isActive: true
      });
      setIsCodeEditable(true);
      setLockParentRoot(lockParentToRoot || !!defaultParentId);
    }
    setCatErrorMessage('');
    setHideParentSelect(false);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.')) return;
    try {
      await categoryService.delete(id);
      showToast('success', 'Xóa danh mục thành công!');
      loadData();
    } catch (err) {
      console.error(err);
      const parsed = parseError(err);
      showToast('error', 'Lỗi xóa danh mục: ' + parsed.message, parsed.details.join('\n'));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      return showToast('warning', 'File quá lớn (>2MB)', 'Vui lòng chọn ảnh nhỏ hơn.');
    }
    
    setUploading(true);
    try {
      const res = await productService.uploadLocalImage(file);
      if (res && res.url) {
        let finalUrl = res.url;
        if (finalUrl.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
          const hostBase = apiBase.replace('/api', '');
          finalUrl = `${hostBase}${finalUrl}`;
        }
        setFormData({ ...formData, iconUrl: finalUrl });
      }
    } catch (err) {
      showToast('error', 'Lỗi tải ảnh', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return showToast('warning', 'Thiếu dữ liệu', 'Vui lòng nhập tên danh mục.');

    setCatErrorMessage('');
    setFormError(null);
    setSaving(true);
    try {
      const generatedCode = formData.categoryCode.trim() || generateBrandOrCategoryCode(formData.name, 20);
      const payload = {
        name: formData.name.trim(),
        slug: generateSlug(formData.name.trim()),
        categoryCode: generatedCode,
        description: formData.description.trim(),
        iconUrl: formData.iconUrl,
        parentId: formData.parentId ? parseInt(formData.parentId) : null,
        isActive: formData.isActive
      };

      if (editingCategory) {
        // Prevent self-parenting
        if (payload.parentId === editingCategory.id) {
          throw new Error("Không thể chọn chính nó làm danh mục cha.");
        }
        await categoryService.update(editingCategory.id, payload);
        showToast('success', 'Cập nhật danh mục thành công!');
      } else {
        await categoryService.create(payload);
        showToast('success', 'Tạo danh mục mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      const parsed = parseError(err);
      setFormError(parsed);
      
      const msgLower = parsed.message.toLowerCase();
      if (msgLower.includes('mã này đã tồn tại')) {
        setCatErrorMessage('Mã này đã tồn tại trong hệ thống.');
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredRoots = rootCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.categoryCode && cat.categoryCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Quản lý Danh Mục</h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Quản lý cấu trúc danh mục kinh doanh 3 cấp</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm danh mục gốc..."
              className="w-full pl-11 pr-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-medium text-admin-text-main placeholder-admin-text-muted"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal(null, '', false, true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 whitespace-nowrap"
              title="Thêm danh mục gốc mới. Phím tắt: Shift + N"
            >
              <Plus size={18} />
              <span>Thêm danh mục gốc</span>
            </button>
            <div className="relative group">
              <div className="p-2 bg-admin-bg hover:bg-admin-border text-admin-text-muted hover:text-primary rounded-md cursor-help transition-all">
                <HelpCircle size={18} />
              </div>
              <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-indigo-950 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-white/10">
                <div className="font-bold text-sm mb-1 text-white">Thêm danh mục gốc</div>
                <div className="text-admin-text-muted leading-relaxed">
                  Tạo một danh mục cha cấp cao nhất (Cấp 1) dùng để phân chia các ngành hàng chính.
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] bg-white/10 px-2.5 py-1 rounded-md font-bold text-white w-full border border-white/5">
                  <span>Phím tắt mở nhanh:</span>
                  <span className="bg-primary px-1.5 py-0.5 rounded text-white font-mono">Shift + N</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-md overflow-hidden mb-8 border border-admin-border">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 size={40} className="animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-admin-border">
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase">Tên danh mục gốc</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Số danh mục con</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Tổng sản phẩm</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm bg-white">
                {filteredRoots.length > 0 ? (
                  filteredRoots.map((cat) => (
                    <CategoryRow 
                      key={cat.id} 
                      category={cat} 
                      level={1} 
                      onEdit={(c) => handleOpenModal(c)}
                      onAddSubCategory={(parentId, nextLevel, parentNameVal) => handleOpenModal(null, parentId, false, true, parentNameVal)}
                      onDelete={handleDeleteCategory}
                      allCategories={allCategories}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-admin-text-muted">
                        <FolderOpen size={64} strokeWidth={1} className="mb-4 opacity-50 text-primary" />
                        <p className="text-lg font-bold text-admin-text-main">Không tìm thấy danh mục gốc nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Cập nhật/Thêm mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-admin-border flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-admin-text-main flex items-center gap-2">
                {editingCategory ? <Edit size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                {editingCategory 
                  ? 'Cập nhật danh mục' 
                  : parentName 
                    ? `Thêm danh mục con cho ${parentName}` 
                    : 'Thêm danh mục gốc'
                }
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-admin-text-muted hover:text-admin-danger hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

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
                <div className="md:col-span-2 flex flex-col items-center sm:flex-row gap-6 p-4 bg-admin-bg rounded-md border border-admin-border border-dashed">
                  <div className="w-24 h-24 bg-white rounded-md border border-admin-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {uploading ? (
                      <Loader2 className="animate-spin text-primary" size={24} />
                    ) : formData.iconUrl ? (
                      <img src={formData.iconUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-admin-text-muted" size={32} />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-admin-text-main mb-1">Ảnh đại diện (Tùy chọn)</h4>
                    <p className="text-xs text-admin-text-muted mb-3">Chỉ hỗ trợ định dạng ảnh (JPG, PNG, WEBP, SVG). Tối đa 2MB.</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-admin-border text-admin-text-main text-sm font-bold rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
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
                  </div>
                </div>

                {/* Form Fields */}
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-admin-text-main mb-2">Tên danh mục *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Điện thoại, Tai nghe..."
                      className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-admin-text-main">Mã (CategoryCode)</label>
                      {editingCategory && !isCodeEditable && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Việc đổi mã danh mục sẽ không cập nhật lại các mã SKU đã tạo trước đó. Bạn vẫn muốn sửa?")) {
                              setIsCodeEditable(true);
                            }
                          }}
                          className="text-xs text-primary hover:underline font-bold"
                        >
                          Thay đổi mã
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Tự động tạo nếu để trống"
                      className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-medium uppercase disabled:bg-admin-bg disabled:text-admin-text-muted"
                      value={formData.categoryCode}
                      onChange={(e) => setFormData({...formData, categoryCode: e.target.value.toUpperCase().replace(/\s+/g, '')})}
                      disabled={!isCodeEditable}
                    />
                    {catErrorMessage && <p className="text-admin-danger text-xs font-bold mt-1">{catErrorMessage}</p>}
                  </div>
                </div>

                <div className="md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-admin-text-main mb-2">Phân cấp (Danh mục cha)</label>
                    <select
                      className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-medium bg-white disabled:bg-admin-bg disabled:text-admin-text-muted disabled:cursor-not-allowed"
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
                          {c.level === 1 ? `[Cấp 1] ${c.name}` : `[Cấp ${c.level || 2}] ${c.name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-admin-text-main mb-2">Trạng thái hiển thị</label>
                    {(() => {
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
                        <>
                          <label className={`flex items-center gap-3 p-3 border border-admin-border rounded-md bg-slate-50 ${inheritedInactiveModal ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
                            <span className="text-xs text-admin-danger font-bold mt-1 block">
                              Danh mục cha đang bị ẩn, không thể kích hoạt danh mục này.
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Mô tả danh mục</label>
                  <textarea
                    rows="3"
                    placeholder="Mô tả tóm tắt..."
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main font-medium resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-admin-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-admin-bg text-admin-text-main rounded-md font-bold hover:bg-admin-border transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-6 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "Đang lưu..." : (editingCategory ? "Cập nhật" : "Tạo mới")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[200] max-w-sm w-full bg-white rounded-md shadow-xl border p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' ? 'border-l-4 border-l-success border-admin-border' : 
          toast.type === 'error' ? 'border-l-4 border-l-admin-danger border-admin-border' : 
          'border-l-4 border-l-[#FFB800] border-admin-border'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">✓</div>
            ) : toast.type === 'error' ? (
              <div className="w-8 h-8 rounded-full bg-admin-danger/10 text-admin-danger flex items-center justify-center font-bold">✕</div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold">!</div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-admin-text-main text-sm">
              {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi hệ thống' : 'Cảnh báo'}
            </h4>
            <p className="text-xs text-admin-text-muted mt-1 font-semibold leading-relaxed">{toast.message}</p>
            {toast.description && (
              <p className="text-[10px] text-admin-danger mt-1.5 bg-admin-danger/10 p-2 rounded-md font-mono break-all leading-normal whitespace-pre-wrap">{toast.description}</p>
            )}
          </div>
          <button onClick={() => setToast(null)} className="text-admin-text-muted hover:text-admin-text-main flex-shrink-0 transition-colors p-1 hover:bg-admin-bg rounded-md">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
