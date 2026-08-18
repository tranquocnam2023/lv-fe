// BẢNG ĐIỀU KHIỂN & BÁO CÁO THỐNG KÊ (DASHBOARD)
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  HardDrive, ShieldAlert, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { dashboardService } from '../../../services/dashboardService';
import { productService } from '../../../services/productService';
import { orderService } from '../../../services/orderService';
import api from '../../../services/api';

import { THEME, PIE_COLORS } from '../../../utils/theme';

export default function AdminDashboard({ onTabChange }) {
  // State: chartType - Quản lý trạng thái và dữ liệu của chartType trong giao diện
  const [chartType, setChartType] = useState('cumulative'); // 'cumulative' or 'daily'
  // State: revenueData - Quản lý trạng thái và dữ liệu của revenueData trong giao diện
  const [revenueData, setRevenueData] = useState([]);
  // State: productStats - Quản lý trạng thái và dữ liệu của productStats trong giao diện
  const [productStats, setProductStats] = useState([]);
  // State: brandPerformance - Quản lý trạng thái và dữ liệu của brandPerformance trong giao diện
  const [brandPerformance, setBrandPerformance] = useState([]);
  // State: stats - Quản lý trạng thái và dữ liệu của stats trong giao diện
  const [stats, setStats] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0, profitMargin: 0, totalCompletedOrders: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0 });
  // State: weeklySales - Quản lý trạng thái và dữ liệu của weeklySales trong giao diện
  const [weeklySales, setWeeklySales] = useState(0);
  // State: usersList - Quản lý trạng thái và dữ liệu của usersList trong giao diện
  const [usersList, setUsersList] = useState([]);
  // State: shippingStats - Quản lý trạng thái và dữ liệu của shippingStats trong giao diện
  const [shippingStats, setShippingStats] = useState({ pending: 0, confirmed: 0, shipping: 0, delivered: 0, canceled: 0, total: 0 });
  // State: brandProfitReport - Báo cáo Lợi nhuận gộp theo Thương hiệu (Ecosystem Business Insights)
  const [brandProfitReport, setBrandProfitReport] = useState(null);

  useEffect(() => {
    // Fetch Brand Profit Report (Xử lý mượt nếu Backend chưa định nghĩa endpoint này)
    api.get('/AdminDashboard/brand-profit-report')
      .then(res => setBrandProfitReport(res.data || res))
      .catch(() => setBrandProfitReport(null));
    // 1. Fetch Revenue Data
    dashboardService.getRevenue()
      .then(data => { if (data && data.length > 0) setRevenueData(data); })
      .catch(e => console.error("Lỗi tải Doanh thu:", e));

    // 3. Fetch General Stats
    dashboardService.getStats()
      .then(data => { if (data) setStats(data); })
      .catch(e => console.error("Lỗi tải Thống kê:", e));

    // 4. Fetch Users List
    api.get('/User')
      .then(res => {
        // Khai báo biến/hằng số: rawUsers - Dùng trong logic xử lý của component
        const rawUsers = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
        // Hàm thực thi logic: customersOnly
        const customersOnly = rawUsers.filter(u => u.role === 'User' || u.role?.toLowerCase() === 'customer');
        setUsersList(customersOnly.slice(0, 5));
      })
      .catch(e => console.error("Lỗi tải danh sách khách hàng:", e));

    // 5. Fetch Products and Orders together to cross-reference and build real metrics
    Promise.all([
      productService.getAll(),
      orderService.getAll()
    ]).then(([products, orders]) => {
      // Cấu hình/Hằng số/Dịch vụ dữ liệu: prodList
      const prodList = Array.isArray(products) ? products : [];
      // Cấu hình/Hằng số/Dịch vụ dữ liệu: orderList
      const orderList = Array.isArray(orders) ? orders : [];

      // A. Calculate weekly sales (past 7 days, completed only)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // Hàm thực thi logic: weeklyTotal
      const weeklyTotal = orderList.reduce((sum, o) => {
        // Khai báo biến/hằng số: orderDate - Dùng trong logic xử lý của component
        const orderDate = new Date(o.createdAt);
        // Khai báo biến/hằng số: isCompleted - Dùng trong logic xử lý của component
        const isCompleted = o.statusId === 4 || o.statusName === 'Đã giao' || o.statusName === 'Hoàn thành';
        if (!isCompleted) return sum;
        if (orderDate >= sevenDaysAgo) {
          return sum + (o.totalPrice || 0);
        }
        return sum;
      }, 0);
      setWeeklySales(weeklyTotal);

      // B. Shipping statistics
      const pending = orderList.filter(o => o.statusId === 1).length;
      // Hàm thực thi logic: confirmed
      const confirmed = orderList.filter(o => o.statusId === 2).length;
      // Hàm thực thi logic: shipping
      const shipping = orderList.filter(o => o.statusId === 3).length;
      // Hàm thực thi logic: delivered
      const delivered = orderList.filter(o => o.statusId === 4).length;
      // Hàm thực thi logic: canceled
      const canceled = orderList.filter(o => o.statusId === 5).length;
      setShippingStats({
        pending,
        confirmed,
        shipping,
        delivered,
        canceled,
        total: orderList.length
      });

      // C. Brand performance (calculate stock from products, sold from orders)
      const brandSold = {};
      orderList.forEach(order => {
        // Khai báo biến/hằng số: isCompleted - Dùng trong logic xử lý của component
        const isCompleted = order.statusId === 4 || order.statusName === 'Đã giao' || order.statusName === 'Hoàn thành';
        if (!isCompleted) return;
        if (order.items) {
          order.items.forEach(item => {
            // Hàm thực thi logic: prod
            const prod = prodList.find(p => p.id === item.productId || p.name === item.productName);
            // Khai báo biến/hằng số: brand - Dùng trong logic xử lý của component
            const brand = prod?.brandName || prod?.categoryName || 'Khác';
            brandSold[brand] = (brandSold[brand] || 0) + (item.quantity || 0);
          });
        }
      });

      // Khai báo biến/hằng số: performance - Dùng trong logic xử lý của component
      const performance = {};
      prodList.forEach(p => {
        // Khai báo biến/hằng số: brand - Dùng trong logic xử lý của component
        const brand = p.brandName || p.categoryName || 'Khác';
        if (!performance[brand]) {
          performance[brand] = { name: brand, stock: 0, sold: 0, value: 0 };
        }
        // Khai báo biến/hằng số: currentStock - Dùng trong logic xử lý của component
        const currentStock = p.availableStock ?? p.totalStock ?? p.stockQuantity ?? p.stock ?? 0;
        performance[brand].stock += currentStock;
      });

      // Map sold quantities
      Object.keys(performance).forEach(brand => {
        // Khai báo biến/hằng số: soldQty - Dùng trong logic xử lý của component
        const soldQty = brandSold[brand] || 0;
        performance[brand].sold = soldQty;
        performance[brand].value = performance[brand].stock + soldQty;
      });

      setBrandPerformance(Object.values(performance).slice(0, 5));

      // D. Calculate best selling products
      const statsMap = {};
      orderList.forEach(order => {
        // Khai báo biến/hằng số: isCompleted - Dùng trong logic xử lý của component
        const isCompleted = order.statusId === 4 || order.statusName === 'Đã giao' || order.statusName === 'Hoàn thành';
        if (!isCompleted) return;
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            // Khai báo biến/hằng số: name - Dùng trong logic xử lý của component
            const name = item.productName || 'Sản phẩm không tên';
            if (!statsMap[name]) {
              statsMap[name] = {
                name,
                quantity: 0,
                revenue: 0
              };
            }
            statsMap[name].quantity += item.quantity || 0;
            statsMap[name].revenue += (item.quantity || 0) * (item.priceAtPurchase || 0);
          });
        }
      });
      // Hàm thực thi logic: sortedStats
      const sortedStats = Object.values(statsMap).sort((a, b) => b.quantity - a.quantity);
      setProductStats(sortedStats.slice(0, 5));
    }).catch(e => console.error("Error loading products & orders data:", e));
  }, []);

  // Format các số liệu hiển thị
  const formattedWeeklySales = weeklySales > 0
    ? `${weeklySales.toLocaleString('vi-VN')}đ`
    : '0đ';

  // Khai báo biến/hằng số: formattedTotalRevenue - Dùng trong logic xử lý của component
  const formattedTotalRevenue = stats.totalRevenue > 0
    ? `${stats.totalRevenue.toLocaleString('vi-VN')}đ`
    : '0đ';

  // LỢI NHUẬN GỘP (Tiền bán - Tiền gốc nhập kho), chỉ tính trên các đơn hàng ĐÃ GIAO THÀNH CÔNG
  const formattedTotalProfit = `${(stats.totalProfit || 0).toLocaleString('vi-VN')}đ`;
  const formattedTotalCost = `${(stats.totalCost || 0).toLocaleString('vi-VN')}đ`;

  // Tạo dữ liệu giả lập cho biểu đồ mini của Total Orders
  const orderTrendData = [
    { name: 'W1', orders: 15 },
    { name: 'W2', orders: 38 },
    { name: 'W3', orders: 20 },
    { name: 'W4', orders: 54 },
    { name: 'W5', orders: stats.totalOrders || 45 }
  ];

  // Tính phần trăm thị phần của các thương hiệu hàng đầu
  const totalBrandStock = brandPerformance.reduce((acc, curr) => acc + curr.value, 0) || 1;
  // Hàm thực thi logic: pieData
  const pieData = brandPerformance.map(b => ({
    name: b.name,
    value: b.value,
    percentage: Math.round((b.value / totalBrandStock) * 100)
  }));

  // Phần trăm của từng trạng thái vận chuyển (đã bỏ thanh đo)

  // Chuẩn bị dữ liệu cho biểu đồ (tự động chia tỷ lệ x10 cho doanh thu ngày để đồng bộ trục Y với lũy kế)
  const formattedChartData = revenueData.map(item => ({
    ...item,
    dailyScaled: (item.daily || 0) / 10
  }));

  // Biểu đồ tròn không biểu diễn được phần âm: thương hiệu đang lỗ (tỷ trọng LN < 0) sẽ làm
  // Recharts vẽ sai hình. Chỉ đưa các thương hiệu có lãi vào biểu đồ, phần lỗ đã thể hiện đầy đủ
  // ở bảng bên cạnh.
  const profitPieData = (brandProfitReport?.brands || []).filter(b => (b.profitShare || 0) > 0);
  const lossMakingBrands = (brandProfitReport?.brands || []).filter(b => (b.grossProfit || 0) < 0);

  return (
    <div className="space-y-6 pb-10 font-sans text-textmain animate-in fade-in duration-300">

      {/* SECTION 1: TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Card 0: Lợi nhuận gộp thực tế (Tiền bán - Tiền gốc nhập kho, chỉ tính đơn giao thành công) */}
        <div className="bg-bgcard p-5 rounded-lg border border-bordercustom shadow-sm flex flex-col justify-between h-[150px] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-textmuted uppercase tracking-wider flex items-center gap-1">
              Lợi nhuận gộp
              <span
                className="text-[10px] text-gray-400 font-normal cursor-help"
                title="Lợi nhuận = Tiền bán - Tiền gốc (giá nhập kho gần nhất). Chỉ tính các đơn hàng ĐÃ GIAO THÀNH CÔNG."
              >
                (đơn thành công)
              </span>
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-extrabold tracking-tight text-success">{formattedTotalProfit}</h3>
              <span className="text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                {stats.profitMargin || 0}%
              </span>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-textmuted space-y-0.5">
            <p>Tiền gốc nhập hàng: <span className="font-bold text-admin-text-main">{formattedTotalCost}</span></p>
            <p>{(stats.totalCompletedOrders || 0).toLocaleString('vi-VN')} đơn đã giao thành công</p>
          </div>
        </div>

        {/* Card 1: Weekly Sales */}
        <div className="bg-bgcard p-5 rounded-lg border border-bordercustom shadow-sm flex flex-col justify-between h-[150px] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-textmuted uppercase tracking-wider flex items-center gap-1">
              Doanh thu tuần qua <span className="text-[10px] text-gray-400 font-normal">(7 ngày)</span>
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-extrabold tracking-tight text-primary">{formattedWeeklySales}</h3>
              <span className="text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight size={12} /> +3.5%
              </span>
            </div>
          </div>
          <div className="absolute right-2 bottom-2 w-[120px] h-[60px]">
            <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
              <BarChart data={revenueData.slice(-6)}>
                <Bar dataKey="daily" fill="var(--color-primary)" opacity={0.8} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-bgcard p-5 rounded-lg border border-bordercustom shadow-sm flex flex-col justify-between h-[150px] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-textmuted uppercase tracking-wider">Tổng Đơn Hàng</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl font-extrabold tracking-tight text-primary">
                {stats.totalOrders > 0 ? stats.totalOrders.toLocaleString('vi-VN') : '0'}
              </h3>
              <span className="text-[11px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowDownRight size={12} /> -13.6%
              </span>
            </div>
          </div>
          <div className="absolute right-2 bottom-1 w-[120px] h-[60px]">
            <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
              <AreaChart data={orderTrendData}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="orders" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#orderGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Market Share Donut */}
        <div className="bg-bgcard p-5 rounded-lg border border-bordercustom shadow-sm flex items-center justify-between h-[150px] group hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-textmuted uppercase tracking-wider">Thị Phần Kho Hiệu</p>
            <div className="space-y-1">
              {pieData.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] font-semibold text-admin-text-muted">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                  <span className="truncate max-w-[80px]">{item.name}</span>
                  <span className="text-gray-400 font-normal">({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-[100px] h-[100px] flex-shrink-0 relative">
            <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[13px] font-extrabold text-primary">
                {stats.totalProducts > 0 ? stats.totalProducts : '0'}
              </span>
              <span className="text-[8px] text-textmuted font-bold uppercase">Mã hàng</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: CHARTS & PROJECTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Total Sales Line Chart (8 Columns) */}
        <div className="lg:col-span-8 bg-bgcard p-6 rounded-lg border border-bordercustom shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-primary text-base">
                {chartType === 'cumulative' ? 'Tổng Doanh Số (Lũy kế)' : 'Doanh Thu Thực Tế (Theo Ngày)'}
              </h3>
              <p className="text-xs text-textmuted">
                {chartType === 'cumulative' ? 'Số liệu tăng trưởng doanh số lũy kế thực tế' : 'Số liệu doanh thu thực tế phát sinh theo từng ngày'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-primary bg-blue-50 px-3 py-1.5 rounded-md">
                {chartType === 'cumulative' ? `Tổng lũy kế: ${formattedTotalRevenue}` : `Doanh thu tuần: ${formattedWeeklySales}`}
              </div>
              <button
                onClick={() => setChartType(prev => prev === 'cumulative' ? 'daily' : 'cumulative')}
                className="p-1.5 text-textmuted hover:text-primary hover:bg-gray-50 border border-bordercustom rounded-md transition-all duration-200 flex items-center gap-1 font-semibold text-xs cursor-pointer"
                title={chartType === 'cumulative' ? 'Click để chuyển sang Doanh thu theo Ngày' : 'Click để chuyển sang Lũy kế doanh số'}
              >
                <span>{chartType === 'cumulative' ? 'Xem Doanh thu Ngày' : 'Xem Lũy kế'}</span>
                <span className="text-lg">•••</span>
              </button>
            </div>
          </div>

          <div className="flex-1">
            <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
              <AreaChart data={formattedChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-bordercustom)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-textmuted)', fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-textmuted)', fontSize: 11, fontWeight: 600 }} />
                <Tooltip cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey={chartType === 'cumulative' ? "monthly" : "dailyScaled"}
                  name={chartType === 'cumulative' ? "Doanh số lũy kế (x10)" : "Doanh thu ngày (x10)"}
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  dot={{ r: 4, stroke: 'var(--color-primary)', strokeWidth: 2, fill: 'var(--color-bgcard)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Storage Status & Promotion Widget (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">

          {/* Shipping/Storage Performance Meter */}
          <div className="bg-bgcard p-6 rounded-lg border border-bordercustom shadow-sm flex flex-col justify-between flex-1">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-textmuted uppercase tracking-wider">Trạng thái đơn hàng</h4>
                <HardDrive size={16} className="text-primary" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-extrabold text-admin-text-main">{shippingStats.total} Đơn hàng</h3>
                {/*Muốn ghi gì thì ghi*/}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 text-[10px] font-bold text-admin-text-muted">
              {/* Cột 1 */}
              <div className="space-y-4">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-warning"></div>
                    <span>Chờ duyệt</span>
                  </div>
                  <span className="text-textmain font-black text-xs ml-4">{shippingStats.pending}</span>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-info"></div>
                    <span>Đã xác nhận</span>
                  </div>
                  <span className="text-textmain font-black text-xs ml-4">{shippingStats.confirmed}</span>
                </div>
              </div>

              {/* Cột 2 */}
              <div className="space-y-4">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                    <span>Đang giao</span>
                  </div>
                  <span className="text-textmain font-black text-xs ml-4">{shippingStats.shipping}</span>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
                    <span>Đã giao</span>
                  </div>
                  <span className="text-textmain font-black text-xs ml-4">{shippingStats.delivered}</span>
                </div>
              </div>

              {/* Cột 3 */}
              <div className="space-y-4">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-danger"></div>
                    <span>Đã hủy</span>
                  </div>
                  <span className="text-textmain font-black text-xs ml-4">{shippingStats.canceled}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Promotion Banner */}
          <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-lg text-white shadow-md flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
              <ShieldAlert size={140} />
            </div>
            <div className="z-10">
              <h4 className="font-extrabold text-lg mb-1 leading-snug">Hệ thống phân tích PhoneShop</h4>
              <p className="text-xs text-blue-100 font-semibold leading-relaxed">Bộ công cụ quản trị dữ liệu thông minh, liên tục cập nhật theo thời gian thực từ CSDL SQL.</p>
            </div>
            <button className="z-10 self-start text-xs font-bold bg-bgcard text-primary px-4 py-2 rounded-md hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1">
              Xem tài liệu <ChevronRight size={14} />
            </button>
          </div>

        </div>

      </div>

      {/* SECTION 3: TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Best Selling Products (8 Columns) */}
        <div className="lg:col-span-8 bg-bgcard p-6 rounded-lg border border-bordercustom shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-textmain text-base">Sản phẩm bán chạy nhất</h3>
              <p className="text-xs text-textmuted">Top sản phẩm mang lại doanh thu cao nhất cho PhoneShop</p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-bordercustom text-textmuted text-[11px] font-bold uppercase tracking-wider">
                  <th className="pb-3">Tên sản phẩm</th>
                  <th className="pb-3 text-right">Doanh thu</th>
                  <th className="pb-3 text-center">Số lượng</th>
                  <th className="pb-3 text-right">Tỉ lệ đóng góp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bordercustom">
                {productStats.length > 0 ? (
                  productStats.map((item, idx) => {
                    // Khai báo biến/hằng số: maxRevenue - Dùng trong logic xử lý của component
                    const maxRevenue = productStats[0].revenue || 1;
                    // Khai báo biến/hằng số: contributionRate - Dùng trong logic xử lý của component
                    const contributionRate = Math.round((item.revenue / maxRevenue) * 100);
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 font-bold text-textmain max-w-[200px] truncate">{item.name}</td>
                        <td className="py-4 text-right font-bold text-primary">{item.revenue.toLocaleString('vi-VN')}đ</td>
                        <td className="py-4 text-center font-bold text-success">{item.quantity}</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="font-bold text-xs text-admin-text-muted">{contributionRate}%</span>
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${contributionRate}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-textmuted italic">Chưa có dữ liệu bán hàng</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Active Customer List (4 Columns) */}
        <div className="lg:col-span-4 bg-bgcard p-6 rounded-lg border border-bordercustom shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-textmain text-base">Danh sách khách hàng</h3>
              <span className="text-[10px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">Khách hàng</span>
            </div>
            <div className="space-y-4">
              {usersList.length > 0 ? (
                usersList.map((user, idx) => {
                  // Khai báo biến/hằng số: initials - Dùng trong logic xử lý của component
                  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'US';
                  // Khai báo biến/hằng số: roleName - Dùng trong logic xử lý của component
                  const roleName = 'Khách hàng';
                  // Khai báo biến/hằng số: colorPalette - Dùng trong logic xử lý của component
                  const colorPalette = ['bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500', 'bg-purple-500'];
                  // Khai báo biến/hằng số: avatarBg - Dùng trong logic xử lý của component
                  const avatarBg = colorPalette[idx % colorPalette.length];

                  return (
                    <div key={user.id || idx} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarBg}`}>
                          {initials}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-textmain group-hover:text-primary transition-colors">{user.username}</h4>
                          <p className="text-[10px] text-textmuted font-semibold">{roleName}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-textmuted italic py-8 text-center">Chưa tải được danh sách khách hàng</div>
              )}
            </div>
          </div>
          <button
            onClick={() => onTabChange && onTabChange('customers')}
            className="w-full mt-6 py-2 bg-blue-500 hover:bg-blue-600 text-xs font-bold text-admin-text-muted rounded-md transition-colors border border-gray-100"
          >
            Xem tất cả khách hàng
          </button>
        </div>

      </div>

      {/* SECTION BRAND PROFITABILITY & ECOSYSTEM INSIGHTS */}
      {brandProfitReport && (
        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-100 pb-4">
            <div>
              <h3 className="font-extrabold text-emerald-900 text-lg flex items-center gap-2">
                <span>📊</span> Báo Cáo Quản Trị: Ăn Chia Lợi Nhuận & Hệ Sinh Thái Theo Hãng
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Phân tích đối sánh giữa Doanh thu và Lợi nhuận gộp thực tế (Tiền bán - Tiền gốc nhập hàng) giữa các thương hiệu.
                <span className="font-bold text-emerald-700"> Chỉ tính đơn hàng đã giao thành công</span>
                {typeof brandProfitReport.totalCompletedOrders === 'number' && (
                  <span className="text-slate-400"> ({brandProfitReport.totalCompletedOrders.toLocaleString('vi-VN')} đơn).</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-right">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">Tổng Lợi Nhuận Gộp</span>
                <span className="text-sm font-black text-emerald-600">
                  {(brandProfitReport.totalStoreGrossProfit || 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-right">
                <span className="text-[10px] font-bold text-blue-700 block uppercase">Biên Lợi Nhuận Toàn Shop</span>
                <span className="text-sm font-black text-blue-600">
                  {brandProfitReport.overallMargin || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Donut Charts (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 text-center">
                So Sánh Tỷ Trọng Doanh Thu vs Lợi Nhuận Gộp (%)
              </h4>
              <div className="w-full h-[240px]">
                <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profitPieData}
                      dataKey="profitShare"
                      nameKey="brandName"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ brandName, profitShare }) => `${brandName}: ${profitShare}%`}
                    >
                      {profitPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {lossMakingBrands.length > 0 && (
                <p className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mt-1 text-center">
                  Biểu đồ chỉ gồm thương hiệu có lãi. Đang lỗ:{' '}
                  <span className="font-black">{lossMakingBrands.map(b => b.brandName).join(', ')}</span> — xem tỷ trọng âm ở bảng bên.
                </p>
              )}
            </div>

            {/* Right: Ecosystem Profit Table (7 Cols) */}
            <div className="lg:col-span-7 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50">
                    <th className="p-2.5 rounded-l-md">Thương hiệu</th>
                    <th className="p-2.5 text-right">Doanh thu</th>
                    <th className="p-2.5 text-right">Tiền gốc (nhập hàng)</th>
                    <th className="p-2.5 text-right">Lợi nhuận gộp</th>
                    <th className="p-2.5 text-center">Biên Lợi Nhuận</th>
                    <th className="p-2.5 text-right rounded-r-md">Tỷ trọng LN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(brandProfitReport.brands || []).map((b, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-2.5 font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        {b.brandName}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-600">
                        {b.revenue.toLocaleString('vi-VN')}₫ <span className="text-[10px] text-slate-400">({b.revenueShare}%)</span>
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-500">
                        {(b.costOfGoodsSold || 0).toLocaleString('vi-VN')}₫
                      </td>
                      <td className={`p-2.5 text-right font-black ${b.grossProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {b.grossProfit.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${b.profitMargin >= 30 ? 'bg-emerald-100 text-emerald-800' : (b.profitMargin >= 18 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}`}>
                          {b.profitMargin}%
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-black text-slate-900">
                        {/*
                          Hãng đang lỗ thì "tỷ trọng lợi nhuận" không còn ý nghĩa: mẫu số là tổng lãi
                          của các hãng CÓ lãi, nên một hãng lỗ nặng sẽ ra con số kiểu -358% - đúng
                          phép tính nhưng không đọc được. Với các hãng này ghi thẳng là đang lỗ và
                          bao nhiêu, số % vẫn giữ trong tooltip cho ai cần.
                        */}
                        {b.grossProfit < 0 ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-700"
                            title={`Tỷ trọng lợi nhuận: ${b.profitShare}%`}
                          >
                            Lỗ {Math.abs(b.grossProfit).toLocaleString('vi-VN')}₫
                          </span>
                        ) : (
                          `${b.profitShare}%`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/*
                Sau khi bỏ việc tự sinh giá vốn = 85% giá bán, những sản phẩm chưa khai giá nhập
                sẽ KHÔNG được tính vào báo cáo lợi nhuận (thay vì hiện lợi nhuận 0đ như số liệu
                thật). Nói rõ ra để admin biết báo cáo đang thiếu bao nhiêu, và đi khai giá nhập.
              */}
              {(brandProfitReport.unknownCostUnits || 0) > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-semibold">
                  Có <span className="font-black">{brandProfitReport.unknownCostUnits.toLocaleString('vi-VN')}</span> sản phẩm đã bán
                  (doanh thu <span className="font-black">{(brandProfitReport.unknownCostRevenue || 0).toLocaleString('vi-VN')}₫</span>)
                  chưa khai giá nhập nên không được tính vào báo cáo lợi nhuận. Khai giá nhập ở màn Kho để số liệu đầy đủ.
                </div>
              )}

              {(brandProfitReport.brands || []).length === 0 && (
                <div className="p-6 text-center text-xs font-semibold text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                  Chưa có đơn hàng nào giao thành công trong kỳ nên chưa ghi nhận được lợi nhuận.
                </div>
              )}

              {/* Insight Cards: sinh trực tiếp từ số liệu thật của từng thương hiệu */}
              {(brandProfitReport.brands || []).length > 0 && (
                <div className="mt-4 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold space-y-1">
                  <div className="font-extrabold flex items-center gap-1 text-emerald-800">
                    <span>💡 Insight Kinh doanh Hệ sinh thái:</span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-emerald-800/90 space-y-0.5">
                    {(brandProfitReport.brands || []).slice(0, 3).map((b, idx) => (
                      <p key={idx}>- <strong>{b.brandName}</strong>: {b.insightNote}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: FULL CHART AT BOTTOM - TOP PRODUCTS */}
      <div className="bg-bgcard p-6 rounded-lg border border-bordercustom shadow-sm flex flex-col h-[350px]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-extrabold text-textmain text-base">Top Sản Phẩm So Sánh</h3>
            <p className="text-xs text-textmuted">So sánh tỉ lệ tồn kho và khả năng bán ra của các thương hiệu hàng đầu</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-admin-text-muted">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-primary rounded-sm"></div> Tồn kho</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-secondary rounded-sm"></div> Đã bán</span>
          </div>
        </div>

        <div className="flex-1">
          <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
            <BarChart data={brandPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-bordercustom)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-textmuted)', fontSize: 11, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-textmuted)', fontSize: 11, fontWeight: 600 }} />
              <Tooltip />
              <Bar dataKey="stock" name="Tồn kho" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={25} />
              <Bar dataKey="sold" name="Đã bán" fill="var(--color-secondary)" radius={[3, 3, 0, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
