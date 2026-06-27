import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash2, FolderOpen, Image as ImageIcon, X, ChevronDown, ChevronUp, Loader2, UploadCloud, AlertCircle, AlertTriangle, HelpCircle, Check } from 'lucide-react';
import { brandService } from '../services/brandService';
import { productService } from '../services/productService';
import { generateBrandOrCategoryCode, generateSlug } from '../utils/codeGenerator';

export default function AdminBrands({ onRedirectToProducts, onRedirectToCreateProduct }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 8;
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const isFirstRender = useRef(true);

  // Modal & CRUD States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCodeEditable, setIsCodeEditable] = useState(true);
  const [catErrorMessage, setCatErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    brandCode: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true
  });

  // Expanded Row & Stats States
  const [expandedBrands, setExpandedBrands] = useState({}); // { [id]: boolean }
  const [brandStats, setBrandStats] = useState({}); // { [id]: statsObj }
  const [loadingStats, setLoadingStats] = useState({}); // { [id]: boolean }

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
    if (msgLower.includes("mã này đã tồn tại") || msgLower.includes("trùng mã") || msgLower.includes("brandcode")) {
      parsed.message = "Mã thương hiệu (BrandCode) đã tồn tại";
      parsed.details = [
        "Lý do: Mỗi thương hiệu phải có một mã định danh duy nhất.",
        "Hành động bị chặn: Không được phép lưu trùng mã.",
        "Cách khắc phục: Thay đổi mã thương hiệu khác, hoặc xóa trắng trường mã để hệ thống tự động sinh mã."
      ];
    } else if (msgLower.includes("slug") || msgLower.includes("đã tồn tại")) {
      parsed.message = "Slug đã tồn tại";
      parsed.details = [
        "Lý do: Tên thương hiệu tạo ra đường dẫn (slug) trùng với một hãng khác.",
        "Hành động bị chặn: Tránh lỗi trùng đường dẫn SEO.",
        "Cách khắc phục: Nhập tên thương hiệu hơi khác một chút hoặc cập nhật thủ công."
      ];
    } else if (msgLower.includes("sản phẩm") || msgLower.includes("product")) {
      parsed.message = "Không thể thực hiện thao tác";
      parsed.details = [
        "Lý do: Thương hiệu này đang chứa các sản phẩm liên kết.",
        "Hành động bị chặn: Không cho phép xóa để đảm bảo tính toàn vẹn dữ liệu.",
        "Cách khắc phục: Di chuyển các sản phẩm của thương hiệu này sang thương hiệu khác trước khi xóa."
      ];
    } else {
      parsed.details = [
        "Chi tiết lỗi từ máy chủ: " + msg,
        "Vui lòng kiểm tra lại kết nối mạng hoặc thông tin nhập liệu."
      ];
    }

    return parsed;
  };

  const fetchBrands = () => {
    setLoading(true);
    brandService.getAll({
      pageNumber: currentPage,
      pageSize: pageSize,
      searchTerm: searchTerm
    })
      .then(res => {
        if (res && res.items) {
          setBrands(res.items);
          setTotalItems(res.totalItems || 0);
          setTotalPages(res.totalPages || 1);
        } else {
          const arr = Array.isArray(res) ? res : [];
          setBrands(arr);
          setTotalItems(arr.length);
          setTotalPages(1);
        }
      })
      .catch(err => {
        console.error("Lỗi tải thương hiệu:", err);
        setBrands([]);
        showToast('error', 'Lỗi tải thương hiệu', err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchBrands();
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchBrands();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        const activeElem = document.activeElement;
        if (activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA' || activeElem.isContentEditable)) {
          return;
        }
        e.preventDefault();
        handleOpenModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.type === 'success' ? 4000 : 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleOpenModal = (brand = null) => {
    setFormError(null);
    setCatErrorMessage('');
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name || '',
        brandCode: brand.brandCode || '',
        slug: brand.slug || generateSlug(brand.name),
        description: brand.description || '',
        imageUrl: brand.imageUrl || '',
        isActive: brand.isActive !== false
      });
      setIsCodeEditable(false);
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        brandCode: '',
        slug: '',
        description: '',
        imageUrl: '',
        isActive: true
      });
      setIsCodeEditable(true);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['image/svg+xml', 'image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      return showToast('warning', 'Định dạng file không hợp lệ', 'Hệ thống chỉ hỗ trợ SVG, WebP, PNG, JPG/JPEG.');
    }
    
    // Validate size (2MB)
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
        setFormData(prev => ({ ...prev, imageUrl: finalUrl }));
        showToast('success', 'Tải ảnh lên thành công!');
      }
    } catch (err) {
      showToast('error', 'Lỗi tải ảnh', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return showToast('warning', 'Thiếu dữ liệu', 'Vui lòng nhập tên thương hiệu.');
    
    setFormError(null);
    setCatErrorMessage('');
    setSaving(true);

    try {
      const generatedCode = formData.brandCode.trim() || generateBrandOrCategoryCode(formData.name.trim(), 10);
      const generatedSlugStr = formData.slug.trim() || generateSlug(formData.name.trim());
      
      const payload = {
        name: formData.name.trim(),
        slug: generatedSlugStr,
        brandCode: generatedCode,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl,
        isActive: formData.isActive
      };

      if (editingBrand) {
        await brandService.update(editingBrand.id, payload);
        showToast('success', 'Cập nhật thương hiệu thành công!');
      } else {
        await brandService.create(payload);
        showToast('success', 'Thêm thương hiệu mới thành công!');
      }
      setIsModalOpen(false);
      fetchBrands();
    } catch (err) {
      console.error(err);
      const parsed = parseError(err);
      setFormError(parsed);

      if (parsed.message.toLowerCase().includes('mã này đã tồn tại')) {
        setCatErrorMessage('Mã thương hiệu này đã tồn tại trong hệ thống.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleExpand = async (brand) => {
    const brandId = brand.id;
    const isCurrentlyExpanded = expandedBrands[brandId];
    
    // Toggle state
    setExpandedBrands(prev => ({ ...prev, [brandId]: !isCurrentlyExpanded }));

    // If expanding and stats are not loaded, call API
    if (!isCurrentlyExpanded && !brandStats[brandId]) {
      setLoadingStats(prev => ({ ...prev, [brandId]: true }));
      try {
        const res = await brandService.getStats(brandId);
        setBrandStats(prev => ({ ...prev, [brandId]: res }));
      } catch (err) {
        console.error('Không thể tải thống kê cho thương hiệu', brandId, err);
        showToast('error', 'Lỗi tải thống kê', err.message);
      } finally {
        setLoadingStats(prev => ({ ...prev, [brandId]: false }));
      }
    }
  };

  const handleToggleActive = async (brand) => {
    try {
      const payload = {
        name: brand.name,
        slug: brand.slug || generateSlug(brand.name),
        brandCode: brand.brandCode,
        description: brand.description || '',
        imageUrl: brand.imageUrl || '',
        isActive: !brand.isActive
      };
      
      await brandService.update(brand.id, payload);
      showToast('success', `${!brand.isActive ? 'Bật' : 'Tắt'} thương hiệu thành công!`, `Các sản phẩm thuộc thương hiệu ${brand.name} sẽ được ${!brand.isActive ? 'hiển thị' : 'ẩn đi'} tương ứng.`);
      fetchBrands();
    } catch (err) {
      console.error(err);
      const parsed = parseError(err);
      showToast('error', 'Lỗi thay đổi trạng thái', parsed.message);
    }
  };

  const handleDelete = async (brand) => {
    if (brand.productsCount > 0) {
      return showToast('warning', 'Không thể xóa', `Thương hiệu ${brand.name} đang chứa ${brand.productsCount} sản phẩm. Vui lòng di chuyển hoặc xóa sản phẩm trước.`);
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${brand.name}"? Hành động này không thể hoàn tác.`)) return;

    try {
      await brandService.delete(brand.id);
      showToast('success', 'Xóa thương hiệu thành công!');
      fetchBrands();
    } catch (err) {
      console.error(err);
      const parsed = parseError(err);
      showToast('error', 'Lỗi xóa thương hiệu', parsed.message);
    }
  };

  const filteredBrands = brands;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Quản lý Thương Hiệu</h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Quản lý danh sách, logo và trạng thái hoạt động của các thương hiệu</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm thương hiệu..."
              className="w-full pl-11 pr-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-medium text-admin-text-main placeholder-admin-text-muted"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 whitespace-nowrap"
              title="Thêm thương hiệu mới. Phím tắt: Shift + N"
            >
              <Plus size={18} />
              <span>Thêm thương hiệu</span>
            </button>
            <div className="relative group">
              <div className="p-2 bg-admin-bg hover:bg-admin-border text-admin-text-muted hover:text-primary rounded-md cursor-help transition-all">
                <HelpCircle size={18} />
              </div>
              <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-indigo-950 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-white/10">
                <div className="font-bold text-sm mb-1 text-white">Thêm thương hiệu</div>
                <div className="text-admin-text-muted leading-relaxed">
                  Tạo một thương hiệu điện thoại mới để phân nhóm sản phẩm và quản lý trên hệ thống.
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
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase">Thương hiệu</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Mã (BrandCode)</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Tổng sản phẩm</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`text-sm bg-white transition-opacity duration-200 ${loading && filteredBrands.length > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
              {loading && filteredBrands.length === 0 ? (
                [...Array(pageSize)].map((_, idx) => (
                  <tr key={idx} className="border-b border-admin-border h-[68px]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-neutral-100 animate-pulse border border-admin-border"></div>
                        <div className="space-y-2">
                          <div className="w-24 h-4 bg-neutral-100 rounded animate-pulse"></div>
                          <div className="w-36 h-3 bg-neutral-100 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-16 h-6 bg-neutral-100 rounded-md animate-pulse mx-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-20 h-4 bg-neutral-100 rounded animate-pulse mx-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-12 h-6 bg-neutral-100 rounded-full animate-pulse mx-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-neutral-100 animate-pulse"></div>
                        <div className="w-8 h-8 rounded-md bg-neutral-100 animate-pulse"></div>
                        <div className="w-8 h-8 rounded-md bg-neutral-100 animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => {
                    const isExpanded = expandedBrands[brand.id];
                    const stats = brandStats[brand.id];
                    const statsLoading = loadingStats[brand.id];
                    const isBrandActive = brand.isActive !== false;

                    return (
                      <React.Fragment key={brand.id}>
                        {/* Main Row */}
                        <tr className={`hover:bg-admin-bg transition-all group border-b border-admin-border ${!isBrandActive ? 'opacity-50 grayscale bg-gray-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-white border border-admin-border flex items-center justify-center overflow-hidden flex-shrink-0">
                                {brand.imageUrl ? (
                                  <img src={brand.imageUrl} alt={brand.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="text-admin-text-muted" size={20} />
                                )}
                              </div>
                              <div>
                                <span className="text-base font-bold text-admin-text-main">{brand.name}</span>
                                {brand.description && (
                                  <span className="block text-xs text-admin-text-muted max-w-xs truncate mt-0.5">{brand.description}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-primary bg-admin-bg px-3 py-1 rounded-md">
                              {brand.brandCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-admin-text-main">
                            {brand.productsCount || 0} sản phẩm
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={isBrandActive}
                                  onChange={() => handleToggleActive(brand)}
                                />
                                <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenModal(brand)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(brand)}
                                className="p-2 text-admin-danger hover:bg-admin-danger/10 rounded-md transition-colors"
                                title="Xóa thương hiệu"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button
                                onClick={() => handleToggleExpand(brand)}
                                className={`p-2 rounded-md transition-all ${isExpanded ? 'bg-primary text-white' : 'text-admin-text-muted hover:text-primary hover:bg-admin-bg'}`}
                                title={isExpanded ? 'Thu gọn' : 'Xem thống kê'}
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Stats Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan="5" className="p-0 border-b border-admin-border">
                              <div className="px-12 py-5 border-l-4 border-primary/30 bg-gray-50/20">
                                {statsLoading ? (
                                  <div className="flex justify-center items-center py-6">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <span className="text-sm font-semibold text-admin-text-main ml-2">Đang tải thống kê nhanh...</span>
                                  </div>
                                ) : (brand.productsCount === 0 || !stats || (stats.totalActive === 0 && stats.totalStock === 0)) ? (
                                  /* Empty State Layout */
                                  <div className="flex items-center justify-between h-16 px-6 bg-white rounded-md border border-dashed border-admin-border">
                                    <div className="flex items-center text-admin-text-muted gap-2">
                                      <FolderOpen size={20} className="text-admin-text-muted opacity-50" />
                                      <span className="text-sm font-semibold">Chưa có sản phẩm nào thuộc thương hiệu này.</span>
                                    </div>
                                    <button 
                                      type="button" 
                                      className="flex items-center gap-1.5 px-4 py-2 bg-admin-bg text-primary hover:bg-primary/10 rounded-md text-xs font-bold transition-all active:scale-[0.98]"
                                      onClick={() => onRedirectToCreateProduct && onRedirectToCreateProduct(brand.id)}
                                    >
                                      <Plus size={14} />
                                      <span>Thêm sản phẩm</span>
                                    </button>
                                  </div>
                                ) : (
                                  /* 3-Column Quick Insights Seamless Grid with Dividers */
                                  <div className="grid grid-cols-1 md:grid-cols-3 bg-neutral-50/80 rounded-md border border-neutral-100 p-5 divide-y md:divide-y-0 md:divide-x divide-gray-200 animate-in slide-in-from-top-2 duration-300">
                                    {/* Cột 1: Hiệu suất (Performance) */}
                                    <div className="pb-4 md:pb-0 md:pr-6 flex flex-col justify-center">
                                      <h5 className="text-xs font-extrabold text-admin-text-muted uppercase tracking-wider mb-3">Hiệu suất (Performance)</h5>
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm font-medium">
                                          <span className="text-admin-text-main flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-success inline-block"></span>
                                            Đang bán:
                                          </span>
                                          <span className="text-success font-bold">{stats.totalActive} SP</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-medium">
                                          <span className="text-admin-text-main flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-admin-danger inline-block"></span>
                                            Hết hàng:
                                          </span>
                                          <span className="text-admin-danger font-bold">{stats.outOfStock} SP</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-medium">
                                          <span className="text-admin-text-main flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                                            Tồn kho tổng:
                                          </span>
                                          <span className="text-admin-text-main font-bold">{stats.totalStock?.toLocaleString('vi-VN') || 0} thiết bị</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Cột 2: Sản phẩm bán chạy (Top Sellers) */}
                                    <div className="py-4 md:py-0 md:px-6 flex flex-col justify-center">
                                      <h5 className="text-xs font-extrabold text-admin-text-muted uppercase tracking-wider mb-3">Sản phẩm bán chạy (Top Sellers)</h5>
                                      {stats.topSellers && stats.topSellers.length > 0 ? (
                                        <div className="space-y-2">
                                          {stats.topSellers.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2.5">
                                              <div className="w-6 h-6 rounded bg-white border border-admin-border flex items-center justify-center overflow-hidden shrink-0">
                                                {item.thumbnailImage ? (
                                                  <img src={item.thumbnailImage} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                  <ImageIcon className="text-admin-text-muted" size={12} />
                                                )}
                                              </div>
                                              <span className="truncate text-xs font-bold text-admin-text-main" title={item.name}>{item.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-admin-text-muted italic py-2">Chưa có thông tin bán hàng.</span>
                                      )}
                                    </div>

                                    {/* Cột 3: Hành động nhanh (Quick Actions) */}
                                    <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-center gap-2">
                                      <button
                                        onClick={() => onRedirectToProducts && onRedirectToProducts(brand.id)}
                                        className="w-full py-2 bg-primary hover:bg-admin-primary-hover text-white text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                      >
                                        <span>Xem toàn bộ {brand.productsCount || 0} sản phẩm</span>
                                      </button>
                                      <button
                                        onClick={() => onRedirectToCreateProduct && onRedirectToCreateProduct(brand.id)}
                                        className="w-full py-2 bg-transparent hover:bg-neutral-100 text-primary text-xs font-bold rounded-md transition-all border border-admin-border flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                      >
                                        <Plus size={14} />
                                        <span>Thêm sản phẩm</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-admin-text-muted">
                        <FolderOpen size={64} strokeWidth={1} className="mb-4 opacity-50 text-primary" />
                        <p className="text-lg font-bold text-admin-text-main">Không tìm thấy thương hiệu nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        <div className="px-6 py-4 border-t border-admin-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-admin-text-muted">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              Hiển thị {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, totalItems)} trên tổng số {totalItems} thương hiệu
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-xs font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-xs font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-admin-border flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-admin-text-main flex items-center gap-2">
                {editingBrand ? <Edit size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                {editingBrand ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu mới'}
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
                    ) : formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-admin-text-muted" size={32} />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-admin-text-main mb-1">Logo thương hiệu *</h4>
                    <p className="text-xs text-admin-text-muted mb-3">Chỉ hỗ trợ định dạng WebP, SVG, PNG, JPG/JPEG. Tối đa 2MB.</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-admin-border text-admin-text-main text-sm font-bold rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                      <UploadCloud size={16} />
                      Tải ảnh lên
                      <input 
                        type="file" 
                        accept=".svg,.webp,.png,.jpg,.jpeg" 
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
                    <label className="flex items-center gap-3 p-3 border border-admin-border rounded-md bg-slate-50 cursor-pointer">
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
                  {saving ? "Đang lưu..." : (editingBrand ? "Cập nhật" : "Tạo mới")}
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
              {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi hệ thống' : 'Thông tin'}
            </h4>
            <p className="text-xs text-admin-text-muted mt-1 font-semibold leading-relaxed">{toast.message}</p>
            {toast.description && (
              <p className="text-[10px] text-admin-text-muted mt-1 font-medium leading-relaxed">{toast.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
