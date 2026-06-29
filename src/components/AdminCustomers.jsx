import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Award, UserCheck, ShieldCheck, Users, Lock, Unlock, X, ShieldAlert } from 'lucide-react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { usePagination } from '../hooks/usePagination';
import { useFormat } from '../hooks/useFormat';

const CUSTOMER_TABS = [
  { id: 'all', name: 'Tất cả', count: 0, icon: Users, color: 'text-admin-text-muted', bgColor: 'bg-admin-bg' },
  { id: 'User', name: 'Khách hàng', count: 0, icon: UserCheck, color: 'text-success', bgColor: 'bg-success/10' },
  { id: 'Admin', name: 'Quản trị viên', count: 0, icon: Award, color: 'text-primary', bgColor: 'bg-primary/10' },
];

const CUSTOMER_STATS_CONFIG = [
  { label: 'Tổng người dùng', countKey: 'all', icon: Users, bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-primary)' },
  { label: 'Khách hàng (User)', countKey: 'User', icon: UserCheck, bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-success)' },
  { label: 'Quản trị viên (Admin)', countKey: 'Admin', icon: Award, bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-primary)' },
];

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [modalLoading, setModalLoading] = useState(false);

  const { formatDate } = useFormat();

  const fetchUsers = () => {
    setLoading(true);
    userService.getAll()
      .then(data => {
        if (Array.isArray(data)) {
          setCustomers(data);
        } else {
          setCustomers([]);
        }
      })
      .catch(err => {
        console.error("Lỗi tải khách hàng từ API:", err);
        setCustomers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, username, isActive) => {
    const actionText = isActive ? 'KHÓA' : 'MỞ KHÓA';
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của "${username}"?`)) {
      try {
        const msg = await userService.toggleStatus(id);
        alert(msg || 'Thực hiện thao tác thành công!');
        fetchUsers();
      } catch (error) {
        console.error("Lỗi thay đổi trạng thái:", error);
        alert('Có lỗi xảy ra: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  const handleOpenModal = () => {
    setFormData({ username: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      alert('Đăng ký tài khoản người dùng mới thành công!');
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Đăng ký thất bại:", error);
      alert('Lỗi đăng ký: ' + (error.message || JSON.stringify(error)));
    } finally {
      setModalLoading(false);
    }
  };

  // Filter logic
  const filteredCustomers = customers.filter(customer => {
    const matchesTab = activeTab === 'all' || customer.role === activeTab;
    const matchesSearch = (customer.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const {
    currentData: paginatedCustomers,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredCustomers, 5); // 5 records per page

  // Calculate counts for tabs
  const tabCounts = {
    all: customers.length,
    User: customers.filter(c => c.role === 'User').length,
    Admin: customers.filter(c => c.role === 'Admin').length,
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin': return 'bg-primary/10 text-primary border border-primary/20';
      case 'User': return 'bg-success/10 text-success border border-success/20';
      default: return 'bg-admin-bg text-admin-text-muted';
    }
  };

  const getRankBadgeStyle = (points) => {
    if (points >= 5000) return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (points >= 1000) return 'bg-slate-100 text-slate-800 border border-slate-200';
    return 'bg-orange-100 text-orange-800 border border-orange-200';
  };

  //hạng khách hàng
  const getRankLabel = (points) => {
    if (points >= 5000) return 'Vàng';
    if (points >= 1000) return 'Bạc';
    return 'Đồng';
  };

  const getRankColorClass = (points) => {
    if (points >= 5000) return 'text-amber-600';
    if (points >= 1000) return 'text-slate-500';
    return 'text-orange-700';
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Quản lý khách hàng</h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Theo dõi thông tin, phân quyền và trạng thái hoạt động của tài khoản người dùng</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm username, email, mã người dùng..."
              className="w-full pl-11 pr-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-medium text-admin-text-main placeholder-admin-text-muted"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 whitespace-nowrap"
          >
            <UserPlus size={18} />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CUSTOMER_STATS_CONFIG.map((item, i) => {
          const Icon = item.icon;
          const count = tabCounts[item.countKey];
          return (
            <div
              key={i}
              className="p-5 rounded-md transition-all flex items-center justify-between h-28 bg-white border border-admin-border"
            >
              <div className="flex flex-col">
                <p className="text-[12px] font-bold text-admin-text-muted mb-1">
                  {item.label}
                </p>
                <h3 className="text-2xl font-bold text-admin-text-main leading-none">
                  {count.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-full bg-admin-bg flex items-center justify-center flex-shrink-0">
                <Icon size={24} style={{ color: item.iconColor }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
        {CUSTOMER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-md text-sm font-bold transition-all whitespace-nowrap border ${isActive
                ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
                : 'bg-white text-admin-text-muted border-admin-border hover:border-primary hover:text-primary'
                }`}
            >
              {Icon && <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : tab.color}`} />}
              {tab.name}
              <span className={`ml-3 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tighter ${isActive ? 'bg-white/20 text-white' : 'bg-admin-bg text-admin-text-main'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-md overflow-hidden mb-8 border border-admin-border">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-primary gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="font-bold text-sm">Đang tải danh sách người dùng...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-admin-border bg-admin-bg/50">
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Tên người dùng</th>
                  {/*<th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Mã số tài khoản</th>*/}
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Thứ hạng</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Email liên hệ</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Vai trò</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Ngày đăng ký</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border text-sm">
                {paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map((customer) => {
                    return (
                      <tr key={customer.id} className="hover:bg-admin-bg transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {(customer.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-bold ${getRankColorClass(customer.accumulatedPoints || 0)}`}>{customer.username}</span>
                          </div>
                        </td>
                        {/*<td className="px-6 py-4 font-medium text-admin-text-muted">
                          <span className="text-xs">{customer.id}</span>
                        </td>*/}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getRankBadgeStyle(customer.accumulatedPoints || 0)}`}>
                              {getRankLabel(customer.accumulatedPoints || 0)}
                            </span>
                            <span className="text-xs text-admin-text-muted mt-1 font-bold">
                              Ví: {customer.rewardPoints ?? 0} | Tích lũy: {customer.accumulatedPoints ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-medium text-admin-text-main">{customer.email}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block ${getRoleBadgeStyle(customer.role)}`}>
                            {customer.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-admin-text-main">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block ${customer.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-admin-danger/10 text-admin-danger'
                            }`}>
                            {customer.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(customer.id, customer.username, customer.isActive)}
                              className={`p-2 rounded-md transition-all ${customer.isActive
                                ? 'text-admin-danger hover:bg-admin-danger/10'
                                : 'text-success hover:bg-success/10'
                                }`}
                              title={customer.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            >
                              {customer.isActive ? <Lock size={18} /> : <Unlock size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-admin-text-muted">
                        <Users size={64} strokeWidth={1} className="mb-4 opacity-50" />
                        <p className="text-lg font-bold text-admin-text-main">Không tìm thấy tài khoản người dùng nào</p>
                        <p className="text-sm font-medium mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="px-6 py-4 border-t border-admin-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-bold text-admin-text-muted">
              Hiển thị {startIndex}-{endIndex} trên {totalItems} tài khoản
            </span>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-colors disabled:opacity-50"
              >
                TRƯỚC
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-colors disabled:opacity-50"
              >
                SAU
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-md w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-admin-border flex justify-between items-center bg-admin-bg">
              <h3 className="text-xl font-bold text-admin-text-main flex items-center gap-2">
                <UserPlus size={22} className="text-primary" />
                Tạo tài khoản mới
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-admin-text-muted hover:text-admin-danger hover:rotate-90 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main font-medium"
                  placeholder="Nhập tên tài khoản..."
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main font-medium"
                  placeholder="example@gmail.com..."
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-admin-text-main mb-2">Mật khẩu</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main font-medium"
                  placeholder="Tối thiểu 6 ký tự..."
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="bg-warning/10 p-4 rounded-md border border-warning/20 flex items-start gap-3 text-xs text-warning font-medium">
                <ShieldAlert size={20} className="shrink-0" />
                <p>Tài khoản được đăng ký tại đây mặc định sẽ có vai trò là <strong>Khách hàng (User)</strong> và được kích hoạt hoạt động ngay.</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-admin-bg text-admin-text-main rounded-md font-bold hover:bg-admin-border transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 disabled:opacity-50"
                >
                  {modalLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
