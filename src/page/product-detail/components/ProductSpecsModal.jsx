import React from 'react';
import { X } from 'lucide-react';

export default function ProductSpecsModal({ isOpen, onClose, mergedSpecs, productName }) {
  if (!isOpen || !mergedSpecs) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">
            Thông số kỹ thuật chi tiết {productName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-red-500 rounded-full transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(() => {
            try {
              const parsedSpecs = mergedSpecs;
              if (!Array.isArray(parsedSpecs) || parsedSpecs.length === 0) {
                return <div className="text-center py-6 text-gray-400">Không có dữ liệu chi tiết.</div>;
              }
              return parsedSpecs.map((group, gIdx) => (
                <div key={gIdx} className="bg-gray-50/50 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-100/70 px-5 py-3.5 font-bold text-gray-800 text-xs border-b border-gray-100 uppercase tracking-wider">
                    {group.groupName}
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {group.items.map((item, iIdx) => (
                        <tr key={iIdx} className="border-b border-gray-100/60 last:border-0 hover:bg-white transition-colors">
                          <td className="py-3 px-5 font-bold text-gray-500 w-1/3 border-r border-gray-100/40">{item.key}</td>
                          <td className="py-3 px-5 text-gray-800 font-semibold">{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ));
            } catch (e) {
              return <div className="text-center py-6 text-gray-400">Không thể tải cấu hình chi tiết.</div>;
            }
          })()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-md uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
