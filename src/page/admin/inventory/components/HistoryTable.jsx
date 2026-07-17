import React from 'react';

export default function HistoryTable({
  loading,
  error,
  paginatedHistory,
  formatCurrency,
  handleRevertTransaction,
  setSelectedTxGroup,
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
                <th className="pb-3 px-4">ID Sản phẩm</th>
                {/* <th className="pb-3 px-4">Mã giao dịch</th> */}
                <th className="pb-3 px-4">Ngày nhận</th>
                <th className="pb-3 px-4">Sản phẩm</th>

                <th className="pb-3 px-4 text-center">Đơn vị</th>
                <th className="pb-3 px-4 text-center">SL Nhập</th>
                <th className="pb-3 px-4 text-center">SL Tồn</th>
                <th className="pb-3 px-4 text-right">Đơn giá</th>
                <th className="pb-3 px-4 text-right">Tổng giá trị tồn</th>
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
                const formattedDate = new Date(item.receivedDate).toLocaleString('vi-VN');
                const lotCode = `#LOT${item.inventoryDetailId}`;
                const importCode = item.receivingDetailId ? `#ORD${item.receivingDetailId}` : 'Điều chỉnh';
                const totalValue = item.price * item.quantityRemaining;

                return (
                  <tr key={item.inventoryDetailId} className="border-b border-admin-border hover:bg-admin-bg transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">#{item.productId}</td>
                    {/*kết hợp hai mã giao dịch*/ }
                    {/*<td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-600">{item.transactionCode}-SP{item.productId}</td> */}
                    <td className="py-3.5 px-4 text-xs text-admin-text-muted">{formattedDate}</td>
                    <td className="py-3.5 px-4 font-bold text-admin-text-main">
                      {/* Hiển thị tên đầy đủ của biến thể nếu có (ví dụ: Samsung S25 Ultra - 16GB/1TB - Trắng) */}
                      {/* Đối với sản phẩm đơn giản hoặc phụ kiện không có biến thể thực tế (tên biến thể là 'Tiêu chuẩn' hoặc 'Mặc định'), chỉ hiển thị tên sản phẩm */}
                      {item.variantName && item.variantName !== 'Tiêu chuẩn' && item.variantName !== 'Mặc định'
                        ? item.variantName
                        : item.productName}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-admin-text-main">{item.unit || 'Cái'}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-admin-text-main">{item.quantityIn}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-admin-text-main">{item.quantityRemaining}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-admin-text-main">{formatCurrency(item.price)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-admin-text-main">{formatCurrency(totalValue)}</td>
                  </tr>
                );
              }

              // Transaction history mode (original code)
              let prefix = '#TX';
              if (item.transactionType === 'EXPORT_SELL') {
                prefix = '#PS';
              } else if (item.transactionType === 'IMPORT_SUPPLIER') {
                prefix = '#ORD';
              } else if (item.transactionType === 'IMPORT_RETURN') {
                prefix = '#REO';
              } else if (item.transactionType === 'EXPORT_DEFECT' || item.transactionType === 'EXPORT_DAMAGE') {
                prefix = '#ER';
              }
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
