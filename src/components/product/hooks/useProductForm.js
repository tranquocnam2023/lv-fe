import React, { useState, useEffect, useMemo } from 'react';
import { categoryService } from '../../../services/categoryService';
import { brandService } from '../../../services/brandService';
import { productService } from '../../../services/productService';
import { variantService } from '../../../services/variantService';
import { generateProductCode } from '../../../utils/codeGenerator';

const AVAILABLE_ATTRIBUTES = ['Màu sắc', 'Dung lượng RAM - ROM', 'Kích thước', 'Phiên bản'];

// Helper to compute Cartesian product
const cartesianProduct = (arrays) => {
  return arrays.reduce((acc, curr) => {
    return acc.flatMap(x => curr.map(y => [...x, y]));
  }, [[]]);
};

// Helpers for SKU generation following Backend rules
const removeDiacritics = (text) => {
  if (!text) return '';
  let str = text.toString();
  str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
  str = str.replace(/[ÀÁẠẢÃÂẤẦẬẨẪĂẮẰẶẲẴ]/g, "A");
  str = str.replace(/[èéẹẻẽêềếệểễ]/g, "e");
  str = str.replace(/[ÈÉẸẺẼÊẾỀỆỂỄ]/g, "E");
  str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
  str = str.replace(/[ÓÒỌỎÕÔỐỒỘỔỖƠỚỜỢỞỠ]/g, "O");
  str = str.replace(/[ùúụủũưừứựửữ]/g, "u");
  str = str.replace(/[ÚÙỤỦŨƯỨỪỰỬỮ]/g, "U");
  str = str.replace(/[ìíịỉĩ]/g, "i");
  str = str.replace(/[ÍÌỊỈĨ]/g, "I");
  str = str.replace(/đ/g, "d");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/[ỳýỵỷỹ]/g, "y");
  str = str.replace(/[ÝỲỴỶỸ]/g, "Y");
  return str;
};

const processAttributeValue = (attrName, attrValue) => {
  if (!attrValue) return '';
  const cleanVal = attrValue.trim().replace(/\s+/g, ' ');

  // Case 2: ROM/RAM -> Keep digits only
  if (attrName.includes("Dung lượng") || attrName.includes("RAM") || attrName.includes("ROM")) {
    return cleanVal.replace(/\D/g, '');
  }

  // Case 1: Màu sắc, Kích thước, Phiên bản, etc.
  const words = cleanVal.split(' ').filter(w => w.length > 0);
  if (words.length === 1) {
    const unsigned = removeDiacritics(words[0]);
    const lettersAndDigits = unsigned.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return lettersAndDigits.slice(0, 5);
  } else if (words.length > 1) {
    const firstLetters = words.map(w => {
      const unsigned = removeDiacritics(w);
      const valid = unsigned.replace(/[^a-zA-Z0-9]/g, '');
      return valid.length > 0 ? valid[0] : '';
    }).filter(c => c !== '').join('').toUpperCase();
    return firstLetters.slice(0, 10);
  }

  return '';
};

