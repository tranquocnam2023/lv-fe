import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, HelpCircle } from 'lucide-react';
import { brandService } from '../../../services/brandService';
import { productService } from '../../../services/productService';
import { generateBrandOrCategoryCode, generateSlug } from '../../../utils/codeGenerator';

// Subcomponents
import BrandTable from './components/BrandTable';
import BrandModal from './components/BrandModal';
import BrandToast from './components/BrandToast';

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
  const [inlineUploadingBrandId, setInlineUploadingBrandId] = useState(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const validExtensions = ['image/svg+xml', 'image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      return showToast('warning', 'Định dạng file không hợp lệ', 'Hệ thống chỉ hỗ trợ SVG, WebP, PNG, JPG/JPEG.');
    }
    
    if (file.size > 2 * 1024 * 1024) {
      return showToast('warning', 'File quá lớn (>2MB)', 'Vui lòng chọn ảnh nhỏ hơn.');
    }
    
    setUploading(true);
    try {
      const res = await productService.uploadLocalImage(file, 'brands');
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
    
    setExpandedBrands(prev => ({ ...prev, [brandId]: !isCurrentlyExpanded }));

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

  const handleDeleteLogo = async (brand) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa logo của thương hiệu "${brand.name}"?`)) return;

    try {
      const payload = {
        name: brand.name,
        slug: brand.slug,
        brandCode: brand.brandCode,
        description: brand.description || '',
        imageUrl: '',
        isActive: brand.isActive
      };
      await brandService.update(brand.id, payload);
      showToast('success', 'Xóa logo thương hiệu thành công!');
      fetchBrands();
    } catch (err) {
      console.error(err);
      const parsed = parseError(err);
      showToast('error', 'Lỗi xóa logo', parsed.message);
    }
  };

  const handleUploadLogoInline = async (e, brand) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['image/svg+xml', 'image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      return showToast('warning', 'Định dạng file không hợp lệ', 'Hệ thống chỉ hỗ trợ SVG, WebP, PNG, JPG/JPEG.');
    }
    
    if (file.size > 2 * 1024 * 1024) {
      return showToast('warning', 'File quá lớn (>2MB)', 'Vui lòng chọn ảnh nhỏ hơn.');
    }

    setInlineUploadingBrandId(brand.id);
    try {
      const res = await productService.uploadLocalImage(file, 'brands');
      if (res && res.url) {
        let finalUrl = res.url;
        if (finalUrl.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
          const hostBase = apiBase.replace('/api', '');
          finalUrl = `${hostBase}${finalUrl}`;
        }
        
        const payload = {
          name: brand.name,
          slug: brand.slug,
          brandCode: brand.brandCode,
          description: brand.description || '',
          imageUrl: finalUrl,
          isActive: brand.isActive
        };
        await brandService.update(brand.id, payload);
        showToast('success', 'Cập nhật logo thương hiệu thành công!');
        fetchBrands();
      }
    } catch (err) {
      console.error(err);
      const parsed = parseError(err);
      showToast('error', 'Lỗi cập nhật logo', parsed.message);
    } finally {
      setInlineUploadingBrandId(null);
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
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 whitespace-nowrap cursor-pointer border-0"
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

      {/* Main Table Component */}
      <BrandTable
        brands={brands}
        loading={loading}
        pageSize={pageSize}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        totalPages={totalPages}
        expandedBrands={expandedBrands}
        brandStats={brandStats}
        loadingStats={loadingStats}
        inlineUploadingBrandId={inlineUploadingBrandId}
        handleToggleExpand={handleToggleExpand}
        handleToggleActive={handleToggleActive}
        handleDeleteLogo={handleDeleteLogo}
        handleUploadLogoInline={handleUploadLogoInline}
        handleOpenModal={handleOpenModal}
        handleDelete={handleDelete}
        onRedirectToProducts={onRedirectToProducts}
        onRedirectToCreateProduct={onRedirectToCreateProduct}
      />

      {/* Form Dialog Modal Component */}
      <BrandModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingBrand={editingBrand}
        saving={saving}
        uploading={uploading}
        isCodeEditable={isCodeEditable}
        setIsCodeEditable={setIsCodeEditable}
        catErrorMessage={catErrorMessage}
        formData={formData}
        setFormData={setFormData}
        formError={formError}
        handleImageUpload={handleImageUpload}
        handleSave={handleSave}
      />

      {/* Custom Alert Toast Notification */}
      <BrandToast toast={toast} />
    </div>
  );
}
