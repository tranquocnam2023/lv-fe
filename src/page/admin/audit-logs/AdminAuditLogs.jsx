// QUẢN LÝ NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG
import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Filter, Eye, X, ArrowLeft, ArrowRight, RefreshCw, Database, Info } from 'lucide-react';
import { auditLogService } from '../../../services/auditLogService';

export default function AdminAuditLogs() {
  // State for logs and pagination
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Filters state
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Active filters applied to request
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    actionType: '',
    startDate: '',
    endDate: ''
  });

  // Modal state for viewing JSON values
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalType, setModalType] = useState(''); // 'old' or 'new' or 'diff'

  const fetchLogs = () => {
    setLoading(true);
    const params = {
      page: currentPage,
      pageSize,
      search: appliedFilters.search || undefined,
      actionType: appliedFilters.actionType || undefined,
      startDate: appliedFilters.startDate || undefined,
      endDate: appliedFilters.endDate || undefined
    };

    auditLogService.getAll(params)
      .then((res) => {
        if (res) {
          setLogs(res.items || res.Items || []);
          setTotalPages(res.totalPages || res.TotalPages || 1);
          setTotalCount(res.totalCount || res.TotalCount || 0);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy nhật ký kiểm toán:", err);
        setLogs([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Re-fetch when page or applied filters change
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1
    setAppliedFilters({
      search,
      actionType,
      startDate,
      endDate
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setActionType('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setAppliedFilters({
      search: '',
      actionType: '',
      startDate: '',
      endDate: ''
    });
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const getActionBadgeClass = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('create') || act.includes('insert') || act.includes('add')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30';
    }
    if (act.includes('delete') || act.includes('remove')) {
      return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/30';
    }
    return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30';
  };

  const renderJsonPretty = (jsonStr) => {
    if (!jsonStr) return <span className="text-gray-400 italic">Trống</span>;
    try {
      const parsed = JSON.parse(jsonStr);
      return (
        <pre className="text-[11px] font-mono text-gray-700 bg-gray-50 dark:bg-slate-900 dark:text-slate-300 p-4 rounded border border-gray-150 dark:border-slate-800 max-h-[350px] overflow-y-auto leading-relaxed">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return (
        <pre className="text-[11px] font-mono text-gray-700 bg-gray-50 dark:bg-slate-900 dark:text-slate-300 p-4 rounded border border-gray-150 dark:border-slate-800 max-h-[350px] overflow-y-auto leading-relaxed">
          {jsonStr}
        </pre>
      );
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main flex items-center gap-2">
            <Clock className="text-primary w-6 h-6" />
            Nhật Ký Hoạt Động
          </h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">
            Xem nhật ký kiểm toán hệ thống ghi nhận tự động các thao tác quản lý dữ liệu
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-admin-text-main border border-admin-border rounded-md shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Tải lại
        </button>
      </div>

      {/* Filter Section */}
      <form onSubmit={handleApplyFilters} className="bg-white p-6 rounded-lg border border-admin-border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Admin Email Search */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-admin-text-muted uppercase tracking-wider ml-0.5">Tìm kiếm quản trị viên</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-admin-text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Email hoặc ID Admin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-admin-border rounded-md text-xs font-semibold focus:outline-none focus:border-primary transition-all text-admin-text-main"
              />
            </div>
          </div>

          {/* Action type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-admin-text-muted uppercase tracking-wider ml-0.5">Loại hành động</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-admin-border rounded-md text-xs font-semibold focus:outline-none focus:border-primary transition-all text-admin-text-main cursor-pointer"
            >
              <option value="">Tất cả hành động</option>
              <option value="Create">Tạo mới (Create)</option>
              <option value="Update">Cập nhật (Update)</option>
              <option value="Delete">Xóa bỏ (Delete)</option>
            </select>
          </div>

          {/* Start date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-admin-text-muted uppercase tracking-wider ml-0.5">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-admin-border rounded-md text-xs font-semibold focus:outline-none focus:border-primary transition-all text-admin-text-main cursor-pointer"
            />
          </div>

          {/* End date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-admin-text-muted uppercase tracking-wider ml-0.5">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-admin-border rounded-md text-xs font-semibold focus:outline-none focus:border-primary transition-all text-admin-text-main cursor-pointer"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-admin-text-main border border-admin-border rounded-md font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            Xóa bộ lọc
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-primary hover:bg-primary/95 text-white rounded-md font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Filter size={13} />
            Lọc nhật ký
          </button>
        </div>
      </form>

      {/* Logs Table Area */}
      <div className="bg-white rounded-lg border border-admin-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-admin-border bg-gray-50/30 flex justify-between items-center">
          <h3 className="text-sm font-bold text-admin-text-main flex items-center gap-2">
            <Database size={16} className="text-primary" />
            Nhật ký kiểm toán ({totalCount} bản ghi)
          </h3>
          {loading && <span className="text-xs text-primary font-bold animate-pulse">Đang tải dữ liệu...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border text-xs font-bold text-admin-text-muted bg-gray-50/20 uppercase tracking-wider">
                <th className="px-5 py-3.5">Mã Log</th>
                <th className="px-5 py-3.5">Thời Gian</th>
                <th className="px-5 py-3.5">Người Thực Hiện (Admin)</th>
                <th className="px-5 py-3.5 text-center">Hành Động</th>
                <th className="px-5 py-3.5">Bảng Tác Động</th>
                <th className="px-5 py-3.5 text-center">Mã Bản Ghi</th>
                <th className="px-5 py-3.5 text-center">Giá Trị Cũ</th>
                <th className="px-5 py-3.5 text-center">Giá Trị Mới</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-xs text-admin-text-main">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-admin-bg/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-admin-text-muted">#{log.id}</td>
                    <td className="px-5 py-4 font-semibold whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{log.userEmail || 'Chưa xác định'}</span>
                        <span className="text-[10px] text-admin-text-muted mt-0.5">ID: {log.userId || '---'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded border text-[10px] font-bold inline-block uppercase tracking-wide ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-primary">{log.targetTable}</td>
                    <td className="px-5 py-4 text-center font-semibold text-admin-text-muted">#{log.targetId}</td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLog(log);
                          setModalType('old');
                        }}
                        disabled={!log.oldValues}
                        className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-gray-50 border border-gray-200 rounded text-[10px] font-bold transition cursor-pointer"
                      >
                        Xem (Old)
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLog(log);
                          setModalType('new');
                        }}
                        disabled={!log.newValues}
                        className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-gray-50 border border-gray-200 rounded text-[10px] font-bold transition cursor-pointer"
                      >
                        Xem (New)
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-admin-text-muted font-bold">
                    {loading ? 'Đang tải dữ liệu, vui lòng đợi...' : 'Không có nhật ký hoạt động nào khớp với bộ lọc.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-admin-border bg-gray-50/20 flex items-center justify-between">
            <span className="text-xs text-admin-text-muted font-medium">
              Hiển thị trang <strong className="text-admin-text-main">{currentPage}</strong> trên tổng số <strong className="text-admin-text-main">{totalPages}</strong> trang
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="p-1.5 bg-white hover:bg-gray-50 border border-admin-border rounded disabled:opacity-50 transition cursor-pointer flex items-center justify-center text-admin-text-main"
              >
                <ArrowLeft size={14} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Only show a window of pages to avoid overcrowding
                if (totalPages > 6 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-admin-text-muted px-1">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-white hover:bg-gray-50 text-admin-text-main border border-admin-border'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="p-1.5 bg-white hover:bg-gray-50 border border-admin-border rounded disabled:opacity-50 transition cursor-pointer flex items-center justify-center text-admin-text-main"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Details Modal */}
      {selectedLog && modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-admin-border shadow-2xl max-w-xl w-full flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-admin-border bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Info className="text-primary w-5 h-5" />
                <h4 className="font-bold text-sm text-admin-text-main">
                  Chi tiết Giá trị {modalType === 'old' ? 'Cũ' : 'Mới'} (Log #{selectedLog.id})
                </h4>
              </div>
              <button
                onClick={() => {
                  setSelectedLog(null);
                  setModalType('');
                }}
                className="p-1 text-admin-text-muted hover:text-admin-text-main rounded-md hover:bg-gray-150 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold bg-gray-50/50 p-3 rounded border border-admin-border">
                <div>
                  <span className="text-admin-text-muted block text-[10px] uppercase">Thao tác</span>
                  <span className="text-admin-text-main font-bold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-admin-text-muted block text-[10px] uppercase">Bảng tác động</span>
                  <span className="text-primary font-bold">{selectedLog.targetTable} (ID: #{selectedLog.targetId})</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-admin-text-muted uppercase tracking-wider block">Dữ liệu chi tiết:</span>
                {renderJsonPretty(modalType === 'old' ? selectedLog.oldValues : selectedLog.newValues)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-admin-border bg-gray-50/30 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedLog(null);
                  setModalType('');
                }}
                className="px-4 py-2 bg-primary text-white rounded-md font-bold text-xs shadow-sm hover:bg-primary/95 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
