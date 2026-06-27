// src/utils/productHelper.js

/**
 * Phân loại sản phẩm thành một trong 4 mặt hàng kinh doanh:
 * điện thoại, Tablet, SmartWatch, Phụ kiện
 * @param {object} product Đối tượng sản phẩm từ API
 * @returns {string} Tên ngành hàng
 */
export const getProductCategory = (product) => {
  if (!product) return 'điện thoại';
  
  const desc = product.description || '';
  
  // 0. Trích xuất từ tag [Category: ...] trong mô tả nếu có
  const match = desc.match(/\[Category:\s*([^\]]+)\]/i);
  if (match && match[1]) {
    const matchedCat = match[1].trim();
    // Chuẩn hóa tên ngành hàng
    if (matchedCat.toLowerCase() === 'điện thoại') return 'điện thoại';
    if (matchedCat.toLowerCase() === 'tablet') return 'Tablet';
    if (matchedCat.toLowerCase() === 'smartwatch') return 'SmartWatch';
    if (matchedCat.toLowerCase() === 'phụ kiện') return 'Phụ kiện';
  }
  
  const name = (product.name || '').toLowerCase();
  
  // 1. Phân loại Tablet
  if (
    name.includes('tablet') || 
    name.includes('tab ') || 
    name.includes('ipad') || 
    desc.toLowerCase().includes('máy tính bảng')
  ) {
    return 'Tablet';
  }
  
  // 2. Phân loại SmartWatch
  if (
    name.includes('watch') || 
    name.includes('smartwatch') || 
    name.includes('đồng hồ') || 
    name.includes('gear') ||
    desc.toLowerCase().includes('đồng hồ thông minh')
  ) {
    return 'SmartWatch';
  }
  
  // 3. Phân loại Phụ kiện
  if (
    name.includes('cáp') || 
    name.includes('sạc') || 
    name.includes('tai nghe') || 
    name.includes('ốp') || 
    name.includes('bao da') || 
    name.includes('phụ kiện') || 
    name.includes('charger') || 
    name.includes('cable') || 
    name.includes('earphone') || 
    name.includes('headphone') || 
    name.includes('case') || 
    name.includes('adapter') || 
    name.includes('sd card') || 
    name.includes('thẻ nhớ') || 
    name.includes('cường lực')
  ) {
    return 'Phụ kiện';
  }
  
  // 4. Mặc định là điện thoại
  return 'điện thoại';
};

/**
 * Loại bỏ tag danh mục khỏi mô tả khi hiển thị cho người dùng
 * @param {string} description Mô tả sản phẩm
 * @returns {string} Mô tả sạch không chứa tag
 */
export const cleanDescription = (description) => {
  if (!description) return '';
  return description.replace(/\[Category:\s*[^\]]+\]/gi, '').trim();
};
