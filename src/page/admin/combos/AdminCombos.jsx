import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, PackagePlus, AlertCircle, RefreshCw, Search, Filter } from 'lucide-react';
import api from '../../../services/api';
import { productService } from '../../../services/productService';
import AdminComboModal from './AdminComboModal';

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
}

export default function AdminCombos() {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCombos, resProducts] = await Promise.all([
        api.get('/ProductCombo'),
        productService.getAll(true).catch(() => [])
      ]);
      setCombos(resCombos.data || resCombos || []);
      setProducts(resProducts || []);
    } catch (err) {
      console.error("Lỗi tải danh sách Combo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Combo này không?")) return;
    try {
      setActionLoading(id);
      await api.delete(`/ProductCombo/${id}`);
      fetchData();
    } catch (err) {
      alert("Xóa thất bại!");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (combo) => {
    try {
      setActionLoading(combo.id + '_toggle');
      const payload = {
        name: combo.name,
        description: combo.description,
        startDate: combo.startDate,
        endDate: combo.endDate,
        isActive: !combo.isActive, // Nút gạt đảo trạng thái
        items: combo.comboItems.map(i => ({
          productId: i.productId,
          isMain: i.isMain,
          discountType: i.discountType,
          discountValue: i.discountValue
        }))
      };
      await api.put(`/ProductCombo/${combo.id}`, payload);
      // Cập nhật state cục bộ để UI phản hồi tức thì
      setCombos(prev => prev.map(c => c.id === combo.id ? { ...c, isActive: !c.isActive } : c));
    } catch (err) {
      alert("Thay đổi trạng thái thất bại!");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getComboStatus = (combo) => {
    const now = new Date();
    const start = new Date(combo.startDate);
    const end = new Date(combo.endDate);

    if (!combo.isActive) return 'PAUSED';
    if (end < now) return 'ENDED';
    if (start > now) return 'UPCOMING';
    return 'ACTIVE';
  };

  const filteredCombos = combos.filter(c => {
    const matchText = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toString() === searchTerm;
    if (!matchText) return false;

    if (statusFilter !== 'ALL') {
      const status = getComboStatus(c);
      if (status !== statusFilter) return false;
    }

    if (timeFilter !== 'ALL') {
      const start = new Date(c.startDate);
      const now = new Date();
      if (timeFilter === 'THIS_MONTH') {
         if (start.getMonth() !== now.getMonth() || start.getFullYear() !== now.getFullYear()) return false;
      }
      if (timeFilter === 'THIS_WEEK') {
         const currentWeek = getWeekNumber(now);
         const startWeek = getWeekNumber(start);
         if (currentWeek !== startWeek || start.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <PackagePlus size={24} />
            </div>
            Quản lý Combo Bán chéo
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Theo dõi và cấu hình các chiến dịch gợi ý mua phụ kiện kèm sản phẩm chính.
          </p>
        </div>
        <button
          onClick={() => { setEditingCombo(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Tạo Combo Mới</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Ô Tìm kiếm */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chiến dịch hoặc ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium transition-all outline-none"
            />
          </div>

          {/* Bộ lọc 1: Trạng thái */}
          <div className="lg:w-48 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 appearance-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">🟢 Đang chạy</option>
              <option value="UPCOMING">🟡 Sắp diễn ra</option>
              <option value="PAUSED">⚪ Tạm dừng</option>
              <option value="ENDED">🔴 Đã kết thúc</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              ▼
            </div>
          </div>

          {/* Bộ lọc 2: Thời gian */}
          <div className="lg:w-56 relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 appearance-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="ALL">Mọi thời gian</option>
              <option value="THIS_WEEK">Bắt đầu trong Tuần này</option>
              <option value="THIS_MONTH">Bắt đầu trong Tháng này</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              ▼
            </div>
          </div>

          <button onClick={fetchData} className="px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 bg-gray-50 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center border border-transparent hover:border-blue-100" title="Làm mới">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Bảng Dữ liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible z-10">
        {loading ? (
          <div className="p-20 flex flex-col justify-center items-center text-blue-500">
            <RefreshCw className="animate-spin w-10 h-10 mb-4" />
            <p className="font-bold text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="p-20 flex flex-col justify-center items-center text-gray-400">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
               <AlertCircle className="w-12 h-12" />
            </div>
            <p className="font-bold text-lg text-gray-700">Không tìm thấy Combo nào</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 text-gray-500 font-black text-[11px] uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Chiến dịch</th>
                  <th className="px-6 py-4">Thời gian áp dụng</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right rounded-tr-2xl">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 bg-white">
                {filteredCombos.map(combo => {
                  
                  // Lấy thông tin sản phẩm chính và phụ kiện
                  const mainItem = combo.comboItems?.find(i => i.isMain);
                  const accItems = combo.comboItems?.filter(i => !i.isMain) || [];
                  const mainProduct = products.find(p => p.id === mainItem?.productId);
                  const accProducts = accItems.map(i => products.find(p => p.id === i.productId)).filter(Boolean);
                  const status = getComboStatus(combo);

                  return (
                  <tr key={combo.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-black text-gray-900 text-base mb-1">{combo.name}</div>
                      
                      {/* Dòng 2: Hiển thị sản phẩm chính áp dụng */}
                      {mainProduct ? (
                        <div className="flex items-center gap-2 mt-1.5">
                           <span className="text-xs text-gray-400 font-semibold">Áp dụng cho:</span>
                           <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                             {mainProduct.thumbnailImage && (
                               <img src={mainProduct.thumbnailImage} alt="" className="w-4 h-4 rounded object-cover bg-white" />
                             )}
                             <span className="text-[11px] font-bold text-gray-700 max-w-[200px] truncate" title={mainProduct.name}>
                               {mainProduct.name}
                             </span>
                           </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Không tìm thấy SP gốc</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                         <div className="text-[13px] font-bold text-gray-700">
                           <span className="text-gray-400 text-xs font-semibold mr-2">Từ</span>
                           {new Date(combo.startDate).toLocaleDateString('vi-VN')}
                         </div>
                         <div className="text-[13px] font-bold text-gray-700">
                           <span className="text-gray-400 text-xs font-semibold mr-2">Đến</span>
                           {new Date(combo.endDate).toLocaleDateString('vi-VN')}
                         </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {/* Cột hiển thị: 1 SP Chính + X Phụ kiện (Có Tooltip) */}
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">1 SP Chính</span>
                        <span className="text-[13px] font-bold text-gray-400">+</span>
                        
                        {/* Khu vực chứa Tooltip */}
                        <div className="relative group/tooltip">
                           <span className="text-[13px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded cursor-help border border-amber-100 border-dashed">
                             {accItems.length} Phụ kiện
                           </span>
                           
                           {/* Tooltip Content */}
                           {accProducts.length > 0 && (
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                               <div className="font-bold text-gray-400 mb-2 uppercase text-[10px] tracking-wider">Danh sách phụ kiện:</div>
                               <ul className="space-y-1.5">
                                 {accProducts.map((ap, idx) => (
                                   <li key={idx} className="flex items-center gap-2">
                                     <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0"></span>
                                     <span className="truncate">{ap.name}</span>
                                   </li>
                                 ))}
                               </ul>
                               {/* Mũi tên Tooltip */}
                               <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                             </div>
                           )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                         {/* Toggle Switch */}
                         <button 
                           onClick={() => handleToggleStatus(combo)}
                           disabled={actionLoading === combo.id + '_toggle'}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${combo.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                         >
                           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${combo.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                         </button>
                         
                         {/* Text Status */}
                         <span className={`text-[10px] font-black uppercase tracking-wider ${
                           status === 'ACTIVE' ? 'text-blue-600' :
                           status === 'UPCOMING' ? 'text-amber-500' :
                           status === 'ENDED' ? 'text-red-500' :
                           'text-gray-400'
                         }`}>
                           {status === 'ACTIVE' ? 'Đang chạy' :
                            status === 'UPCOMING' ? 'Sắp diễn ra' :
                            status === 'ENDED' ? 'Đã kết thúc' : 'Tạm dừng'}
                         </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingCombo(combo); setIsModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(combo.id)}
                          disabled={actionLoading === combo.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                          title="Xóa"
                        >
                          {actionLoading === combo.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} strokeWidth={2.5} />}
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

      <AdminComboModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        comboData={editingCombo}
      />
    </div>
  );
}
