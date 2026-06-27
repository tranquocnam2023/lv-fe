import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Ticket, X, Check, Calendar, Settings } from 'lucide-react';
import { promotionService } from '../services/promotionService';

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: 0
  });

  const fetchPromotions = () => {
    setLoading(true);
    promotionService.getAll()
      .then(data => {
        setPromotions(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Lỗi tải mã khuyến mãi:", err);
        setPromotions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromotion(promo);
      // Format dates to YYYY-MM-DDThh:mm for datetime-local input
      const startIso = promo.startDate ? new Date(promo.startDate).toISOString().slice(0, 16) : '';
      const endIso = promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 16) : '';
      
      setFormData({
        code: promo.code,
        discountType: promo.discountType || 'PERCENTAGE',
        discountValue: promo.discountValue || 0,
        startDate: startIso,
        endDate: endIso,
        isActive: promo.isActive !== undefined ? promo.isActive : true,
        usageLimit: promo.usageLimit || 0
      });
    } else {
      setEditingPromotion(null);
      // Default dates: now and +30 days
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(now.getDate() + 30);
      
      setFormData({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: now.toISOString().slice(0, 16),
        endDate: nextMonth.toISOString().slice(0, 16),
        isActive: true,
        usageLimit: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: formData.isActive,
        usageLimit: Number(formData.usageLimit)
      };

      if (editingPromotion) {
        await promotionService.update(editingPromotion.id, payload);
        alert('Cập nhật mã khuyến mãi thành công!');
      } else {
        await promotionService.create(payload);
        alert('Thêm mã khuyến mãi thành công!');
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (error) {
      console.error('Lưu khuyến mãi thất bại:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data || error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã khuyến mãi này?')) {
      try {
        await promotionService.delete(id);
        alert('Xóa thành công!');
        fetchPromotions();
      } catch (error) {
        console.error('Xóa khuyến mãi thất bại:', error);
        alert('Không thể xóa mã khuyến mãi này: ' + (error.response?.data || error.message || ''));
      }
    }
  };

  const getPromoStatus = (promo) => {
    if (!promo.isActive) return { text: 'Vô hiệu', color: 'bg-red-50 text-red-600 border border-red-100' };
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    
    if (now < start) return { text: 'Sắp diễn ra', color: 'bg-blue-50 text-blue-600 border border-blue-100' };
    if (now > end) return { text: 'Hết hạn', color: 'bg-gray-150 text-gray-500 border border-gray-200' };
    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return { text: 'Hết lượt', color: 'bg-orange-50 text-orange-600 border border-orange-100' };
    }
    return { text: 'Đang chạy', color: 'bg-green-50 text-green-600 border border-green-100' };
  };

  const filteredPromotions = promotions.filter(promo =>
    promo.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Quản lý Mã Khuyến Mãi</h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Tạo, cập nhật và quản lý các mã giảm giá trong hệ thống</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm mã giảm giá..."
              className="w-full pl-11 pr-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-medium text-admin-text-main placeholder-admin-text-muted"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>Thêm mã mới</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted w-16">ID</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Mã giảm giá</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Loại giảm</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Giá trị giảm</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Thời hạn sử dụng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Đã dùng / Giới hạn</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {filteredPromotions.length > 0 ? (
                filteredPromotions.map((promo) => {
                  const status = getPromoStatus(promo);
                  return (
                    <tr key={promo.id} className="hover:bg-admin-bg transition-colors group">
                      <td className="px-6 py-4 text-admin-text-muted font-bold">#{promo.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-primary/5 text-primary flex items-center justify-center">
                            <Ticket size={16} />
                          </div>
                          <span className="font-extrabold text-admin-text-main tracking-wider text-base">{promo.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-admin-text-main font-semibold">
                        {promo.discountType === 'PERCENTAGE' ? 'Giảm phần trăm' : 'Giảm số tiền'}
                      </td>
                      <td className="px-6 py-4 text-red-600 font-extrabold text-base">
                        {promo.discountType === 'PERCENTAGE' 
                          ? `${promo.discountValue}%` 
                          : `${promo.discountValue.toLocaleString('vi-VN')} ₫`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs font-semibold text-gray-500 gap-0.5">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Từ: {new Date(promo.startDate).toLocaleDateString('vi-VN')}</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Đến: {new Date(promo.endDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-admin-text-main">
                        <span className="text-blue-600">{promo.usedCount || 0}</span>
                        <span className="text-gray-300 mx-1">/</span>
                        <span className="text-gray-500">{promo.usageLimit === 0 ? '∞' : promo.usageLimit}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(promo)}
                            className="p-2 text-admin-text-muted hover:text-warning hover:bg-warning/10 rounded-md transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-admin-text-muted hover:text-admin-danger hover:bg-admin-danger/10 rounded-md transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center bg-white">
                    <div className="flex flex-col items-center justify-center text-admin-text-muted">
                      <Ticket size={64} strokeWidth={1} className="mb-4 opacity-50" />
                      <p className="text-lg font-bold text-admin-text-main">Không tìm thấy mã khuyến mãi nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-admin-border flex items-center justify-between text-sm font-bold text-admin-text-muted">
          <span>Tổng cộng: {filteredPromotions.length} mã</span>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-md w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-admin-border flex justify-between items-center bg-admin-bg">
              <h3 className="text-xl font-bold text-admin-text-main">
                {editingPromotion ? 'Cập nhật mã khuyến mãi' : 'Thêm mã khuyến mãi mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-admin-text-muted hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Mã giảm giá *</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold uppercase tracking-wider text-admin-text-main"
                    placeholder="VD: KHUYENMAI20, SUMMER50..."
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Loại giảm giá *</label>
                  <select
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-semibold text-admin-text-main"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value, discountValue: e.target.value === 'PERCENTAGE' ? Math.min(100, formData.discountValue) : formData.discountValue })}
                  >
                    <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Giảm số tiền cố định (₫)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Giá trị giảm *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={formData.discountType === 'PERCENTAGE' ? 100 : 99999999}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold text-admin-text-main"
                    placeholder={formData.discountType === 'PERCENTAGE' ? "Nhập % (1-100)" : "Nhập số tiền giảm"}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-semibold text-admin-text-main"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-semibold text-admin-text-main"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Giới hạn số lần dùng (0 = vô hạn)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold text-admin-text-main"
                    placeholder="VD: 50, 100..."
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                  />
                </div>

                <div className="flex items-center pt-8 pl-4">
                  <label className="flex items-center gap-2.5 font-bold text-admin-text-main cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Kích hoạt mã giảm giá</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-admin-bg text-admin-text-main rounded-md font-bold hover:bg-admin-border transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : (editingPromotion ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
