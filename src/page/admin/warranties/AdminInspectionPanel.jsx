import React, { useState, useEffect } from 'react';
import { orderService } from '../../../services/orderService';
import { warrantyService } from '../../../services/warrantyService';
import { Search, ShieldAlert, CheckCircle2, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';

/**
 * ============================================================================
 * COMPONENT: AdminInspectionPanel (Màn hình thẩm định máy cho Kỹ thuật viên)
 * ============================================================================
 * Chức năng:
 *  1. Liệt kê toàn bộ các đơn hàng có yêu cầu thẩm định thiết bị cũ (Standalone Warranty).
 *  2. Hỗ trợ tìm kiếm nhanh theo Mã đơn hàng hoặc Số điện thoại.
 *  3. KTV xem thông tin IMEI, dòng máy của khách.
 *  4. KTV nhập note và chọn Duyệt (PASSED) hoặc Từ chối (FAILED).
 *  5. Tự động tương tác với Backend để thay đổi trạng thái đơn hàng.
 * ============================================================================
 */
export default function AdminInspectionPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('WAITING_CHECK'); // 'WAITING_CHECK' | 'PASSED' | 'FAILED' | 'ALL'
  const [selectedItem, setSelectedItem] = useState(null); // Item đang chọn để xử lý
  const [inspectionNote, setInspectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Tải danh sách đơn hàng
  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getAll();
      if (res && Array.isArray(res)) {
        setOrders(res);
      } else if (res && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách đơn hàng để thẩm định:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Lọc ra các OrderItem có gắn gói bảo hành cần thẩm định
  const getInspectionItems = () => {
    const list = [];
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          // Chỉ lấy các item có warrantyId và có trạng thái thẩm định hợp lệ
          if (item.warrantyId && item.inspectionStatus) {
            list.push({
              ...item,
              orderId: order.id,
              recipientName: order.recipientName,
              phoneNumber: order.phoneNumber,
              orderDate: order.createdAt || order.orderDate,
              orderStatusId: order.orderStatusId
            });
          }
        });
      }
    });

    // Sắp xếp đơn mới lên đầu
    list.sort((a, b) => b.orderId - a.orderId);

    // Lọc theo search query (Mã đơn hoặc Số điện thoại)
    return list.filter(item => {
      const matchesSearch =
        String(item.orderId).includes(searchQuery) ||
        (item.phoneNumber && item.phoneNumber.includes(searchQuery)) ||
        (item.imeiOrSerial && item.imeiOrSerial.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.productName && item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || item.inspectionStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredItems = getInspectionItems();

  // Xử lý cập nhật thẩm định
  const handleInspect = async (item, status) => {
    if (!window.confirm(`Bạn có chắc chắn muốn cập nhật trạng thái thẩm định là ${status === 'PASSED' ? 'ĐẠT CHUẨN' : 'TỪ CHỐI'} không?`)) {
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await warrantyService.inspectOrderItem(item.id, {
        status: status,
        note: inspectionNote.trim() || undefined
      });

      setMessage({
        type: 'success',
        text: `Đã cập nhật trạng thái thẩm định thành công cho đơn #PS${item.orderId}!`
      });
      setInspectionNote('');
      setSelectedItem(null);
      loadOrders(); // Tải lại danh sách
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thẩm định.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-primary" />
            <span>Thẩm định thiết bị bảo hành</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Giao diện dành cho Kỹ thuật viên kiểm tra ngoại quan máy cũ mua lẻ gói bảo hành.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded text-xs font-bold transition-all cursor-pointer bg-white"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {/* Thông báo kết quả */}
      {message && (
        <div className={`p-4 rounded-md text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <AlertCircle size={16} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tìm kiếm & Lọc trạng thái */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, SĐT khách, IMEI thiết bị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-250 rounded text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
        </div>

        {/* Tab Lọc Trạng thái */}
        <div className="md:col-span-6 flex gap-1 bg-gray-50 p-1 rounded">
          {[
            { key: 'WAITING_CHECK', label: 'Chờ thẩm định' },
            { key: 'PASSED', label: 'Đã duyệt' },
            { key: 'FAILED', label: 'Từ chối' },
            { key: 'ALL', label: 'Tất cả' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setSelectedItem(null);
              }}
              className={`flex-1 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DANH SÁCH THIẾT BỊ CẦN KIỂM TRA */}
        <div className={`${selectedItem ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-500">
                    <th className="p-4">Đơn hàng</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Thiết bị & IMEI</th>
                    <th className="p-4">Gói bảo hành</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-gray-400 font-bold">
                        Đang tải danh sách thiết bị thẩm định...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-gray-400 font-bold">
                        Không tìm thấy thiết bị nào khớp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Order Code */}
                        <td className="p-4">
                          <span className="font-black text-gray-900">#PS{item.orderId}</span>
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            {item.orderDate ? new Date(item.orderDate).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="p-4">
                          <span className="block text-gray-800">{item.recipientName}</span>
                          <span className="block text-[10px] text-gray-400 font-bold mt-0.5">{item.phoneNumber}</span>
                        </td>

                        {/* Device & IMEI */}
                        <td className="p-4">
                          <span className="block text-gray-900 font-bold">{item.productName}</span>
                          <span className="block text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded w-fit font-bold mt-1">
                            IMEI: {item.imeiOrSerial || 'Chưa cung cấp'}
                          </span>
                        </td>

                        {/* Warranty */}
                        <td className="p-4">
                          <span className="block text-blue-600 font-bold">{item.warrantyName}</span>
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            Giá trị: {item.warrantyPrice?.toLocaleString('vi-VN')}₫
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.inspectionStatus === 'WAITING_CHECK'
                              ? 'bg-yellow-50 text-yellow-600'
                              : item.inspectionStatus === 'PASSED'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {item.inspectionStatus === 'WAITING_CHECK' && <Clock size={11} />}
                            {item.inspectionStatus === 'PASSED' && <CheckCircle2 size={11} />}
                            {item.inspectionStatus === 'FAILED' && <XCircle size={11} />}
                            {item.inspectionStatus === 'WAITING_CHECK' ? 'Chờ kiểm tra' : item.inspectionStatus === 'PASSED' ? 'Đã duyệt' : 'Từ chối'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setInspectionNote('');
                            }}
                            className={`p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-primary transition-all cursor-pointer ${
                              selectedItem && selectedItem.id === item.id ? 'bg-primary/10 text-primary' : ''
                            }`}
                            title="Thẩm định thiết bị"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BẢNG XỬ LÝ THẨM ĐỊNH (RIGHT COLUMN) */}
        {selectedItem && (
          <div className="lg:col-span-5 bg-white rounded-lg border border-gray-100 p-5 space-y-5 animate-in slide-in-from-right-5 duration-300">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-gray-900 uppercase">Thẩm định đơn hàng #PS{selectedItem.orderId}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                Đóng
              </button>
            </div>

            {/* Thông tin chi tiết */}
            <div className="bg-gray-50 rounded p-4 space-y-3 text-xs font-semibold text-gray-600">
              <div className="flex justify-between">
                <span>Thiết bị:</span>
                <span className="text-gray-950 font-bold">{selectedItem.productName}</span>
              </div>
              <div className="flex justify-between">
                <span>Mã IMEI / Serial:</span>
                <span className="text-gray-950 font-bold bg-white px-2 py-0.5 border rounded border-gray-200">
                  {selectedItem.imeiOrSerial}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gói bảo hành đăng ký:</span>
                <span className="text-blue-600 font-bold">{selectedItem.warrantyName}</span>
              </div>
              <div className="flex justify-between">
                <span>Giá trị gói:</span>
                <span className="text-gray-950 font-bold">{selectedItem.warrantyPrice?.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="text-gray-950 font-bold">{selectedItem.recipientName} ({selectedItem.phoneNumber})</span>
              </div>
            </div>

            {/* Form ghi chú */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                Ghi chú thẩm định (Ngoại quan/Lỗi trầy xước...):
              </label>
              <textarea
                rows="4"
                placeholder="Nhập tình trạng máy thực tế kiểm tra ngoại quan (Ví dụ: Máy đẹp 99%, màn hình không trầy xước, đủ điều kiện)..."
                value={inspectionNote}
                onChange={(e) => setInspectionNote(e.target.value)}
                className="w-full p-3 border border-gray-250 rounded text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
              />
            </div>

            {/* Nút hành động */}
            {selectedItem.inspectionStatus === 'WAITING_CHECK' ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleInspect(selectedItem, 'FAILED')}
                  className="py-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-black uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle size={15} />
                  Từ chối (FAILED)
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleInspect(selectedItem, 'PASSED')}
                  className="py-3 bg-green-600 text-white hover:bg-green-700 text-xs font-black uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <CheckCircle2 size={15} />
                  Duyệt Đạt (PASSED)
                </button>
              </div>
            ) : (
              <div className="bg-gray-100 text-gray-500 rounded p-4 text-center font-bold text-xs select-none">
                Giao dịch này đã được thẩm định ({selectedItem.inspectionStatus === 'PASSED' ? 'Đã duyệt' : 'Đã từ chối'}) và không thể thay đổi.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
