import React, { useState, useEffect, useRef } from 'react';
import { categoryService } from '../services/categoryService';
import { brandService } from '../services/brandService';
import { productService } from '../services/productService';
import { variantService } from '../services/variantService';
import { generateProductCode } from '../utils/codeGenerator';
import { useProductSpecs } from './useProductSpecs';
import { useProductVariants } from './useProductVariants';

export const useProductForm = ({ productId, onBack, onSaveSuccess, searchParams, setSearchParams }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message, description = '') => {
    setToast({ type, message, description });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.type === 'success' ? 4000 : 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
    specs: '',
    basePrice: 0,
    originalPrice: 0,
    totalStock: 0,
    isActive: true,
    isFeatured: false,
    images: [],
    hasVariants: false,
    videoUrl: ''
  });

  // Call the refactored specialized hooks
  const { prevBrandIdRef } = useProductSpecs({ formData, setFormData, categories, brands });
  
  const variantState = useProductVariants({
    formData,
    setFormData,
    brands,
    showToast
  });

  const {
    options,
    setOptions,
    setExcludedKeys,
    variantsData,
    setVariantsData,
    activeCombinations,
    duplicateSkuKeys,
    generateVariantSku,
    cartesianProduct
  } = variantState;

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
          // Edit Mode
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

            const hasVars = dbVariants.length > 0;
            let parsedOpts = [];
            let parsedVarsData = {};

            if (hasVars) {
              const optionNames = [];
              dbVariants.forEach(v => {
                if (v.attributes) {
                  try {
                    const attrs = JSON.parse(v.attributes);
                    Object.keys(attrs).forEach(k => {
                      const kLower = k.toLowerCase();
                      if (kLower !== 'costprice' && kLower !== 'chargetax' && !optionNames.includes(k)) {
                        optionNames.push(k);
                      }
                    });
                  } catch (e) { }
                }
              });

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
                    } catch (e) { }
                  }
                });

                const values = Array.from(valueSet).map((valText, valIdx) => ({
                  internalId: `val-${optIdx + 1}-${valIdx + 1}`,
                  text: valText
                }));

                return {
                  id: optId,
                  name,
                  isEditing: false,
                  values
                };
              });

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

                      const combValues = parsedOpts.map(opt => {
                        const valText = attrs[opt.name];
                        return valText ? String(valText).trim() : '';
                      }).filter(t => t !== '');
                      const combName = combValues.join(' - ');
                      const defaultName = `${productData.name || ''} - ${combName}`;

                      let isOutOfSync = false;
                      for (const valText of combValues) {
                        if (!v.name.toLowerCase().includes(valText.toLowerCase())) {
                          isOutOfSync = true;
                          break;
                        }
                      }
                      const finalName = isOutOfSync ? defaultName : v.name;

                      let specsList = [];
                      if (v.specsOverride) {
                        try {
                          const parsed = JSON.parse(v.specsOverride);
                          specsList = Object.entries(parsed).map(([k, val]) => ({ key: k, value: val }));
                        } catch (e) {}
                      }

                      parsedVarsData[key] = {
                        id: v.id,
                        name: finalName,
                        sku: v.sku || '',
                        price: v.price,
                        totalStock: v.totalStock,
                        isActive: v.isActive !== false,
                        imageId: v.imageId || '',
                        costPrice: attrs.costPrice || '',
                        specsOverrideList: specsList
                      };
                    }
                  } catch (e) { }
                }
              });
            }

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
              specs: productData.specs || '',
              basePrice: productData.basePrice || 0,
              originalPrice: productData.originalPrice || 0,
              totalStock: productData.totalStock || 0,
              isActive: productData.isActive !== false,
              isFeatured: productData.isFeatured || false,
              images: loadedImages,
              hasVariants: hasVars,
              videoUrl: productData.videoUrl || ''
            });

            if (hasVars) {
              setOptions(parsedOpts);
              setVariantsData(parsedVarsData);

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
        } else {
          const queryBrandId = searchParams.get('brandId');
          if (queryBrandId) {
            setFormData(prev => ({ ...prev, brandId: queryBrandId }));
          }
        }
      } catch (e) {
        console.error("Lỗi tải dữ liệu ban đầu:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

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
        const res = await productService.uploadLocalImage(file, 'products');
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
    if (index < 0 || index >= formData.images.length) return;
    const newImages = [...formData.images];
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    const updatedImages = newImages.map((img, i) => ({
      ...img,
      isMain: i === 0,
      order: i
    }));
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };

  const updateImageOrder = (index, newOrder) => {
    if (index < 0 || index >= formData.images.length) return;
    const newImages = [...formData.images];
    newImages[index].order = parseFloat(newOrder) || 0;
    newImages.sort((a, b) => a.order - b.order);
    const updatedImages = newImages.map((img, i) => ({
      ...img,
      isMain: i === 0,
      order: i
    }));
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };

  const removeImage = (index) => {
    if (index < 0 || index >= formData.images.length) return;
    const newImages = formData.images.filter((_, i) => i !== index);
    const updatedImages = newImages.map((img, i) => ({
      ...img,
      isMain: i === 0,
      order: i
    }));
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };

  const handleSave = async (keepEditing = false) => {
    if (!formData.name) return showToast("warning", "Vui lòng nhập tên sản phẩm.");
    if (!formData.categoryId) return showToast("warning", "Vui lòng chọn danh mục.");

    if (formData.basePrice < 1000 || formData.basePrice > 500000000) {
      return showToast("warning", "Giá bán không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }
    if (formData.originalPrice && (formData.originalPrice < 1000 || formData.originalPrice > 500000000)) {
      return showToast("warning", "Giá gốc không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }

    for (const opt of options) {
      if (opt.name === "Màu sắc" || opt.name === "Kích thước") {
        const hasInvalid = opt.values.some(v => v.text && /^\d+$/.test(String(v.text).trim()));
        if (hasInvalid) {
          return showToast("warning", `Thuộc tính '${opt.name}' không được phép chỉ chứa toàn các con số.`);
        }
      }
    }

    if (formData.hasVariants && duplicateSkuKeys.size > 0) {
      return showToast("warning", "Không thể lưu sản phẩm. Vui lòng khắc phục các mã SKU bị trùng lặp.");
    }

    setSaving(true);
    try {
      const mainImage = formData.images[0]?.url || "";
      const otherImages = formData.images.slice(1).map(i => i.url);
      const generatedCode = formData.productCode.trim() || generateProductCode(formData.name, 20);

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
        specs: formData.specs,
        basePrice: Number(formData.basePrice),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        totalStock: calculatedStock,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        categoryId: parseInt(formData.categoryId),
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        thumbnailImage: mainImage,
        mainImage: mainImage,
        images: JSON.stringify(otherImages),
        videoUrl: formData.videoUrl || "" 
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
          const selectedBrand = brands.find(b => b.id === Number(formData.brandId));
          const brandCode = selectedBrand?.brandCode || 'GEN';

          const variantsPayload = activeCombinations.map(comb => {
            const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
            const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
            const vData = variantsData[key];

            const attributeObj = {};
            comb.forEach(part => {
              attributeObj[part.optionName] = part.valueText;
            });

            if (vData?.costPrice) {
              attributeObj.costPrice = Number(vData.costPrice);
            }

            const combName = comb.map(p => p.valueText).join(' - ');
            const defaultName = `${formData.name} - ${combName}`;
            const defaultSku = generateVariantSku(brandCode, generatedCode, comb);

            const specsOverrideObj = {};
            if (Array.isArray(vData?.specsOverrideList)) {
              vData.specsOverrideList.forEach(s => {
                if (s.key.trim() && s.value.trim()) {
                  specsOverrideObj[s.key.trim()] = s.value.trim();
                }
              });
            }
            const specsOverrideStr = Object.keys(specsOverrideObj).length > 0 ? JSON.stringify(specsOverrideObj) : null;

            return {
              id: vData?.id || 0,
              name: vData?.name || defaultName,
              sku: vData?.sku || defaultSku,
              price: vData?.price ? Number(vData.price) : Number(formData.basePrice),
              totalStock: vData?.totalStock ? Number(vData.totalStock) : 0,
              productId: savedProductId,
              imageId: vData?.imageId || '',
              attributes: JSON.stringify(attributeObj),
              specsOverride: specsOverrideStr,
              isActive: vData?.isActive !== false
            };
          });

          await variantService.sync(savedProductId, variantsPayload);
        } else if (productId) {
          await variantService.sync(savedProductId, []);
        }
      }

      if (keepEditing) {
        showToast('success', productId ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!');
        if (!productId && savedProductId) {
          setSearchParams({ tab: 'update_product', productId: savedProductId });
        }
      } else {
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch (e) {
      let msg = typeof e === 'object' && e !== null ? (e.message || JSON.stringify(e)) : String(e);
      if (typeof e === 'object' && e.errors) {
        msg = JSON.stringify(e.errors);
      }
      showToast("error", "Lỗi lưu sản phẩm", msg);
    } finally {
      setSaving(false);
    }
  };

  return {
    categories,
    brands,
    loading,
    saving,
    toast,
    setToast,
    showToast,
    uploading,
    setUploading,
    isDragOver,
    setIsDragOver,
    formData,
    setFormData,
    ...variantState,
    handleSave,
    handleImageUpload,
    setMainImage,
    updateImageOrder,
    removeImage
  };
};