const generateVariantSku = (brandCode, productCode, combinationParts) => {
  const bCode = (brandCode || 'GEN').toUpperCase();
  const pCode = (productCode || 'PROD').toUpperCase();

  const sortedParts = [...combinationParts].sort((a, b) => a.optionId.localeCompare(b.optionId));

  const attrParts = [];
  sortedParts.forEach(part => {
    const processed = processAttributeValue(part.optionName, part.valueText);
    if (processed) {
      attrParts.push(processed);
    }
  });

  const suffix = attrParts.length > 0 ? attrParts.join('-') : '';
  return suffix ? `${bCode}-${pCode}-${suffix}`.toUpperCase() : `${bCode}-${pCode}`.toUpperCase();
};

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
    basePrice: 0,
    originalPrice: 0,
    totalStock: 0,
    isActive: true,
    isFeatured: false,
    images: [],
    hasVariants: false
  });

  // Options state
  const [options, setOptions] = useState([]);

  // Excluded (deleted) variant combinations
  const [excludedKeys, setExcludedKeys] = useState([]);

  // Expanded variant key for inline detailed editor
  const [expandedVariantKey, setExpandedVariantKey] = useState(null);

  // Selected variant keys for bulk actions
  const [selectedVariantKeys, setSelectedVariantKeys] = useState([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  // Variants store mapping
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
                      if (k !== 'costPrice' && k !== 'chargeTax' && !optionNames.includes(k)) {
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

                      parsedVarsData[key] = {
                        id: v.id,
                        name: finalName,
                        sku: v.sku || '',
                        price: v.price,
                        totalStock: v.totalStock,
                        isActive: v.isActive !== false,
                        imageId: v.imageId || '',
                        costPrice: attrs.costPrice || '',
                        chargeTax: attrs.chargeTax !== false
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
    const oldName = formData.name;

    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: generateSlug(newName)
    }));

    if (oldName && oldName.trim() !== '' && oldName !== newName) {
      setVariantsData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const v = updated[key];
          if (v && v.name) {
            const escapedOldName = oldName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(escapedOldName, 'g');
            updated[key] = {
              ...v,
              name: v.name.replace(regex, newName)
            };
          }
        });
        return updated;
      });
    }
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

  const updateValueText = (optId, valId, newText) => {
    const targetOpt = options.find(o => o.id === optId);
    const targetVal = targetOpt?.values.find(v => v.internalId === valId);
    const oldText = targetVal ? targetVal.text : '';

    setOptions(prev => prev.map(o => {
      if (o.id === optId) {
        let newValues = o.values.map(val =>
          val.internalId === valId ? { ...val, text: newText } : val
        );
        const targetIndex = newValues.findIndex(val => val.internalId === valId);
        if (targetIndex === newValues.length - 1 && newText.trim() !== '') {
          newValues.push({ internalId: `val-${optId.replace('opt-', '')}-${Date.now()}`, text: '' });
        }
        return { ...o, values: newValues };
      }
      return o;
    }));

    if (oldText && oldText.trim() !== '' && oldText !== newText) {
      setVariantsData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const parts = key.split('|');
          if (parts.includes(`${optId}:${valId}`)) {
            const v = updated[key];
            if (v && v.name) {
              const escapedOldText = oldText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
              const regex = new RegExp(escapedOldText, 'g');
              updated[key] = {
                ...v,
                name: v.name.replace(regex, newText)
              };
            }
          }
        });
        return updated;
      });
    }
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
          showToast("warning", "Vui lòng nhập ít nhất một giá trị cho tùy chọn này.");
          return o;
        }

        if (o.name === "Màu sắc" || o.name === "Kích thước") {
          const hasInvalid = filteredValues.some(v => /^\d+$/.test(String(v.text).trim()));
          if (hasInvalid) {
            showToast("warning", `Thuộc tính '${o.name}' không được phép chỉ chứa toàn các con số.`);
            return o;
          }
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
  const activeOptions = useMemo(() => {
    return options.map(opt => ({
      ...opt,
      values: opt.values.filter(v => v && v.text && String(v.text).trim() !== '')
    })).filter(o => o.name && o.values.length > 0);
  }, [options]);

  const combinationArrays = useMemo(() => {
    return activeOptions.map(opt =>
      opt.values.map(val => ({
        optionId: opt.id,
        optionName: opt.name,
        valueId: opt.id + ':' + val.internalId,
        valueText: val.text
      }))
    );
  }, [activeOptions]);

  const generatedCombinations = useMemo(() => {
    return combinationArrays.length > 0 ? cartesianProduct(combinationArrays) : [];
  }, [combinationArrays]);

  const activeCombinations = useMemo(() => {
    return generatedCombinations.filter(comb => {
      const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
      const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
      return !excludedKeys.includes(key);
    });
  }, [generatedCombinations, excludedKeys]);

  const duplicateSkuKeys = useMemo(() => {
    const skus = {};
    const duplicates = new Set();

    const selectedBrand = brands.find(b => b.id === Number(formData.brandId));
    const brandCode = selectedBrand?.brandCode || 'GEN';
    const productCode = formData.productCode.trim() || generateProductCode(formData.name, 20);

    activeCombinations.forEach(comb => {
      const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
      const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
      const vData = variantsData[key];
      const defaultSku = generateVariantSku(brandCode, productCode, comb);
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
  }, [activeCombinations, variantsData, formData.name, formData.brandId, formData.productCode, brands]);

  const updateVariantField = (key, field, value) => {
    setVariantsData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSelectByAttribute = (optionId, valueText) => {
    const matchedKeys = [];
    activeCombinations.forEach(comb => {
      const hasMatch = comb.some(p => p.optionId === optionId && p.valueText === valueText);
      if (hasMatch) {
        const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
        const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
        matchedKeys.push(key);
      }
    });

    setSelectedVariantKeys(prev => {
      const newSelection = [...prev];
      matchedKeys.forEach(k => {
        if (!newSelection.includes(k)) {
          newSelection.push(k);
        }
      });
      return newSelection;
    });
  };

  const handleApplyBulkEdit = (price, stock) => {
    if (selectedVariantKeys.length === 0) return;

    setVariantsData(prev => {
      const updated = { ...prev };
      selectedVariantKeys.forEach(key => {
        updated[key] = {
          ...updated[key]
        };
        if (price !== undefined) {
          updated[key].price = price;
        }
        if (stock !== undefined) {
          updated[key].totalStock = stock;
        }
      });
      return updated;
    });
    showToast("success", `Đã cập nhật hàng loạt cho ${selectedVariantKeys.length} biến thể.`);
  };

  const allActiveKeys = useMemo(() => {
    return activeCombinations.map(comb => {
      const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
      return sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
    });
  }, [activeCombinations]);

  const isAllSelected = allActiveKeys.length > 0 && allActiveKeys.every(k => selectedVariantKeys.includes(k));
  const isSomeSelected = allActiveKeys.length > 0 && allActiveKeys.some(k => selectedVariantKeys.includes(k)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVariantKeys([]);
    } else {
      setSelectedVariantKeys(allActiveKeys);
    }
  };

  useEffect(() => {
    setSelectedVariantKeys(prev => prev.filter(k => allActiveKeys.includes(k)));
  }, [allActiveKeys]);

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
      const sortedImages = [...formData.images].sort((a, b) => a.order - b.order);
      const mainImage = sortedImages.find(i => i.isMain)?.url || "";
      const otherImages = sortedImages.filter(i => !i.isMain).map(i => i.url);
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
            if (vData?.chargeTax !== undefined) {
              attributeObj.chargeTax = !!vData.chargeTax;
            }

            const combName = comb.map(p => p.valueText).join(' - ');
            const defaultName = `${formData.name} - ${combName}`;
            const defaultSku = generateVariantSku(brandCode, generatedCode, comb);

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
    options,
    setOptions,
    excludedKeys,
    setExcludedKeys,
    expandedVariantKey,
    setExpandedVariantKey,
    selectedVariantKeys,
    setSelectedVariantKeys,
    bulkPrice,
    setBulkPrice,
    bulkStock,
    setBulkStock,
    variantsData,
    setVariantsData,
    activeOptions,
    activeCombinations,
    duplicateSkuKeys,
    allActiveKeys,
    isAllSelected,
    isSomeSelected,
    generateVariantSku,
    updateVariantField,
    handleSelectByAttribute,
    handleApplyBulkEdit,
    handleToggleSelectAll,
    handleSave,
    handleNameChange,
    handleImageUpload,
    setMainImage,
    updateImageOrder,
    removeImage,
    addOptionRow,
    removeOptionRow,
    updateOptionName,
    updateValueText,
    removeOptionValue,
    handleDoneOption,
    handleEditOption,
    handleValueKeyDown,
    AVAILABLE_ATTRIBUTES
  };
};
