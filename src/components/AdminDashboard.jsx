import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  ShoppingCart, Gift, Package, TrendingUp, ShoppingBag, 
  Users, HardDrive, ShieldAlert, Award, FileText, BarChart3,
  Calendar, Layers, CheckCircle2, ChevronRight, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import api from '../services/api';

import { THEME, PIE_COLORS } from '../utils/theme';

export default function AdminDashboard() {
  const [revenueData, setRevenueData] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [brandPerformance, setBrandPerformance] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0 });
  const [weeklySales, setWeeklySales] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [shippingStats, setShippingStats] = useState({ delivered: 0, shipping: 0, pending: 0, total: 0 });
  const [selectedMonth, setSelectedMonth] = useState('January');

  useEffect(() => {
    // 1. Fetch Revenue Data
    dashboardService.getRevenue()
      .then(data => { if (data && data.length > 0) setRevenueData(data); })
      .catch(e => console.error("Lỗi tải Doanh thu:", e));

    // 2. Fetch Recent Orders
    dashboardService.getRecentOrders()
      .then(data => { if (data && data.length > 0) setRecentOrders(data); })
      .catch(e => console.error("Lỗi tải Đơn hàng mới:", e));

    // 3. Fetch General Stats
    dashboardService.getStats()
      .then(data => { if (data) setStats(data); })
      .catch(e => console.error("Lỗi tải Thống kê:", e));

    // 4. Fetch Users List
    api.get('/User')
      .then(res => {
        const rawUsers = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
        const customersOnly = rawUsers.filter(u => u.role === 'User' || u.role?.toLowerCase() === 'customer');
        setUsersList(customersOnly.slice(0, 5));
      })
      .catch(e => console.error("Lỗi tải danh sách khách hàng:", e));

    // 5. Fetch Products and Orders together to cross-reference and build real metrics
    Promise.all([
      productService.getAll(),
      orderService.getAll()
    ]).then(([products, orders]) => {
      const prodList = Array.isArray(products) ? products : [];
      const orderList = Array.isArray(orders) ? orders : [];

      // A. Calculate weekly sales (past 7 days, excluding cancelled)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weeklyTotal = orderList.reduce((sum, o) => {
        const orderDate = new Date(o.createdAt);
        const isCancelled = o.status && (o.status.toLowerCase() === 'cancelled' || o.status === 'Đã hủy' || o.statusId === 5);
        if (isCancelled) return sum;
        if (orderDate >= sevenDaysAgo) {
          return sum + (o.totalPrice || 0);
        }
        return sum;
      }, 0);
      setWeeklySales(weeklyTotal);

      // B. Shipping statistics
      const delivered = orderList.filter(o => o.statusId === 4).length;
      const shipping = orderList.filter(o => o.statusId === 3).length;
      const pending = orderList.filter(o => o.statusId === 1 || o.statusId === 2).length;
      setShippingStats({
        delivered,
        shipping,
        pending,
        total: orderList.length
      });

      // C. Brand performance (calculate stock from products, sold from orders)
      const brandSold = {};
      orderList.forEach(order => {
        const isCancelled = order.status && (order.status.toLowerCase() === 'cancelled' || order.status === 'Đã hủy' || order.statusId === 5);
        if (isCancelled) return;
        if (order.items) {
          order.items.forEach(item => {
            const prod = prodList.find(p => p.id === item.productId || p.name === item.productName);
            const brand = prod?.brandName || prod?.categoryName || 'Khác';
            brandSold[brand] = (brandSold[brand] || 0) + (item.quantity || 0);
          });
        }
      });

      const performance = {};
      prodList.forEach(p => {
        const brand = p.brandName || p.categoryName || 'Khác';
        if (!performance[brand]) {
          performance[brand] = { name: brand, stock: 0, sold: 0, value: 0 };
        }
        const currentStock = p.availableStock ?? p.totalStock ?? p.stockQuantity ?? p.stock ?? 0;
        performance[brand].stock += currentStock;
      });

      // Map sold quantities
      Object.keys(performance).forEach(brand => {
        const soldQty = brandSold[brand] || 0;
        performance[brand].sold = soldQty;
        performance[brand].value = performance[brand].stock + soldQty;
      });

      setBrandPerformance(Object.values(performance).slice(0, 5));

      // D. Calculate best selling products
      const statsMap = {};
      orderList.forEach(order => {
        const isCancelled = order.status && (order.status.toLowerCase() === 'cancelled' || order.status === 'Đã hủy' || order.statusId === 5);
        if (isCancelled) return;
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
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
      const sortedStats = Object.values(statsMap).sort((a, b) => b.quantity - a.quantity);
      setProductStats(sortedStats.slice(0, 5));
    }).catch(e => console.error("Error loading products & orders data:", e));
  }, []);

  // Format các số liệu hiển thị
  const formattedWeeklySales = weeklySales > 0 
    ? `${weeklySales.toLocaleString('vi-VN')}đ` 
    : '0đ';

  const formattedTotalRevenue = stats.totalRevenue > 0
    ? `${stats.totalRevenue.toLocaleString('vi-VN')}đ`
    : '0đ';

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
  const pieData = brandPerformance.map(b => ({
    name: b.name,
    value: b.value,
    percentage: Math.round((b.value / totalBrandStock) * 100)
  }));

  // Phần trăm của từng trạng thái vận chuyển
  const deliveredPct = shippingStats.total > 0 ? (shippingStats.delivered / shippingStats.total) * 100 : 0;
  const shippingPct = shippingStats.total > 0 ? (shippingStats.shipping / shippingStats.total) * 100 : 0;
  const pendingPct = shippingStats.total > 0 ? (shippingStats.pending / shippingStats.total) * 100 : 0;

  return (
    <div className="space-y-6 pb-10 font-sans text-textmain animate-in fade-in duration-300">
      
      {/* SECTION 1: TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
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
            <ResponsiveContainer width="100%" height="100%">
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderTrendData}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
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
            <ResponsiveContainer width="100%" height="100%">
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
              <h3 className="font-extrabold text-primary text-base">Tổng Doanh Số & Biểu đồ</h3>
              <p className="text-xs text-textmuted">Số liệu tăng trưởng doanh số lũy kế thực tế</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-primary bg-blue-50 px-3 py-1.5 rounded-md">
                Tổng cộng: {formattedTotalRevenue}
              </div>
              <button className="p-1 text-textmuted hover:text-textmain transition-colors">
                <span className="text-lg">•••</span>
              </button>
            </div>
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-bordercustom)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-textmuted)', fontSize: 11, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-textmuted)', fontSize: 11, fontWeight: 600}} />
                <Tooltip cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="monthly" name="Doanh số lũy kế (x10)" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" dot={{ r: 4, stroke: 'var(--color-primary)', strokeWidth: 2, fill: 'var(--color-bgcard)' }} />
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
                <span className="text-xs text-textmuted font-semibold">trong hệ thống</span>
              </div>
              
              <div className="w-full h-3 bg-gray-100 rounded-full mt-4 overflow-hidden flex">
                <div className="h-full bg-success" style={{ width: `${deliveredPct}%` }} title="Đã giao"></div>
                <div className="h-full bg-secondary" style={{ width: `${shippingPct}%` }} title="Đang giao"></div>
                <div className="h-full bg-warning" style={{ width: `${pendingPct}%` }} title="Chờ xử lý/Xác nhận"></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-bold text-admin-text-muted">
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
                  <span>Đã giao</span>
                </div>
                <span className="text-textmain font-black text-xs ml-4">{shippingStats.delivered}</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                  <span>Đang giao</span>
                </div>
                <span className="text-textmain font-black text-xs ml-4">{shippingStats.shipping}</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-warning"></div>
                  <span>Chờ duyệt</span>
                </div>
                <span className="text-textmain font-black text-xs ml-4">{shippingStats.pending}</span>
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
                    const maxRevenue = productStats[0].revenue || 1;
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
                  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'US';
                  const roleName = 'Khách hàng';
                  const colorPalette = ['bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500', 'bg-purple-500'];
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
                      <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-success' : 'bg-gray-300'}`}></div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-textmuted italic py-8 text-center">Chưa tải được danh sách khách hàng</div>
              )}
            </div>
          </div>
          <button className="w-full mt-6 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-admin-text-muted rounded-md transition-colors border border-gray-100">
            Xem tất cả khách hàng
          </button>
        </div>

      </div>

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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brandPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-bordercustom)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-textmuted)', fontSize: 11, fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-textmuted)', fontSize: 11, fontWeight: 600}} />
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
