// COMPONENT THỐNG KÊ KHO HÀNG & SẢN PHẨM/PHỤ KIỆN BÁN CHẠY NHẤT (INVENTORY STATS)
// Chức năng: Tính toán tổng sản lượng tồn kho, giá trị tồn kho, thống kê sản phẩm/phụ kiện bán chạy nhất trong 30 ngày gần nhất
import React from 'react';
import { Package, Activity, FileText, AlertCircle, Award, ShoppingCart, TrendingUp } from 'lucide-react';
import { useFormat } from '../../../../hooks/useFormat';

export default function InventoryStats({ products, txHistory }) {
  const { formatCurrency } = useFormat();

  // ─── 1. TÍNH TOÁN CÁC CHỈ SỐ TỒN KHO CƠ BẢN ───────────────────────────
  // Tính tổng số lượng tồn kho vật lý đang có trong hệ thống
  const totalStockQty = products.reduce((acc, p) => acc + ((p.totalStock ?? p.stock ?? p.stockQuantity ?? 0)), 0);

  // Tính tổng giá trị tồn kho (Số lượng * Giá bán lẻ cơ bản)
  const totalStockValue = products.reduce((acc, p) => acc + ((p.basePrice || p.price || 0) * (p.totalStock ?? p.stock ?? p.stockQuantity ?? 0)), 0);

  // Tổng số lượng giao dịch thành công (loại trừ các giao dịch bị hoàn tác/hủy)
  const totalTxCount = txHistory.filter(t => !t.isReverted).length;

  // Số lượng sản phẩm sắp hết hàng (tồn kho nhỏ hơn 5 cái)
  const lowStockCount = products.filter(p => (p.totalStock ?? p.stock ?? p.stockQuantity ?? 0) < 5).length;

  // Cấu hình các thẻ hiển thị chỉ số (Stats Cards)
  const STATS_CONFIG = [
    { label: 'Tổng sản lượng tồn kho', value: totalStockQty, icon: Package, iconColor: 'var(--color-primary)' },
    { label: 'Tổng giá trị tồn kho', value: totalStockValue, icon: Activity, isCurrency: true, iconColor: 'var(--color-success)' },
    { label: 'Giao dịch thành công', value: totalTxCount, icon: FileText, iconColor: 'var(--color-warning)' },
    { label: 'Sản phẩm sắp hết hàng', value: lowStockCount, icon: AlertCircle, iconColor: 'var(--color-admin-danger)' }
  ];

  // ─── 2. THUẬT TOÁN XẾP HẠNG BÁN CHẠY NHẤT TRONG THÁNG GẦN NHẤT ───────

  // Hàm kiểm tra sản phẩm có phải là phụ kiện hay không
  const isAccessoryProduct = (product) => {
    if (!product) return false; // trả về 'true' nếu tra trong isAccessory trong DB
    return product.isAccessory === true || String(product.isAccessory) === 'true';
  };

  // Xác định mốc thời gian 30 ngày tính ngược từ giao dịch mới nhất (tránh lỗi lệch ngày hệ thống)
  const times = txHistory.map(t => new Date(t.createdAt).getTime());
  const maxTime = times.length > 0 ? Math.max(...times) : new Date().getTime();
  const oneMonthAgo = maxTime - 30 * 24 * 60 * 60 * 1000;

  // LƯỢC LỌC GIAO DỊCH XUẤT BÁN HÀNG THÀNH CÔNG (EXPORT_SELL VÀ KHÔNG BỊ HỦY) TRONG 30 NGÀY GẦN NHẤT
  const recentSales = txHistory.filter(t =>
    t.transactionType === 'EXPORT_SELL' &&
    !t.isReverted &&
    new Date(t.createdAt).getTime() >= oneMonthAgo
  );

  // GOM NHÓM TỔNG SỐ LƯỢNG ĐÃ BÁN VÀ TỔNG DOANH THU THEO TỪNG PRODUCT ID TRONG 30 NGÀY
  const salesMap = {};
  recentSales.forEach(tx => {
    const prodId = tx.productId;
    // qty: Số lượng sản phẩm bán ra trong giao dịch này (lấy trị tuyệt đối của biến động số lượng kho)
    const qty = Math.abs(tx.quantityChanged || 0);
    // revenue: Tính doanh thu bán lẻ thu về từ khách hàng của giao dịch này (Số lượng * Giá bán lẻ, CHƯA trừ đi giá vốn hay chi phí nhập hàng)
    const revenue = qty * (tx.price || 0);
    const product = products.find(p => p.id === prodId);

    if (!salesMap[prodId]) {
      salesMap[prodId] = {
        productId: prodId,
        productName: tx.productName || (product ? product.name : 'Sản phẩm không rõ'),
        quantitySold: 0,
        // totalRevenue: Tổng doanh thu bán lẻ cộng dồn (chưa trừ giá vốn)
        totalRevenue: 0,
        productObj: product
      };
    }
    salesMap[prodId].quantitySold += qty;
    salesMap[prodId].totalRevenue += revenue; // Cộng dồn doanh thu bán lẻ
  });

  const allSales = Object.values(salesMap);
  // HÀm kiểm tra xem là điện thoại
  // PHÂN TÁCH: LỌC TOP 5 SẢN PHẨM CHÍNH BÁN CHẠY NHẤT (ĐIỆN THOẠI...)
  const bestProducts = allSales
    .filter(item => {
      if (item.productObj) {
        return !isAccessoryProduct(item.productObj);
      }
      return true; // Mặc định là sản phẩm chính nếu không thấy thông tin đối tượng
    })
    .sort((a, b) => b.quantitySold - a.quantitySold) // Sắp xếp giảm dần theo số lượng bán
    .slice(0, 5); // Lấy Top 5

  // PHÂN TÁCH: LỌC TOP 5 PHỤ KIỆN BÁN CHẠY NHẤT (SẠC, TAI NGHE, CÁP...)
  const bestAccessories = allSales
    .filter(item => {
      if (item.productObj) {
        return isAccessoryProduct(item.productObj);
      }
      return false; // Mặc định không phải phụ kiện
    })
    .sort((a, b) => b.quantitySold - a.quantitySold) // Sắp xếp giảm dần theo số lượng bán
    .slice(0, 5); // Lấy Top 5

  // HELPER HIỂN THỊ BADGE THỨ HẠNG TRỰC QUAN (VÀNG, BẠC, ĐỒNG...)
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
      {/* ─── HIỂN THỊ 4 THẺ CHỈ SỐ TỒN KHO CƠ BẢN ──────────────────────── */}
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

      {/* ─── HIỂN THỊ 2 BẢNG THỐNG KÊ TOP 5 BÁN CHẠY NHẤT  ────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-admin-border/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-admin-border/40">
            <Award size={18} className="text-amber-500 animate-pulse" />
            <h4 className="font-extrabold text-sm text-admin-text-main uppercase tracking-wider">
              Top 5 Sản Phẩm Bán Chạy <span className="text-[11px] text-gray-400 font-semibold lowercase">(30 ngày gần nhất)</span>
            </h4>
          </div>
          {/*hiển thị sản phẩm điện thoại bán chạy*/}
          {bestProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-admin-text-muted font-bold uppercase tracking-wider border-b border-admin-border/30">
                    <th className="pb-2 text-center w-12">Hạng</th>
                    <th className="pb-2 px-3">Tên sản phẩm</th>
                    <th className="pb-2 text-center w-24">Đã bán</th>
                    {/* <th className="pb-2 text-right w-36">Tổng doanh thu</th> */}
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
                      {/* <td className="py-2.5 text-right font-bold text-primary">
                        {formatCurrency(item.totalRevenue)}
                      </td> */}
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

        <div className="bg-white rounded-lg border border-admin-border/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-admin-border/40">
            <TrendingUp size={18} className="text-emerald-500 animate-pulse" />
            <h4 className="font-extrabold text-sm text-admin-text-main uppercase tracking-wider">
              Top 5 Phụ Kiện Bán Chạy <span className="text-[11px] text-gray-400 font-semibold lowercase">(30 ngày gần nhất)</span>
            </h4>
          </div>
          {/*hiển thị sản phẩm phụ kiện bán chạy*/}
          {bestAccessories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-admin-text-muted font-bold uppercase tracking-wider border-b border-admin-border/30">
                    <th className="pb-2 text-center w-12">Hạng</th>
                    <th className="pb-2 px-3">Tên phụ kiện</th>
                    <th className="pb-2 text-center w-24">Đã bán</th>
                    {/* <th className="pb-2 text-right w-36">Tổng doanh thu</th> */}
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
                      {/* <td className="py-2.5 text-right font-bold text-emerald-600">
                        {formatCurrency(item.totalRevenue)}
                      </td> */}
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
