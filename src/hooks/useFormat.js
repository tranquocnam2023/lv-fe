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
 * Ví dụ: "ThÆ°Æ¡ng hiá»‡u" -> "Thương hiệu"
 */
export const fixVietnameseEncoding = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  try {
    // Nếu chuỗi chứa các ký tự mã hóa lỗi UTF-8 kép đặc trưng (Æ, ®, ±, ¼, ½, ¾, á», áº...)
    if (/[ÆØ¥§µ¶ÃÂÀÁÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(str)) {
      const decoded = decodeURIComponent(escape(str));
      if (decoded && decoded !== str) return decoded;
    }
  } catch {
    // Nếu giải mã lỗi thì trả về chuỗi gốc
  }
  return str;
};
