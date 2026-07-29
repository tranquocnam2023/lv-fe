// QUẢN LÝ CHƯƠNG TRÌNH KHUYẾN MÃI (PROMOTIONS)
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Ticket, X, Check, Calendar, Settings } from 'lucide-react';
import { promotionService } from '../../../services/promotionService';

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
    usageLimit: 0,
    minOrderAmount: '',
    maxDiscountAmount: '',
    maxPerUser: ''
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
        usageLimit: promo.usageLimit || 0,
        minOrderAmount: promo.minOrderAmount ?? '',
        maxDiscountAmount: promo.maxDiscountAmount ?? '',
        maxPerUser: promo.maxPerUser ?? ''
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
        usageLimit: 0,
        minOrderAmount: '',
        maxDiscountAmount: '',
        maxPerUser: 1
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
        usageLimit: Number(formData.usageLimit),
        minOrderAmount: formData.minOrderAmount !== '' ? Number(formData.minOrderAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount !== '' ? Number(formData.maxDiscountAmount) : null,
        maxPerUser: formData.maxPerUser !== '' ? Number(formData.maxPerUser) : null
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
      return { text: 'Hết lượt', color: 'bg-orange-50 text-orange-400 border border-orange-100' };
    }
    return { text: 'Đang hoạt động', color: 'bg-green-50 text-green-400 border border-green-100' };
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
                       {/* =========================================================================
                           [MÃ KHUYẾN MÃI - FRONT-END]
                           - ID: Khóa chính tự tăng dưới CSDL, hiển thị dạng '#{promo.id}'.
                           - Code: Mã voucher do Admin nhập thủ công (Ví dụ: GIAM20K, CHAOSONG).
                           ========================================================================= */}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingPromotion ? 'Cập nhật mã khuyến mãi' : 'Thêm mã khuyến mãi mới'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {editingPromotion ? `Đang chỉnh sửa mã #${editingPromotion.id} (${editingPromotion.code})` : 'Tạo mã voucher mới cho chương trình ưu đãi'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Nhóm 1: Thông tin mã & Trạng thái */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Thông tin chung</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Mã giảm giá <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={30}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-extrabold uppercase tracking-wider text-gray-900 bg-white placeholder-gray-400 text-sm"
                        placeholder="VD: KHUYENMAI20, SUMMER50..."
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2.5 p-2.5 bg-white border border-gray-300 rounded-lg font-bold text-xs text-gray-800 cursor-pointer select-none hover:border-primary transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span>Kích hoạt mã</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Nhóm 2: Quy định giảm giá */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">2. Giá trị & Điều kiện áp dụng</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Loại giảm giá <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-gray-800 text-sm bg-white cursor-pointer"
                      value={formData.discountType}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discountType: e.target.value, 
                        discountValue: e.target.value === 'PERCENTAGE' ? Math.min(100, formData.discountValue) : formData.discountValue 
                      })}
                    >
                      <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Giảm số tiền cố định (₫)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Giá trị giảm <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={1}
                        max={formData.discountType === 'PERCENTAGE' ? 100 : 999999999}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-extrabold text-gray-900 text-sm bg-white"
                        placeholder={formData.discountType === 'PERCENTAGE' ? "Nhập % (1 - 100)" : "Nhập số tiền..."}
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 pointer-events-none">
                        {formData.discountType === 'PERCENTAGE' ? '%' : '₫'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Đơn tối thiểu (₫)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 text-sm bg-white"
                      placeholder="VD: 500000"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Để trống nếu không yêu cầu giá trị đơn tối thiểu</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Mức giảm tối đa (₫)
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={formData.discountType === 'FIXED_AMOUNT'}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder="VD: 100000"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formData.discountType === 'PERCENTAGE' ? 'Số tiền giảm tối đa khi áp dụng %' : 'Chỉ áp dụng với loại giảm theo %'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nhóm 3: Thời hạn & Lượt sử dụng */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">3. Thời gian & Giới hạn sử dụng</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-gray-800 text-sm bg-white"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Ngày kết thúc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-gray-800 text-sm bg-white"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Lượt dùng / 1 Khách hàng
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 text-sm bg-white"
                      placeholder="VD: 1"
                      value={formData.maxPerUser}
                      onChange={(e) => setFormData({ ...formData, maxPerUser: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Mặc định 1 lượt dùng cho mỗi khách hàng</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Tổng lượt dùng toàn hệ thống
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 text-sm bg-white"
                      placeholder="VD: 200 (0 = Không giới hạn)"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Nhập 0 nếu không giới hạn tổng số lượt</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-admin-primary-hover transition-all active:scale-95 text-sm disabled:opacity-50 shadow-md"
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
