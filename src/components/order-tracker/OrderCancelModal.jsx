import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function OrderCancelModal({
  order,
  setIsCancelModalOpen,
  cancelReason,
  setCancelReason,
  customReason,
  setCustomReason,
  cancelling,
  cancelError,
  setCancelError,
  handleCancelOrder,
  cancelReasons
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-md border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-50 p-6 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-black text-gray-900">Yêu cầu hủy đơn hàng</h3>
            <p className="text-xs text-gray-500 font-bold tracking-tight">Đơn hàng #PS{order.id}</p>
          </div>
          <button 
            onClick={() => {
              setIsCancelModalOpen(false);
              setCancelReason('');
              setCustomReason('');
              setCancelError('');
            }}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-100 flex items-center justify-center text-gray-500 transition-colors border-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 select-none">Vui lòng chọn lý do hủy đơn:</p>
          
          {cancelError && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-md text-xs font-bold flex items-center gap-2 animate-in shake">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <div className="space-y-3">
            {cancelReasons.map((reason, idx) => (
              <label 
                key={idx} 
                className={`flex items-center gap-3 p-3.5 rounded-md border transition-all cursor-pointer ${
                  cancelReason === reason 
                    ? 'border-red-500 bg-red-50/30' 
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <input 
                  type="radio" 
                  name="cancel_reason" 
                  value={reason}
                  checked={cancelReason === reason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    setCancelError('');
                  }}
                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700">{reason}</span>
              </label>
            ))}
          </div>

          {cancelReason === 'Lý do khác' && (
            <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
              <textarea
                placeholder="Vui lòng nhập lý do cụ thể..."
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setCancelError('');
                }}
                rows={3}
                className="w-full border border-gray-200 p-3 rounded-md text-xs font-semibold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none font-sans"
              ></textarea>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-50 p-6 flex gap-3 bg-gray-50/30 select-none">
          <button
            onClick={() => {
              setIsCancelModalOpen(false);
              setCancelReason('');
              setCustomReason('');
              setCancelError('');
            }}
            disabled={cancelling}
            className="flex-1 py-3 border border-gray-200 rounded-md text-xs font-black text-gray-700 hover:bg-gray-50 transition active:scale-95 disabled:opacity-50 cursor-pointer bg-white"
          >
            ĐÓNG
          </button>
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer border-0"
          >
            {cancelling ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN HỦY ĐƠN'}
          </button>
        </div>
      </div>
    </div>
  );
}
