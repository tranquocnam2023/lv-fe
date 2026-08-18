import { useState, useEffect, useMemo } from 'react';
import { generateProductCode } from '../utils/codeGenerator';

// Khai báo biến/hằng số: AVAILABLE_ATTRIBUTES - Dùng trong logic xử lý của component
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

// Hàm xử lý logic/sự kiện: processAttributeValue
const processAttributeValue = (attrName, attrValue) => {
  if (!attrValue) return '';
  // Khai báo biến/hằng số: cleanVal - Dùng trong logic xử lý của component
  const cleanVal = attrValue.trim().replace(/\s+/g, ' ');

  // Case 2: ROM/RAM -> Keep digits only
  if (attrName.includes("Dung lượng") || attrName.includes("RAM") || attrName.includes("ROM")) {
    return cleanVal.replace(/\D/g, '');
  }

  // Case 1: Màu sắc, Kích thước, Phiên bản, etc.
  const words = cleanVal.split(' ').filter(w => w.length > 0);
  if (words.length === 1) {
    // Khai báo biến/hằng số: unsigned - Dùng trong logic xử lý của component
    const unsigned = removeDiacritics(words[0]);
    // Khai báo biến/hằng số: lettersAndDigits - Dùng trong logic xử lý của component
    const lettersAndDigits = unsigned.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return lettersAndDigits.slice(0, 5);
  } else if (words.length > 1) {
    // Hàm thực thi logic: firstLetters
    const firstLetters = words.map(w => {
      // Khai báo biến/hằng số: unsigned - Dùng trong logic xử lý của component
      const unsigned = removeDiacritics(w);
      // Khai báo biến/hằng số: valid - Dùng trong logic xử lý của component
      const valid = unsigned.replace(/[^a-zA-Z0-9]/g, '');
      return valid.length > 0 ? valid[0] : '';
    }).filter(c => c !== '').join('').toUpperCase();
    return firstLetters.slice(0, 10);
  }

  return '';
};

// Hàm thực thi logic: generateVariantSku
const generateVariantSku = (brandCode, productCode, combinationParts) => {
  // Khai báo biến/hằng số: bCode - Dùng trong logic xử lý của component
  const bCode = (brandCode || 'GEN').toUpperCase();
  // Khai báo biến/hằng số: pCode - Dùng trong logic xử lý của component
  const pCode = (productCode || 'PROD').toUpperCase();

  // Hàm thực thi logic: sortedParts
  const sortedParts = [...combinationParts].sort((a, b) => a.optionId.localeCompare(b.optionId));

  // Khai báo biến/hằng số: attrParts - Dùng trong logic xử lý của component
  const attrParts = [];
  sortedParts.forEach(part => {
    // Khai báo biến/hằng số: processed - Dùng trong logic xử lý của component
    const processed = processAttributeValue(part.optionName, part.valueText);
    if (processed) {
      attrParts.push(processed);
    }
  });

  // Khai báo biến/hằng số: suffix - Dùng trong logic xử lý của component
  const suffix = attrParts.length > 0 ? attrParts.join('-') : '';
  return suffix ? `${bCode}-${pCode}-${suffix}`.toUpperCase() : `${bCode}-${pCode}`.toUpperCase();
};

