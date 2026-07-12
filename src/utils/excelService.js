import api from '../services/api';

export const excelService = {
  // Xuất Báo cáo Tồn kho ra file Excel (CSV UTF-8 với BOM)
  exportInventoryReport: async (products, brands) => {
    try {
      const variants = await api.get('/ProductVariant');
      const headers = ["Mã sản phẩm (Product ID)", "Mã biến thể (Variant ID)", "Tên sản phẩm", "Tên biến thể", "Thương hiệu", "Tồn kho", "Đơn giá gốc (VNĐ)", "Tổng giá trị (VNĐ)"];
      const rows = [];
      
      variants.forEach(v => {
        const prod = products.find(p => p.id === v.productId);
        const prodName = prod ? prod.name : 'Sản phẩm không xác định';
        const brandObj = brands.find(b => b.id === prod?.brandId);
        const brandName = brandObj ? brandObj.name : '';
        const basePrice = v.price || prod?.basePrice || prod?.price || 0;
        const totalStock = v.totalStock ?? 0;
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
        const hasVariants = variants.some(v => v.productId === p.id);
        if (!hasVariants) {
          const brandObj = brands.find(b => b.id === p.brandId);
          const brandName = brandObj ? brandObj.name : '';
          const basePrice = p.basePrice || p.price || 0;
          const totalStock = p.totalStock ?? p.stock ?? p.stockQuantity ?? 0;
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
      
      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
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
      const variants = await api.get('/ProductVariant');
      const headers = [
        "Mã sản phẩm (Product ID)", 
        "Mã biến thể (Variant ID)", 
        "Tên sản phẩm", 
        "Tên biến thể", 
        "Số lượng thay đổi (Quantity - Nhập dương, Xuất âm)", 
        "Giá giao dịch (Price)", 
        "Loại giao dịch (IMPORT_SUPPLIER/IMPORT_RETURN/EXPORT_SELL/EXPORT_DEFECT)", 
        "Ghi chú (Note)"
      ];
      
      const rows = [];
      variants.forEach(v => {
        const prod = products.find(p => p.id === v.productId);
        const prodName = prod ? prod.name : '';
        rows.push([
          v.productId,
          v.id,
          `"${prodName.replace(/"/g, '""')}"`,
          `"${v.name.replace(/"/g, '""')}"`,
          "", 
          "", 
          "IMPORT_SUPPLIER", 
          "Nhập hàng từ Excel" 
        ]);
      });
      
      products.forEach(p => {
        const hasVariants = variants.some(v => v.productId === p.id);
        if (!hasVariants) {
          rows.push([
            p.id,
            "", 
            `"${p.name.replace(/"/g, '""')}"`,
            "Mặc định",
            "",
            "",
            "IMPORT_SUPPLIER",
            "Nhập hàng từ Excel"
          ]);
        }
      });
      
      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
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
