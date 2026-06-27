import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, X, FolderOpen, ChevronLeft, ChevronRight, PlusCircle, MinusCircle } from 'lucide-react';
import { productService } from '../services/productService';
import { variantService } from '../services/variantService';
import { usePagination } from '../hooks/usePagination';

// Helper to remove Vietnamese diacritics and generate uppercase SKU
const generateSkuFromName = (name) => {
  if (!name) return '';
  let str = name.toString();

  // Remove Vietnamese accents
  str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
  str = str.replace(/[èéẹẻẽêềếệểễ]/g, "e");
  str = str.replace(/[ìíịỉĩ]/g, "i");
  str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
  str = str.replace(/[ùúụủũưừứựửữ]/g, "u");
  str = str.replace(/[ỳýỵỷỹ]/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, "A");
  str = str.replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, "E");
  str = str.replace(/[ÌÍỊỈĨ]/g, "I");
  str = str.replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, "O");
  str = str.replace(/[ÙÚỤỦUƯỪỨỰỬỮ]/g, "U");
  str = str.replace(/[ỲÝỴỶỸ]/g, "Y");
  str = str.replace(/Đ/g, "D");

  // Remove special characters, keep letters, numbers, spaces, hyphens
  str = str.replace(/[^A-Za-z0-9\s\-]/g, '');

  // Replace multiple spaces/hyphens with a single hyphen
  str = str.replace(/[\s\-]+/g, '-');

  return str.toUpperCase().trim().replace(/^-+|-+$/g, '');
};