// Custom Hook: useProductVariants - Quản lý logic tái sử dụng useProductVariants
export const useProductVariants = ({ formData, setFormData, brands, showToast }) => {
  // State: options - Quản lý trạng thái và dữ liệu của options trong giao diện
  const [options, setOptions] = useState([]);
  // State: excludedKeys - Quản lý trạng thái và dữ liệu của excludedKeys trong giao diện
  const [excludedKeys, setExcludedKeys] = useState([]);
  // State: expandedVariantKey - Quản lý trạng thái và dữ liệu của expandedVariantKey trong giao diện
  const [expandedVariantKey, setExpandedVariantKey] = useState(null);
  // State: selectedVariantKeys - Quản lý trạng thái và dữ liệu của selectedVariantKeys trong giao diện
  const [selectedVariantKeys, setSelectedVariantKeys] = useState([]);
  // State: selectedAttributes - Quản lý trạng thái và dữ liệu của selectedAttributes trong giao diện
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  // State: bulkPrice - Quản lý trạng thái và dữ liệu của bulkPrice trong giao diện
  const [bulkPrice, setBulkPrice] = useState('');
  // State: bulkStock - Quản lý trạng thái và dữ liệu của bulkStock trong giao diện
  const [bulkStock, setBulkStock] = useState('');
  // State: variantsData - Quản lý trạng thái và dữ liệu của variantsData trong giao diện
  const [variantsData, setVariantsData] = useState({});

  // Hàm xử lý logic/sự kiện: handleNameChange
  const handleNameChange = (e) => {
    // Khai báo biến/hằng số: newName - Dùng trong logic xử lý của component
    const newName = e.target.value;
    // Khai báo biến/hằng số: oldName - Dùng trong logic xử lý của component
    const oldName = formData.name;

    // Hàm thực thi logic: generateSlug
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
        // Khai báo biến/hằng số: updated - Dùng trong logic xử lý của component
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          // Khai báo biến/hằng số: v - Dùng trong logic xử lý của component
          const v = updated[key];
          if (v && v.name) {
            // Khai báo biến/hằng số: escapedOldName - Dùng trong logic xử lý của component
            const escapedOldName = oldName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            // Khai báo biến/hằng số: regex - Dùng trong logic xử lý của component
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

  // Hàm thực thi logic: addOptionRow
  const addOptionRow = () => {
    if (options.length >= 4) return;
    // Khai báo biến/hằng số: nextId - Dùng trong logic xử lý của component
    const nextId = `opt-${Date.now()}`;
    // Hàm thực thi logic: unusedAttr
    const unusedAttr = AVAILABLE_ATTRIBUTES.find(attr => !options.some(o => o.name === attr)) || '';
    setOptions(prev => [...prev, {
      id: nextId,
      name: unusedAttr,
      isEditing: true,
      values: [{ internalId: `val-${Date.now()}-1`, text: '' }]
    }]);
  };

  // Hàm thực thi logic: removeOptionRow
  const removeOptionRow = (optId) => {
    setOptions(prev => prev.filter(o => o.id !== optId));
  };

  // Hàm thực thi logic: updateOptionName
  const updateOptionName = (optId, newName) => {
    setOptions(prev => prev.map(o => o.id === optId ? {
      ...o,
      name: newName,
      values: [{ internalId: `val-${optId.replace('opt-', '')}-${Date.now()}`, text: '' }]
    } : o));
  };

  // Hàm thực thi logic: updateValueText
  const updateValueText = (optId, valId, newText) => {
    // Hàm thực thi logic: targetOpt
    const targetOpt = options.find(o => o.id === optId);
    // Hàm thực thi logic: targetVal
    const targetVal = targetOpt?.values.find(v => v.internalId === valId);
    // Khai báo biến/hằng số: oldText - Dùng trong logic xử lý của component
    const oldText = targetVal ? targetVal.text : '';

    setOptions(prev => prev.map(o => {
      if (o.id === optId) {
        let newValues = o.values.map(val =>
          val.internalId === valId ? { ...val, text: newText } : val
        );
        // Hàm thực thi logic: targetIndex
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
        // Khai báo biến/hằng số: updated - Dùng trong logic xử lý của component
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          // Khai báo biến/hằng số: parts - Dùng trong logic xử lý của component
          const parts = key.split('|');
          if (parts.includes(`${optId}:${valId}`)) {
            // Khai báo biến/hằng số: v - Dùng trong logic xử lý của component
            const v = updated[key];
            if (v && v.name) {
              // Khai báo biến/hằng số: escapedOldText - Dùng trong logic xử lý của component
              const escapedOldText = oldText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
              // Khai báo biến/hằng số: regex - Dùng trong logic xử lý của component
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

  // Hàm thực thi logic: removeOptionValue
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

  // Hàm xử lý logic/sự kiện: handleDoneOption
  const handleDoneOption = (optId) => {
    setOptions(prev => prev.map(o => {
      if (o.id === optId) {
        // Hàm thực thi logic: filteredValues
        const filteredValues = o.values.filter(v => v && v.text && String(v.text).trim() !== '');
        if (filteredValues.length === 0) {
          showToast("warning", "Vui lòng nhập ít nhất một giá trị cho tùy chọn này.");
          return o;
        }

        if (o.name === "Màu sắc" || o.name === "Kích thước") {
          // Hàm thực thi logic: hasInvalid
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

  // Hàm xử lý logic/sự kiện: handleEditOption
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

  // Hàm xử lý logic/sự kiện: handleValueKeyDown
  const handleValueKeyDown = (e, opt, valId, vIdx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Khai báo biến/hằng số: container - Dùng trong logic xử lý của component
      const container = e.currentTarget.closest('.values-container');
      if (container) {
        // Khai báo biến/hằng số: inputs - Dùng trong logic xử lý của component
        const inputs = container.querySelectorAll('input.value-input');
        // Khai báo biến/hằng số: nextInput - Dùng trong logic xử lý của component
        const nextInput = inputs[vIdx + 1];
        if (nextInput) {
          nextInput.focus();
        } else {
          // Khai báo biến/hằng số: currentVal - Dùng trong logic xử lý của component
          const currentVal = opt.values[vIdx];
          if (currentVal && currentVal.text && String(currentVal.text).trim() !== '') {
            setTimeout(() => {
              // Khai báo biến/hằng số: updatedInputs - Dùng trong logic xử lý của component
              const updatedInputs = container.querySelectorAll('input.value-input');
              // Khai báo biến/hằng số: lastInput - Dùng trong logic xử lý của component
              const lastInput = updatedInputs[updatedInputs.length - 1];
              if (lastInput) lastInput.focus();
            }, 50);
          }
        }
      }
    }
  };

  // Hàm thực thi logic: activeOptions
  const activeOptions = useMemo(() => {
    return options.map(opt => ({
      ...opt,
      values: opt.values.filter(v => v && v.text && String(v.text).trim() !== '')
    })).filter(o => o.name && o.values.length > 0);
  }, [options]);

  // Hàm thực thi logic: combinationArrays
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

  // Hàm thực thi logic: generatedCombinations
  const generatedCombinations = useMemo(() => {
    return combinationArrays.length > 0 ? cartesianProduct(combinationArrays) : [];
  }, [combinationArrays]);

  // Hàm thực thi logic: activeCombinations
  const activeCombinations = useMemo(() => {
    return generatedCombinations.filter(comb => {
      // Hàm thực thi logic: sortedParts
      const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
      // Hàm thực thi logic: key
      const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
      return !excludedKeys.includes(key);
    });
  }, [generatedCombinations, excludedKeys]);

  // Hàm thực thi logic: duplicateSkuKeys
  const duplicateSkuKeys = useMemo(() => {
    // Khai báo biến/hằng số: skus - Dùng trong logic xử lý của component
    const skus = {};
    // Khai báo biến/hằng số: duplicates - Dùng trong logic xử lý của component
    const duplicates = new Set();

    // Hàm thực thi logic: selectedBrand
    const selectedBrand = brands.find(b => b.id === Number(formData.brandId));
    // Khai báo biến/hằng số: brandCode - Dùng trong logic xử lý của component
    const brandCode = selectedBrand?.brandCode || 'GEN';
    // Khai báo biến/hằng số: productCode - Dùng trong logic xử lý của component
    const productCode = formData.productCode.trim() || generateProductCode(formData.name, 20);

    activeCombinations.forEach(comb => {
      // Hàm thực thi logic: sortedParts
      const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
      // Hàm thực thi logic: key
      const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
      // Cấu hình/Hằng số/Dịch vụ dữ liệu: vData
      const vData = variantsData[key];
      // Khai báo biến/hằng số: defaultSku - Dùng trong logic xử lý của component
      const defaultSku = generateVariantSku(brandCode, productCode, comb);
      // Khai báo biến/hằng số: sku - Dùng trong logic xử lý của component
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

  // Hàm thực thi logic: updateVariantField
  const updateVariantField = (key, field, value) => {
    setVariantsData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  // Hàm xử lý logic/sự kiện: handleSelectByAttribute
  const handleSelectByAttribute = (optionId, valueText) => {
    // Khai báo biến/hằng số: attrKey - Dùng trong logic xử lý của component
    const attrKey = `${optionId}:${valueText}`;
    setSelectedAttributes(prev => {
      // Khai báo biến/hằng số: isAlreadySelected - Dùng trong logic xử lý của component
      const isAlreadySelected = prev.includes(attrKey);
      // Khai báo biến/hằng số: nextAttrs - Dùng trong logic xử lý của component
      const nextAttrs = isAlreadySelected 
        ? prev.filter(a => a !== attrKey)
        : [...prev, attrKey];

      // Khai báo biến/hằng số: matchedKeys - Dùng trong logic xử lý của component
      const matchedKeys = [];
      activeCombinations.forEach(comb => {
        // Hàm thực thi logic: sortedParts
        const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
        // Hàm thực thi logic: key
        const key = sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');

        // Hàm thực thi logic: matchesAny
        const matchesAny = nextAttrs.some(attr => {
          // State: optId - Quản lý trạng thái và dữ liệu của optId trong giao diện
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

  // Hàm xử lý logic/sự kiện: handleApplyBulkEdit
  const handleApplyBulkEdit = (price, stock) => {
    if (selectedVariantKeys.length === 0) return;

    setVariantsData(prev => {
      // Khai báo biến/hằng số: updated - Dùng trong logic xử lý của component
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

  // Hàm xử lý logic/sự kiện: handleBulkStatusToggle
  const handleBulkStatusToggle = () => {
    if (selectedVariantKeys.length === 0) return;
    setVariantsData(prev => {
      // Khai báo biến/hằng số: updated - Dùng trong logic xử lý của component
      const updated = { ...prev };
      selectedVariantKeys.forEach(key => {
        // Cấu hình/Hằng số/Dịch vụ dữ liệu: currentData
        const currentData = updated[key] || {};
        // Khai báo biến/hằng số: currentIsActive - Dùng trong logic xử lý của component
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

  // Hàm xử lý logic/sự kiện: handleBulkDelete
  const handleBulkDelete = () => {
    if (selectedVariantKeys.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedVariantKeys.length} biến thể đã chọn?`)) {
      setExcludedKeys(prev => {
        // Khai báo biến/hằng số: newExcluded - Dùng trong logic xử lý của component
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

  // Hàm thực thi logic: allActiveKeys
  const allActiveKeys = useMemo(() => {
    return activeCombinations.map(comb => {
      // Hàm thực thi logic: sortedParts
      const sortedParts = [...comb].sort((a, b) => a.optionId.localeCompare(b.optionId));
      return sortedParts.map(p => `${p.optionId}:${p.valueId.split(':').pop()}`).join('|');
    });
  }, [activeCombinations]);

  // Hàm thực thi logic: isAllSelected
  const isAllSelected = allActiveKeys.length > 0 && allActiveKeys.every(k => selectedVariantKeys.includes(k));
  // Hàm thực thi logic: isSomeSelected
  const isSomeSelected = allActiveKeys.length > 0 && allActiveKeys.some(k => selectedVariantKeys.includes(k)) && !isAllSelected;

  // Hàm xử lý logic/sự kiện: handleToggleSelectAll
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVariantKeys([]);
    } else {
      setSelectedVariantKeys(allActiveKeys);
    }
  };

  // Bỏ khỏi danh sách đang chọn những biến thể vừa bị vô hiệu hoá.
  // Chỉnh trong lúc render theo hướng dẫn của React thay vì useEffect, và so sánh bằng chữ ký
  // nội dung: allActiveKeys là mảng mới sau mỗi lần useMemo tính lại, nên so sánh theo tham
  // chiếu như effect cũ sẽ chạy lại nhiều hơn cần thiết.
  const activeKeysSignature = allActiveKeys.join('|');
  const [prevActiveKeysSignature, setPrevActiveKeysSignature] = useState(activeKeysSignature);
  if (prevActiveKeysSignature !== activeKeysSignature) {
    setPrevActiveKeysSignature(activeKeysSignature);
    setSelectedVariantKeys(prev => prev.filter(k => allActiveKeys.includes(k)));
  }

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
