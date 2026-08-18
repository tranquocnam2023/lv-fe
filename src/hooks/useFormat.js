/**
 * Hook cung cấp các hàm định dạng dữ liệu dùng chung
 */
export const useFormat = () => {

  // Định dạng tiền tệ VNĐ: 1000000 -> 1.000.000₫
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount).replace('₫', 'đ'); // Thay đổi ký hiệu nếu muốn
  };

  // Định dạng ngày tháng: 2024-05-01 -> 01/05/2024
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return String(dateString);
      }
      return new Intl.DateTimeFormat('vi-VN').format(date);
    } catch {
      return String(dateString);
    }
  };

  // Định dạng số lượng: 1000 -> 1,000
  const formatNumber = (number) => {
    return new Intl.NumberFormat('vi-VN').format(number);
  };

  return {
    formatCurrency,
    formatDate,
    formatNumber,
    fixVietnameseEncoding
  };
};

/**
 * Tự động sửa lỗi phông chữ / mã hóa UTF-8 bị lỗi (Mojibake double encoding)
 * Ví dụ: "ThÆ°Æ¡ng hiá»‡u" -> "Thương hiệu", "ThƯ°Æ¡ng hiệ»u" -> "Thương hiệu"
 */
export const fixVietnameseEncoding = (str) => {
  if (!str || typeof str !== 'string') return str || '';

  // 1. Khôi phục trực tiếp các cụm từ bị lỗi mã hóa Mojibake phổ biến
  let result = str
    .replace(/ThÆ°Æ¡ng hiá»‡u/gi, 'Thương hiệu')
    .replace(/ThƯ°Æ¡ng hiệ»u/gi, 'Thương hiệu')
    .replace(/ThƯ°Æ¡ng/gi, 'Thương')
    .replace(/ThÆ°Æ¡ng/gi, 'Thương')
    .replace(/hiệ»u/gi, 'hiệu')
    .replace(/hiá»‡u/gi, 'hiệu')
    .replace(/Æ¡/g, 'ơ')
    .replace(/Æ°/g, 'ư')
    .replace(/á»‡/g, 'ệ')
    .replace(/á»/g, 'ộ')
    .replace(/áº/g, 'ạ');

  // 2. Thử giải mã UTF-8 kép nếu còn các ký tự rác chưa được làm sạch
  if (result.includes('Æ') || result.includes('á»') || result.includes('áº') || result.includes('Ư°')) {
    try {
      const escaped = escape(result);
      if (!escaped.includes('%u')) {
        const decoded = decodeURIComponent(escaped);
        if (decoded && decoded !== result) result = decoded;
      }
    } catch {
      // Giữ kết quả ở bước 1
    }
  }

  return result;
};
