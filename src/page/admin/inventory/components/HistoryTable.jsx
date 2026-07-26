import React from 'react';
import { Package, Eye } from 'lucide-react';

export default function HistoryTable({
  loading,
  error,
  paginatedHistory,
  formatCurrency,
  handleRevertTransaction,
  setSelectedTxGroup,
  setSelectedStockProduct,
  viewMode = 'TRANSACTIONS'
}) {
  const isStockMode = viewMode === 'STOCK';

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-admin-border text-admin-text-muted text-[11px] font-bold uppercase tracking-wider">
            {isStockMode ? (
              <>
                <th className="pb-3 px-4">ID</th>
                <th className="pb-3 px-4">Sản phẩm</th>
                <th className="pb-3 px-4">Thương hiệu / Danh mục</th>
                <th className="pb-3 px-4 text-center">Tổng SL Nhập</th>
                <th className="pb-3 px-4 text-center">Tổng SL Tồn</th>
                <th className="pb-3 px-4 text-right">Tổng giá trị tồn</th>
                <th className="pb-3 px-4 text-center">Chi tiết</th>
              </>
            ) : (
              <>
                <th className="pb-3 px-4">Mã Giao dịch</th>
                <th className="pb-3 px-4">Thời gian</th>
                <th className="pb-3 px-4">Sản phẩm & Biến thể</th>
                <th className="pb-3 px-4">Loại GD</th>
                <th className="pb-3 px-4 text-center">Số lượng</th>
                <th className="pb-3 px-4 text-right">Tổng giá trị</th>
                <th className="pb-3 px-4">Người thực hiện</th>
                <th className="pb-3 px-4">Ghi chú</th>
                <th className="pb-3 px-4 text-center">Hành động</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="text-sm">
          {loading ? (
            <tr>
              <td colSpan="9" className="p-12 text-center text-gray-500 font-bold">
                {isStockMode ? "Đang tải dữ liệu tồn kho..." : "Đang tải lịch sử giao dịch kho..."}
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan="9" className="p-12 text-center text-red-500 font-bold">
                {error}
              </td>
            </tr>
          ) : paginatedHistory.length > 0 ? (
            paginatedHistory.map((item) => {
              if (isStockMode) {
                const totalRem = item.totalQuantityRemaining || 0;
                const variantCount = item.variants ? item.variants.length : 0;
                const catName = (item.categoryName || '').toLowerCase();
                const prodName = (item.productName || '').toLowerCase();

                // Kiểm tra nếu là Phụ kiện hoặc Sản phẩm đơn (chỉ có 1 biến thể duy nhất)
                const isAccessory = catName.includes('phụ kiện') || catName.includes('tai nghe') || catName.includes('cáp') || catName.includes('sạc') || catName.includes('ốp') || catName.includes('kính') || prodName.includes('tai nghe') || prodName.includes('sạc') || prodName.includes('ốp') || prodName.includes('kính');
                const hasMultipleVariants = variantCount > 1 && !isAccessory;

                return (
                  <tr
                    key={item.productId}
                    onClick={() => {
                      if (hasMultipleVariants && setSelectedStockProduct) {
                        setSelectedStockProduct(item);
                      }
                    }}
                    className={`border-b border-admin-border transition-colors ${hasMultipleVariants ? 'hover:bg-admin-bg/80 cursor-pointer group' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">#{item.productId}</td>
                    <td className="py-3.5 px-4 font-bold text-admin-text-main">
                      <div className="flex flex-col">
                        <span className={`${hasMultipleVariants ? 'group-hover:text-primary' : ''} transition-colors text-sm`}>{item.productName}</span>
                        {hasMultipleVariants && (
                          <span className="text-[11px] font-semibold text-gray-400 mt-0.5">
                            Gồm {variantCount} biến thể & lô hàng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-admin-text-muted">
                      <div><b className="text-gray-700">{item.brandName || '---'}</b></div>
                      <div className="text-[11px] text-gray-400">{item.categoryName || '---'}</div>
                    </td>
                    {/* cột */}
                    <td className="py-3.5 px-4 text-center font-bold text-admin-text-main">{item.totalQuantityIn}</td>
                    {/* cột */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-block ${totalRem > 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        totalRem > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                        {totalRem > 0 ? `${totalRem} sản phẩm` : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-indigo-600">{formatCurrency(item.totalStockValue)}</td>
                    <td className="py-3.5 px-4 text-center">
                      {hasMultipleVariants ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStockProduct && setSelectedStockProduct(item);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 mx-auto border border-blue-200 active:scale-95 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Xem biến thể</span>
                        </button>
                      ) : (
                        <span className="text-gray-300 font-bold text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              }


              // [ĐỊNH DẠNG MÃ GIAO DỊCH KHO - PHÍA FRONT-END]

              let prefix = '#TX'; // Tiền tố mặc định cho điều chỉnh kho thủ công

              if (item.transactionType === 'EXPORT_SELL') {
                prefix = '#PS';   // Tiền tố Xuất bán hàng
              } else if (item.transactionType === 'IMPORT_SUPPLIER') {
                prefix = '#ORD';  // Tiền tố Nhập hàng từ nhà cung cấp (NCC)
              } else if (item.transactionType === 'IMPORT_RETURN') {
                prefix = '#REO';  // Tiền tố Nhập trả hàng lỗi từ khách
              } else if (item.transactionType === 'EXPORT_DEFECT' || item.transactionType === 'EXPORT_DAMAGE') {
                prefix = '#ER';   // Tiền tố Xuất trả hàng lỗi cho NCC / Xuất kho hư hỏng
              }
              //sửa xong vô BE sửa,Controllers/InventoryTransactionController dòng 337-346
              // Nếu có liên kết đơn hàng thì dùng orderId, ngược lại dùng id giao dịch kho tự tăng
              const code = item.orderId ? `${prefix}${item.orderId}` : `${prefix}${item.primaryTx.id}`;
              const formattedDate = new Date(item.createdAt).toLocaleString('vi-VN');

              return (
                <tr key={item.batchId} className={`border-b border-admin-border hover:bg-admin-bg transition-colors ${item.isReverted ? 'opacity-50' : ''}`}>
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">{code}</td>
                  <td className="py-3.5 px-4 text-xs text-admin-text-muted">{formattedDate}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-admin-text-main flex items-center gap-2">
                      Gồm {item.items.length} mặt hàng
                      <button
                        onClick={() => setSelectedTxGroup(item)}
                        className="text-[10px] text-primary hover:underline px-2 py-0.5 bg-primary/10 rounded-full"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.transactionType === 'IMPORT_SUPPLIER' ? 'bg-blue-50 text-blue-600' :
                      item.transactionType === 'IMPORT_RETURN' ? 'bg-green-50 text-green-600' :
                        item.transactionType === 'EXPORT_SELL' ? 'bg-purple-50 text-purple-600' :
                          'bg-red-50 text-red-600'
                      }`}>
                      {item.transactionType === 'IMPORT_SUPPLIER' ? 'Nhập NCC' :
                        item.transactionType === 'IMPORT_RETURN' ? 'Khách trả' :
                          item.transactionType === 'EXPORT_SELL' ? 'Xuất bán' : 'Xuất lỗi'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-admin-text-main">{item.totalQuantity}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-admin-text-main">{formatCurrency(item.totalPrice)}</td>
                  <td className="py-3.5 px-4 text-xs text-admin-text-main font-bold">{item.createdByUsername || 'Hệ thống'}</td>
                  <td className="py-3.5 px-4 text-xs text-admin-text-muted font-semibold max-w-[150px] truncate" title={item.note}>{item.note}</td>
                  <td className="py-3.5 px-4 text-center">
                    {item.isReverted ? (
                      <span className="text-xs text-red-400 italic font-semibold">Đã hủy</span>
                    ) : item.orderId ? (
                      <span className="text-xs text-gray-400 italic font-semibold">Theo đơn hàng</span>
                    ) : (
                      <button
                        onClick={() => setSelectedTxGroup(item)}
                        className="px-3 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md font-extrabold transition-all border border-slate-200 active:scale-95"
                      >
                        Chi tiết
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="9" className="p-12 text-center text-gray-400 italic font-semibold">
                {isStockMode ? "Không tìm thấy thông tin tồn kho nào." : "Không tìm thấy lịch sử giao dịch kho nào."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
