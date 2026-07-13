import React from 'react';

export default function HistoryTable({
  loading,
  error,
  paginatedHistory,
  formatCurrency,
  handleRevertTransaction,
  setSelectedTxGroup
}) {
  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-admin-border text-admin-text-muted text-[11px] font-bold uppercase tracking-wider">
            <th className="pb-3 px-4">Mã Giao dịch</th>
            <th className="pb-3 px-4">Thời gian</th>
            <th className="pb-3 px-4">Sản phẩm & Biến thể</th>
            <th className="pb-3 px-4">Loại GD</th>
            <th className="pb-3 px-4 text-center">Số lượng</th>
            <th className="pb-3 px-4 text-right">Tổng giá trị</th>
            <th className="pb-3 px-4">Người thực hiện</th>
            <th className="pb-3 px-4">Ghi chú</th>
            <th className="pb-3 px-4 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {loading ? (
            <tr>
              <td colSpan="9" className="p-12 text-center text-gray-500 font-bold">
                Đang tải lịch sử giao dịch kho...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan="9" className="p-12 text-center text-red-500 font-bold">
                {error}
              </td>
            </tr>
          ) : paginatedHistory.length > 0 ? (
            paginatedHistory.map((group) => {
              let prefix = '#TX';
              if (group.transactionType === 'EXPORT_SELL') {
                prefix = '#PS';
              } else if (group.transactionType === 'IMPORT_SUPPLIER') {
                prefix = '#ORD';
              } else if (group.transactionType === 'IMPORT_RETURN') {
                prefix = '#REO';
              } else if (group.transactionType === 'EXPORT_DEFECT' || group.transactionType === 'EXPORT_DAMAGE') {
                prefix = '#ER';
              }
              const code = group.orderId ? `${prefix}${group.orderId}` : `${prefix}${group.primaryTx.id}`;
              const formattedDate = new Date(group.createdAt).toLocaleString('vi-VN');

              return (
                <tr key={group.batchId} className={`border-b border-admin-border hover:bg-admin-bg transition-colors ${group.isReverted ? 'opacity-50' : ''}`}>
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">{code}</td>
                  <td className="py-3.5 px-4 text-xs text-admin-text-muted">{formattedDate}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-admin-text-main flex items-center gap-2">
                      Gồm {group.items.length} mặt hàng
                      <button
                        onClick={() => setSelectedTxGroup(group)}
                        className="text-[10px] text-primary hover:underline px-2 py-0.5 bg-primary/10 rounded-full"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${group.transactionType === 'IMPORT_SUPPLIER' ? 'bg-blue-50 text-blue-600' :
                      group.transactionType === 'IMPORT_RETURN' ? 'bg-green-50 text-green-600' :
                        group.transactionType === 'EXPORT_SELL' ? 'bg-purple-50 text-purple-600' :
                          'bg-red-50 text-red-600'
                      }`}>
                      {group.transactionType === 'IMPORT_SUPPLIER' ? 'Nhập NCC' :
                        group.transactionType === 'IMPORT_RETURN' ? 'Khách trả' :
                          group.transactionType === 'EXPORT_SELL' ? 'Xuất bán' : 'Xuất lỗi'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-admin-text-main">{group.totalQuantity}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-admin-text-main">{formatCurrency(group.totalPrice)}</td>
                  <td className="py-3.5 px-4 text-xs text-admin-text-main font-bold">{group.createdByUsername || 'Hệ thống'}</td>
                  <td className="py-3.5 px-4 text-xs text-admin-text-muted font-semibold max-w-[150px] truncate" title={group.note}>{group.note}</td>
                  <td className="py-3.5 px-4 text-center">
                    {group.isReverted ? (
                      <span className="text-xs text-red-400 italic font-semibold">Đã hủy</span>
                    ) : group.orderId ? (
                      <span className="text-xs text-gray-400 italic font-semibold">Theo đơn hàng</span>
                    ) : (
                      <button
                        onClick={() => setSelectedTxGroup(group)}
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
                Không tìm thấy lịch sử giao dịch kho nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
