import { useState, useEffect, useMemo } from 'react';
import { generateProductCode } from '../utils/codeGenerator';

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

export const useProductVariants = ({ formData, setFormData, brands, showToast }) => {
  const [options, setOptions] = useState([]);
  const [excludedKeys, setExcludedKeys] = useState([]);
  const [expandedVariantKey, setExpandedVariantKey] = useState(null);
  const [selectedVariantKeys, setSelectedVariantKeys] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [variantsData, setVariantsData] = useState({});

  const handleNameChange = (e) => {
    const newName = e.target.value;
    const oldName = formData.name;

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
    const attrKey = `${optionId}:${valueText}`;
    setSelectedAttributes(prev => {
      const isAlreadySelected = prev.includes(attrKey);
      const nextAttrs = isAlreadySelected 
        ? prev.filter(a => a !== attrKey)
        : [...prev, attrKey];

      const matchedKeys = [];
      activeCombinations.forEach(comb => {
        const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
        const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');

        const matchesAny = nextAttrs.some(attr => {
          const [optId, valText] = attr.split(':');
          return comb.some(p => p.optionId === optId && p.valueText === valText);
        });

        if (matchesAny) {
          matchedKeys.push(key);
        }
      });

      setSelectedVariantKeys(matchedKeys);
      return nextAttrs;
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

  const handleBulkStatusToggle = () => {
    if (selectedVariantKeys.length === 0) return;
    setVariantsData(prev => {
      const updated = { ...prev };
      selectedVariantKeys.forEach(key => {
        const currentData = updated[key] || {};
        const currentIsActive = currentData.isActive !== false;
        updated[key] = {
          ...currentData,
          isActive: !currentIsActive
        };
      });
      return updated;
    });
    showToast("success", `Đã bật/tắt kích hoạt hàng loạt cho ${selectedVariantKeys.length} biến thể.`);
  };

  const handleBulkDelete = () => {
    if (selectedVariantKeys.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedVariantKeys.length} biến thể đã chọn?`)) {
      setExcludedKeys(prev => {
        const newExcluded = [...prev];
        selectedVariantKeys.forEach(k => {
          if (!newExcluded.includes(k)) {
            newExcluded.push(k);
          }
        });
        return newExcluded;
      });
      setSelectedVariantKeys([]);
      showToast("success", `Đã xóa hàng loạt ${selectedVariantKeys.length} biến thể.`);
    }
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

  return {
    options,
    setOptions,
    excludedKeys,
    setExcludedKeys,
    expandedVariantKey,
    setExpandedVariantKey,
    selectedVariantKeys,
    setSelectedVariantKeys,
    selectedAttributes,
    setSelectedAttributes,
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
    handleBulkStatusToggle,
    handleBulkDelete,
    handleToggleSelectAll,
    handleNameChange,
    addOptionRow,
    removeOptionRow,
    updateOptionName,
    updateValueText,
    removeOptionValue,
    handleDoneOption,
    handleEditOption,
    handleValueKeyDown,
    AVAILABLE_ATTRIBUTES,
    cartesianProduct
  };
};
