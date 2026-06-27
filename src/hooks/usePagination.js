import { useState, useMemo } from 'react';

/**
 * Hook xử lý logic phân trang cho mảng dữ liệu
 * @param {Array} data - Toàn bộ mảng dữ liệu cần phân trang
 * @param {number} itemsPerPage - Số lượng mục trên mỗi trang
 */
export const usePagination = (data = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Tính tổng số trang
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Lấy dữ liệu của trang hiện tại
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  // Chuyển đến trang cụ thể
  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  // Sang trang tiếp theo
  const nextPage = () => goToPage(currentPage + 1);

  // Quay lại trang trước
  const prevPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, data.length),
    totalItems: data.length
  };
};
