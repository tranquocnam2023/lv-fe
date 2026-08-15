import { useEffect, useRef } from 'react';
import { categoryService } from '../services/categoryService';
import { categoryBrandDefaultService } from '../services/categoryBrandDefaultService';

// Custom Hook: useProductSpecs - Quản lý logic tái sử dụng useProductSpecs
export const useProductSpecs = ({ formData, setFormData, categories, brands }) => {
  // Reference (useRef): prevBrandIdRef - Lưu vết tham chiếu DOM hoặc giá trị không gây re-render
  const prevBrandIdRef = useRef(null);

  useEffect(() => {
    // Hàm thực thi logic: loadSpecsTemplate
    const loadSpecsTemplate = async () => {
      if (!formData.categoryId) return;
      try {
        let category = await categoryService.getById(formData.categoryId);
        // Khai báo biến/hằng số: templatesToMerge - Dùng trong logic xử lý của component
        const templatesToMerge = [];

        // Duyệt ngược lên gốc để thu thập tất cả các template cấu hình
        while (category) {
          if (category.specsTemplate && category.specsTemplate.trim() !== '' && category.specsTemplate.trim() !== '[]') {
            templatesToMerge.unshift(category.specsTemplate); // Đưa danh mục cha lên trước danh mục con
          }
          if (category.parentId) {
            category = await categoryService.getById(category.parentId);
          } else {
            break;
          }
        }

        if (templatesToMerge.length > 0) {
          // Khai báo biến/hằng số: mergedGroups - Dùng trong logic xử lý của component
          const mergedGroups = [];

          // Gộp và loại bỏ các nhóm/thuộc tính trùng lặp (không phân biệt chữ hoa/thường)
          for (const templateStr of templatesToMerge) {
            try {
              // Khai báo biến/hằng số: template - Dùng trong logic xử lý của component
              const template = JSON.parse(templateStr);
              if (Array.isArray(template)) {
                for (const group of template) {
                  if (!group.groupName) continue;
                  // Khai báo biến/hằng số: normalizedGroupName - Dùng trong logic xử lý của component
                  const normalizedGroupName = group.groupName.trim().toUpperCase();

                  let existingGroup = mergedGroups.find(
                    g => g.groupName.trim().toUpperCase() === normalizedGroupName
                  );

                  if (!existingGroup) {
                    existingGroup = { groupName: group.groupName.trim(), items: [] };
                    mergedGroups.push(existingGroup);
                  }

                  for (const item of group.items) {
                    if (!item) continue;
                    // Khai báo biến/hằng số: trimmedItem - Dùng trong logic xử lý của component
                    const trimmedItem = item.trim();
                    // Khai báo biến/hằng số: normalizedItem - Dùng trong logic xử lý của component
                    const normalizedItem = trimmedItem.toLowerCase();

                    // Khai báo biến/hằng số: isDuplicate - Dùng trong logic xử lý của component
                    const isDuplicate = existingGroup.items.some(
                      existingItem => existingItem.toLowerCase() === normalizedItem
                    );

                    if (!isDuplicate && trimmedItem !== '') {
                      existingGroup.items.push(trimmedItem);
                    }
                  }
                }
              }
            } catch (parseErr) {
              console.error("Lỗi parse specs template khi gộp:", parseErr);
            }
          }

          if (mergedGroups.length > 0) {
            // Lấy tất cả cấu hình thương hiệu mặc định của danh mục này để biết giá trị mặc định của brand cũ
            let allDefaultsForCategory = [];
            try {
              allDefaultsForCategory = await categoryBrandDefaultService.getByCategory(formData.categoryId);
            } catch (err) {
              console.debug("Lỗi lấy cấu hình thương hiệu mặc định cho danh mục:", err);
            }

            // Lấy giá trị mặc định của brand mới
            let brandDefaults = {};
            if (formData.brandId) {
              // Hàm thực thi logic: newBrandConfig
              const newBrandConfig = allDefaultsForCategory.find(d => d.brandId === parseInt(formData.brandId));
              if (newBrandConfig && newBrandConfig.defaultSpecs) {
                try {
                  brandDefaults = JSON.parse(newBrandConfig.defaultSpecs);
                } catch (e) {
                  console.error("Lỗi parse default specs brand mới:", e);
                }
              }
            }

            // Lấy giá trị mặc định của brand cũ từ cache ref
            let prevBrandDefaults = {};
            // Khai báo biến/hằng số: prevBrandId - Dùng trong logic xử lý của component
            const prevBrandId = prevBrandIdRef.current;
            if (prevBrandId) {
              // Hàm thực thi logic: prevBrandConfig
              const prevBrandConfig = allDefaultsForCategory.find(d => d.brandId === parseInt(prevBrandId));
              if (prevBrandConfig && prevBrandConfig.defaultSpecs) {
                try {
                  prevBrandDefaults = JSON.parse(prevBrandConfig.defaultSpecs);
                } catch (e) {
                  console.error("Lỗi parse default specs brand cũ:", e);
                }
              }
            }

            // Hàm thực thi logic: initialSpecs
            const initialSpecs = mergedGroups.map(group => ({
              groupName: group.groupName,
              items: group.items.map(name => {
                // Khai báo biến/hằng số: defaultKey - Dùng trong logic xử lý của component
                const defaultKey = Object.keys(brandDefaults).find(
                  k => k.trim().toLowerCase() === name.trim().toLowerCase()
                );
                // Khai báo biến/hằng số: defaultValue - Dùng trong logic xử lý của component
                const defaultValue = defaultKey ? brandDefaults[defaultKey] : '';
                return { key: name, value: defaultValue };
              })
            }));

            setFormData(prev => {
              // 1. Nếu hoàn toàn chưa có specs: Điền specs hoàn chỉnh kèm các giá trị mặc định của brand mới
              if (!prev.specs || prev.specs.trim() === '' || prev.specs.trim() === '[]') {
                return {
                  ...prev,
                  specs: JSON.stringify(initialSpecs)
                };
              }

              // 2. Nếu đã có specs (Edit mode hoặc đang nhập nửa chừng):
              // Cập nhật/ghi đè các trường có định nghĩa giá trị mặc định của brand mới,
              // và tự động xóa trống các trường mang giá trị mặc định của brand cũ nếu brand mới không định nghĩa.
              try {
                // Khai báo biến/hằng số: currentSpecs - Dùng trong logic xử lý của component
                const currentSpecs = JSON.parse(prev.specs);
                if (Array.isArray(currentSpecs)) {
                  let updatedAny = false;
                  // Hàm thực thi logic: updatedSpecs
                  const updatedSpecs = currentSpecs.map(group => {
                    // Khai báo biến/hằng số: matchedMergedGroup - Dùng trong logic xử lý của component
                    const matchedMergedGroup = mergedGroups.find(
                      g => g.groupName.trim().toUpperCase() === group.groupName.trim().toUpperCase()
                    );
                    if (!matchedMergedGroup) return group;

                    return {
                      ...group,
                      items: group.items.map(item => {
                        // Khai báo biến/hằng số: lowercaseKey - Dùng trong logic xử lý của component
                        const lowercaseKey = item.key.trim().toLowerCase();

                        // Tìm key tương ứng trong brand mới
                        const newDefaultKey = Object.keys(brandDefaults).find(
                          k => k.trim().toLowerCase() === lowercaseKey
                        );

                        if (newDefaultKey) {
                          // A. Brand mới có cấu hình: Cập nhật nếu giá trị hiện tại khác giá trị mặc định mới
                          const newValue = brandDefaults[newDefaultKey] || '';
                          if (item.value !== newValue) {
                            updatedAny = true;
                            return { ...item, value: newValue };
                          }
                        } else {
                          // B. Brand mới không có cấu hình: 
                          // Nếu brand cũ có cấu hình và giá trị hiện tại khớp với giá trị mặc định của brand cũ -> Clear về trống.
                          const prevDefaultKey = Object.keys(prevBrandDefaults).find(
                            k => k.trim().toLowerCase() === lowercaseKey
                          );
                          if (prevDefaultKey) {
                            // Khai báo biến/hằng số: prevDefaultValue - Dùng trong logic xử lý của component
                            const prevDefaultValue = prevBrandDefaults[prevDefaultKey] || '';
                            if (item.value === prevDefaultValue) {
                              updatedAny = true;
                              return { ...item, value: '' };
                            }
                          }
                        }
                        return item;
                      })
                    };
                  });

                  if (updatedAny) {
                    return {
                      ...prev,
                      specs: JSON.stringify(updatedSpecs)
                    };
                  }
                }
              } catch (e) {
                console.error("Lỗi cập nhật specs khi đổi brand:", e);
              }

              return prev;
            });

            // Cập nhật ref lưu trữ thương hiệu trước đó
            prevBrandIdRef.current = formData.brandId;
          }
        }
      } catch (e) {
        console.error("Lỗi nạp specs template từ danh mục:", e);
      }
    };
    loadSpecsTemplate();
  }, [formData.categoryId, formData.brandId]);

  return {
    prevBrandIdRef
  };
};
