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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
  };

  // Định dạng số lượng: 1000 -> 1,000
  const formatNumber = (number) => {
    return new Intl.NumberFormat('vi-VN').format(number);
  };

  return {
    formatCurrency,
    formatDate,
    formatNumber
  };
};
