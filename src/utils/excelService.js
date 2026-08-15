import api from '../services/api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: excelService
export const excelService = {
  // Xuất Báo cáo Tồn kho ra file Excel (CSV UTF-8 với BOM)
  exportInventoryReport: async (products, brands) => {
    try {
      // Khai báo biến/hằng số: variants - Dùng trong logic xử lý của component
      const variants = await api.get('/ProductVariant');
      // Khai báo biến/hằng số: headers - Dùng trong logic xử lý của component
      const headers = ["Mã sản phẩm (Product ID)", "Mã biến thể (Variant ID)", "Tên sản phẩm", "Tên biến thể", "Thương hiệu", "Tồn kho", "Đơn giá gốc (VNĐ)", "Tổng giá trị (VNĐ)"];
      // Khai báo biến/hằng số: rows - Dùng trong logic xử lý của component
      const rows = [];
      
      variants.forEach(v => {
        // Hàm thực thi logic: prod
        const prod = products.find(p => p.id === v.productId);
        // Khai báo biến/hằng số: prodName - Dùng trong logic xử lý của component
        const prodName = prod ? prod.name : 'Sản phẩm không xác định';
        // Hàm thực thi logic: brandObj
        const brandObj = brands.find(b => b.id === prod?.brandId);
        // Khai báo biến/hằng số: brandName - Dùng trong logic xử lý của component
        const brandName = brandObj ? brandObj.name : '';
        // Khai báo biến/hằng số: basePrice - Dùng trong logic xử lý của component
        const basePrice = v.price || prod?.basePrice || prod?.price || 0;
        // Khai báo biến/hằng số: totalStock - Dùng trong logic xử lý của component
        const totalStock = v.totalStock ?? 0;
        // Khai báo biến/hằng số: totalVal - Dùng trong logic xử lý của component
        const totalVal = basePrice * totalStock;
        
        rows.push([
          v.productId,
          v.id,
          `"${prodName.replace(/"/g, '""')}"`,
          `"${v.name.replace(/"/g, '""')}"`,
          `"${brandName.replace(/"/g, '""')}"`,
          totalStock,
          basePrice,
          totalVal
        ]);
      });
      
      // Thêm sản phẩm không có biến thể
      products.forEach(p => {
        // Hàm thực thi logic: hasVariants
        const hasVariants = variants.some(v => v.productId === p.id);
        if (!hasVariants) {
          // Hàm thực thi logic: brandObj
          const brandObj = brands.find(b => b.id === p.brandId);
          // Khai báo biến/hằng số: brandName - Dùng trong logic xử lý của component
          const brandName = brandObj ? brandObj.name : '';
          // Khai báo biến/hằng số: basePrice - Dùng trong logic xử lý của component
          const basePrice = p.basePrice || p.price || 0;
          // Khai báo biến/hằng số: totalStock - Dùng trong logic xử lý của component
          const totalStock = p.totalStock ?? p.stock ?? p.stockQuantity ?? 0;
          // Khai báo biến/hằng số: totalVal - Dùng trong logic xử lý của component
          const totalVal = basePrice * totalStock;
          
          rows.push([
            p.id,
            "",
            `"${p.name.replace(/"/g, '""')}"`,
            "Mặc định",
            `"${brandName.replace(/"/g, '""')}"`,
            totalStock,
            basePrice,
            totalVal
          ]);
        }
      });
      
      // Hàm thực thi logic: csvContent
      const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      // Khai báo biến/hằng số: blob - Dùng trong logic xử lý của component
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      // Khai báo biến/hằng số: url - Dùng trong logic xử lý của component
      const url = URL.createObjectURL(blob);
      // Khai báo biến/hằng số: link - Dùng trong logic xử lý của component
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bao_cao_ton_kho_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      throw new Error('Lỗi xuất dữ liệu: ' + err.message);
    }
  },

  // Tạo và tải file Excel/CSV mẫu chứa dữ liệu thực tế trong DB
  downloadImportTemplate: async (products) => {
    try {
      // Khai báo biến/hằng số: variants - Dùng trong logic xử lý của component
      const variants = await api.get('/ProductVariant');
      // Khai báo biến/hằng số: headers - Dùng trong logic xử lý của component
      const headers = [
        "Mã sản phẩm (Product ID)", 
        "Mã biến thể (Variant ID)", 
        "Tên sản phẩm", 
        "Tên biến thể", 
        "Số lượng nhập", 
        "Giá giao dịch (Price)", 
        "Loại giao dịch (Nhập vào)", 
        "Ghi chú (Note)"
      ];
      
      // Khai báo biến/hằng số: rows - Dùng trong logic xử lý của component
      const rows = [];
      variants.forEach(v => {
        // Hàm thực thi logic: prod
        const prod = products.find(p => p.id === v.productId);
        // Khai báo biến/hằng số: prodName - Dùng trong logic xử lý của component
        const prodName = prod ? prod.name : '';
        rows.push([
          v.productId,
          v.id,
          `"${prodName.replace(/"/g, '""')}"`,
          `"${v.name.replace(/"/g, '""')}"`,
          "", 
          "", 
          "Nhập vào", 
          "Nhập hàng từ Excel" 
        ]);
      });
      
      products.forEach(p => {
        // Hàm thực thi logic: hasVariants
        const hasVariants = variants.some(v => v.productId === p.id);
        if (!hasVariants) {
          rows.push([
            p.id,
            "", 
            `"${p.name.replace(/"/g, '""')}"`,
            "Mặc định",
            "",
            "",
            "Nhập vào",
            "Nhập hàng từ Excel"
          ]);
        }
      });
      
      // Hàm thực thi logic: csvContent
      const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      // Khai báo biến/hằng số: blob - Dùng trong logic xử lý của component
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      // Khai báo biến/hằng số: url - Dùng trong logic xử lý của component
      const url = URL.createObjectURL(blob);
      // Khai báo biến/hằng số: link - Dùng trong logic xử lý của component
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "mau_nhap_ton_kho.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      throw new Error('Lỗi tạo tệp mẫu: ' + err.message);
    }
  }
};
