import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, PackagePlus, AlertCircle, RefreshCw, Search, Filter } from 'lucide-react';
import api from '../../../services/api';

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
}

export default function AdminCombos({ onCreate, onEdit }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/PromotionCampaign');
      setCampaigns(res.data || res || []);
    } catch (err) {
      console.error("Lỗi tải danh sách Chiến dịch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Chiến dịch này không?")) return;
    try {
      setActionLoading(id);
      await api.delete(`/PromotionCampaign/${id}`);
      fetchData();
    } catch (err) {
      alert("Xóa thất bại!");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (campaign) => {
    try {
      setActionLoading(campaign.id + '_toggle');
      const payload = {
        name: campaign.name,
        description: campaign.description,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        discountType: campaign.discountType,
        discountValue: campaign.discountValue,
        maxQuantityAllowed: campaign.maxQuantityAllowed,
        isActive: !campaign.isActive,
        mainProductRules: campaign.mainProductRules,
        addonProductRules: campaign.addonProductRules
      };
      await api.put(`/PromotionCampaign/${campaign.id}`, payload);
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, isActive: !c.isActive } : c));
    } catch (err) {
      alert("Thay đổi trạng thái thất bại!");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatus = (campaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);

    if (!campaign.isActive) return 'PAUSED';
    if (end < now) return 'ENDED';
    if (start > now) return 'UPCOMING';
    return 'ACTIVE';
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchText = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toString() === searchTerm;
    if (!matchText) return false;

    if (statusFilter !== 'ALL') {
      const status = getStatus(c);
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
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <PackagePlus size={24} />
            </div>
            Chiến dịch Mua kèm
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Quản lý và cấu hình các chiến dịch Mua kèm giảm giá siêu linh hoạt.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Tạo Chiến dịch</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chiến dịch hoặc ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent hover:bg-gray-100 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-xl text-sm font-medium transition-all outline-none"
            />
          </div>

          <div className="lg:w-48 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 appearance-none outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
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

          <div className="lg:w-56 relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 appearance-none outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
            >
              <option value="ALL">Mọi thời gian</option>
              <option value="THIS_WEEK">Bắt đầu trong Tuần này</option>
              <option value="THIS_MONTH">Bắt đầu trong Tháng này</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              ▼
            </div>
          </div>

          <button onClick={fetchData} className="px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 bg-gray-50 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center border border-transparent hover:border-red-100" title="Làm mới">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Bảng Dữ liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible z-10">
        {loading ? (
          <div className="p-20 flex flex-col justify-center items-center text-red-500">
            <RefreshCw className="animate-spin w-10 h-10 mb-4" />
            <p className="font-bold text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-20 flex flex-col justify-center items-center text-gray-400">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
               <AlertCircle className="w-12 h-12" />
            </div>
            <p className="font-bold text-lg text-gray-700">Không tìm thấy Chiến dịch nào</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 text-gray-500 font-black text-[11px] uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Chiến dịch</th>
                  <th className="px-6 py-4">Giảm giá</th>
                  <th className="px-6 py-4">Phạm vi áp dụng</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right rounded-tr-2xl">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 bg-white">
                {filteredCampaigns.map(campaign => {
                  const status = getStatus(campaign);
                  const mainRules = campaign.mainProductRules || [];
                  const addonRules = campaign.addonProductRules || [];

                  return (
                  <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-black text-gray-900 text-base mb-1">{campaign.name}</div>
                      <div className="flex flex-col gap-1 mt-1.5">
                         <div className="text-[12px] font-medium text-gray-600">
                           <span className="text-gray-400 text-xs font-semibold mr-1">Từ:</span>
                           {new Date(campaign.startDate).toLocaleDateString('vi-VN')}
                         </div>
                         <div className="text-[12px] font-medium text-gray-600">
                           <span className="text-gray-400 text-xs font-semibold mr-1">Đến:</span>
                           {new Date(campaign.endDate).toLocaleDateString('vi-VN')}
                         </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                       <span className="text-red-600 font-black text-lg">
                          {campaign.discountType === 'Percentage' ? `${campaign.discountValue}%` : `${campaign.discountValue.toLocaleString()}đ`}
                       </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-[12px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100">
                          {mainRules.length === 0 ? "Tất cả sản phẩm" : `${mainRules.length} ĐK Sản phẩm chính`}
                        </div>
                        <div className="text-[12px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-100">
                          {`${addonRules.length} ĐK Phụ kiện (Tối đa ${campaign.maxQuantityAllowed})`}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                         {/* Toggle Switch */}
                         <button 
                           onClick={() => handleToggleStatus(campaign)}
                           disabled={actionLoading === campaign.id + '_toggle'}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${campaign.isActive ? 'bg-red-600' : 'bg-gray-300'}`}
                         >
                           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${campaign.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                         </button>
                         
                         {/* Text Status */}
                         <span className={`text-[10px] font-black uppercase tracking-wider ${
                           status === 'ACTIVE' ? 'text-red-600' :
                           status === 'UPCOMING' ? 'text-amber-500' :
                           status === 'ENDED' ? 'text-gray-500' :
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
                          onClick={() => onEdit && onEdit(campaign.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          disabled={actionLoading === campaign.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                          title="Xóa"
                        >
                          {actionLoading === campaign.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} strokeWidth={2.5} />}
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
