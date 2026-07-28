import React from 'react';
import { Package, Activity, FileText, AlertCircle, Award, ShoppingCart, TrendingUp } from 'lucide-react';
import { useFormat } from '../../../../hooks/useFormat';

export default function InventoryStats({ products, txHistory }) {
  const { formatCurrency } = useFormat();

  // 1. Tính toán các chỉ số tồn kho cơ bản
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

  // 2. Logic xếp hạng Sản phẩm & Phụ kiện bán chạy nhất tháng gần nhất
  const isAccessoryProduct = (product) => {
    if (!product) return false;
    return product.isAccessory === true;
  };

  // Xác định mốc thời gian 30 ngày từ thời điểm có giao dịch mới nhất để tránh dữ liệu cũ không hiển thị
  const times = txHistory.map(t => new Date(t.createdAt).getTime());
  const maxTime = times.length > 0 ? Math.max(...times) : new Date().getTime();
  const oneMonthAgo = maxTime - 30 * 24 * 60 * 60 * 1000;

  // Lọc các giao dịch bán hàng (EXPORT_SELL) thành công trong vòng 30 ngày qua
  const recentSales = txHistory.filter(t => 
    t.transactionType === 'EXPORT_SELL' && 
    !t.isReverted && 
    new Date(t.createdAt).getTime() >= oneMonthAgo
  );

  // Gom nhóm tổng số lượng bán và doanh thu cho mỗi sản phẩm
  const salesMap = {};
  recentSales.forEach(tx => {
    const prodId = tx.productId;
    const qty = Math.abs(tx.quantityChanged || 0);
    const revenue = qty * (tx.price || 0);
    const product = products.find(p => p.id === prodId);

    if (!salesMap[prodId]) {
      salesMap[prodId] = {
        productId: prodId,
        productName: tx.productName || (product ? product.name : 'Sản phẩm không rõ'),
        quantitySold: 0,
        totalRevenue: 0,
        productObj: product
      };
    }
    salesMap[prodId].quantitySold += qty;
    salesMap[prodId].totalRevenue += revenue;
  });

  const allSales = Object.values(salesMap);

  // Phân tách: Sản phẩm chính (Điện thoại, Máy tính...) vs Phụ kiện
  const bestProducts = allSales
    .filter(item => {
      if (item.productObj) {
        return !isAccessoryProduct(item.productObj);
      }
      return true; // Mặc định là sản phẩm chính nếu không thấy đối tượng từ API
    })
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  const bestAccessories = allSales
    .filter(item => {
      if (item.productObj) {
        return isAccessoryProduct(item.productObj);
      }
      return false; // Mặc định không phải phụ kiện
    })
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  // Helper hiển thị badge thứ hạng
  const renderRankBadge = (index) => {
    const badges = [
      { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: '1' },
      { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: '2' },
      { bg: 'bg-orange-100 text-orange-700 border-orange-200', text: '3' },
    ];
    const defaultBadge = 'bg-gray-50 text-gray-500 border-gray-150';
    const badge = badges[index] || { bg: defaultBadge, text: String(index + 1) };

    return (
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${badge.bg}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_CONFIG.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="p-5 rounded-md flex items-center justify-between h-28 bg-white border border-admin-border/50 shadow-sm hover:shadow-md transition-all duration-300">
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

      {/* 2 Tables: Sản phẩm bán chạy & Phụ kiện bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bảng Sản phẩm bán chạy */}
        <div className="bg-white rounded-lg border border-admin-border/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-admin-border/40">
            <Award size={18} className="text-amber-500 animate-pulse" />
            <h4 className="font-extrabold text-sm text-admin-text-main uppercase tracking-wider">
              Top 5 Sản Phẩm Bán Chạy <span className="text-[11px] text-gray-400 font-semibold lowercase">(30 ngày gần nhất)</span>
            </h4>
          </div>
          {bestProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-admin-text-muted font-bold uppercase tracking-wider border-b border-admin-border/30">
                    <th className="pb-2 text-center w-12">Hạng</th>
                    <th className="pb-2 px-3">Tên sản phẩm</th>
                    <th className="pb-2 text-center w-24">Đã bán</th>
                    <th className="pb-2 text-right w-36">Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {bestProducts.map((item, idx) => (
                    <tr key={item.productId} className="border-b border-admin-border/20 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 text-center flex justify-center">{renderRankBadge(idx)}</td>
                      <td className="py-2.5 px-3 font-bold text-admin-text-main truncate max-w-[200px]" title={item.productName}>
                        {item.productName}
                      </td>
                      <td className="py-2.5 text-center font-extrabold text-admin-text-main bg-slate-50/50 rounded">
                        {item.quantitySold} cái
                      </td>
                      <td className="py-2.5 text-right font-bold text-primary">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-gray-400 italic">
              Không có giao dịch bán hàng chính nào trong 30 ngày qua.
            </div>
          )}
        </div>

        {/* Bảng Phụ kiện bán chạy */}
        <div className="bg-white rounded-lg border border-admin-border/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-admin-border/40">
            <TrendingUp size={18} className="text-emerald-500 animate-pulse" />
            <h4 className="font-extrabold text-sm text-admin-text-main uppercase tracking-wider">
              Top 5 Phụ Kiện Bán Chạy <span className="text-[11px] text-gray-400 font-semibold lowercase">(30 ngày gần nhất)</span>
            </h4>
          </div>
          {bestAccessories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-admin-text-muted font-bold uppercase tracking-wider border-b border-admin-border/30">
                    <th className="pb-2 text-center w-12">Hạng</th>
                    <th className="pb-2 px-3">Tên phụ kiện</th>
                    <th className="pb-2 text-center w-24">Đã bán</th>
                    <th className="pb-2 text-right w-36">Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {bestAccessories.map((item, idx) => (
                    <tr key={item.productId} className="border-b border-admin-border/20 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 text-center flex justify-center">{renderRankBadge(idx)}</td>
                      <td className="py-2.5 px-3 font-bold text-admin-text-main truncate max-w-[200px]" title={item.productName}>
                        {item.productName}
                      </td>
                      <td className="py-2.5 text-center font-extrabold text-admin-text-main bg-slate-50/50 rounded">
                        {item.quantitySold} cái
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-gray-400 italic">
              Không có giao dịch bán phụ kiện nào trong 30 ngày qua.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
