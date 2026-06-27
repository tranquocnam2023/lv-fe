import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, UploadCloud, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { productService } from '../../services/productService';
import { variantService } from '../../services/variantService';
import { generateProductCode } from '../../utils/codeGenerator';
import PriceInput from '../PriceInput';

const AVAILABLE_ATTRIBUTES = ['Màu sắc', 'Dung lượng RAM - ROM', 'Kích thước', 'Phiên bản'];

// Helper to compute Cartesian product
const cartesianProduct = (arrays) => {
  return arrays.reduce((acc, curr) => {
    return acc.flatMap(x => curr.map(y => [...x, y]));
  }, [[]]);
};

// Helper to generate default SKU
const generateVariantSku = (productName, combinationParts) => {
  const cleanProd = productName.toString().toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, '')
    .toUpperCase();

  const cleanComb = combinationParts.map(p => 
    p.valueText.toString().toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
      .replace(/[èéẹẻẽêềếệểễ]/g, "e")
      .replace(/[ìíịỉĩ]/g, "i")
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
      .replace(/[ùúụủũưừứựửữ]/g, "u")
      .replace(/[ỳýỵỷỹ]/g, "y")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, '')
      .toUpperCase()
  ).join('-');

  return `${cleanProd}-${cleanComb}`;
};

