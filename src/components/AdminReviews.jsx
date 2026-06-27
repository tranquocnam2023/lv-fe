import React, { useState, useEffect } from 'react';
import { Search, Trash2, Star, Calendar, MessageSquare, Filter } from 'lucide-react';
// import { MOCK_REVIEWS } from '../utils/mockData'; // Removed mock data
import { reviewService } from '../services/reviewService';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchReviews = () => {
    setLoading(true);
    // Assuming userService.getAllReviews exists, or use appropriate service
    reviewService.getAll()
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Lỗi tải đánh giá:", err);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      reviewService.delete(id).then(() => {
        alert('Xóa thành công!');
        fetchReviews();
      }).catch(err => {
        alert('Lỗi xóa đánh giá: ' + err.message);
      });
    }
  };

  const filteredReviews = reviews.filter(rev =>
    String(rev.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(rev.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(rev.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Quản Lý Đánh Giá</h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Theo dõi phản hồi từ khách hàng về sản phẩm</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-md border border-admin-border p-6 space-y-6">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-[300px] space-y-2">
            <label className="text-[12px] font-bold text-admin-text-main ml-1">Lọc theo mã đánh giá / user / email / nội dung...</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted group-focus-within:text-primary transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Nhập thông tin cần tìm..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-admin-text-main placeholder-admin-text-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-admin-text-main ml-1">Ngày bắt đầu</label>
            <input
              type="date"
              className="px-4 py-3 bg-white border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-bold text-admin-text-main"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-admin-text-main ml-1">Ngày kết thúc</label>
            <input
              type="date"
              className="px-4 py-3 bg-white border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-bold text-admin-text-main"
            />
          </div>

          <button className="px-6 py-3 bg-admin-danger/10 text-admin-danger rounded-md font-bold text-sm hover:bg-admin-danger/20 transition-all active:scale-95">
            Xóa lọc
          </button>

          <button className="px-6 py-3 bg-admin-bg text-primary rounded-md font-bold text-sm hover:bg-admin-border transition-all active:scale-95">
            Làm mới
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-admin-border">
          <h3 className="text-sm font-bold text-admin-text-main flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            Danh sách đánh giá ({filteredReviews.length} bản ghi)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Mã đánh giá</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Người dùng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Biến thể</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Số sao</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Nội dung</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Ngày tạo</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Ngày sửa</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-admin-bg transition-colors group">
                    <td className="px-6 py-4 text-admin-text-muted font-bold">#{rev.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-admin-text-main">{rev.user}</span>
                        <span className="text-[12px] text-admin-text-muted font-medium">{rev.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-primary">{rev.variantId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1 text-warning">
                        <span className="font-bold text-admin-text-main">{rev.stars}</span>
                        <Star size={16} fill="currentColor" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-admin-text-main max-w-[200px] truncate" title={rev.content}>
                        {rev.content}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-[12px] font-bold text-admin-text-muted whitespace-nowrap">{rev.createdAt}</td>
                    <td className="px-6 py-4 text-[12px] font-bold text-admin-text-muted whitespace-nowrap">{rev.updatedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDelete(rev.id)}
                          className="p-2 text-admin-text-muted hover:text-admin-danger hover:bg-admin-danger/10 rounded-md transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center bg-white">
                    <div className="flex flex-col items-center justify-center text-admin-text-muted">
                      <MessageSquare size={64} strokeWidth={1} className="mb-4 opacity-50" />
                      <p className="text-lg font-bold text-admin-text-main">Không tìm thấy đánh giá nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-admin-border flex items-center justify-between text-[12px] font-bold text-admin-text-muted">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md hover:bg-admin-border transition-colors disabled:opacity-50" disabled>Trang trước</button>
            <span className="flex items-center px-4">Trang 1 / 1</span>
            <button className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md hover:bg-admin-border transition-colors disabled:opacity-50" disabled>Trang sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