export default function AdminProductVariants() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('0');
  const [variantImage, setVariantImage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Dynamic attributes list [{ key: '', value: '' }]
  const [attributes, setAttributes] = useState([]);

  const [imageInputMethod, setImageInputMethod] = useState('url'); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);

  // Load products and variants
  const loadData = () => {
    setLoading(true);
    Promise.all([
      productService.getAll(),
      variantService.getAll()
    ])
      .then(([productsData, variantsData]) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
        setVariants(Array.isArray(variantsData) ? variantsData : []);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu biến thể:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProductById = (id) => {
    return products.find(p => p.id === id);
  };

  const handleOpenModal = (v = null) => {
    if (v) {
      setEditingVariant(v);
      setSelectedProductId(v.productId.toString());
      setVariantPrice(v.price.toString());
      setVariantStock(v.totalStock.toString());
      setVariantImage(v.imageId || '');
      setIsActive(v.isActive ?? true);

      let parsedAttributes = {};
      try {
        parsedAttributes = v.attributes ? JSON.parse(v.attributes) : {};
      } catch (e) {
        console.error("Lỗi parse attributes", e);
      }

      const attrList = Object.entries(parsedAttributes)
        .filter(([key]) => key !== 'SKU')
        .map(([key, value]) => ({ key, value }));
      // muốn hiện sẵn thì vô đây
      if (attrList.length === 0) {
        attrList.push({ key: 'Màu sắc', value: '' });
        attrList.push({ key: 'Dung Lượng RAM - ROM', value: '' });
      }
      setAttributes(attrList);
    } else {
      setEditingVariant(null);
      setSelectedProductId(products[0]?.id?.toString() || '');
      setVariantPrice('');
      setVariantStock('0');
      setVariantImage('');
      setIsActive(true);
      setAttributes([
        { key: 'Màu sắc', value: '' },
        { key: 'Dung Lượng RAM - ROM', value: '' }
      ]);
    }
    setShowModal(true);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index) => {
    const updated = attributes.filter((_, i) => i !== index);
    setAttributes(updated.length > 0 ? updated : [{ key: '', value: '' }]);
  };

  const handleAttributeChange = (index, field, val) => {
    const updated = [...attributes];
    updated[index][field] = val;
    setAttributes(updated);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        setVariantImage(finalUrl);
        alert('Tải ảnh lên thành công!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải ảnh lên.');
    } finally {
      setUploading(false);
    }
  };

  // Auto-calculated fields
  const selectedProduct = getProductById(parseInt(selectedProductId));
  const attributeValuesStr = attributes.map(a => a.value.trim()).filter(Boolean).join(' ');
  const generatedVariantName = selectedProduct ? (attributeValuesStr ? `${selectedProduct.name} ${attributeValuesStr}` : selectedProduct.name) : '';
  const generatedSku = generateSkuFromName(generatedVariantName);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Vui lòng chọn sản phẩm hợp lệ!');
      return;
    }

    // Check duplicate variant configuration for this product
    const duplicate = variants.find(v => {
      if (v.productId !== selectedProduct.id) return false;
      if (editingVariant && v.id === editingVariant.id) return false;

      let parsedAttr = {};
      try { parsedAttr = v.attributes ? JSON.parse(v.attributes) : {}; } catch (e) { }

      // Compare all non-SKU attributes
      const currentAttrs = {};
      attributes.forEach(a => {
        if (a.key.trim() && a.value.trim()) {
          currentAttrs[a.key.trim().toLowerCase()] = a.value.trim().toLowerCase();
        }
      });

      const dbAttrs = {};
      Object.entries(parsedAttr).forEach(([k, val]) => {
        if (k !== 'SKU') {
          dbAttrs[k.toLowerCase()] = String(val).toLowerCase();
        }
      });

      const currentKeys = Object.keys(currentAttrs);
      const dbKeys = Object.keys(dbAttrs);

      if (currentKeys.length !== dbKeys.length) return false;
      return currentKeys.every(k => currentAttrs[k] === dbAttrs[k]);
    });

    if (duplicate) {
      alert(`Biến thể với cấu hình này đã tồn tại cho sản phẩm này!`);
      return;
    }

    // Price fallback logic
    let priceVal = parseFloat(variantPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      priceVal = selectedProduct.basePrice || selectedProduct.price || 0;
    }

    const attributesObj = {};
    attributes.forEach(a => {
      if (a.key.trim() && a.value.trim()) {
        attributesObj[a.key.trim()] = a.value.trim();
      }
    });
    if (generatedSku) {
      attributesObj["SKU"] = generatedSku;
    }

    const payload = {
      name: generatedVariantName,
      price: priceVal,
      totalStock: parseInt(variantStock) || 0,
      productId: selectedProduct.id,
      imageId: variantImage,
      attributes: JSON.stringify(attributesObj),
      isActive: isActive
    };

    try {
      if (editingVariant) {
        await variantService.update(editingVariant.id, payload);
        alert('Cập nhật biến thể thành công!');
      } else {
        await variantService.create(payload);
        alert('Thêm biến thể mới thành công!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Lưu biến thể thất bại:', err);
      alert('Có lỗi xảy ra: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biến thể này?')) {
      try {
        await variantService.delete(id);
        alert('Xóa thành công!');
        loadData();
      } catch (err) {
        console.error(err);
        alert('Không thể xóa biến thể này. Có thể nó đang nằm trong giỏ hàng hoặc đơn hàng.');
      }
    }
  };

  // Search filtering
  const filteredVariants = variants.filter(v => {
    const product = getProductById(v.productId);
    const prodName = product ? product.name.toLowerCase() : '';
    const varName = v.name ? v.name.toLowerCase() : '';
    let sku = '';
    try {
      const parsed = v.attributes ? JSON.parse(v.attributes) : {};
      sku = (parsed["SKU"] || '').toLowerCase();
    } catch (e) { }

    const query = searchTerm.toLowerCase();
    return prodName.includes(query) || varName.includes(query) || sku.includes(query);
  });

  // Pagination hook
  const {
    currentData: paginatedVariants,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredVariants, 10);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Quản lý Biến thể({variants.length}) </h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Quản lý SKU, thông số, kích thước, màu sắc và tồn kho của sản phẩm</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm theo sản phẩm, biến thể, SKU..."
              className="w-full pl-11 pr-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-medium text-admin-text-main placeholder-admin-text-muted"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                goToPage(1);
              }}
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>Thêm biến thể</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md overflow-hidden mb-8 p-6 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted w-16">ID</th>
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted w-24">Hình ảnh</th>
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted">Sản phẩm gốc</th>
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted">Mã SKU</th>
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted">Thông số biến thể</th>
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted text-right">Giá bán</th>
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted text-center">Tồn kho</th>
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted text-center">Trạng thái</th>
                <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {paginatedVariants.length > 0 ? (
                paginatedVariants.map((v) => {
                  const product = getProductById(v.productId);
                  let parsedAttr = {};
                  try { parsedAttr = v.attributes ? JSON.parse(v.attributes) : {}; } catch (e) { }
                  const sku = parsedAttr["SKU"] || generateSkuFromName(v.name);

                  return (
                    <tr key={v.id} className="hover:bg-admin-bg transition-colors group">
                      <td className="px-4 py-4">
                        <span className="text-admin-text-muted font-bold">#{v.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-14 h-14 rounded-md bg-admin-bg flex items-center justify-center overflow-hidden border border-admin-border p-1">
                          {v.imageId ? (
                            <img src={v.imageId} alt="Variant" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="text-admin-text-muted" size={20} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-admin-text-main">{product ? product.name : `Sản phẩm #${v.productId}`}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {sku}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(parsedAttr)
                            .filter(([key]) => key !== 'SKU')
                            .map(([key, val]) => (
                              <span key={key} className="text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                <strong className="text-gray-500">{key}:</strong> {String(val)}
                              </span>
                            ))
                          }
                          {Object.keys(parsedAttr).filter(k => k !== 'SKU').length === 0 && (
                            <span className="text-xs text-gray-400 italic">Mặc định</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-admin-text-main text-base">{v.price.toLocaleString('vi-VN')} ₫</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${v.totalStock > 0 ? 'bg-success/10 text-success' : 'bg-admin-danger/10 text-admin-danger'}`}>
                          {v.totalStock > 0 ? `Còn ${v.totalStock}` : 'Hết hàng'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${v.isActive ? 'bg-success/10 text-success' : 'bg-admin-danger/10 text-admin-danger'}`}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(v)}
                            className="p-2 text-admin-text-muted hover:text-warning hover:bg-warning/10 rounded-md transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-2 text-admin-text-muted hover:text-admin-danger hover:bg-admin-danger/10 rounded-md transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-20 text-center bg-white">
                    <div className="flex flex-col items-center justify-center text-admin-text-muted">
                      <FolderOpen size={64} strokeWidth={1} className="mb-4 opacity-50" />
                      <p className="text-lg font-bold text-admin-text-main">Không tìm thấy biến thể nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-admin-border pt-4">
            <div className="text-sm font-bold text-admin-text-muted">
              Hiển thị {startIndex}-{endIndex} trên {totalItems} biến thể
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} /> TRƯỚC
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                SAU <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md w-full max-w-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-admin-border flex justify-between items-center bg-admin-bg">
              <h3 className="text-xl font-bold text-admin-text-main">{editingVariant ? 'Cập nhật Biến thể' : 'Thêm Biến thể mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-admin-text-muted hover:text-admin-danger transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Product Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Sản phẩm gốc *</label>
                  <select
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white font-medium"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Variant Name & SKU Preview */}
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Tên biến thể (Tự động sinh)</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full px-4 py-3 border border-admin-border bg-admin-bg rounded-md outline-none text-admin-text-main font-medium select-all"
                    value={generatedVariantName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Mã SKU (Tự động sinh)</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full px-4 py-3 border border-admin-border bg-admin-bg rounded-md outline-none text-red-600 font-mono font-bold select-all"
                    value={generatedSku}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Giá bán (Để trống = Theo sản phẩm gốc)</label>
                  <input
                    type="number"
                    placeholder={selectedProduct ? `Giá gốc: ${selectedProduct.basePrice?.toLocaleString('vi-VN')} ₫` : 'Giá bán'}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main font-medium"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Tồn kho ban đầu</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main font-medium bg-white"
                    value={variantStock}
                    onChange={(e) => setVariantStock(e.target.value)}
                    required
                  />
                </div>

                {/* Is Active */}
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-admin-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-admin-text-main cursor-pointer">Hoạt động (Is Active)</label>
                </div>

                {/* Dynamic Attributes section */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-bold text-admin-text-main">Thuộc tính của biến thể (Dynamic Attributes)</label>
                    <button
                      type="button"
                      onClick={handleAddAttribute}
                      className="text-xs font-bold text-primary hover:text-admin-primary-hover flex items-center gap-1"
                    >
                      <PlusCircle size={14} /> Thêm thuộc tính
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 border border-admin-border rounded-md p-3 bg-gray-50">
                    {attributes.map((attr, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white p-2.5 rounded-md border border-admin-border">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Tên thuộc tính (VD: Màu sắc)"
                            className="w-full px-3 py-1.5 border border-admin-border rounded-md text-xs font-semibold outline-none focus:border-primary"
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
                          className="text-admin-danger hover:text-red-700 transition-colors p-1"
                          title="Xóa thuộc tính"
                        >
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Upload/URL Input */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Hình ảnh biến thể</label>
                  <div className="flex border-b border-admin-border mb-3">
                    <button
                      type="button"
                      onClick={() => setImageInputMethod('upload')}
                      className={`py-2 px-4 font-bold text-sm border-b-2 transition-colors ${imageInputMethod === 'upload' ? 'border-primary text-primary' : 'border-transparent text-admin-text-muted'}`}
                    >
                      Tải lên từ máy
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMethod('url')}
                      className={`py-2 px-4 font-bold text-sm border-b-2 transition-colors ${imageInputMethod === 'url' ? 'border-primary text-primary' : 'border-transparent text-admin-text-muted'}`}
                    >
                      Nhập liên kết URL
                    </button>
                  </div>

                  {imageInputMethod === 'upload' ? (
                    <div className="relative border-2 border-dashed border-admin-border rounded-md p-6 flex flex-col items-center justify-center bg-admin-bg/10 h-28 cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.svg"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {uploading ? (
                        <span className="text-xs font-bold text-primary">Đang tải ảnh...</span>
                      ) : (
                        <span className="text-xs font-bold text-admin-text-muted">Nhấp để tải lên ảnh biến thể</span>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main"
                      placeholder="Dán link ảnh biến thể (https://...)"
                      value={variantImage}
                      onChange={(e) => setVariantImage(e.target.value)}
                    />
                  )}
                  {variantImage && (
                    <div className="flex items-center gap-3 mt-3 p-2 border border-admin-border rounded-md w-fit bg-gray-50">
                      <img src={variantImage} alt="Preview" className="w-12 h-12 object-contain rounded" />
                      <span className="text-xs text-admin-text-muted font-bold">Hình ảnh xem trước</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory history (Mocked table as requested by UI design) */}
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

              <div className="flex gap-3 justify-end pt-4 border-t border-admin-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-admin-bg text-admin-text-main rounded-md font-bold hover:bg-admin-border transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95"
                >
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
