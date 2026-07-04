import React, { useState, useEffect } from 'react';
import { Search, Trash2, Star, Calendar, MessageSquare, Filter, Eye, EyeOff, CornerDownRight, Check } from 'lucide-react';
// import { MOCK_REVIEWS } from '../utils/mockData'; // Removed mock data
import { reviewService } from '../../../services/reviewService';


export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = () => {
    reviewService.getAll()
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Lỗi tải đánh giá:", err);
        setReviews([]);
      });
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

  const handleToggleVisibility = (id) => {
    reviewService.toggleVisibility(id)
      .then(res => {
        alert(res || 'Thay đổi trạng thái hiển thị thành công!');
        fetchReviews();
      })
      .catch(err => {
        alert('Lỗi thay đổi trạng thái hiển thị: ' + (err.message || err));
      });
  };

  const handleSendReply = (id) => {
    if (!replyText.trim()) {
      alert('Vui lòng nhập nội dung phản hồi!');
      return;
    }
    reviewService.reply(id, replyText)
      .then(res => {
        alert(res || 'Đã gửi phản hồi thành công!');
        setReplyingId(null);
        setReplyText('');
        fetchReviews();
      })
      .catch(err => {
        alert('Lỗi gửi phản hồi: ' + (err.message || err));
      });
  };

  const filteredReviews = reviews.filter(rev =>
    String(rev.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(rev.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(rev.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Sản phẩm</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Số sao</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Nội dung</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Trạng thái</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Ngày tạo</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Ngày phản hồi</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((rev) => (
                  <React.Fragment key={rev.id}>
                    <tr className={`${rev.isHidden ? 'bg-amber-50/15' : ''} hover:bg-admin-bg transition-colors group`}>
                      <td className="px-6 py-4 text-admin-text-muted font-bold">#{rev.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-admin-text-main">{rev.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">{rev.productName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1 text-warning">
                          <span className="font-bold text-admin-text-main">{rev.rating}</span>
                          <Star size={16} fill="currentColor" className="text-yellow-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-admin-text-main max-w-[250px] break-words" title={rev.comment}>
                            {rev.comment}
                          </p>
                          {rev.adminReply && (
                            <div className="text-xs text-blue-600 bg-blue-50/50 border border-blue-100 rounded p-2 flex gap-1 mt-1">
                              <span className="font-bold shrink-0">QTV:</span>
                              <span className="font-medium break-words">{rev.adminReply}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {rev.isHidden ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Đã duyệt
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[12px] font-bold text-admin-text-muted whitespace-nowrap">
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-[12px] font-bold text-admin-text-muted whitespace-nowrap">
                        {rev.repliedAt ? new Date(rev.repliedAt).toLocaleDateString('vi-VN') : <span className="text-gray-400 italic font-normal">Chưa phản hồi</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {rev.isHidden ? (
                            <button
                              onClick={() => handleToggleVisibility(rev.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all active:scale-95 flex items-center gap-1 font-bold text-[11px] shadow-sm cursor-pointer"
                              title="Duyệt bài đánh giá này"
                            >
                              <Check size={14} strokeWidth={3} />
                              <span>Duyệt</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleVisibility(rev.id)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-200 transition-all active:scale-95 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                              title="Ẩn bài đánh giá này"
                            >
                              <EyeOff size={14} />
                              <span>Ẩn</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (replyingId === rev.id) {
                                setReplyingId(null);
                                setReplyText('');
                              } else {
                                setReplyingId(rev.id);
                                setReplyText(rev.adminReply || '');
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md border transition-all active:scale-95 flex items-center gap-1 font-bold text-[11px] cursor-pointer ${
                              replyingId === rev.id
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-300 hover:border-blue-200'
                            }`}
                            title="Phản hồi bình luận"
                          >
                            <MessageSquare size={14} />
                            <span>{rev.adminReply ? 'Sửa' : 'Phản hồi'}</span>
                          </button>

                          <button
                            onClick={() => handleDelete(rev.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-md border border-red-100 hover:border-red-500 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                            title="Xóa đánh giá không hợp lệ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {replyingId === rev.id && (
                      <tr className="bg-blue-50/10">
                        <td colSpan="9" className="px-8 py-5 border-b border-admin-border bg-gray-50/40">
                          <div className="flex gap-4 items-start max-w-3xl ml-4">
                            <CornerDownRight size={20} className="text-blue-500 shrink-0 mt-2" />
                            <div className="flex-1 bg-white p-5 rounded-lg border border-admin-border shadow-sm space-y-4">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                                  <MessageSquare size={14} />
                                  Phản hồi của QTV cho khách hàng #{rev.id}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Khách hàng: <strong className="text-gray-800 font-bold">{rev.username}</strong>
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Nhập nội dung phản hồi của quản trị viên (giải đáp thắc mắc, cảm ơn, hỗ trợ...)"
                                className="w-full bg-gray-50/50 focus:bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-4 py-3 text-xs font-semibold text-gray-800 focus:outline-none transition-all leading-relaxed"
                                autoFocus
                              />
                              <div className="flex items-center gap-3 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingId(null);
                                    setReplyText('');
                                  }}
                                  className="px-4 py-2 text-gray-500 hover:text-gray-800 text-xs font-bold transition hover:bg-gray-100 rounded-md cursor-pointer"
                                >
                                  Hủy bỏ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSendReply(rev.id)}
                                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-md shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
                                >
                                  <Check size={13} strokeWidth={3} />
                                  <span>{rev.adminReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
