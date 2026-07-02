import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { productService } from '../services/productService';
import { variantService } from '../services/variantService';
import { usePagination } from '../hooks/usePagination';

// Subcomponents
import VariantTable from './admin-variants/components/VariantTable';
import VariantModal from './admin-variants/components/VariantModal';

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
  str = str.replace(/[^A-Za-z0-9\s-]/g, '');

  // Replace multiple spaces/hyphens with a single hyphen
  str = str.replace(/[\s-]+/g, '-');

  return str.toUpperCase().trim().replace(/^-+|-+$/g, '');
};

export default function AdminProductVariants() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Dynamic specs override list [{ key: '', value: '' }]
  const [specsOverride, setSpecsOverride] = useState([]);

  const [imageInputMethod, setImageInputMethod] = useState('url'); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const [inlineUploadingVariantId, setInlineUploadingVariantId] = useState(null);

  // Load products and variants
  const loadData = () => {
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
      });
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
      
      if (attrList.length === 0) {
        attrList.push({ key: 'Màu sắc', value: '' });
        attrList.push({ key: 'Dung Lượng RAM - ROM', value: '' });
      }
      setAttributes(attrList);

      let parsedSpecsOverride = {};
      try {
        parsedSpecsOverride = v.specsOverride ? JSON.parse(v.specsOverride) : {};
      } catch (e) {
        console.error("Lỗi parse specsOverride", e);
      }
      const specsOverrideList = Object.entries(parsedSpecsOverride).map(([key, value]) => ({ key, value }));
      setSpecsOverride(specsOverrideList);
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
      setSpecsOverride([]);
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

  const handleAddSpecOverride = () => {
    setSpecsOverride([...specsOverride, { key: '', value: '' }]);
  };

  const handleRemoveSpecOverride = (index) => {
    const updated = specsOverride.filter((_, i) => i !== index);
    setSpecsOverride(updated);
  };

  const handleSpecOverrideChange = (index, field, val) => {
    const updated = [...specsOverride];
    updated[index][field] = val;
    setSpecsOverride(updated);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await productService.uploadLocalImage(file, 'variants');
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
      try { parsedAttr = v.attributes ? JSON.parse(v.attributes) : {}; } catch { /* empty */ }

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

    const specsOverrideObj = {};
    specsOverride.forEach(s => {
      if (s.key.trim() && s.value.trim()) {
        specsOverrideObj[s.key.trim()] = s.value.trim();
      }
    });

    const payload = {
      name: generatedVariantName,
      price: priceVal,
      totalStock: parseInt(variantStock) || 0,
      productId: selectedProduct.id,
      imageId: variantImage,
      attributes: JSON.stringify(attributesObj),
      specsOverride: Object.keys(specsOverrideObj).length > 0 ? JSON.stringify(specsOverrideObj) : null,
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

  const handleUploadImageInline = async (e, variant) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['image/svg+xml', 'image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      return alert('Hệ thống chỉ hỗ trợ SVG, WebP, PNG, JPG/JPEG.');
    }
    
    if (file.size > 2 * 1024 * 1024) {
      return alert('Vui lòng chọn ảnh nhỏ hơn 2MB.');
    }

    setInlineUploadingVariantId(variant.id);
    try {
      const res = await productService.uploadLocalImage(file, 'variants');
      if (res && res.url) {
        let finalUrl = res.url;
        if (finalUrl.startsWith('/')) {
          const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
          const hostBase = apiBase.replace('/api', '');
          finalUrl = `${hostBase}${finalUrl}`;
        }
        
        const payload = {
          name: variant.name,
          price: variant.price,
          totalStock: variant.totalStock,
          productId: variant.productId,
          imageId: finalUrl,
          attributes: variant.attributes,
          specsOverride: variant.specsOverride,
          isActive: variant.isActive
        };
        await variantService.update(variant.id, payload);
        loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi tải ảnh: ' + err.message);
    } finally {
      setInlineUploadingVariantId(null);
    }
  };

  const handleDeleteImageInline = async (e, variant) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hình ảnh của biến thể này?`)) return;

    try {
      const payload = {
        name: variant.name,
        price: variant.price,
        totalStock: variant.totalStock,
        productId: variant.productId,
        imageId: '',
        attributes: variant.attributes,
        specsOverride: variant.specsOverride,
        isActive: variant.isActive
      };
      await variantService.update(variant.id, payload);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Lỗi xóa hình ảnh: ' + err.message);
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
    } catch {
      /* ignore invalid JSON attributes */
    }

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
          <h2 className="text-2xl font-bold text-admin-text-main">Quản lý Biến thể ({variants.length})</h2>
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
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 whitespace-nowrap cursor-pointer border-0"
          >
            <Plus size={18} />
            <span>Thêm biến thể</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <VariantTable
        paginatedVariants={paginatedVariants}
        getProductById={getProductById}
        generateSkuFromName={generateSkuFromName}
        inlineUploadingVariantId={inlineUploadingVariantId}
        handleDeleteImageInline={handleDeleteImageInline}
        handleUploadImageInline={handleUploadImageInline}
        handleOpenModal={handleOpenModal}
        handleDelete={handleDelete}
        totalPages={totalPages}
        currentPage={currentPage}
        goToPage={goToPage}
        prevPage={prevPage}
        nextPage={nextPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
      />

      {/* CRUD Modal */}
      {showModal && (
        <VariantModal
          setShowModal={setShowModal}
          editingVariant={editingVariant}
          handleSave={handleSave}
          products={products}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          generatedVariantName={generatedVariantName}
          generatedSku={generatedSku}
          variantPrice={variantPrice}
          setVariantPrice={setVariantPrice}
          selectedProduct={selectedProduct}
          variantStock={variantStock}
          setVariantStock={setVariantStock}
          isActive={isActive}
          setIsActive={setIsActive}
          handleAddAttribute={handleAddAttribute}
          attributes={attributes}
          handleAttributeChange={handleAttributeChange}
          handleRemoveAttribute={handleRemoveAttribute}
          handleAddSpecOverride={handleAddSpecOverride}
          specsOverride={specsOverride}
          handleSpecOverrideChange={handleSpecOverrideChange}
          handleRemoveSpecOverride={handleRemoveSpecOverride}
          imageInputMethod={imageInputMethod}
          setImageInputMethod={setImageInputMethod}
          handleFileChange={handleFileChange}
          uploading={uploading}
          variantImage={variantImage}
          setVariantImage={setVariantImage}
        />
      )}
    </div>
  );
}
