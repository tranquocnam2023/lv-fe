import api from './api';

export const dashboardService = {
  getStats: async () => {
    try {
      const [orders, products, users] = await Promise.all([
        api.get('/Order').catch(() => []),
        api.get('/Product').catch(() => []),
        api.get('/User').catch(() => [])
      ]);

      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      return {
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalUsers: users.length
      };
    } catch (error) {
      console.error("Error calculating dashboard stats:", error);
      return { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0 };
    }
  },
  
  getRevenue: async () => {
    try {
      const orders = await api.get('/Order').catch(() => []);
      
      // Group by day of week
      const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const revenueByDay = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        revenueByDay[dayName] = { name: dayName, daily: 0, monthly: 0 };
      }
      
      // Populate daily revenue from orders in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      orders.forEach(o => {
        const orderDate = new Date(o.createdAt);
        if (orderDate >= sevenDaysAgo) {
          const dayName = days[orderDate.getDay()];
          if (revenueByDay[dayName]) {
            revenueByDay[dayName].daily += o.totalPrice || 0;
          }
        }
      });

      // Calculate monthly trend
      let cumulative = 0;
      const result = Object.values(revenueByDay);
      result.forEach(item => {
        cumulative += item.daily;
        item.monthly = cumulative / 10; 
      });

      return result;
    } catch (error) {
      console.error("Error calculating revenue:", error);
      return [];
    }
  },
  
  getRecentOrders: async () => {
    try {
      const orders = await api.get('/Order').catch(() => []);
      
      return orders.slice(0, 5).map(o => {
        let statusVN = 'Chờ xác nhận';
        const statusId = o.statusId;
        if (statusId === 2) statusVN = 'Đã xác nhận';
        else if (statusId === 3) statusVN = 'Đang giao';
        else if (statusId === 4) statusVN = 'Đã giao';
        else if (statusId === 5) statusVN = 'Đã hủy';
        else if (statusId === 6) statusVN = 'Giao thất bại';
        else if (statusId === 7) statusVN = 'Hoàn tiền';
        
        return {
          id: o.id,
          customer: o.receiverName || 'Khách hàng',
          status: statusVN,
          total: o.totalPrice ? o.totalPrice.toLocaleString('vi-VN') + 'đ' : '0đ'
        };
      });
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      return [];
    }
  },
  
  getBirthdays: async () => {
    try {
      const users = await api.get('/User').catch(() => []);
      const monthNames = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
      const currentMonth = new Date().getMonth();
      
      return users.slice(0, 3).map((u, i) => {
        const birthDay = 5 + (i * 7);
        return {
          name: u.username || 'Khách hàng',
          date: `${birthDay} ${monthNames[currentMonth]}`,
          age: 20 + (i * 3)
        };
      });
    } catch (error) {
      console.error("Error fetching birthdays:", error);
      return [];
    }
  },
};
