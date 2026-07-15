// QUẢN LÝ GIAO DỊCH & THANH TOÁN
import React, { useState, useEffect } from 'react';
import { Search, CreditCard, Clock, CheckCircle2, XCircle, DollarSign, Activity, Copy, Check } from 'lucide-react';
import { paymentService } from '../../../services/paymentService';
import { usePagination } from '../../../hooks/usePagination';
import { useFormat } from '../../../hooks/useFormat';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const { formatCurrency, formatDate } = useFormat();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.getAll();
      if (Array.isArray(data)) {
        setPayments(data);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải giao dịch thanh toán:', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logic
  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesProvider = providerFilter === 'all' || p.provider?.toLowerCase() === providerFilter.toLowerCase();
    
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = 
      !term ||
      String(p.orderId).includes(term) ||
      (p.customerName && p.customerName.toLowerCase().includes(term)) ||
      (p.customerEmail && p.customerEmail.toLowerCase().includes(term)) ||
      (p.providerSessionId && p.providerSessionId.toLowerCase().includes(term)) ||
      (p.providerTransactionId && p.providerTransactionId.toLowerCase().includes(term));

    return matchesStatus && matchesProvider && matchesSearch;
  });

  const {
    currentData: paginatedPayments,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredPayments, 8);

  // Statistics calculation
  const stats = React.useMemo(() => {
    const totalCount = payments.length;
    const succeededCount = payments.filter(p => p.status?.toLowerCase() === 'succeeded').length;
    const pendingCount = payments.filter(p => p.status?.toLowerCase() === 'pending').length;
    const failedCount = payments.filter(p => p.status?.toLowerCase() === 'failed').length;

    const totalRevenue = payments
      .filter(p => p.status?.toLowerCase() === 'succeeded')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalCount,
      succeededCount,
      pendingCount,
      failedCount,
      totalRevenue
    };
  }, [payments]);

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
        return 'bg-success/10 text-success border border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border border-warning/20';
      case 'failed':
        return 'bg-danger/10 text-danger border border-danger/20';
      default:
        return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'succeeded': return 'Thành công';
      case 'pending': return 'Chờ xử lý';
      case 'failed': return 'Thất bại';
      default: return status;
    }
  };

  const getProviderBadgeStyle = (provider) => {
    switch (provider?.toLowerCase()) {
      case 'stripe':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30';
      case 'momo':
        return 'bg-pink-50 text-pink-600 border border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800/30';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-100 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/30';
    }
  };

  const getProviderName = (provider) => {
    switch (provider?.toLowerCase()) {
      case 'stripe': return 'Stripe Card';
      case 'momo': return 'Ví MoMo';
      default: return provider;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Nhật ký giao dịch thanh toán</h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Theo dõi, kiểm tra trạng thái và lịch sử thanh toán của khách hàng</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted group-focus-within:text-primary transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Khách hàng, Session ID..."
            className="w-full pl-11 pr-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-medium text-admin-text-main placeholder-admin-text-muted"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-admin-danger/10 border border-admin-danger/20 text-admin-danger rounded-md font-bold text-sm flex items-center gap-2">
          <XCircle size={18} />
          <span>Có lỗi xảy ra: {error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-md transition-all flex items-center justify-between h-28 bg-white shadow-sm border border-admin-border">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold text-admin-text-muted mb-1 uppercase tracking-wider">Tổng doanh thu nhận</p>
            <h3 className="text-2xl font-black text-success leading-none">
              {formatCurrency(stats.totalRevenue)}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 text-success">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="p-5 rounded-md transition-all flex items-center justify-between h-28 bg-white shadow-sm border border-admin-border">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold text-admin-text-muted mb-1 uppercase tracking-wider">Tổng yêu cầu thanh toán</p>
            <h3 className="text-2xl font-black text-admin-text-main leading-none">
              {stats.totalCount.toLocaleString('vi-VN')}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
            <Activity size={24} />
          </div>
        </div>

        <div className="p-5 rounded-md transition-all flex items-center justify-between h-28 bg-white shadow-sm border border-admin-border">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold text-admin-text-muted mb-1 uppercase tracking-wider">Giao dịch chờ thanh toán</p>
            <h3 className="text-2xl font-black text-warning leading-none">
              {stats.pendingCount.toLocaleString('vi-VN')}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 text-warning">
            <Clock size={24} />
          </div>
        </div>

        <div className="p-5 rounded-md transition-all flex items-center justify-between h-28 bg-white shadow-sm border border-admin-border">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold text-admin-text-muted mb-1 uppercase tracking-wider">Thanh toán thất bại/Hủy</p>
            <h3 className="text-2xl font-black text-danger leading-none">
              {stats.failedCount.toLocaleString('vi-VN')}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0 text-danger">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-md border border-admin-border flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-admin-text-muted">Trạng thái:</span>
            <select
              className="text-xs font-bold bg-admin-bg text-admin-text-main rounded-md px-3 py-2 border-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-admin-border"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="succeeded">Thành công</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="failed">Thất bại/Hủy</option>
            </select>
          </div>

          {/* Provider Filter */}
          <div className="flex items-center gap-2 ml-0 sm:ml-4">
            <span className="text-xs font-bold text-admin-text-muted">Cổng thanh toán:</span>
            <select
              className="text-xs font-bold bg-admin-bg text-admin-text-main rounded-md px-3 py-2 border-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-admin-border"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="stripe">Stripe Card</option>
              <option value="momo">Ví MoMo</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchPayments}
          className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 active:scale-95 transition-all px-4 py-2 rounded-md w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Activity size={14} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-md overflow-hidden border border-admin-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border bg-gray-50/50">
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase tracking-wider">Mã GD</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase tracking-wider">Đơn hàng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase tracking-wider">Cổng TT</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase tracking-wider">Mã Phiên / Mã GD Cổng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase tracking-wider">Số tiền</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-admin-text-muted font-bold">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.length > 0 ? (
                paginatedPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-admin-bg/40 transition-colors group">
                    {/* Payment ID */}
                    <td className="px-6 py-4 font-bold text-admin-text-main">
                      #{p.id}
                    </td>

                    {/* Order Link */}
                    <td className="px-6 py-4">
                      <span className="text-primary font-bold group-hover:underline cursor-pointer">
                        #{p.orderId}
                      </span>
                    </td>

                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-admin-text-main">{p.customerName}</span>
                        <span className="text-[11px] text-admin-text-muted font-medium">{p.customerEmail}</span>
                      </div>
                    </td>

                    {/* Gateway provider */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getProviderBadgeStyle(p.provider)}`}>
                        {getProviderName(p.provider)}
                      </span>
                    </td>

                    {/* Session ID / Transaction ID */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 max-w-[220px]">
                        {p.providerSessionId && (
                          <div className="flex items-center justify-between bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-500 font-medium">
                            <span className="truncate mr-2" title={`Session ID: ${p.providerSessionId}`}>
                              Sess: {p.providerSessionId}
                            </span>
                            <button
                              onClick={() => handleCopy(p.providerSessionId, `sess-${p.id}`)}
                              className="text-gray-400 hover:text-primary transition active:scale-90 cursor-pointer"
                              title="Sao chép Session ID"
                            >
                              {copiedId === `sess-${p.id}` ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                            </button>
                          </div>
                        )}

                        {p.providerTransactionId ? (
                          <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] text-emerald-600 font-bold">
                            <span className="truncate mr-2" title={`Trans ID: ${p.providerTransactionId}`}>
                              Trans: {p.providerTransactionId}
                            </span>
                            <button
                              onClick={() => handleCopy(p.providerTransactionId, `trans-${p.id}`)}
                              className="text-emerald-400 hover:text-primary transition active:scale-90 cursor-pointer"
                              title="Sao chép Transaction ID"
                            >
                              {copiedId === `trans-${p.id}` ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                            </button>
                          </div>
                        ) : (
                          p.status === 'succeeded' && <span className="text-[10px] text-gray-400 font-medium italic">Không có mã GD cổng</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 font-bold text-admin-text-main">
                      {formatCurrency(p.amount)}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-xs font-semibold text-admin-text-muted">
                      {formatDate(p.createdAt)}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadgeStyle(p.status)}`}>
                        {getStatusText(p.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-admin-text-muted">
                      <CreditCard size={48} strokeWidth={1.5} className="mb-2 opacity-40" />
                      <p className="text-sm font-bold text-admin-text-main">Không tìm thấy giao dịch nào</p>
                      <p className="text-xs font-medium mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-admin-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
            <span className="text-xs font-bold text-admin-text-muted">
              Hiển thị {startIndex}-{endIndex} trên {totalItems} giao dịch
            </span>
            
            <div className="flex gap-1.5">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-admin-bg text-admin-text-main rounded text-xs font-bold hover:bg-admin-border transition disabled:opacity-50 cursor-pointer"
              >
                Trước
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition ${currentPage === i + 1 ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-admin-bg text-admin-text-main rounded text-xs font-bold hover:bg-admin-border transition disabled:opacity-50 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
