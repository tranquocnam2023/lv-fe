// Bảng tồn kho chi tiết-Lịch sử xuất/nhập kho- Quản lý kho hàng
import React from 'react';
import { X, Package, PlusCircle, ArrowUpRight } from 'lucide-react';

export default function StockProductDetailModal({
  selectedStockProduct,
  onClose,
  formatCurrency,
  onOpenImportTx
}) {
  if (!selectedStockProduct) return null;

  
  // Trích xuất các trường dữ liệu để sử dụng hiển thị trong giao diện Modal:
  const {
    productId, // - productId: Mã ID sản phẩm -> Hiển thị dạng mã tag ở Tiêu đề Modal (Dòng 41)
    productName,// - productName: Tên sản phẩm -> Hiển thị ở Tiêu đề Modal (Dòng 42)
    productImage, // - productImage: Ảnh sản phẩm -> Hiển thị ở góc trái tiêu đề Modal (Dòng 34)
    brandName,// - brandName: Tên hãng -> Hiển thị ở dòng phụ thương hiệu (Dòng 45)
    categoryName, // - categoryName: Tên danh mục -> Hiển thị ở dòng phụ danh mục (Dòng 47)
    totalQuantityIn,// - totalQuantityIn: Tổng số lượng đã nhập -> Hiển thị ở ô Stats 1 "Tổng SL nhập" (Dòng 64)
    totalQuantityRemaining,// - totalQuantityRemaining: Tổng số lượng còn tồn -> Hiển thị ở ô Stats 2 "Tổng tồn kho" (Dòng 69)
    totalStockValue, // - totalStockValue: Tổng giá trị hàng tồn -> Hiển thị ở ô Stats 3 "Tổng giá trị tồn" (Dòng 74)
    variants = [] // - variants: Mảng danh sách biến thể -> Hiển thị số lượng (Dòng 82) và duyệt vòng lặp hiển thị bảng chi tiết (Dòng 111)
  } = selectedStockProduct;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-admin-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
              {productImage ? (
                <img src={productImage} alt={productName} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{productId}</span>
                <h3 className="text-lg font-black text-admin-text-main">{productName}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-admin-text-muted mt-1 font-semibold">
                <span>Thương hiệu: <b className="text-gray-800">{brandName}</b></span>
                <span>•</span>
                <span>Danh mục: <b className="text-gray-800">{categoryName}</b></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-3 gap-4 px-6 py-3.5 bg-blue-50/40 border-b border-blue-100">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng SL nhập</span>
            <span className="text-base font-black text-gray-800">{totalQuantityIn} sản phẩm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng tồn kho</span>
            <span className={`text-base font-black ${totalQuantityRemaining > 5 ? 'text-emerald-600' : totalQuantityRemaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {totalQuantityRemaining} máy
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng giá trị tồn</span>
            <span className="text-base font-black text-indigo-700">{formatCurrency(totalStockValue)}</span>
          </div>
        </div>

        {/* Variants Detail Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <span>Danh sách biến thể ({variants.length})</span>
            </h4>
            {onOpenImportTx && (
              <button
                onClick={() => {
                  onClose();
                  onOpenImportTx(productId);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>Nhập thêm hàng</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-admin-border rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-admin-border text-admin-text-muted text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">ID Biến thể</th>
                  <th className="py-3 px-4">Tên biến thể / Cấu hình</th>
                  <th className="py-3 px-4 text-center">Đơn vị</th>
                  <th className="py-3 px-4 text-center">SL Nhập</th>
                  <th className="py-3 px-4 text-center">SL Tồn</th>
                  <th className="py-3 px-4 text-right">Đơn giá</th>
                  <th className="py-3 px-4 text-right">Tổng giá trị tồn</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100">
                {variants.map((v, idx) => {
                  const variantIdCode = v.variantId ? `#${v.variantId}` : (v.productVariantId ? `#${v.productVariantId}` : `#${idx + 1}`);
                  const variantVal = (v.price || 0) * (v.quantityRemaining || 0);

                  const displayName = v.variantName && v.variantName !== 'Tiêu chuẩn' && v.variantName !== 'Mặc định'
                    ? v.variantName.replace(productName, '').replace(/^[\s\-\:\,]+/, '')
                    : (v.variantName || 'Bản chuẩn');

                  return (
                    <tr key={v.variantId || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{variantIdCode}</td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {displayName || 'Tiêu chuẩn'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-700">{v.unit || 'Cái'}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">{v.quantityIn}</td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          v.quantityRemaining > 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          v.quantityRemaining > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {v.quantityRemaining}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-800">{formatCurrency(v.price)}</td>
                      <td className="py-3 px-4 text-right font-black text-indigo-600">{formatCurrency(variantVal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-admin-border flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold transition-all"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
