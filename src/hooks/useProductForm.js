import React, { useState, useEffect, useRef } from 'react';
import { categoryService } from '../services/categoryService';
import { brandService } from '../services/brandService';
import { productService } from '../services/productService';
import { variantService } from '../services/variantService';
import { generateProductCode } from '../utils/codeGenerator';
import { useProductSpecs } from './useProductSpecs';
import { useProductVariants } from './useProductVariants';

// Custom Hook: useProductForm - Quản lý logic tái sử dụng useProductForm
export const useProductForm = ({ productId, onBack, onSaveSuccess, searchParams, setSearchParams }) => {
  // State: categories - Quản lý trạng thái và dữ liệu của categories trong giao diện
  const [categories, setCategories] = useState([]);
  // State: brands - Quản lý trạng thái và dữ liệu của brands trong giao diện
  const [brands, setBrands] = useState([]);
  // State: loading - Quản lý trạng thái và dữ liệu của loading trong giao diện
  const [loading, setLoading] = useState(false);
  // State: saving - Quản lý trạng thái và dữ liệu của saving trong giao diện
  const [saving, setSaving] = useState(false);
  // State: toast - Quản lý trạng thái và dữ liệu của toast trong giao diện
  const [toast, setToast] = useState(null);

  // Hàm thực thi logic: showToast
  const showToast = (type, message, description = '') => {
    setToast({ type, message, description });
  };

  useEffect(() => {
    if (toast) {
      // Hàm thực thi logic: timer
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.type === 'success' ? 4000 : 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // State: uploading - Quản lý trạng thái và dữ liệu của uploading trong giao diện
  const [uploading, setUploading] = useState(false);
  // State: isDragOver - Quản lý trạng thái và dữ liệu của isDragOver trong giao diện
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
  
  // Khai báo biến/hằng số: variantState - Dùng trong logic xử lý của component
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
    // Hàm xử lý logic/sự kiện: handleKeyDown
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        // Khai báo biến/hằng số: activeEl - Dùng trong logic xử lý của component
        const activeEl = document.activeElement;
        // Khai báo biến/hằng số: isTyping - Dùng trong logic xử lý của component
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
    // Hàm xử lý logic/sự kiện: fetchData
    const fetchData = async () => {
      setLoading(true);
      try {
        // State: brandsData - Quản lý trạng thái và dữ liệu của brandsData trong giao diện
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
              // Khai báo biến/hằng số: allVars - Dùng trong logic xử lý của component
              const allVars = await variantService.getAll(productId);
              if (Array.isArray(allVars)) {
                // Khai báo biến/hằng số: targetProductId - Dùng trong logic xử lý của component
                const targetProductId = Number(productId);
                dbVariants = allVars.filter(v => Number(v.productId) === targetProductId);
              }
            } catch (err) {
              console.error("Lỗi tải biến thể:", err);
            }

            // Khai báo biến/hằng số: hasVars - Dùng trong logic xử lý của component
            const hasVars = dbVariants.length > 0;
            let parsedOpts = [];
            let parsedVarsData = {};

            if (hasVars) {
              // Khai báo biến/hằng số: optionNames - Dùng trong logic xử lý của component
              const optionNames = [];
              dbVariants.forEach(v => {
                if (v.attributes) {
                  try {
                    // Khai báo biến/hằng số: attrs - Dùng trong logic xử lý của component
                    const attrs = JSON.parse(v.attributes);
                    Object.keys(attrs).forEach(k => {
                      // Khai báo biến/hằng số: kLower - Dùng trong logic xử lý của component
                      const kLower = k.toLowerCase();
                      if (kLower !== 'costprice' && kLower !== 'chargetax' && !optionNames.includes(k)) {
                        optionNames.push(k);
                      }
                    });
                  } catch (e) { }
                }
              });

              parsedOpts = optionNames.map((name, optIdx) => {
                // Khai báo biến/hằng số: optId - Dùng trong logic xử lý của component
                const optId = `opt-${optIdx + 1}`;
                // Khai báo biến/hằng số: valueSet - Dùng trong logic xử lý của component
                const valueSet = new Set();
                dbVariants.forEach(v => {
                  if (v.attributes) {
                    try {
                      // Khai báo biến/hằng số: attrs - Dùng trong logic xử lý của component
                      const attrs = JSON.parse(v.attributes);
                      if (attrs[name]) {
                        // Khai báo biến/hằng số: valStr - Dùng trong logic xử lý của component
                        const valStr = String(attrs[name]).trim();
                        if (valStr) valueSet.add(valStr);
                      }
                    } catch (e) { }
                  }
                });

                // Hàm thực thi logic: values
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
                    // Khai báo biến/hằng số: attrs - Dùng trong logic xử lý của component
                    const attrs = JSON.parse(v.attributes);
                    // Khai báo biến/hằng số: keyParts - Dùng trong logic xử lý của component
                    const keyParts = [];
                    parsedOpts.forEach(opt => {
                      // Khai báo biến/hằng số: valText - Dùng trong logic xử lý của component
                      const valText = attrs[opt.name];
                      if (valText) {
                        // Hàm thực thi logic: valObj
                        const valObj = opt.values.find(val => val.text === String(valText).trim());
                        if (valObj) {
                          keyParts.push(`${opt.id}:${valObj.internalId}`);
                        }
                      }
                    });

                    if (keyParts.length === parsedOpts.length && keyParts.length > 0) {
                      // Khai báo biến/hằng số: key - Dùng trong logic xử lý của component
                      const key = keyParts.join('|');

                      // Hàm thực thi logic: combValues
                      const combValues = parsedOpts.map(opt => {
                        // Khai báo biến/hằng số: valText - Dùng trong logic xử lý của component
                        const valText = attrs[opt.name];
                        return valText ? String(valText).trim() : '';
                      }).filter(t => t !== '');
                      // Khai báo biến/hằng số: combName - Dùng trong logic xử lý của component
                      const combName = combValues.join(' - ');
                      // Khai báo biến/hằng số: defaultName - Dùng trong logic xử lý của component
                      const defaultName = `${productData.name || ''} - ${combName}`;

                      let isOutOfSync = false;
                      for (const valText of combValues) {
                        if (!v.name.toLowerCase().includes(valText.toLowerCase())) {
                          isOutOfSync = true;
                          break;
                        }
                      }
                      // Khai báo biến/hằng số: finalName - Dùng trong logic xử lý của component
                      const finalName = isOutOfSync ? defaultName : v.name;

                      let specsList = [];
                      if (v.specsOverride) {
                        try {
                          // Khai báo biến/hằng số: parsed - Dùng trong logic xử lý của component
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
                // Khai báo biến/hằng số: otherImgs - Dùng trong logic xử lý của component
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

              // Hàm thực thi logic: activeOpts
              const activeOpts = parsedOpts.map(opt => ({
                ...opt,
                values: opt.values.filter(v => v && v.text && String(v.text).trim() !== '')
              })).filter(o => o.name && o.values.length > 0);

              // Hàm thực thi logic: combArrays
              const combArrays = activeOpts.map(opt =>
                opt.values.map(val => ({
                  optionId: opt.id,
                  valueId: opt.id + ':' + val.internalId,
                }))
              );

              // Khai báo biến/hằng số: allCombs - Dùng trong logic xử lý của component
              const allCombs = combArrays.length > 0 ? cartesianProduct(combArrays) : [];
              // Khai báo biến/hằng số: dbKeys - Dùng trong logic xử lý của component
              const dbKeys = Object.keys(parsedVarsData);
              // Khai báo biến/hằng số: initialExcluded - Dùng trong logic xử lý của component
              const initialExcluded = [];

              allCombs.forEach(comb => {
                // Hàm thực thi logic: sortedParts
                const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
                // Hàm thực thi logic: key
                const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
                if (!dbKeys.includes(key)) {
                  initialExcluded.push(key);
                }
              });

              setExcludedKeys(initialExcluded);
            }
          }
        } else {
          // Khai báo biến/hằng số: queryBrandId - Dùng trong logic xử lý của component
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
    // Khai báo biến/hằng số: files - Dùng trong logic xử lý của component
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Khai báo biến/hằng số: newImages - Dùng trong logic xử lý của component
      const newImages = [...formData.images];
      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn (>2MB).`);
          continue;
        }
        // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
        const res = await productService.uploadLocalImage(file, 'products');
        if (res && res.url) {
          let finalUrl = res.url;
          if (finalUrl.startsWith('/')) {
            // Khai báo biến/hằng số: apiBase - Dùng trong logic xử lý của component
            const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
            // Khai báo biến/hằng số: hostBase - Dùng trong logic xử lý của component
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

  // Hàm xử lý logic/sự kiện: setMainImage
  const setMainImage = (index) => {
    if (index < 0 || index >= formData.images.length) return;
    // Khai báo biến/hằng số: newImages - Dùng trong logic xử lý của component
    const newImages = [...formData.images];
    // State: selectedImage - Quản lý trạng thái và dữ liệu của selectedImage trong giao diện
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    // Hàm thực thi logic: updatedImages
    const updatedImages = newImages.map((img, i) => ({
      ...img,
      isMain: i === 0,
      order: i
    }));
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };

  // Hàm thực thi logic: updateImageOrder
  const updateImageOrder = (index, newOrder) => {
    if (index < 0 || index >= formData.images.length) return;
    // Khai báo biến/hằng số: newImages - Dùng trong logic xử lý của component
    const newImages = [...formData.images];
    newImages[index].order = parseFloat(newOrder) || 0;
    newImages.sort((a, b) => a.order - b.order);
    // Hàm thực thi logic: updatedImages
    const updatedImages = newImages.map((img, i) => ({
      ...img,
      isMain: i === 0,
      order: i
    }));
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };

  // Hàm thực thi logic: removeImage
  const removeImage = (index) => {
    if (index < 0 || index >= formData.images.length) return;
    // Hàm thực thi logic: newImages
    const newImages = formData.images.filter((_, i) => i !== index);
    // Hàm thực thi logic: updatedImages
    const updatedImages = newImages.map((img, i) => ({
      ...img,
      isMain: i === 0,
      order: i
    }));
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };
  // logic nhập giá bán
  const handleSave = async (keepEditing = false) => {
    if (!formData.name) return showToast("warning", "Vui lòng nhập tên sản phẩm.");
    if (!formData.categoryId) return showToast("warning", "Vui lòng chọn danh mục.");

    if (formData.basePrice < 1000 || formData.basePrice > 500000000) {
      return showToast("warning", "Giá bán không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }
    if (formData.originalPrice && (formData.originalPrice < 1000 || formData.originalPrice > 500000000)) {
      return showToast("warning", "Giá gốc không hợp lệ (phải từ 1.000 đến 500.000.000 VNĐ)");
    }
    // RÀNG BUỘC GIÁ: Giá bán thực tế (đã giảm) không được phép lớn hơn giá gốc niêm yết cũ.
    // Nếu giá bán bằng giá gốc thì hệ thống vẫn cho phép lưu bình thường (không giảm giá).
    if(formData.basePrice > formData.originalPrice){
      return showToast("warning", "Giá bán không được lớn hơn giá gốc");
    }
    
    

    for (const opt of options) {
      if (opt.name === "Màu sắc" || opt.name === "Kích thước") {
        // Hàm thực thi logic: hasInvalid
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
      // Khai báo biến/hằng số: mainImage - Dùng trong logic xử lý của component
      const mainImage = formData.images[0]?.url || "";
      // Hàm thực thi logic: otherImages
      const otherImages = formData.images.slice(1).map(i => i.url);
      // =========================================================================
      // [XỬ LÝ MÃ SẢN PHẨM - FRONT-END]
      // - Nếu mã sản phẩm bỏ trống, FE tự sinh viết tắt từ tên sản phẩm (Ví dụ: "iPhone 15 Pro" -> "IP15P").
      // =========================================================================
      const rawCode = formData.productCode.trim() || generateProductCode(formData.name, 20);
      // Khai báo biến/hằng số: generatedCode - Dùng trong logic xử lý của component
      const generatedCode = rawCode || generateProductCode(formData.name, 20);
      //const generatedCode = `SP-${rawCode}`;

      let calculatedStock = 0;
      if (formData.hasVariants && activeCombinations.length > 0) {
        activeCombinations.forEach(comb => {
          // Hàm thực thi logic: sortedParts
          const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
          // Hàm thực thi logic: key
          const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
          // Cấu hình/Hằng số/Dịch vụ dữ liệu: vData
          const vData = variantsData[key];
          calculatedStock += vData ? (Number(vData.totalStock) || 0) : 0;
        });
      } else {
        calculatedStock = Number(formData.totalStock) || 0;
      }

      // Khai báo biến/hằng số: payload - Dùng trong logic xử lý của component
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
        // Lấy thuộc tính ID danh mục từ Form, ép kiểu sang số nguyên (int) để gán vào thuộc tính khóa ngoại của Product gửi lên API
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

      // Khai báo biến/hằng số: savedProductId - Dùng trong logic xử lý của component
      const savedProductId = resultProduct?.id || productId;

      if (savedProductId) {
        if (formData.hasVariants && activeCombinations.length > 0) {
          // Hàm thực thi logic: selectedBrand
          const selectedBrand = brands.find(b => b.id === Number(formData.brandId));
          // Khai báo biến/hằng số: brandCode - Dùng trong logic xử lý của component
          const brandCode = selectedBrand?.brandCode || 'GEN';

          // Hàm thực thi logic: variantsPayload
          const variantsPayload = activeCombinations.map(comb => {
            // Hàm thực thi logic: sortedParts
            const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
            // Hàm thực thi logic: key
            const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
            // Cấu hình/Hằng số/Dịch vụ dữ liệu: vData
            const vData = variantsData[key];

            // Khai báo biến/hằng số: attributeObj - Dùng trong logic xử lý của component
            const attributeObj = {};
            comb.forEach(part => {
              attributeObj[part.optionName] = part.valueText;
            });

            if (vData?.costPrice) {
              attributeObj.costPrice = Number(vData.costPrice);
            }

            // Hàm thực thi logic: combName
            const combName = comb.map(p => p.valueText).join(' - ');
            // Khai báo biến/hằng số: defaultName - Dùng trong logic xử lý của component
            const defaultName = `${formData.name} - ${combName}`;
            // Khai báo biến/hằng số: defaultSku - Dùng trong logic xử lý của component
            const defaultSku = generateVariantSku(brandCode, generatedCode, comb);

            // Khai báo biến/hằng số: specsOverrideObj - Dùng trong logic xử lý của component
            const specsOverrideObj = {};
            if (Array.isArray(vData?.specsOverrideList)) {
              vData.specsOverrideList.forEach(s => {
                if (s.key.trim() && s.value.trim()) {
                  specsOverrideObj[s.key.trim()] = s.value.trim();
                }
              });
            }
            // Khai báo biến/hằng số: specsOverrideStr - Dùng trong logic xử lý của component
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
    productId,
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
