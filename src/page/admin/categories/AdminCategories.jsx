// QUẢN LÝ DANH MỤC
import React, { useState, useEffect } from 'react';
import { Search, FolderOpen, Plus, Loader2, HelpCircle } from 'lucide-react';
import { categoryService } from '../../../services/categoryService';
import { productService } from '../../../services/productService';
import { generateBrandOrCategoryCode, generateSlug } from '../../../utils/codeGenerator';

// Subcomponents
import CategoryRow from './components/CategoryRow';
import CategoryEditForm from './components/CategoryEditForm';
import CategoryToast from './components/CategoryToast';

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
    isActive: true,
    specsTemplate: ''
  });
  const [catErrorMessage, setCatErrorMessage] = useState('');
  const [uploading, setUploading] = useState(false);
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

  const getFullDirectoryForSelect = (cat) => {
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
    const codePrefix = cat.categoryCode ? `[${cat.categoryCode}] ` : '';
    return `${codePrefix}${parts.join(' \\ ')}`;
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
        handleOpenModal(null, '', true, '');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenModal = (category = null, defaultParentId = '', lockParentToRoot = false, parentNameVal = '') => {
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
        isActive: category.isActive !== false,
        specsTemplate: category.specsTemplate || ''
      });
      setIsCodeEditable(false);
      setLockParentRoot(false);
    } else {
      setEditingCategory(null);
      // LOGIC TẠO MỚI: Khởi tạo giá trị rỗng cho các trường dữ liệu
      setFormData({
        name: '',
        categoryCode: '',
        description: '',
        iconUrl: '',
        parentId: defaultParentId, // Nếu là tạo danh mục gốc thì parentId = '', nếu là con thì parentId = ID của cha
        isActive: true,
        specsTemplate: ''
      });
      setIsCodeEditable(true);
      // Nếu lockParentToRoot = true (khi bấm tạo gốc) hoặc đã có defaultParentId (khi bấm tạo con từ dòng):
      // Khóa không cho người dùng tự ý thay đổi danh mục cha trong Form chọn
      setLockParentRoot(lockParentToRoot || !!defaultParentId);
    }
    setCatErrorMessage('');
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
      const res = await productService.uploadLocalImage(file, 'categories');
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
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.name.trim()) return showToast('warning', 'Thiếu dữ liệu', 'Vui lòng nhập tên danh mục.');

    setCatErrorMessage('');
    setFormError(null);
    setSaving(true);
    try {
      const generatedCode = formData.categoryCode.trim() || generateBrandOrCategoryCode(formData.name, 20);
      // LOGIC LƯU DANH MỤC: Thiết lập payload gửi API
      // Nếu parentId để trống (tức là tạo danh mục gốc Cấp 1), ta chuyển nó thành null để DB nhận diện
      const payload = {
        name: formData.name.trim(),
        slug: generateSlug(formData.name.trim()),
        categoryCode: generatedCode,
        description: formData.description.trim(),
        iconUrl: formData.iconUrl,
        parentId: formData.parentId ? parseInt(formData.parentId) : null, // Gửi null nếu là danh mục gốc
        isActive: formData.isActive,
        specsTemplate: formData.specsTemplate
      };

      if (editingCategory) {
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

  if (isModalOpen) {
    return (
      <CategoryEditForm
        editingCategory={editingCategory}
        parentName={parentName}
        setIsModalOpen={setIsModalOpen}
        saving={saving}
        uploading={uploading}
        formData={formData}
        setFormData={setFormData}
        isCodeEditable={isCodeEditable}
        setIsCodeEditable={setIsCodeEditable}
        catErrorMessage={catErrorMessage}
        lockParentRoot={lockParentRoot}
        allCategories={allCategories}
        isDescendantOrSelf={isDescendantOrSelf}
        getFullDirectoryForSelect={getFullDirectoryForSelect}
        handleImageUpload={handleImageUpload}
        handleSave={handleSave}
        formError={formError}
      />
    );
  }

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
            {/* LOGIC TẠO DANH MỤC GỐC: defaultParentId = '' (không có cha), lockParentToRoot = true để khóa lựa chọn cha */}
            <button
              onClick={() => handleOpenModal(null, '', true, '')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 whitespace-nowrap cursor-pointer border-0"
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
                      onAddSubCategory={(parentId, nextLevel, parentNameVal) => handleOpenModal(null, parentId, true, parentNameVal)}
                      onDelete={handleDeleteCategory}
                      allCategories={allCategories}
                      onRefresh={loadData}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
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

      {/* Toast Notification Alert */}
      <CategoryToast toast={toast} setToast={setToast} />
    </div>
  );
}
