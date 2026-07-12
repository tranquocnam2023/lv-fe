import React from 'react';
import { X } from 'lucide-react';
import { useFormat } from '../../../../hooks/useFormat';

export default function TxDetailsModal({ 
  selectedTxGroup, 
  onClose, 
  onRevert 
}) {
  const { formatCurrency } = useFormat();

  if (!selectedTxGroup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-admin-border animate-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-6 border-b border-admin-border pb-4">
          <div>
            <h3 className="text-xl font-bold text-admin-text-main flex items-center gap-2">
              Chi tiết Lô Giao dịch Kho
            </h3>
            <p className="text-sm text-admin-text-muted mt-1">
              Mã giao dịch: <span className="font-mono text-blue-600 font-bold">{selectedTxGroup.batchId}</span> |
              Thời gian: {new Date(selectedTxGroup.createdAt).toLocaleString('vi-VN')} | 
              Loại: <span className="font-bold">{selectedTxGroup.transactionType.includes('IMPORT') ? 'Nhập kho' : 'Xuất kho'}</span>
            </p>
            {selectedTxGroup.note && (
              <p className="text-sm text-gray-600 mt-1 italic">Ghi chú: {selectedTxGroup.note}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-admin-bg text-admin-text-muted hover:text-admin-text-main rounded-full transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
           <h4 className="font-bold text-sm text-admin-text-main mb-3">Danh sách {selectedTxGroup.items.length} mặt hàng</h4>
           <div className="overflow-x-auto border border-admin-border rounded-lg">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-admin-border text-[11px] font-bold text-admin-text-muted uppercase tracking-wider">
                   <th className="p-3">Sản phẩm</th>
                   <th className="p-3">Biến thể</th>
                   <th className="p-3 text-center">Số lượng</th>
                   <th className="p-3 text-right">Đơn giá</th>
                   <th className="p-3 text-right">Tổng</th>
                   {!selectedTxGroup.orderId && !selectedTxGroup.isReverted && (
                     <th className="p-3 text-center">Hành động</th>
                   )}
                 </tr>
               </thead>
               <tbody className="text-sm">
                 {selectedTxGroup.items.map((tx, idx) => {
                   const qty = Math.abs(tx.quantityChanged);
                   return (
                     <tr key={idx} className={`border-b border-admin-border last:border-0 hover:bg-slate-50 ${tx.isReverted ? 'opacity-50 line-through' : ''}`}>
                       <td className="p-3 font-bold text-admin-text-main">{tx.productName}</td>
                       <td className="p-3 text-admin-text-muted">{tx.variantName}</td>
                       <td className="p-3 text-center font-bold text-admin-text-main">{qty}</td>
                       <td className="p-3 text-right text-admin-text-main">{formatCurrency(tx.price)}</td>
                       <td className="p-3 text-right font-bold text-primary">{formatCurrency(tx.price * qty)}</td>
                       {!selectedTxGroup.orderId && !selectedTxGroup.isReverted && (
                         <td className="p-3 text-center">
                           {!tx.isReverted ? (
                             <button
                               onClick={() => onRevert(tx.id)}
                               className="text-[11px] px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-bold border border-red-100"
                             >
                               Hoàn tác món này
                             </button>
                           ) : (
                             <span className="text-[11px] text-red-400 italic font-bold">Đã hoàn tác</span>
                           )}
                         </td>
                       )}
                     </tr>
                   );
                 })}
               </tbody>
               <tfoot className="bg-slate-50 border-t border-admin-border font-bold">
                 <tr>
                   <td colSpan="2" className="p-3 text-right text-admin-text-main">Tổng cộng Lô Giao Dịch:</td>
                   <td className="p-3 text-center text-admin-text-main">{selectedTxGroup.totalQuantity}</td>
                   <td className="p-3"></td>
                   <td className="p-3 text-right text-primary text-base">{formatCurrency(selectedTxGroup.totalPrice)}</td>
                   {!selectedTxGroup.orderId && !selectedTxGroup.isReverted && (
                     <td className="p-3"></td>
                   )}
                 </tr>
               </tfoot>
             </table>
           </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-admin-border">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-md font-bold text-admin-text-main bg-admin-bg hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
