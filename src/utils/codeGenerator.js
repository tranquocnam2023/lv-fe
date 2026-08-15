// Hàm thực thi logic: removeDiacriticsAndSpecialChars
const removeDiacriticsAndSpecialChars = (str) => {
  let s = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s.replace(/[^a-zA-Z\s]/g, '');
};

// Hàm thực thi logic: removeDiacriticsAndSpecialCharsAllowNumbers
const removeDiacriticsAndSpecialCharsAllowNumbers = (str) => {
  let s = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s.replace(/[^a-zA-Z0-9\s]/g, '');
};

// Hàm thực thi logic: generateBrandOrCategoryCode
export const generateBrandOrCategoryCode = (name, maxLength) => {
  if (!name || !name.trim()) return '';
  // Khai báo biến/hằng số: cleanName - Dùng trong logic xử lý của component
  const cleanName = removeDiacriticsAndSpecialChars(name);
  // Khai báo biến/hằng số: words - Dùng trong logic xử lý của component
  const words = cleanName.split(/\s+/).filter(Boolean);
  let code = '';
  
  if (words.length === 1) {
    code = words[0];
  } else {
    code = words.map(w => w[0]).join('');
  }
  
  code = code.toUpperCase();
  return code.length > maxLength ? code.substring(0, maxLength) : code;
};

// Hàm thực thi logic: generateProductCode
export const generateProductCode = (name, maxLength = 20) => {
  if (!name || !name.trim()) return '';
  // Khai báo biến/hằng số: cleanName - Dùng trong logic xử lý của component
  const cleanName = removeDiacriticsAndSpecialCharsAllowNumbers(name);
  // Khai báo biến/hằng số: words - Dùng trong logic xử lý của component
  const words = cleanName.split(/\s+/).filter(Boolean);
  let code = '';
  
  words.forEach(word => {
    if (/\d/.test(word)) {
      code += word;
    } else {
      code += word[0];
    }
  });
  
  code = code.toUpperCase();
  return code.length > maxLength ? code.substring(0, maxLength) : code;
};

// Hàm thực thi logic: generateSlug
export const generateSlug = (str) => {
  if (!str) return '';
  let s = str.toLowerCase();
  s = s.replace(/đ/g, 'd');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9\s-]/g, '');
  s = s.trim().replace(/\s+/g, '-');
  return s;
};
