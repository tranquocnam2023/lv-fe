import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, UploadCloud, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { brandService } from '../services/brandService';
import { productService } from '../services/productService';
import { variantService } from '../services/variantService';
import { generateProductCode } from '../utils/codeGenerator';
import PriceInput from '../components/PriceInput';

const parseRamRom = (value) => {
  if (!value) return { ram: '', rom: '' };
  const parts = value.split('-');
  const ramPart = parts[0] || '';
  const romPart = parts[1] || '';
  const ram = ramPart.replace(/[^0-9]/g, '');
  const rom = romPart.replace(/[^0-9]/g, '');
  return { ram, rom };
};

export default function AdminUpdateProduct({ productId, onBack, onCreateNew }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    productCode: '',
    categoryId: '',
    brandId: '',
    description: '',
    basePrice: 0,
    originalPrice: 0,
    isActive: true,
    isFeatured: false,
    images: [], // { url, isMain, order }
    variants: [] // { id?, tempId, name, price, totalStock, isActive, attr1Value, attr2Value }
  });

  const [attr1Name, setAttr1Name] = useState('Màu sắc');
  const [attr2Name, setAttr2Name] = useState('Phiên bản');
  const [hasAttr2, setHasAttr2] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [brandsData, catsData, productData] = await Promise.all([
          brandService.getAll(),
          categoryService.getAll(),
          productService.getById(productId)
        ]);

        if (brandsData) setBrands(brandsData);
        if (catsData) setCategories(catsData);

        if (productData) {
          // Fetch variants for this product
          let productVariants = [];
          try {
            const allVars = await variantService.getAll(productId);
            if (Array.isArray(allVars)) {
              let a1Name = 'Màu sắc';
              let a2Name = 'Phiên bản';
              let hA2 = false;
              let firstParse = true;

              productVariants = allVars.filter(v => v.productId === productId).map((v, i) => {
                let attr1Val = '';
                let attr2Val = '';
                if (v.attributes) {
                  try {
                    const parsed = JSON.parse(v.attributes);
                    const keys = Object.keys(parsed);
                    if (keys.length > 0) {
                      if (firstParse) {
                        a1Name = keys[0];
                        if (keys.length > 1) {
                          a2Name = keys[1];
                          hA2 = true;
                        }
                        firstParse = false;
                      }
                      attr1Val = parsed[a1Name] || parsed[keys[0]] || '';
                      if (hA2) attr2Val = parsed[a2Name] || (keys.length > 1 ? parsed[keys[1]] : '') || '';
                    }
                  } catch (err) {
                    console.debug(err);
                  }
                }
                return {
                  id: v.id,
                  tempId: Date.now() + i,
                  name: v.name,
                  price: v.price,
                  totalStock: v.totalStock,
                  isActive: v.isActive !== undefined ? v.isActive : true,
                  attr1Value: attr1Val,
                  attr2Value: attr2Val,
                  imageId: v.imageId || ''
                };
              });

              if (!firstParse) {
                setAttr1Name(a1Name);
                setAttr2Name(a2Name);
                setHasAttr2(hA2);
              }
            }
          } catch (err) {
            console.debug(err);
          }

          // Parse images
          let loadedImages = [];
          if (productData.mainImage) {
            loadedImages.push({ url: productData.mainImage, isMain: true, order: 0 });
          }
          if (productData.images) {
            try {
              const otherImgs = JSON.parse(productData.images);
              if (Array.isArray(otherImgs)) {
                otherImgs.forEach((imgUrl, idx) => {
                  if (imgUrl !== productData.mainImage) {
                    loadedImages.push({ url: imgUrl, isMain: false, order: idx + 1 });
                  }
                });
              }
            } catch (err) {
              console.debug(err);
            }
          }

          setFormData({
            name: productData.name || '',
            slug: productData.slug || '',
            productCode: productData.productCode || '',
            categoryId: productData.categoryId || '',
            brandId: productData.brandId || '',
            description: productData.description || '',
            basePrice: productData.basePrice || 0,
            originalPrice: productData.originalPrice || 0,
            isActive: productData.isActive !== undefined ? productData.isActive : true,
            isFeatured: productData.isFeatured || false,
            images: loadedImages,
            variants: productVariants
          });
        }
      } catch (e) {
        console.error("Lỗi tải dữ liệu sản phẩm", e);
        alert("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchData();
  }, [productId]);

  // Handle auto slug with Vietnamese diacritic removal
  const generateSlug = (text) => {
    let str = text.toString().toLowerCase();
    str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
    str = str.replace(/[èéẹẻẽêềếệểễ]/g, "e");
    str = str.replace(/[ìíịỉĩ]/g, "i");
    str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
    str = str.replace(/[ùúụủũưừứựửữ]/g, "u");
    str = str.replace(/[ỳýỵỷỹ]/g, "y");
    str = str.replace(/đ/g, "d");
    return str
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData({
      ...formData,
      name: newName,
      slug: generateSlug(newName)
    });
  };

  // Hình ảnh
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newImages = [...formData.images];
      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn (>2MB).`);
          continue;
        }
        const res = await productService.uploadLocalImage(file);
        if (res && res.url) {
          let finalUrl = res.url;
          if (finalUrl.startsWith('/')) {
            const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
            const hostBase = apiBase.replace('/api', '');
            finalUrl = `${hostBase}${finalUrl}`;
          }
          newImages.push({
            url: finalUrl,
            isMain: newImages.length === 0, // Auto set first image as main
            order: newImages.length
          });
        }
      }
      setFormData({ ...formData, images: newImages });
    } catch (e) {
      alert("Lỗi tải ảnh: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const setMainImage = (index) => {
    const newImages = formData.images.map((img, i) => ({
      ...img,
      isMain: i === index
    }));
    setFormData({ ...formData, images: newImages });
  };

  const updateImageOrder = (index, newOrder) => {
    const newImages = [...formData.images];
    newImages[index].order = parseInt(newOrder) || 0;
    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    if (newImages.length > 0 && formData.images[index].isMain) {
      newImages[0].isMain = true;
    }
    setFormData({ ...formData, images: newImages });
  };

  // Biến thể
  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { tempId: Date.now(), name: '', price: '', totalStock: 0, isActive: true, attr1Value: '', attr2Value: '', imageId: '' }
      ]
    });
  };

  const removeVariant = async (index) => {
    const v = formData.variants[index];
    if (v.id) {
      if (!window.confirm("Biến thể này đã có trong CSDL. Bạn có chắc muốn xóa?")) return;
      try {
        await variantService.delete(v.id);
      } catch (e) {
        alert("Lỗi xóa biến thể: " + e.message);
        return;
      }
    }
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    });
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSaveVariant = async (index) => {
    const v = formData.variants[index];
    if (!v.name) return alert("Vui lòng nhập tên biến thể (SKU)");
    if (!v.attr1Value) return alert(`Vui lòng nhập ${attr1Name || 'Thuộc tính 1'}`);
    if (hasAttr2 && !v.attr2Value) return alert(`Vui lòng nhập ${attr2Name || 'Thuộc tính 2'}`);
    if (v.price && (v.price < 1000 || v.price > 500000000)) {
      return alert("Giá bán của biến thể không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }

    try {
      const attrObj = {};
      if (attr1Name.trim() && v.attr1Value) attrObj[attr1Name.trim()] = v.attr1Value;
      if (hasAttr2 && attr2Name.trim() && v.attr2Value) attrObj[attr2Name.trim()] = v.attr2Value;

      const vPayload = {
        name: v.name,
        price: v.price !== '' ? Number(v.price) : Number(formData.basePrice),
        totalStock: Number(v.totalStock) || 0,
        isActive: v.isActive,
        productId: productId,
        attributes: JSON.stringify(attrObj),
        imageId: v.imageId || ''
      };

      if (v.id) {
        await variantService.update(v.id, vPayload);
        alert('Cập nhật biến thể thành công!');
      } else {
        const res = await variantService.create(vPayload);
        // Cập nhật ID biến thể mới vào state để không bị tạo trùng
        const newVariants = [...formData.variants];
        newVariants[index].id = res?.id || v.id;
        setFormData({ ...formData, variants: newVariants });
        alert('Tạo biến thể mới thành công!');
      }
    } catch (e) {
      alert("Lỗi lưu biến thể: " + e.message);
    }
  };

  // Lưu
  const handleSave = async (actionType = 'BACK') => { // 'BACK', 'STAY', 'NEW'
    if (!formData.name) return alert("Vui lòng nhập tên sản phẩm.");
    if (hasAttr2 && attr1Name.trim().toLowerCase() === attr2Name.trim().toLowerCase()) {
      return alert("Trùng lặp thuộc tính! Vui lòng đặt tên hai thuộc tính khác nhau.");
    }
    // ràng buộc thuộc tính màu sắc và dung lượng ram rom
    //const checkInvalid = (v) => (attr1Name.includes('RAM') && v.attr1Value !== '12GB - 256GB') || (hasAttr2 && attr2Name.includes('RAM') && v.attr2Value !== '12GB - 256GB');
    //if (formData.variants.some(checkInvalid)) return alert("Ràng buộc màu sắc và dung lượng RAM không được vi phạm!");
    
    if (formData.basePrice < 1000 || formData.basePrice > 500000000) {
      return alert("Giá bán không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }
    if (formData.originalPrice && (formData.originalPrice < 1000 || formData.originalPrice > 500000000)) {
      return alert("Giá gốc không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }
    
    // Check variant prices
    if (formData.variants.length > 0) {
      for (let i = 0; i < formData.variants.length; i++) {
        const vPrice = formData.variants[i].price;
        if (vPrice && (vPrice < 1000 || vPrice > 500000000)) {
          return alert(`Giá bán của biến thể "${formData.variants[i].name || `Biến thể ${i+1}`}" không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)`);
        }
      }
    }

    setSaving(true);
    try {
      // Sort images by order before saving
      const sortedImages = [...formData.images].sort((a, b) => a.order - b.order);
      const mainImage = sortedImages.find(i => i.isMain)?.url || "";
      const otherImages = sortedImages.filter(i => !i.isMain).map(i => i.url);

      const generatedCode = formData.productCode.trim() || generateProductCode(formData.name, 20);

      const payload = {
        name: formData.name,
        slug: formData.slug,
        productCode: generatedCode,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        originalPrice: formData.originalPrice !== '' ? Number(formData.originalPrice) : null,
        totalStock: formData.variants.length > 0 ? formData.variants.reduce((acc, v) => acc + (Number(v.totalStock) || 0), 0) : 0,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        categoryId: parseInt(formData.categoryId) || 1,
        brandId: parseInt(formData.brandId) || null,
        thumbnailImage: mainImage,
        mainImage: mainImage,
        images: JSON.stringify(otherImages)
      };

      let targetProductId = productId;

      if (actionType === 'NEW') {
        // Create new product
        const res = await productService.create(payload);
        targetProductId = res?.id || (await (async () => {
          const allProds = await productService.getAll();
          return allProds.find(p => p.slug === formData.slug)?.id;
        })());

        if (targetProductId && formData.variants.length > 0) {
          for (const v of formData.variants) {
            const attrObj = {};
            if (attr1Name.trim() && v.attr1Value) attrObj[attr1Name.trim()] = v.attr1Value;
            if (hasAttr2 && attr2Name.trim() && v.attr2Value) attrObj[attr2Name.trim()] = v.attr2Value;

            await variantService.create({
              name: v.name,
              price: v.price !== '' ? Number(v.price) : Number(formData.basePrice),
              totalStock: Number(v.totalStock) || 0,
              isActive: v.isActive,
              productId: targetProductId,
              attributes: JSON.stringify(attrObj),
              imageId: v.imageId || ''
            });
          }
        }
        alert('Tạo sản phẩm mới thành công!');
        onCreateNew();
      } else {
        // Update existing product
        await productService.update(productId, payload);

        // Update or create variants
        for (const v of formData.variants) {
          const attrObj = {};
          if (attr1Name.trim() && v.attr1Value) attrObj[attr1Name.trim()] = v.attr1Value;
          if (hasAttr2 && attr2Name.trim() && v.attr2Value) attrObj[attr2Name.trim()] = v.attr2Value;

          const vPayload = {
            name: v.name,
            price: v.price !== '' ? Number(v.price) : Number(formData.basePrice),
            totalStock: Number(v.totalStock) || 0,
            isActive: v.isActive,
            productId: productId,
            attributes: JSON.stringify(attrObj),
            imageId: v.imageId || ''
          };

          if (v.id) {
            await variantService.update(v.id, vPayload);
          } else {
            await variantService.create(vPayload);
          }
        }
        alert('Cập nhật sản phẩm thành công!');

        if (actionType === 'BACK') {
          onBack();
        } else if (actionType === 'STAY') {
          // Stay on page
        }
      }

    } catch (e) {
      let msg = typeof e === 'object' && e !== null ? (e.message || JSON.stringify(e)) : String(e);
      if (typeof e === 'object' && e.errors) {
        msg = JSON.stringify(e.errors);
      }
      if (typeof msg === 'string' && msg.toLowerCase().includes('mã này đã tồn tại')) {
        alert("Mã ProductCode đã tồn tại. Vui lòng kiểm tra lại.");
      } else {
        alert("Lỗi lưu sản phẩm: " + msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white rounded-full text-admin-text-muted hover:text-admin-text-main transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-admin-text-main">Cập nhật sản phẩm #{productId}</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave('STAY')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-admin-border text-admin-text-main rounded-md font-bold hover:bg-admin-bg transition-colors disabled:opacity-70 text-sm"
          >
            Lưu lại và tiếp tục
          </button>
          <button
            onClick={() => handleSave('NEW')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-admin-bg text-primary rounded-md font-bold hover:bg-admin-border transition-colors disabled:opacity-70 text-sm"
          >
            Lưu và thêm mới
          </button>
          <button
            onClick={() => handleSave('BACK')}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-colors disabled:opacity-70 text-sm"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Lưu lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* A. Thông tin cơ bản */}
          <div className="bg-white p-6 rounded-md border border-admin-border">
            <h3 className="text-lg font-bold text-admin-text-main mb-4">A. Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-admin-text-main mb-2">Tên sản phẩm *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main"
                  placeholder="Nhập tên sản phẩm..."
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-admin-text-main mb-2">Đường dẫn (Slug)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-admin-border bg-admin-bg rounded-md outline-none text-admin-text-muted"
                  placeholder="tu-dong-tao-tu-ten-san-pham"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-admin-text-main mb-2">Mã (ProductCode)</label>
                <input
                  type="text"
                  value={formData.productCode}
                  onChange={(e) => setFormData({...formData, productCode: e.target.value.toUpperCase().replace(/\s+/g, '')})}
                  className="w-full px-4 py-3 border border-admin-border rounded-md outline-none text-admin-text-main uppercase focus:border-primary"
                  placeholder="Để trống tự tạo..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Danh mục *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Thương hiệu</label>
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white"
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-admin-text-main mb-2">Mô tả chi tiết</label>
                <textarea
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main"
                  placeholder="Nhập mô tả sản phẩm..."
                />
              </div>
            </div>
          </div>

          {/* D. Biến thể */}
          <div className="bg-white p-6 rounded-md border border-admin-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-admin-text-main">D. Biến thể sản phẩm (Tùy chọn)</h3>
              <button
                onClick={addVariant}
                className="flex items-center gap-1 px-3 py-1.5 bg-admin-bg text-primary rounded-md text-sm font-bold hover:bg-admin-border transition-colors"
              >
                <Plus size={16} /> Thêm biến thể
              </button>
            </div>
            {formData.variants.length > 0 && (
              <div className="mb-4 p-4 bg-admin-bg rounded-md border border-admin-border">
                <h4 className="text-sm font-bold text-admin-text-main mb-3">Cấu hình Thuộc tính</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-admin-text-main mb-1">Thuộc tính 1 *</label>
                    <input
                      type="text"
                      value={attr1Name}
                      onChange={(e) => setAttr1Name(e.target.value)}
                      className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none focus:border-primary"
                      placeholder="VD: Màu sắc"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-admin-text-main">Thuộc tính 2</label>
                      {!hasAttr2 ? (
                        <button onClick={() => setHasAttr2(true)} className="text-[10px] text-primary font-bold">+ Thêm</button>
                      ) : (
                        <button onClick={() => setHasAttr2(false)} className="text-[10px] text-admin-danger font-bold">Xóa</button>
                      )}
                    </div>
                    {hasAttr2 && (
                      <input
                        type="text"
                        value={attr2Name}
                        onChange={(e) => setAttr2Name(e.target.value)}
                        className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none focus:border-primary"
                        placeholder="VD: Phiên bản"
                      />
                    )}
                  </div>
                </div>
                {hasAttr2 && attr1Name.trim().toLowerCase() === attr2Name.trim().toLowerCase() && (
                  <p className="text-xs text-admin-danger font-bold mt-2">Trùng lặp thuộc tính!</p>
                )}
              </div>
            )}

            {formData.variants.length === 0 ? (
              <p className="text-sm text-admin-text-muted italic">Chưa có biến thể nào. Sản phẩm sẽ sử dụng giá và tồn kho mặc định.</p>
            ) : (
              <div className="space-y-4">
                {formData.variants.map((variant, vIdx) => (
                  <div key={vIdx} className="p-4 border border-admin-border rounded-md bg-white relative hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 flex flex-col gap-4">
                        {/* Hàng 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-bold text-admin-text-main mb-1">Tên biến thể (SKU) *</label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateVariant(vIdx, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none focus:border-primary"
                              placeholder="VD: Đen - 256GB"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-admin-text-main mb-1">{attr1Name || 'Thuộc tính 1'} *</label>
                            {(attr1Name || '').trim().toLowerCase() === 'dung lượng ram - rom' ? (
                              <div className="flex items-center gap-1 border border-admin-border rounded-md px-2 bg-white h-9 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary w-fit">
                                <input
                                  type="number"
                                  placeholder="RAM"
                                  value={parseRamRom(variant.attr1Value).ram}
                                  onChange={(e) => {
                                    const { rom } = parseRamRom(variant.attr1Value);
                                    updateVariant(vIdx, 'attr1Value', `${e.target.value || '0'}GB - ${rom || '0'}GB`);
                                  }}
                                  className="w-10 border-none outline-none text-sm text-center bg-transparent p-0"
                                />
                                <span className="text-[10px] text-gray-400 font-bold shrink-0">GB</span>
                                <span className="text-gray-300 px-0.5 shrink-0">/</span>
                                <input
                                  type="number"
                                  placeholder="ROM"
                                  value={parseRamRom(variant.attr1Value).rom}
                                  onChange={(e) => {
                                    const { ram } = parseRamRom(variant.attr1Value);
                                    updateVariant(vIdx, 'attr1Value', `${ram || '0'}GB - ${e.target.value || '0'}GB`);
                                  }}
                                  className="w-14 border-none outline-none text-sm text-center bg-transparent p-0"
                                />
                                <span className="text-[10px] text-gray-400 font-bold shrink-0">GB</span>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={variant.attr1Value}
                                onChange={(e) => updateVariant(vIdx, 'attr1Value', e.target.value)}
                                className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none focus:border-primary"
                                placeholder="VD: Đen"
                              />
                            )}
                          </div>
                          {hasAttr2 && (
                            <div>
                              <label className="block text-xs font-bold text-admin-text-main mb-1">{attr2Name || 'Thuộc tính 2'} *</label>
                              {(attr2Name || '').trim().toLowerCase() === 'dung lượng ram - rom' ? (
                                <div className="flex items-center gap-1 border border-admin-border rounded-md px-2 bg-white h-9 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary w-fit">
                                  <input
                                    type="number"
                                    placeholder="RAM"
                                    value={parseRamRom(variant.attr2Value).ram}
                                    onChange={(e) => {
                                      const { rom } = parseRamRom(variant.attr2Value);
                                      updateVariant(vIdx, 'attr2Value', `${e.target.value || '0'}GB - ${rom || '0'}GB`);
                                    }}
                                    className="w-10 border-none outline-none text-sm text-center bg-transparent p-0"
                                  />
                                  <span className="text-[10px] text-gray-400 font-bold shrink-0">GB</span>
                                  <span className="text-gray-300 px-0.5 shrink-0">/</span>
                                  <input
                                    type="number"
                                    placeholder="ROM"
                                    value={parseRamRom(variant.attr2Value).rom}
                                    onChange={(e) => {
                                      const { ram } = parseRamRom(variant.attr2Value);
                                      updateVariant(vIdx, 'attr2Value', `${ram || '0'}GB - ${e.target.value || '0'}GB`);
                                    }}
                                    className="w-14 border-none outline-none text-sm text-center bg-transparent p-0"
                                  />
                                  <span className="text-[10px] text-gray-400 font-bold shrink-0">GB</span>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={variant.attr2Value}
                                  onChange={(e) => updateVariant(vIdx, 'attr2Value', e.target.value)}
                                  className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none focus:border-primary"
                                  placeholder="VD: 256GB"
                                />
                              )}
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-bold text-admin-text-main mb-1">Giá bán (VNĐ)</label>
                            <PriceInput
                              value={variant.price}
                              onChange={(val) => updateVariant(vIdx, 'price', val)}
                              className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none focus:border-primary"
                              placeholder="Để trống = Giá SP"
                            />
                          </div>
                        </div>

                        {/* Hàng 2 */}
                        <div className="flex flex-wrap items-end gap-6 border-t border-gray-100 pt-3">
                          <div>
                            <label className="block text-xs font-bold text-admin-text-main mb-1">Hình ảnh biến thể</label>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-md border border-admin-border flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                                {variant.imageId ? (
                                  <img src={variant.imageId} alt="Variant" className="w-full h-full object-contain" />
                                ) : (
                                  <ImageIcon className="text-admin-text-muted" size={16} />
                                )}
                              </div>
                              <div className="relative">
                                <button
                                  type="button"
                                  className="px-2.5 py-1.5 bg-admin-bg text-primary hover:bg-admin-border text-xs font-bold rounded-md transition-colors whitespace-nowrap"
                                >
                                  Tải ảnh
                                </button>
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.webp,.svg"
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    try {
                                      const res = await productService.uploadLocalImage(file);
                                      if (res && res.url) {
                                        let finalUrl = res.url;
                                        if (finalUrl.startsWith('/')) {
                                          const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
                                          const hostBase = apiBase.replace('/api', '');
                                          finalUrl = `${hostBase}${finalUrl}`;
                                        }
                                        updateVariant(vIdx, 'imageId', finalUrl);
                                      }
                                    } catch (err) {
                                      alert("Lỗi tải ảnh: " + err.message);
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                              {variant.imageId && (
                                <button
                                  type="button"
                                  onClick={() => updateVariant(vIdx, 'imageId', '')}
                                  className="text-admin-danger hover:text-red-700 text-xs font-bold"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="w-32">
                            <label className="block text-xs font-bold text-admin-text-main mb-1">Tồn kho</label>
                            <input
                              type="number"
                              value={variant.totalStock}
                              onChange={(e) => updateVariant(vIdx, 'totalStock', e.target.value)}
                              className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none focus:border-primary"
                            />
                          </div>

                          <div className="flex items-center pb-2.5">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={variant.isActive}
                                onChange={(e) => updateVariant(vIdx, 'isActive', e.target.checked)}
                                className="w-4 h-4 text-primary border-admin-border rounded focus:ring-primary"
                              />
                              <span className="text-xs font-bold text-admin-text-main">Đang bán</span>
                            </label>
                          </div>

                          <div className="flex items-center pb-1">
                            <button
                              type="button"
                              onClick={() => handleSaveVariant(vIdx)}
                              className="px-4 py-2 bg-success text-white hover:bg-success/90 text-xs font-bold rounded-md transition-colors"
                            >
                              Lưu biến thể
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeVariant(vIdx)}
                        className="p-2 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded-md transition-colors mt-5"
                        title="Xóa biến thể"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* B. Giá cả */}
          <div className="bg-white p-6 rounded-md border border-admin-border">
            <h3 className="text-lg font-bold text-admin-text-main mb-4">B. Giá cả cơ bản</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Giá khuyến mãi / Giá bán *</label>
                <div className="relative">
                  <PriceInput
                    value={formData.basePrice}
                    onChange={(val) => setFormData({ ...formData, basePrice: val })}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main"
                    required={true}
                  />
                  <span className="absolute right-4 top-3.5 text-admin-text-muted font-bold text-sm">VNĐ</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Giá gốc</label>
                <div className="relative">
                  <PriceInput
                    value={formData.originalPrice}
                    onChange={(val) => setFormData({ ...formData, originalPrice: val })}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main"
                  />
                  <span className="absolute right-4 top-3.5 text-admin-text-muted font-bold text-sm">VNĐ</span>
                </div>
              </div>
            </div>
          </div>

          {/* C. Trạng thái */}
          <div className="bg-white p-6 rounded-md border border-admin-border">
            <h3 className="text-lg font-bold text-admin-text-main mb-4">C. Trạng thái hiển thị</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-primary border-admin-border rounded focus:ring-primary"
                />
                <span className="text-sm font-bold text-admin-text-main">Đang bán (Active)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-5 h-5 text-warning border-admin-border rounded focus:ring-warning"
                />
                <span className="text-sm font-bold text-admin-text-main">Sản phẩm nổi bật</span>
              </label>
            </div>
          </div>

          {/* E. Hình ảnh */}
          <div className="bg-white p-6 rounded-md border border-admin-border">
            <h3 className="text-lg font-bold text-admin-text-main mb-4">E. Hình ảnh sản phẩm</h3>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={() => setIsDragOver(false)}
              className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center relative transition-colors mb-4 ${isDragOver ? 'border-primary bg-primary/10' : 'border-admin-border bg-admin-bg/30'}`}
            >
              <input
                type="file" multiple accept=".jpg,.jpeg,.png,.webp,.svg"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-primary">
                  <Loader2 size={32} className="animate-spin" />
                  <span className="text-sm font-bold">Đang tải...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-admin-text-muted text-center">
                  <UploadCloud size={32} className={`mb-2 ${isDragOver ? 'text-primary animate-bounce' : ''}`} />
                  <span className="text-sm font-bold text-admin-text-main">
                    {isDragOver ? 'Thả ảnh vào đây!' : 'Tải ảnh từ máy tính hoặc kéo thả vào đây'}
                  </span>
                  <span className="text-xs mt-1">Hỗ trợ tải lên nhiều hình ảnh cùng lúc</span>
                </div>
              )}
            </div>

            {formData.images.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-admin-border text-[10px] text-admin-text-muted uppercase">
                      <th className="pb-2">Hình ảnh</th>
                      <th className="pb-2">Preview</th>
                      <th className="pb-2 text-center w-24">Ảnh đại diện</th>
                      <th className="pb-2 text-center w-20">Thứ tự</th>
                      <th className="pb-2 text-right">Tùy chọn xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.images.map((img, idx) => (
                      <tr key={idx} className="border-b border-admin-border last:border-0">
                        <td className="py-2 text-xs text-admin-text-main max-w-[120px] truncate" title={img.url}>
                          {img.url.split('/').pop()}
                        </td>
                        <td className="py-2">
                          <img src={img.url} alt="preview" className="w-10 h-10 object-cover rounded bg-gray-100" />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="radio"
                            name="mainImage"
                            checked={img.isMain}
                            onChange={() => setMainImage(idx)}
                            className="w-4 h-4 text-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            value={img.order}
                            onChange={(e) => updateImageOrder(idx, e.target.value)}
                            className="w-12 px-1 py-1 text-center border border-admin-border rounded outline-none focus:border-primary text-xs"
                          />
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={() => removeImage(idx)} className="text-admin-text-muted hover:text-admin-danger p-1">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