export default function ProductForm({ productId, onBack, onSaveSuccess }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Core Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    productCode: '',
    categoryId: '',
    brandId: '',
    description: '',
    basePrice: 0,
    originalPrice: 0,
    totalStock: 0, // Used as default stock when hasVariants is false
    isActive: true,
    isFeatured: false,
    images: [], // { url, isMain, order }
    hasVariants: false
  });

  // Options state: [{ id: 'opt-1', name: 'Màu sắc', isEditing: true, values: [{ internalId: 'val-1-1', text: 'Đỏ' }] }]
  const [options, setOptions] = useState([]);

  // Excluded (deleted) variant combinations
  const [excludedKeys, setExcludedKeys] = useState([]);

  // Expanded variant key for inline detailed editor
  const [expandedVariantKey, setExpandedVariantKey] = useState(null);

  // Variants store mapping: { 'opt-1:val-1-1|opt-2:val-2-1': { id, name, sku, price, totalStock, isActive, imageId, costPrice, chargeTax } }
  const [variantsData, setVariantsData] = useState({});


  // Global keydown listener for Space shortcut to toggle IsActive
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        const activeEl = document.activeElement;
        const isTyping = activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.tagName === 'SELECT' || 
          activeEl.isContentEditable
        );
        if (!isTyping) {
          e.preventDefault();
          setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load categories and brands
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [brandsData, catsData] = await Promise.all([
          brandService.getAll(),
          categoryService.getAll(true)
        ]);
        if (brandsData) setBrands(brandsData);
        if (catsData) setCategories(catsData);

        if (productId) {
          // Edit Mode: load product and variants
          const productData = await productService.getById(productId);
          if (productData) {
            let dbVariants = [];
            try {
              const allVars = await variantService.getAll(productId);
              if (Array.isArray(allVars)) {
                const targetProductId = Number(productId);
                dbVariants = allVars.filter(v => Number(v.productId) === targetProductId);
              }
            } catch (err) {
              console.error("Lỗi tải biến thể:", err);
            }

            // Reverse parse variants into options & variantsData
            const hasVars = dbVariants.length > 0;
            let parsedOpts = [];
            let parsedVarsData = {};

            if (hasVars) {
              // 1. Identify unique option names
              const optionNames = [];
              dbVariants.forEach(v => {
                if (v.attributes) {
                  try {
                    const attrs = JSON.parse(v.attributes);
                    Object.keys(attrs).forEach(k => {
                      // Exclude custom metadata keys from option attributes
                      if (k !== 'costPrice' && k !== 'chargeTax' && !optionNames.includes(k)) {
                        optionNames.push(k);
                      }
                    });
                  } catch (e) {}
                }
              });

              // 2. Build options structure
              parsedOpts = optionNames.map((name, optIdx) => {
                const optId = `opt-${optIdx + 1}`;
                const valueSet = new Set();
                dbVariants.forEach(v => {
                  if (v.attributes) {
                    try {
                      const attrs = JSON.parse(v.attributes);
                      if (attrs[name]) {
                        const valStr = String(attrs[name]).trim();
                        if (valStr) valueSet.add(valStr);
                      }
                    } catch (e) {}
                  }
                });

                const values = Array.from(valueSet).map((valText, valIdx) => ({
                  internalId: `val-${optIdx + 1}-${valIdx + 1}`,
                  text: valText
                }));

                return {
                  id: optId,
                  name,
                  isEditing: false, // Default to read-only badges for saved options
                  values
                };
              });

              // 3. Map to combination keys
              dbVariants.forEach(v => {
                if (v.attributes) {
                  try {
                    const attrs = JSON.parse(v.attributes);
                    const keyParts = [];
                    parsedOpts.forEach(opt => {
                      const valText = attrs[opt.name];
                      if (valText) {
                        const valObj = opt.values.find(val => val.text === String(valText).trim());
                        if (valObj) {
                          keyParts.push(`${opt.id}:${valObj.internalId}`);
                        }
                      }
                    });

                    if (keyParts.length === parsedOpts.length && keyParts.length > 0) {
                      const key = keyParts.join('|');
                      parsedVarsData[key] = {
                        id: v.id,
                        name: v.name,
                        sku: v.sku || '',
                        price: v.price,
                        totalStock: v.totalStock,
                        isActive: v.isActive !== false,
                        imageId: v.imageId || '',
                        costPrice: attrs.costPrice || '',
                        chargeTax: attrs.chargeTax !== false
                      };
                    }
                  } catch (e) {}
                }
              });
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
              totalStock: productData.totalStock || 0,
              isActive: productData.isActive !== false,
              isFeatured: productData.isFeatured || false,
              images: loadedImages,
              hasVariants: hasVars
            });

            if (hasVars) {
              setOptions(parsedOpts);
              setVariantsData(parsedVarsData);

              // Pre-calculate initially excluded keys
              const activeOpts = parsedOpts.map(opt => ({
                ...opt,
                values: opt.values.filter(v => v && v.text && String(v.text).trim() !== '')
              })).filter(o => o.name && o.values.length > 0);

              const combArrays = activeOpts.map(opt => 
                opt.values.map(val => ({
                  optionId: opt.id,
                  valueId: opt.id + ':' + val.internalId,
                }))
              );

              const allCombs = combArrays.length > 0 ? cartesianProduct(combArrays) : [];
              const dbKeys = Object.keys(parsedVarsData);
              const initialExcluded = [];
              
              allCombs.forEach(comb => {
                const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
                const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
                if (!dbKeys.includes(key)) {
                  initialExcluded.push(key);
                }
              });
              
              setExcludedKeys(initialExcluded);
            }
          }
        }
      } catch (e) {
        console.error("Lỗi tải dữ liệu ban đầu:", e);
      }
      finally {
        setLoading(false);
      }
    };

    fetchData();
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
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  // Image Upload handler
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
            isMain: newImages.length === 0,
            order: newImages.length
          });
        }
      }
      setFormData(prev => ({ ...prev, images: newImages }));
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
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const updateImageOrder = (index, newOrder) => {
    const newImages = [...formData.images];
    newImages[index].order = parseInt(newOrder) || 0;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    if (newImages.length > 0 && formData.images[index].isMain) {
      newImages[0].isMain = true;
    }
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Option / Attribute management
  const addOptionRow = () => {
    if (options.length >= 4) return;
    const nextId = `opt-${Date.now()}`;
    const unusedAttr = AVAILABLE_ATTRIBUTES.find(attr => !options.some(o => o.name === attr)) || '';
    setOptions(prev => [...prev, { 
      id: nextId, 
      name: unusedAttr, 
      isEditing: true, 
      values: [{ internalId: `val-${Date.now()}-1`, text: '' }] 
    }]);
  };

  const removeOptionRow = (optId) => {
    setOptions(prev => prev.filter(o => o.id !== optId));
  };

  const updateOptionName = (optId, newName) => {
    setOptions(prev => prev.map(o => o.id === optId ? { 
      ...o, 
      name: newName, 
      values: [{ internalId: `val-${optId.replace('opt-', '')}-${Date.now()}`, text: '' }] 
    } : o));
  };

  // Shopify-style Option values tags management
  const updateValueText = (optId, valId, newText) => {
    setOptions(prev => prev.map(o => {
      if (o.id === optId) {
        let newValues = o.values.map(val => 
          val.internalId === valId ? { ...val, text: newText } : val
        );
        // Shopify check: if we type in the last row, automatically append a new empty row
        const targetIndex = newValues.findIndex(val => val.internalId === valId);
        if (targetIndex === newValues.length - 1 && newText.trim() !== '') {
          newValues.push({ internalId: `val-${optId.replace('opt-', '')}-${Date.now()}`, text: '' });
        }
        return { ...o, values: newValues };
      }
      return o;
    }));
  };

  const removeOptionValue = (optId, valId) => {
    setOptions(prev => prev.map(o => {
      if (o.id === optId) {
        return {
          ...o,
          values: o.values.filter(v => v.internalId !== valId)
        };
      }
      return o;
    }));
  };

  const handleDoneOption = (optId) => {
    setOptions(prev => prev.map(o => {
      if (o.id === optId) {
        const filteredValues = o.values.filter(v => v && v.text && String(v.text).trim() !== '');
        if (filteredValues.length === 0) {
          alert("Vui lòng nhập ít nhất một giá trị cho tùy chọn này.");
          return o;
        }
        return {
          ...o,
          values: filteredValues,
          isEditing: false
        };
      }
      return o;
    }));
  };

  const handleEditOption = (optId) => {
    setOptions(prev => prev.map(o => {
      if (o.id === optId) {
        return {
          ...o,
          isEditing: true,
          // Append an empty row for Shopify style adding
          values: [...o.values, { internalId: `val-${optId.replace('opt-', '')}-${Date.now()}`, text: '' }]
        };
      }
      return o;
    }));
  };

  const handleValueKeyDown = (e, opt, valId, vIdx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const container = e.currentTarget.closest('.values-container');
      if (container) {
        const inputs = container.querySelectorAll('input.value-input');
        const nextInput = inputs[vIdx + 1];
        if (nextInput) {
          nextInput.focus();
        } else {
          const currentVal = opt.values[vIdx];
          if (currentVal && currentVal.text && String(currentVal.text).trim() !== '') {
            setTimeout(() => {
              const updatedInputs = container.querySelectorAll('input.value-input');
              const lastInput = updatedInputs[updatedInputs.length - 1];
              if (lastInput) lastInput.focus();
            }, 50);
          }
        }
      }
    }
  };

  // Dynamic combinations calculation based on non-empty values of options
  const activeOptions = options.map(opt => ({
    ...opt,
    values: opt.values.filter(v => v && v.text && String(v.text).trim() !== '')
  })).filter(o => o.name && o.values.length > 0);

  const combinationArrays = activeOptions.map(opt => 
    opt.values.map(val => ({
      optionId: opt.id,
      optionName: opt.name,
      valueId: opt.id + ':' + val.internalId,
      valueText: val.text
    }))
  );

  const generatedCombinations = combinationArrays.length > 0 ? cartesianProduct(combinationArrays) : [];

  // Filter combinations to remove excluded ones
  const activeCombinations = generatedCombinations.filter(comb => {
    const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
    const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
    return !excludedKeys.includes(key);
  });

  // Calculate duplicate SKUs among active combinations
  const duplicateSkuKeys = React.useMemo(() => {
    const skus = {};
    const duplicates = new Set();
    
    activeCombinations.forEach(comb => {
      const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
      const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
      const vData = variantsData[key];
      const defaultSku = generateVariantSku(formData.name, comb);
      const sku = (vData?.sku !== undefined ? vData.sku : defaultSku).trim().toUpperCase();
      
      if (sku) {
        if (skus[sku]) {
          duplicates.add(key);
          duplicates.add(skus[sku]);
        } else {
          skus[sku] = key;
        }
      }
    });
    return duplicates;
  }, [activeCombinations, variantsData, formData.name]);

  // Update variant field helper
  const updateVariantField = (key, field, value) => {
    setVariantsData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  // Form Submission
  const handleSave = async () => {
    if (!formData.name) return alert("Vui lòng nhập tên sản phẩm.");
    if (!formData.categoryId) return alert("Vui lòng chọn danh mục.");

    if (formData.basePrice < 1000 || formData.basePrice > 500000000) {
      return alert("Giá bán không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }
    if (formData.originalPrice && (formData.originalPrice < 1000 || formData.originalPrice > 500000000)) {
      return alert("Giá gốc không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }

    if (formData.hasVariants && duplicateSkuKeys.size > 0) {
      return alert("Không thể lưu sản phẩm. Vui lòng khắc phục các mã SKU bị trùng lặp.");
    }

    setSaving(true);
    try {
      const sortedImages = [...formData.images].sort((a, b) => a.order - b.order);
      const mainImage = sortedImages.find(i => i.isMain)?.url || "";
      const otherImages = sortedImages.filter(i => !i.isMain).map(i => i.url);
      const generatedCode = formData.productCode.trim() || generateProductCode(formData.name, 20);

      // Compute total stock from combinations or fallback to simple default stock
      let calculatedStock = 0;
      if (formData.hasVariants && activeCombinations.length > 0) {
        activeCombinations.forEach(comb => {
          const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
          const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
          const vData = variantsData[key];
          calculatedStock += vData ? (Number(vData.totalStock) || 0) : 0;
        });
      } else {
        calculatedStock = Number(formData.totalStock) || 0;
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        productCode: generatedCode,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        totalStock: calculatedStock,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        categoryId: parseInt(formData.categoryId),
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        thumbnailImage: mainImage,
        mainImage: mainImage,
        images: JSON.stringify(otherImages)
      };

      let resultProduct;
      if (productId) {
        await productService.update(productId, payload);
        resultProduct = { id: productId };
      } else {
        resultProduct = await productService.create(payload);
      }

      const savedProductId = resultProduct?.id || productId;

      if (savedProductId) {
        if (formData.hasVariants && activeCombinations.length > 0) {
          // Construct variants payload list for sync API
          const variantsPayload = activeCombinations.map(comb => {
            const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
            const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
            const vData = variantsData[key];

            const attributeObj = {};
            comb.forEach(part => {
              attributeObj[part.optionName] = part.valueText;
            });

            // Store metadata properties (costPrice, chargeTax) inside Attributes JSON
            if (vData?.costPrice) {
              attributeObj.costPrice = Number(vData.costPrice);
            }
            if (vData?.chargeTax !== undefined) {
              attributeObj.chargeTax = !!vData.chargeTax;
            }

            const combName = comb.map(p => p.valueText).join(' - ');
            const defaultName = `${formData.name} - ${combName}`;
            const defaultSku = generateVariantSku(formData.name, comb);

            return {
              id: vData?.id || 0,
              name: vData?.name || defaultName,
              sku: vData?.sku || defaultSku,
              price: vData?.price ? Number(vData.price) : Number(formData.basePrice),
              totalStock: vData?.totalStock ? Number(vData.totalStock) : 0,
              productId: savedProductId,
              imageId: vData?.imageId || '',
              attributes: JSON.stringify(attributeObj),
              isActive: vData?.isActive !== false
            };
          });

          await variantService.sync(savedProductId, variantsPayload);
        } else if (!formData.hasVariants && productId) {
          // Sync empty array to remove old variants if switched off
          await variantService.sync(savedProductId, []);
        }
      }

      alert(productId ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');
      if (onSaveSuccess) onSaveSuccess();
    } catch (e) {
      let msg = typeof e === 'object' && e !== null ? (e.message || JSON.stringify(e)) : String(e);
      if (typeof e === 'object' && e.errors) {
        msg = JSON.stringify(e.errors);
      }
      alert("Lỗi lưu sản phẩm: " + msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white rounded-full text-admin-text-muted hover:text-admin-text-main transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-admin-text-main">
            {productId ? `Cập nhật sản phẩm #${productId}` : 'Thêm sản phẩm mới'}
          </h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-colors disabled:opacity-70 text-sm cursor-pointer"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Lưu sản phẩm
          </button>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side (Columns 1 & 2) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Khối A - Thông tin cơ bản */}
          <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50">
            <h3 className="text-lg font-bold text-admin-text-main mb-4">Khối A - Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-admin-text-main mb-2">Tên sản phẩm *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white text-sm font-medium"
                  placeholder="Nhập tên sản phẩm..."
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-admin-text-main mb-2">Đường dẫn (Slug)</label>
                <input
                  type="text"
                  value={formData.slug}
                  className="w-full px-4 py-3 border border-admin-border bg-gray-100 rounded-md outline-none text-admin-text-muted cursor-not-allowed text-sm font-medium"
                  placeholder="tu-dong-tao-tu-ten-san-pham"
                  disabled
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-admin-text-main mb-2">Mã sản phẩm (ProductCode)</label>
                <input
                  type="text"
                  value={formData.productCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, productCode: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  className="w-full px-4 py-3 border border-admin-border rounded-md outline-none text-admin-text-main uppercase focus:border-primary bg-white text-sm font-medium"
                  placeholder="Để trống tự tạo..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Danh mục *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white text-sm font-medium"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Thương hiệu</label>
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white text-sm font-medium"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white text-sm font-medium"
                  placeholder="Nhập mô tả sản phẩm..."
                />
              </div>
            </div>
          </div>

          {/* Khối C - Hình ảnh chung */}
          <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50">
            <h3 className="text-lg font-bold text-admin-text-main mb-4">Khối C - Hình ảnh sản phẩm (Gallery)</h3>
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
                    {isDragOver ? 'Thả ảnh vào đây!' : 'Tải ảnh từ máy tính hoặc kéo thả'}
                  </span>
                  <span className="text-xs mt-1">Chọn hoặc thả nhiều ảnh cùng lúc</span>
                </div>
              )}
            </div>

            {formData.images.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-admin-border text-[10px] text-admin-text-muted uppercase">
                      <th className="pb-2">Preview</th>
                      <th className="pb-2 text-center w-24">Đại diện</th>
                      <th className="pb-2 text-center w-16">Thứ tự</th>
                      <th className="pb-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.images.map((img, idx) => (
                      <tr key={idx} className="border-b border-admin-border last:border-0">
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
                            className="w-10 px-1 py-1 text-center border border-admin-border rounded outline-none focus:border-primary text-xs"
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

        {/* Right Side (Column 3) */}
        <div className="flex flex-col gap-6">
          
          {/* Khối B - Trạng thái & Phân loại */}
          <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50">
            <h3 className="text-lg font-bold text-admin-text-main mb-4">Khối B - Trạng thái & Phân loại</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Trạng thái bán</label>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-sm font-bold text-admin-text-main">
                    {formData.isActive ? 'Đang bán (Active)' : 'Ngừng kinh doanh (Inactive)'}
                  </span>
                </div>
                <p className="text-[10px] text-admin-text-muted mt-1.5 font-semibold">(Phím tắt: Space ngoài ô nhập liệu)</p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-5 h-5 text-warning border-admin-border rounded focus:ring-warning"
                  />
                  <span className="text-sm font-bold text-admin-text-main">Sản phẩm nổi bật</span>
                </label>
              </div>
            </div>
          </div>

          {/* Khối D - Giá & Tồn kho mặc định */}
          <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50">
            <h3 className="text-lg font-bold text-admin-text-main mb-4">Khối D - Giá & Tồn kho mặc định</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Giá khuyến mãi / Giá bán *</label>
                <div className="relative">
                  <PriceInput
                    value={formData.basePrice}
                    onChange={(val) => setFormData(prev => ({ ...prev, basePrice: val }))}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main bg-white text-sm font-medium"
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
                    onChange={(val) => setFormData(prev => ({ ...prev, originalPrice: val }))}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main bg-white text-sm font-medium"
                  />
                  <span className="absolute right-4 top-3.5 text-admin-text-muted font-bold text-sm">VNĐ</span>
                </div>
              </div>

              {/* Tồn kho input: ONLY shown if hasVariants is false */}
              {!formData.hasVariants && (
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Tồn kho mặc định</label>
                  <input
                    type="number"
                    value={formData.totalStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalStock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main bg-white text-sm font-medium"
                    placeholder="Nhập số lượng tồn kho..."
                  />
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Block (Khối E) */}
      <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-admin-text-main">Khối E - Tùy chọn biến thể sản phẩm</h3>
            <p className="text-xs text-admin-text-muted font-medium mt-1">Cấu hình màu sắc, dung lượng để tạo ma trận biến thể</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.hasVariants}
              onChange={(e) => setFormData(prev => ({ ...prev, hasVariants: e.target.checked }))}
            />
            <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {formData.hasVariants && (
          <div className="space-y-6 mt-4">
            
            {/* Shopify style Options attributes config list */}
            <div className="p-4 rounded-md bg-white">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h4 className="text-sm font-bold text-admin-text-main">Cấu hình thuộc tính biến thể</h4>
                {options.length < 4 && (
                  <button 
                    type="button"
                    onClick={addOptionRow}
                    className="text-xs font-bold text-primary hover:text-admin-primary-hover flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Thêm tùy chọn thuộc tính
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {options.map((opt, optIdx) => (
                  <div key={opt.id} className="border border-admin-border rounded-md p-4 bg-gray-50/10">
                    {opt.isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
                          <div className="w-64">
                            <select
                              value={opt.name}
                              onChange={(e) => updateOptionName(opt.id, e.target.value)}
                              className="w-full px-3 py-2 border border-admin-border rounded-md text-sm outline-none bg-white text-admin-text-main focus:border-primary font-semibold"
                            >
                              <option value="">-- Chọn thuộc tính --</option>
                              {AVAILABLE_ATTRIBUTES.filter(attr => attr === opt.name || !options.some(o => o.name === attr)).map(attr => (
                                <option key={attr} value={attr}>{attr}</option>
                              ))}
                            </select>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeOptionRow(opt.id)}
                            className="p-1.5 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="space-y-2 values-container">
                          <label className="block text-xs font-bold text-admin-text-main mb-1">Các giá trị thuộc tính:</label>
                          {opt.values.map((val, vIdx) => (
                            <div key={val.internalId} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={val.text}
                                onChange={(e) => updateValueText(opt.id, val.internalId, e.target.value)}
                                onKeyDown={(e) => handleValueKeyDown(e, opt, val.internalId, vIdx)}
                                placeholder={vIdx === opt.values.length - 1 ? "+ Nhập giá trị mới..." : "Giá trị thuộc tính..."}
                                className="flex-1 px-3 py-2 border border-admin-border rounded-md text-xs outline-none bg-white focus:border-primary value-input font-medium"
                              />
                              {vIdx !== opt.values.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOptionValue(opt.id, val.internalId)}
                                  className="p-1.5 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2 pt-2 justify-end">
                            <button
                              type="button"
                              onClick={() => handleDoneOption(opt.id)}
                              className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-admin-primary-hover transition-colors cursor-pointer"
                            >
                              Xong
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-sm text-admin-text-main">{opt.name}:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {opt.values.map(val => (
                              <span key={val.internalId} className="px-2.5 py-1 bg-white border border-admin-border rounded text-xs font-bold text-admin-text-main">
                                {val.text}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditOption(opt.id)}
                          className="px-3 py-1.5 border border-admin-border text-primary hover:bg-admin-bg text-xs font-bold rounded transition-colors cursor-pointer"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Combinations Matrix Table */}
            {activeCombinations.length > 0 && (
              <div className="p-4 rounded-md bg-white">
                <h4 className="text-sm font-bold text-admin-text-main mb-3">Danh sách ma trận biến thể sinh ra</h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-admin-border text-admin-text-muted font-bold">
                        <th className="pb-2 px-2 w-14">Hình ảnh</th>
                        <th className="pb-2 px-2">Tên biến thể</th>
                        <th className="pb-2 px-2 w-48">Mã SKU</th>
                        <th className="pb-2 px-2 w-32">Giá bán (VNĐ)</th>
                        <th className="pb-2 px-2 w-24">Tồn kho</th>
                        <th className="pb-2 px-2 text-center w-24">Kích hoạt</th>
                        <th className="pb-2 px-2 text-right w-36">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCombinations.map((comb, combIdx) => {
                        const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
                        const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
                        const vData = variantsData[key];

                        const combName = comb.map(p => p.valueText).join(' - ');
                        const defaultSku = generateVariantSku(formData.name, comb);
                        const defaultName = `${formData.name} - ${combName}`;
                        
                        const displayName = vData?.name !== undefined ? vData.name : defaultName;
                        const currentSku = vData?.sku !== undefined ? vData.sku : defaultSku;
                        const priceVal = vData?.price !== undefined ? vData.price : '';
                        const stockVal = vData?.totalStock !== undefined ? vData.totalStock : 0;
                        const imgVal = vData?.imageId || '';
                        const isExpanded = expandedVariantKey === key;
                        const hasSkuError = duplicateSkuKeys.has(key);

                        return (
                          <React.Fragment key={key}>
                            <tr className={`border-b border-admin-border hover:bg-admin-bg/30 ${isExpanded ? 'bg-primary/5' : ''}`}>
                              {/* 1. Hình ảnh */}
                              <td className="py-3 px-2">
                                <div className="relative w-8 h-8 rounded border border-admin-border bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer group">
                                  {imgVal ? (
                                    <img src={imgVal} alt="Variant" className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="text-admin-text-muted w-4 h-4" />
                                  )}
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
                                          updateVariantField(key, 'imageId', finalUrl);
                                        }
                                      } catch (err) {
                                        alert("Lỗi tải ảnh: " + err.message);
                                      }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                </div>
                              </td>

                              {/* 2. Tên biến thể */}
                              <td className="py-3 px-2 font-bold text-admin-text-main">
                                {displayName}
                              </td>

                              {/* 3. SKU */}
                              <td className="py-3 px-2">
                                <input 
                                  type="text"
                                  value={currentSku}
                                  onChange={(e) => updateVariantField(key, 'sku', e.target.value)}
                                  className={`w-full px-2 py-1 border rounded outline-none text-xs font-bold ${hasSkuError ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500' : 'border-admin-border text-admin-text-main focus:border-primary'}`}
                                  placeholder="Mã SKU..."
                                />
                                {hasSkuError && (
                                  <span className="text-[10px] text-red-500 font-bold block mt-0.5">Mã SKU đã tồn tại.</span>
                                )}
                              </td>

                              {/* 4. Giá bán */}
                              <td className="py-3 px-2">
                                <PriceInput
                                  value={priceVal}
                                  onChange={(val) => updateVariantField(key, 'price', val)}
                                  className="w-full px-2 py-1 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold"
                                  placeholder="Theo giá gốc SP..."
                                />
                              </td>

                              {/* 5. Tồn kho */}
                              <td className="py-3 px-2">
                                <input 
                                  type="number"
                                  value={stockVal}
                                  onChange={(e) => updateVariantField(key, 'totalStock', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-admin-border rounded outline-none text-xs text-admin-text-main font-semibold"
                                />
                              </td>

                              {/* 5.5. Kích hoạt (Toggle switch) */}
                              <td className="py-3 px-2 text-center">
                                <div className="flex justify-center">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={vData?.isActive !== false}
                                      onChange={(e) => updateVariantField(key, 'isActive', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                  </label>
                                </div>
                              </td>

                              {/* 6. Thao tác */}
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedVariantKey(isExpanded ? null : key)}
                                    className="px-2.5 py-1 text-xs border border-admin-border text-primary hover:bg-primary/5 rounded font-bold transition-all cursor-pointer"
                                  >
                                    {isExpanded ? 'Đóng' : 'Sửa chi tiết'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Bạn có chắc chắn muốn xóa biến thể "${displayName}"?`)) {
                                        setExcludedKeys(prev => [...prev, key]);
                                        if (isExpanded) setExpandedVariantKey(null);
                                      }
                                    }}
                                    className="p-1.5 text-admin-text-muted hover:text-admin-danger hover:bg-red-50 rounded transition-all cursor-pointer"
                                    title="Xóa biến thể"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Detailed Inline Accordion Block */}
                            {isExpanded && (
                              <tr className="bg-gray-50/40">
                                <td colSpan="7" className="p-4 border-b border-admin-border">
                                  <div className="bg-white p-5 rounded border border-admin-border/80 space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                      <h5 className="font-bold text-xs text-admin-text-main uppercase tracking-wider">
                                        Cấu hình nâng cao cho: <span className="text-primary">{displayName}</span>
                                      </h5>
                                      <button 
                                        type="button"
                                        onClick={() => setExpandedVariantKey(null)}
                                        className="text-xs text-admin-text-muted hover:text-admin-text-main font-bold cursor-pointer"
                                      >
                                        Đóng chi tiết
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Cột Trái */}
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-[11px] font-bold text-admin-text-main mb-1">Tên hiển thị biến thể</label>
                                          <input 
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => updateVariantField(key, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[11px] font-bold text-admin-text-main mb-1">Mã SKU (Manual)</label>
                                          <input 
                                            type="text"
                                            value={currentSku}
                                            onChange={(e) => updateVariantField(key, 'sku', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded outline-none text-xs font-semibold ${hasSkuError ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500' : 'border-admin-border text-admin-text-main focus:border-primary'}`}
                                          />
                                          {hasSkuError && (
                                            <span className="text-[11px] text-red-500 font-bold block mt-1">Mã SKU đã tồn tại.</span>
                                          )}
                                        </div>

                                        <div>
                                          <label className="block text-[11px] font-bold text-admin-text-main mb-1">Hình ảnh biến thể</label>
                                          <div className="flex items-center gap-3">
                                            <div className="relative w-14 h-14 rounded border border-admin-border bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer group">
                                              {imgVal ? (
                                                <img src={imgVal} alt="Variant" className="w-full h-full object-cover" />
                                              ) : (
                                                <ImageIcon className="text-admin-text-muted w-5 h-5" />
                                              )}
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
                                                      updateVariantField(key, 'imageId', finalUrl);
                                                    }
                                                  } catch (err) {
                                                    alert("Lỗi tải ảnh: " + err.message);
                                                  }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                              />
                                            </div>
                                            <span className="text-[10px] text-admin-text-muted font-medium">Nhấp vào ô để thay đổi ảnh biến thể</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Cột Phải */}
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-[11px] font-bold text-admin-text-main mb-1">Giá bán riêng (VNĐ)</label>
                                            <PriceInput
                                              value={priceVal}
                                              onChange={(val) => updateVariantField(key, 'price', val)}
                                              className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium"
                                              placeholder="Giá gốc SP..."
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[11px] font-bold text-admin-text-main mb-1">Giá vốn (Cost per item)</label>
                                            <PriceInput
                                              value={vData?.costPrice || ''}
                                              onChange={(val) => updateVariantField(key, 'costPrice', val)}
                                              className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium"
                                              placeholder="Tính lợi nhuận..."
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-[11px] font-bold text-admin-text-main mb-1">Tồn kho</label>
                                            <input 
                                              type="number"
                                              value={stockVal}
                                              onChange={(e) => updateVariantField(key, 'totalStock', parseInt(e.target.value) || 0)}
                                              className="w-full px-3 py-2 border border-admin-border rounded outline-none text-xs text-admin-text-main font-medium"
                                            />
                                          </div>
                                          <div className="flex items-end pb-1.5">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input 
                                                type="checkbox"
                                                checked={vData?.chargeTax !== false}
                                                onChange={(e) => updateVariantField(key, 'chargeTax', e.target.checked)}
                                                className="w-4 h-4 text-primary border-admin-border rounded focus:ring-primary cursor-pointer"
                                              />
                                              <span className="text-xs font-bold text-admin-text-main">Áp dụng thuế</span>
                                            </label>
                                          </div>
                                        </div>

                                      </div>
                                    </div>

                                    {/* Bottom panel with Auto-Save status and Hoàn tất button */}
                                    <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-4">
                                      <span className="text-[11px] text-green-600 font-bold flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        Các thay đổi được tự động ghi nhận vào biểu mẫu chung
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedVariantKey(null)}
                                        className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-admin-primary-hover transition-colors cursor-pointer"
                                      >
                                        Hoàn tất
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {excludedKeys.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                    <span className="text-xs text-admin-text-muted font-medium">Đang ẩn {excludedKeys.length} biến thể không kinh doanh.</span>
                    <button 
                      type="button" 
                      onClick={() => setExcludedKeys([])}
                      className="text-xs font-bold text-primary hover:text-admin-primary-hover cursor-pointer"
                    >
                      Khôi phục tất cả
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
