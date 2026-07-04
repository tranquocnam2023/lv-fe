import React from 'react';

export default function BrandToast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`fixed bottom-5 right-5 z-[200] max-w-sm w-full bg-white rounded-md shadow-xl border p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
      toast.type === 'success' ? 'border-l-4 border-l-success border-admin-border' : 
      toast.type === 'error' ? 'border-l-4 border-l-admin-danger border-admin-border' : 
      'border-l-4 border-l-[#FFB800] border-admin-border'
    }`}>
      <div className="flex-shrink-0 mt-0.5 select-none">
        {toast.type === 'success' ? (
          <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">✓</div>
        ) : toast.type === 'error' ? (
          <div className="w-8 h-8 rounded-full bg-admin-danger/10 text-admin-danger flex items-center justify-center font-bold">✕</div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold">!</div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-admin-text-main text-sm">
          {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi hệ thống' : 'Thông tin'}
        </h4>
        <p className="text-xs text-admin-text-muted mt-1 font-semibold leading-relaxed">{toast.message}</p>
        {toast.description && (
          <p className="text-[10px] text-admin-text-muted mt-1 font-medium leading-relaxed">{toast.description}</p>
        )}
      </div>
    </div>
  );
}
