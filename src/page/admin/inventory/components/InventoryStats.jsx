import React from 'react';
import { Package, Activity, FileText, AlertCircle } from 'lucide-react';
import { useFormat } from '../../../../hooks/useFormat';

export default function InventoryStats({ products, txHistory }) {
  const { formatCurrency } = useFormat();

  const totalStockQty = products.reduce((acc, p) => acc + ((p.totalStock ?? p.stock ?? p.stockQuantity ?? 0)), 0);
  const totalStockValue = products.reduce((acc, p) => acc + ((p.basePrice || p.price || 0) * (p.totalStock ?? p.stock ?? p.stockQuantity ?? 0)), 0);
  const totalTxCount = txHistory.filter(t => !t.isReverted).length;
  const lowStockCount = products.filter(p => (p.totalStock ?? p.stock ?? p.stockQuantity ?? 0) < 5).length;

  const STATS_CONFIG = [
    { label: 'Tổng sản lượng tồn kho', value: totalStockQty, icon: Package, iconColor: 'var(--color-primary)' },
    { label: 'Tổng giá trị tồn kho', value: totalStockValue, icon: Activity, isCurrency: true, iconColor: 'var(--color-success)' },
    { label: 'Giao dịch thành công', value: totalTxCount, icon: FileText, iconColor: 'var(--color-warning)' },
    { label: 'Sản phẩm sắp hết hàng', value: lowStockCount, icon: AlertCircle, iconColor: 'var(--color-admin-danger)' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {STATS_CONFIG.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="p-5 rounded-md flex items-center justify-between h-28 bg-white border border-admin-border/50">
            <div className="flex flex-col">
              <p className="text-[12px] font-bold text-admin-text-muted mb-1 uppercase tracking-wider">{item.label}</p>
              <h3 className="text-2xl font-bold text-admin-text-main leading-none">
                {item.isCurrency ? formatCurrency(item.value) : item.value.toLocaleString('vi-VN')}
              </h3>
            </div>
            <div className="w-14 h-14 rounded-full bg-admin-bg flex items-center justify-center flex-shrink-0">
              <Icon size={24} style={{ color: item.iconColor }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
