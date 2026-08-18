// TIN TỨC VỀ CÁC THIẾT BỊ - QUẢN LÝ BÀI VIẾT / BLOG ADMIN
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, PackagePlus, AlertCircle, RefreshCw, Search, Filter } from 'lucide-react';
import api from '../../../services/api';
import { blogService } from '../../../services/Blog';

export default function AdminBlog({ onCreate, onEdit }) {
  // State: blog - Quản lý danh sách bài viết
  const [blog, setBlog] = useState([]);
  // State: loading - Trạng thái nạp dữ liệu
  const [loading, setLoading] = useState(true);
  // State: actionLoading - Trạng thái chờ khi xóa/đổi trạng thái
  const [actionLoading, setActionLoading] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  // [CẬP NHẬT NGHIỆP VỤ ACCORDING TO USER REQUIREMENT]: Lọc bài viết theo Chuyên mục (Category)
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Hàm xử lý nạp danh sách bài viết từ Backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await blogService.getBlogs();
      const data = res.data || res;
      const list = Array.isArray(data) ? data : (data.items || []);
      setBlog(list);
    } catch (err) {
      console.error("Lỗi tải danh sách bài đăng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xóa bài viết
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng này không?")) return;
    try {
      setActionLoading(id);
      await api.delete(`/blog/${id}`);
      fetchData();
    } catch (err) {
      alert("Xóa thất bại!");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Đổi trạng thái Ẩn / Đã xuất bản
  const handleToggleStatus = async (item) => {
    try {
      setActionLoading(item.id + '_toggle');
      await api.patch(`/blog/${item.id}/toggle-publish`);
      setBlog(prev => prev.map(c => c.id === item.id ? { ...c, isPublished: !c.isPublished } : c));
    } catch (err) {
      alert("Thay đổi trạng thái thất bại!");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatus = (item) => {
    const isPub = item.isPublished ?? item.isActive ?? true;
    return isPub ? 'ACTIVE' : 'PAUSED';
  };

  // Lấy danh sách Chuyên mục (Category) duy nhất từ dữ liệu bài viết
  const categoriesList = React.useMemo(() => {
    if (!Array.isArray(blog)) return [];
    const set = new Set();
    blog.forEach(b => {
      const cat = b.categoryName || b.category || b.CategoryName || b.Category;
      if (cat) set.add(cat);
    });
    // Đảm bảo có các chuyên mục phổ biến
    ['Tin công nghệ', 'Mẹo hay & Thủ thuật', 'Tư vấn mua sắm', 'Đánh giá sản phẩm', 'Khác'].forEach(c => set.add(c));
    return Array.from(set);
  }, [blog]);

  // Lọc dữ liệu bài viết theo Từ khóa, Trạng thái & Chuyên mục
  const filteredBlog = (Array.isArray(blog) ? blog : []).filter(item => {
    const matchText = (item.title || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || item.id?.toString() === searchTerm;
    if (!matchText) return false;

    if (statusFilter !== 'ALL') {
      const status = getStatus(item);
      if (status !== statusFilter) return false;
    }

    // [CẬP NHẬT NGHIỆP VỤ ACCORDING TO USER REQUIREMENT]: Lọc theo Chuyên mục
    if (categoryFilter !== 'ALL') {
      const itemCat = item.categoryName || item.category || item.CategoryName || item.Category || 'Khác';
      if (itemCat !== categoryFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <PackagePlus size={24} />
            </div>
            Quản lý Bài viết / Blog
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Quản lý và xuất bản bài viết tin tức.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Tạo Bài Đăng</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Ô Tìm kiếm theo tiêu đề bài viết */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề bài viết hoặc ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium transition-all outline-none"
            />
          </div>

          {/* [CẬP NHẬT NGHIỆP VỤ ACCORDING TO USER REQUIREMENT]: Dropdown Lọc Theo Chuyên Mục */}
          <div className="lg:w-56 relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 appearance-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả chuyên mục</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs">
              ▼
            </div>
          </div>

          {/* Dropdown Lọc Trạng Thái */}
          <div className="lg:w-48 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 appearance-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">🟢 Đã xuất bản</option>             
              <option value="PAUSED">⚪ Ẩn bài viết</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs">
              ▼
            </div>
          </div>

          {/* Nút Làm mới */}
          <button onClick={fetchData} className="px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 bg-gray-50 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center border border-transparent hover:border-blue-100 cursor-pointer" title="Làm mới">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Bảng Dữ liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col justify-center items-center text-blue-500">
            <RefreshCw className="animate-spin w-10 h-10 mb-4" />
            <p className="font-bold text-gray-500">Đang tải dữ liệu bài viết...</p>
          </div>
        ) : filteredBlog.length === 0 ? (
          <div className="p-20 flex flex-col justify-center items-center text-gray-400">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
               <AlertCircle className="w-12 h-12" />
            </div>
            <p className="font-bold text-lg text-gray-700">Không tìm thấy Bài viết nào</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 text-gray-500 font-black text-[11px] uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Bài viết</th>               
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right rounded-tr-2xl">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 bg-white">
                {filteredBlog.map(item => {
                  const status = getStatus(item);
                  const isPub = status === 'ACTIVE';
                  const categoryName = item.categoryName || item.category || item.CategoryName || item.Category || 'Khác';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.thumbnailUrl && (
                            <img
                              src={item.thumbnailUrl}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <div className="font-black text-gray-900 text-base mb-1 line-clamp-1">
                              {item.title || item.name || `Bài viết #${item.id}`}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>Chuyên mục: <strong className="text-blue-600 font-bold">{categoryName}</strong></span>
                              <span>•</span>
                              <span>Tác giả: <strong className="text-gray-700">{item.authorName || item.author || 'admin'}</strong></span>
                              {item.createdAt && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5 w-[110px] mx-auto">
                           {/* Toggle Switch */}
                           <button 
                             onClick={() => handleToggleStatus(item)}
                             disabled={actionLoading === item.id + '_toggle'}
                             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${isPub ? 'bg-green-500' : 'bg-gray-300'}`}
                           >
                             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPub ? 'translate-x-6' : 'translate-x-1'}`} />
                           </button>
                           <span className={`text-[10px] font-black uppercase tracking-wider ${isPub ? 'text-green-600' : 'text-gray-400'}`}>
                             {isPub ? 'ĐÃ XUẤT BẢN' : 'ĐÃ ẨN BÀI'}
                           </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(item.id || item.Id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa bài viết"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={actionLoading === item.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa bài viết"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
