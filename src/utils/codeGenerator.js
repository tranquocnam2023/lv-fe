const removeDiacriticsAndSpecialChars = (str) => {
  let s = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s.replace(/[^a-zA-Z\s]/g, '');
};

const removeDiacriticsAndSpecialCharsAllowNumbers = (str) => {
  let s = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s.replace(/[^a-zA-Z0-9\s]/g, '');
};

export const generateBrandOrCategoryCode = (name, maxLength) => {
  if (!name || !name.trim()) return '';
  const cleanName = removeDiacriticsAndSpecialChars(name);
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

export const generateProductCode = (name, maxLength = 20) => {
  if (!name || !name.trim()) return '';
  const cleanName = removeDiacriticsAndSpecialCharsAllowNumbers(name);
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

export const generateSlug = (str) => {
  if (!str) return '';
  let s = str.toLowerCase();
  s = s.replace(/đ/g, 'd');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9\s-]/g, '');
  s = s.trim().replace(/\s+/g, '-');
  return s;
};
