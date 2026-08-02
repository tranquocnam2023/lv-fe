import React, { useState, useEffect } from 'react';
import { orderService } from '../../../services/orderService';
import { warrantyService } from '../../../services/warrantyService';
import { Search, ShieldAlert, CheckCircle2, XCircle, Clock, Eye, AlertCircle, Plus, Pencil, Trash2, HelpCircle } from 'lucide-react';

/**
 * ============================================================================
 * COMPONENT: AdminInspectionPanel (Màn hình quản lý & Thẩm định bảo hành)
 * ============================================================================
 * Chức năng (CellphoneS / TGDĐ Style):
 *  1. Hỗ trợ 2 Tab Chế độ (ViewMode Toggle):
 *     - "Thẩm định thiết bị" (KTV kiểm tra ngoại quan máy cũ)
 *     - "Quản lý gói bảo hành" (CRUD danh mục gói bảo hành)
 *  2. Thực hiện CRUD đầy đủ đối với gói bảo hành ở Tab 2.
 *  3. Chú thích tiếng Việt chi tiết từng luồng nghiệp vụ.
 * ============================================================================
 */
export default function AdminInspectionPanel() {
  // Chế độ xem: 'inspection' (thẩm định) hoặc 'crud' (quản lý gói) - mặc định hiện Quản lý gói bảo hành (crud) lên trước
  const [viewMode, setViewMode] = useState('crud'); 

  // ================= STATE TAB 1: THẨM ĐỊNH THIẾT BỊ =================
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('WAITING_CHECK'); // 'WAITING_CHECK' | 'PASSED' | 'FAILED' | 'ALL'
  const [selectedInspectionItem, setSelectedInspectionItem] = useState(null);
  const [inspectionNote, setInspectionNote] = useState('');
  const [inspectionSubmitting, setInspectionSubmitting] = useState(false);

  // State các Modal nâng cao theo thiết kế
  const [imeiModal, setImeiModal] = useState({ isOpen: false, item: null, imei: '' });
  const [rejectModal, setRejectModal] = useState({ 
    isOpen: false, 
    item: null, 
    reason: 'Màn hình nứt vỡ', 
    customReason: '' 
  });

  // ================= STATE TAB 2: CRUD GÓI BẢO HÀNH =================
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null); // Gói đang chọn để sửa
  const [isAddingNew, setIsAddingNew] = useState(false); // Đang mở form thêm mới
  const [packageFormData, setPackageFormData] = useState({
    code: '',
    name: '',
    description: '',
    termsHtml: '',
    durationMonths: 12,
    basePrice: 0,
    requiresInspection: false,
    isActive: true
  });
  const [crudSubmitting, setCrudSubmitting] = useState(false);

  // State thông báo chung
  const [message, setMessage] = useState(null);

  // Tự động tắt thông báo sau 4 giây
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Tải danh sách đơn hàng (Tab 1)
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await orderService.getAll();
      if (res && Array.isArray(res)) {
        setOrders(res);
      } else if (res && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách đơn hàng:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Tải danh sách các gói bảo hành (Tab 2)
  const loadPackages = async () => {
    setPackagesLoading(true);
    try {
      const res = await warrantyService.getAllPackages();
      if (res && Array.isArray(res)) {
        setPackages(res);
      } else if (res && res.data) {
        setPackages(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách gói bảo hành:', err);
    } finally {
      setPackagesLoading(false);
    }
  };

  // Trigger nạp dữ liệu tùy theo tab mode hoạt động
  useEffect(() => {
    if (viewMode === 'inspection') {
      loadOrders();
      setSelectedInspectionItem(null);
    } else {
      loadPackages();
      setSelectedPackage(null);
      setIsAddingNew(false);
    }
    setMessage(null);
  }, [viewMode]);

  // ================= XỬ LÝ NGHIỆP VỤ TAB 1 (THẨM ĐỊNH) =================
  const getFilteredInspectionItems = () => {
    const list = [];
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (item.warrantyId && item.inspectionStatus) {
            list.push({
              ...item,
              orderId: order.id,
              recipientName: order.receiverName || order.recipientName || 'Khách hàng',
              phoneNumber: order.receiverPhone || order.phoneNumber || 'N/A',
              orderDate: order.createdAt || order.orderDate,
              orderStatusId: order.orderStatusId
            });
          }
        });
      }
    });

    list.sort((a, b) => b.orderId - a.orderId);

    return list.filter(item => {
      const cleanQuery = orderSearchQuery.replace('#', '').trim().toLowerCase();
      
      const matchesSearch =
        String(item.orderId).includes(cleanQuery) ||
        (item.phoneNumber && item.phoneNumber.includes(cleanQuery)) ||
        (item.imeiOrSerial && item.imeiOrSerial.toLowerCase().includes(cleanQuery)) ||
        (item.productName && item.productName.toLowerCase().includes(cleanQuery));

      const matchesStatus =
        orderStatusFilter === 'ALL' || item.inspectionStatus === orderStatusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredInspectionItems = getFilteredInspectionItems();

  // Thẩm định trực tiếp qua API
  const handleUpdateInspectionDirect = async (item, status, note, imei) => {
    setInspectionSubmitting(true);
    setMessage(null);
    try {
      await warrantyService.inspectOrderItem(item.id, {
        status: status,
        note: note || undefined,
        imei: imei || undefined
      });

      setMessage({
        type: 'success',
        text: `Đã cập nhật thẩm định thành công cho đơn #PS${item.orderId}!`
      });
      setSelectedInspectionItem(null);
      loadOrders();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể cập nhật trạng thái thẩm định.'
      });
    } finally {
      setInspectionSubmitting(false);
    }
  };

  // Kịch bản click Duyệt (Đã có IMEI -> Duyệt thẳng; Chưa có -> Bật Modal)
  const handleApproveClick = (item) => {
    const cleanImei = (item.imeiOrSerial || '').trim();
    const hasImei = cleanImei && cleanImei.toLowerCase() !== 'chưa cung cấp';
    
    if (hasImei) {
      if (window.confirm(`Xác nhận duyệt Đạt (PASSED) đơn hàng #PS${item.orderId}?`)) {
        handleUpdateInspectionDirect(item, 'PASSED', 'Thiết bị ngoại quan đạt chuẩn bảo hành.', null);
      }
    } else {
      setImeiModal({
        isOpen: true,
        item: item,
        imei: ''
      });
    }
  };

  // Kịch bản click Từ chối (Bật Modal chọn lý do)
  const handleRejectClick = (item) => {
    setRejectModal({
      isOpen: true,
      item: item,
      reason: 'Màn hình nứt vỡ',
      customReason: ''
    });
  };

  const handleImeiSubmit = async (e) => {
    e.preventDefault();
    const cleanImei = imeiModal.imei.trim();
    if (!/^\d{15}$/.test(cleanImei)) {
      alert('Mã IMEI phải chứa đúng 15 chữ số!');
      return;
    }
    const targetItem = imeiModal.item;
    setImeiModal({ isOpen: false, item: null, imei: '' });
    await handleUpdateInspectionDirect(targetItem, 'PASSED', 'Duyệt thẩm định kèm bổ sung IMEI thiết bị.', cleanImei);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    const finalReason = rejectModal.reason === 'Lý do khác' 
      ? rejectModal.customReason.trim() 
      : rejectModal.reason;
      
    if (!finalReason) {
      alert('Vui lòng nhập hoặc chọn lý do từ chối cụ thể!');
      return;
    }
    const targetItem = rejectModal.item;
    setRejectModal({ isOpen: false, item: null, reason: 'Màn hình nứt vỡ', customReason: '' });
    await handleUpdateInspectionDirect(targetItem, 'FAILED', `Từ chối thẩm định: ${finalReason}`, null);
  };

  // Hàm cũ để phục vụ khung chi tiết bên phải
  const handleUpdateInspection = async (item, status) => {
    if (!window.confirm(`Bạn có chắc chắn muốn duyệt thẩm định đơn hàng này là ${status === 'PASSED' ? 'ĐẠT CHUẨN' : 'TỪ CHỐI'}?`)) {
      return;
    }
    await handleUpdateInspectionDirect(item, status, inspectionNote.trim(), null);
    setInspectionNote('');
  };

  // ================= XỬ LÝ NGHIỆP VỤ TAB 2 (CRUD GÓI) =================
  const handleOpenAddForm = () => {
    setSelectedPackage(null);
    setIsAddingNew(true);
    setPackageFormData({
      code: '',
      name: '',
      description: '',
      termsHtml: '',
      durationMonths: 12,
      basePrice: 0,
      requiresInspection: false,
      isActive: true
    });
  };

  const handleOpenEditForm = (pkg) => {
    setIsAddingNew(false);
    setSelectedPackage(pkg);
    setPackageFormData({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description || '',
      termsHtml: pkg.termsHtml || '',
      durationMonths: pkg.durationMonths,
      basePrice: pkg.basePrice,
      requiresInspection: pkg.requiresInspection,
      isActive: pkg.isActive
    });
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa gói bảo hành này? Hành động này cũng sẽ xóa các quy tắc liên kết.')) {
      return;
    }

    try {
      await warrantyService.deletePackage(id);
      setMessage({ type: 'success', text: 'Xóa gói bảo hành thành công!' });
      loadPackages();
      if (selectedPackage && selectedPackage.id === id) {
        setSelectedPackage(null);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Lỗi khi xóa gói bảo hành.' });
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!packageFormData.name.trim()) {
      alert('Vui lòng nhập tên gói bảo hành!');
      return;
    }

    setCrudSubmitting(true);
    try {
      if (isAddingNew) {
        // Tạo mới gói bảo hành
        if (!packageFormData.code.trim()) {
          alert('Vui lòng nhập mã gói bảo hành!');
          setCrudSubmitting(false);
          return;
        }
        await warrantyService.createPackage(packageFormData);
        setMessage({ type: 'success', text: 'Tạo gói bảo hành mới thành công!' });
        setIsAddingNew(false);
      } else {
        // Cập nhật gói cũ
        await warrantyService.updatePackage(selectedPackage.id, packageFormData);
        setMessage({ type: 'success', text: 'Cập nhật gói bảo hành thành công!' });
        setSelectedPackage(null);
      }
      loadPackages();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi lưu gói bảo hành.'
      });
    } finally {
      setCrudSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-primary" />
            <span>Cổng quản trị bảo hành</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Thiết lập các gói bảo hành (VIP, Rơi vỡ) và thực hiện thẩm định thiết bị của khách hàng.
          </p>
        </div>

        {/* Nút chuyển đổi View Mode (Giống Tab Quản Lý Kho) */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded select-none border border-gray-200">
          <button
            onClick={() => setViewMode('inspection')}
            className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'inspection'
                ? 'bg-white text-primary shadow-sm scale-[1.01]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Thẩm định thiết bị
          </button>
          <button
            onClick={() => setViewMode('crud')}
            className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'crud'
                ? 'bg-white text-primary shadow-sm scale-[1.01]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Quản lý gói bảo hành
          </button>
        </div>
      </div>

      {/* Thông báo Alert */}
      {message && (
        <div className={`p-4 rounded-md text-xs font-bold flex items-center gap-2 animate-in fade-in duration-350 border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          <AlertCircle size={16} />
          <span>{message.text}</span>
        </div>
      )}

      {/* =======================================================================
          TAB CHẾ ĐỘ 1: THẨM ĐỊNH THIẾT BỊ
          ======================================================================= */}
      {viewMode === 'inspection' && (
        <>
          {/* Lọc & Tìm kiếm đơn thẩm định */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="relative w-full md:w-[320px] md:mr-auto">
              <input
                type="text"
                placeholder="Tìm Mã đơn, SĐT, IMEI..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-250 rounded text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            </div>

            <div className="flex gap-1 bg-gray-50 p-1 rounded border border-gray-100 shrink-0">
              {[
                { key: 'WAITING_CHECK', label: 'Chờ thẩm định' },
                { key: 'PASSED', label: 'Đã duyệt' },
                { key: 'FAILED', label: 'Từ chối' },
                { key: 'ALL', label: 'Tất cả' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setOrderStatusFilter(tab.key);
                    setSelectedInspectionItem(null);
                  }}
                  className={`px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    orderStatusFilter === tab.key
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
            {/* Bảng danh sách thiết bị */}
            <div className={`${selectedInspectionItem ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
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
                      {ordersLoading ? (
                        <tr>
                          <td colSpan="6" className="p-10 text-center text-gray-400 font-bold">
                            Đang tải danh sách thiết bị thẩm định...
                          </td>
                        </tr>
                      ) : filteredInspectionItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-10 text-center text-gray-400 font-bold">
                            Không tìm thấy thiết bị nào khớp điều kiện lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredInspectionItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4">
                              <span className="font-black text-gray-900">#PS{item.orderId}</span>
                              <span className="block text-[10px] text-gray-400 mt-0.5">
                                {item.orderDate ? new Date(item.orderDate).toLocaleDateString('vi-VN') : ''}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="block text-gray-800">{item.recipientName}</span>
                              <span className="block text-[10px] text-gray-400 font-bold mt-0.5">{item.phoneNumber}</span>
                            </td>
                            <td className="p-4">
                              <span className="block text-gray-900 font-bold">{item.productName}</span>
                              <span className="block text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded w-fit font-bold mt-1">
                                IMEI: {item.imeiOrSerial || 'Chưa cung cấp'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="block text-blue-600 font-bold">{item.warrantyName}</span>
                              <span className="block text-[10px] text-gray-400 mt-0.5">
                                Giá trị: {item.warrantyPrice?.toLocaleString('vi-VN')}₫
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.inspectionStatus === 'WAITING_CHECK'
                                  ? 'bg-yellow-50 text-yellow-600'
                                  : item.inspectionStatus === 'PASSED'
                                  ? 'bg-green-50 text-green-600'
                                  : item.inspectionStatus === 'NOT_REQUIRED'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-red-50 text-red-600'
                              }`}>
                                {item.inspectionStatus === 'WAITING_CHECK' && <Clock size={11} />}
                                {item.inspectionStatus === 'PASSED' && <CheckCircle2 size={11} />}
                                {item.inspectionStatus === 'NOT_REQUIRED' && <CheckCircle2 size={11} />}
                                {item.inspectionStatus === 'FAILED' && <XCircle size={11} />}
                                {item.inspectionStatus === 'WAITING_CHECK' 
                                  ? 'Chờ kiểm tra' 
                                  : item.inspectionStatus === 'PASSED' 
                                  ? 'Đã duyệt' 
                                  : item.inspectionStatus === 'NOT_REQUIRED'
                                  ? 'Tự động duyệt'
                                  : 'Từ chối'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {item.inspectionStatus === 'WAITING_CHECK' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleApproveClick(item)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-0.5"
                                  >
                                    ✓ Duyệt
                                  </button>
                                  <button
                                    onClick={() => handleRejectClick(item)}
                                    className="px-2.5 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-0.5"
                                  >
                                    ✕ Từ chối
                                  </button>
                                </div>
                              ) : item.inspectionStatus === 'PASSED' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider select-none">
                                    ✓ Đã duyệt
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedInspectionItem(item);
                                      setInspectionNote(item.note || '');
                                    }}
                                    className={`p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-primary transition-all cursor-pointer ${
                                      selectedInspectionItem && selectedInspectionItem.id === item.id ? 'bg-primary/10 text-primary' : ''
                                    }`}
                                    title="Xem chi tiết thẩm định"
                                  >
                                    <Eye size={14} />
                                  </button>
                                </div>
                              ) : item.inspectionStatus === 'NOT_REQUIRED' ? (
                                <div className="flex items-center justify-end">
                                  <span className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider select-none">
                                    Tự động duyệt
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end">
                                  <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider select-none">
                                    ✕ Từ chối
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Cột thẩm định (Bên phải) */}
            {selectedInspectionItem && (
              <div className="lg:col-span-5 bg-white rounded-lg border border-gray-100 p-5 space-y-5 animate-in slide-in-from-right-5 duration-300">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-black text-gray-900 uppercase">Thẩm định đơn #PS{selectedInspectionItem.orderId}</h3>
                  <button
                    onClick={() => setSelectedInspectionItem(null)}
                    className="text-gray-400 hover:text-gray-600 font-bold text-xs"
                  >
                    Đóng
                  </button>
                </div>

                <div className="bg-gray-50 rounded p-4 space-y-3 text-xs font-semibold text-gray-600">
                  <div className="flex justify-between">
                    <span>Thiết bị:</span>
                    <span className="text-gray-950 font-bold">{selectedInspectionItem.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mã IMEI / Serial:</span>
                    <span className="text-gray-950 font-bold bg-white px-2 py-0.5 border rounded border-gray-200">
                      {selectedInspectionItem.imeiOrSerial}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gói bảo hành:</span>
                    <span className="text-blue-600 font-bold">{selectedInspectionItem.warrantyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giá trị gói:</span>
                    <span className="text-gray-950 font-bold">{selectedInspectionItem.warrantyPrice?.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Khách hàng:</span>
                    <span className="text-gray-950 font-bold">{selectedInspectionItem.recipientName} ({selectedInspectionItem.phoneNumber})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                    Ghi chú thẩm định:
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Nhập tình trạng máy (ví dụ: máy đẹp, không cấn móp, đủ điều kiện)..."
                    value={inspectionNote}
                    onChange={(e) => setInspectionNote(e.target.value)}
                    className="w-full p-3 border border-gray-250 rounded text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>

                {selectedInspectionItem.inspectionStatus === 'WAITING_CHECK' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={inspectionSubmitting}
                      onClick={() => handleUpdateInspection(selectedInspectionItem, 'FAILED')}
                      className="py-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-black uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={15} />
                      Từ chối (FAILED)
                    </button>
                    <button
                      type="button"
                      disabled={inspectionSubmitting}
                      onClick={() => handleUpdateInspection(selectedInspectionItem, 'PASSED')}
                      className="py-3 bg-green-600 text-white hover:bg-green-700 text-xs font-black uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <CheckCircle2 size={15} />
                      Duyệt Đạt (PASSED)
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-500 rounded p-4 text-center font-bold text-xs select-none">
                    Giao dịch này đã được thẩm định ({selectedInspectionItem.inspectionStatus === 'PASSED' ? 'Đã duyệt' : 'Đã từ chối'}).
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* =======================================================================
          TAB CHẾ ĐỘ 2: CRUD QUẢN LÝ GÓI BẢO HÀNH
          ======================================================================= */}
      {viewMode === 'crud' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cột Danh sách gói bảo hành */}
          <div className={`${(selectedPackage || isAddingNew) ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                  Danh sách gói bảo hành hệ thống
                </h3>
                <button
                  onClick={handleOpenAddForm}
                  className="px-3.5 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <Plus size={13} />
                  Thêm gói mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-500">
                      <th className="p-4">Mã gói</th>
                      <th className="p-4">Tên gói bảo hành</th>
                      <th className="p-4">Thời hạn</th>
                      <th className="p-4">Giá gói</th>
                      <th className="p-4">Thẩm định</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                    {packagesLoading ? (
                      <tr>
                        <td colSpan="7" className="p-10 text-center text-gray-400 font-bold">
                          Đang tải danh mục gói bảo hành...
                        </td>
                      </tr>
                    ) : packages.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-10 text-center text-gray-400 font-bold">
                          Chưa có cấu hình gói bảo hành nào trong CSDL.
                        </td>
                      </tr>
                    ) : (
                      packages.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-gray-900">{pkg.code}</span>
                          </td>
                          <td className="p-4">
                            <span className="block text-gray-800 font-extrabold">{pkg.name}</span>
                            <span className="block text-[10px] text-gray-400 truncate max-w-[200px]" title={pkg.description}>
                              {pkg.description || 'Không có mô tả.'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-900">{pkg.durationMonths} tháng</span>
                          </td>
                          <td className="p-4">
                            <span className="text-red-600 font-black">{pkg.basePrice?.toLocaleString('vi-VN')}₫</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pkg.requiresInspection ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {pkg.requiresInspection ? 'Bắt buộc' : 'Không cần'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                              pkg.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {pkg.isActive ? 'Hoạt động' : 'Tạm khóa'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditForm(pkg)}
                              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-blue-600 rounded transition-all cursor-pointer inline-block"
                              title="Sửa thông tin"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePackage(pkg.id)}
                              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-all cursor-pointer inline-block"
                              title="Xóa gói"
                            >
                              <Trash2 size={14} />
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

          {/* Cột Form Thêm mới / Sửa (Bên phải) */}
          {(isAddingNew || selectedPackage) && (
            <div className="lg:col-span-5 bg-white rounded-lg border border-gray-100 p-5 space-y-4 animate-in slide-in-from-right-5 duration-350">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-gray-900 uppercase">
                  {isAddingNew ? 'Thêm gói bảo hành mới' : `Sửa gói: ${selectedPackage?.code}`}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setSelectedPackage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 font-bold text-xs"
                >
                  Hủy bỏ
                </button>
              </div>

              <form onSubmit={handleSavePackage} className="space-y-4 text-xs font-semibold text-gray-700">
                {/* Mã gói (Chỉ cho nhập khi tạo mới) */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-widest text-[10px] font-black">Mã gói bảo hành (Code):</label>
                  <input
                    type="text"
                    disabled={!isAddingNew}
                    placeholder="Ví dụ: BH_VIP_12M"
                    value={packageFormData.code}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full p-2.5 border border-gray-250 rounded focus:border-primary transition-all outline-none disabled:bg-gray-100 disabled:text-gray-400 font-bold uppercase"
                  />
                </div>

                {/* Tên gói */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-widest text-[10px] font-black">Tên gói hiển thị:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bảo hành 1 đổi 1 VIP 12 tháng"
                    value={packageFormData.name}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 border border-gray-250 rounded focus:border-primary transition-all outline-none"
                  />
                </div>

                {/* Thời hạn & Giá bán */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-gray-500 uppercase tracking-widest text-[10px] font-black">Thời hạn (Tháng):</label>
                    <input
                      type="number"
                      min="1"
                      value={packageFormData.durationMonths}
                      onChange={(e) => setPackageFormData(prev => ({ ...prev, durationMonths: parseInt(e.target.value) || 12 }))}
                      className="w-full p-2.5 border border-gray-250 rounded focus:border-primary transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-gray-500 uppercase tracking-widest text-[10px] font-black">Giá gói (₫):</label>
                    <input
                      type="number"
                      min="0"
                      value={packageFormData.basePrice}
                      onChange={(e) => setPackageFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2.5 border border-gray-250 rounded focus:border-primary transition-all outline-none font-bold text-red-600"
                    />
                  </div>
                </div>

                {/* Mô tả ngắn */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-widest text-[10px] font-black">Mô tả ngắn gọn:</label>
                  <textarea
                    rows="2"
                    placeholder="Mô tả tóm tắt tính năng gói bảo hành..."
                    value={packageFormData.description}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2.5 border border-gray-250 rounded focus:border-primary transition-all outline-none font-medium"
                  />
                </div>

                {/* Chi tiết điều khoản (TermsHtml) */}
                <div className="space-y-1.5">
                  <label className="block text-gray-500 uppercase tracking-widest text-[10px] font-black">Chi tiết điều khoản (Pop-up HTML):</label>
                  <textarea
                    rows="5"
                    placeholder="<h3>Điều khoản</h3><p>Nhập mã HTML hoặc text quy định điều khoản bảo hành để khách xem chi tiết...</p>"
                    value={packageFormData.termsHtml}
                    onChange={(e) => setPackageFormData(prev => ({ ...prev, termsHtml: e.target.value }))}
                    className="w-full p-2.5 border border-gray-250 rounded focus:border-primary transition-all outline-none font-mono text-[11px]"
                  />
                </div>

                {/* Options toggle */}
                <div className="flex flex-col gap-3 py-2 border-t border-b border-gray-100 bg-gray-50/50 p-3 rounded">
                  {/* Requires Inspection */}
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={packageFormData.requiresInspection}
                      onChange={(e) => setPackageFormData(prev => ({ ...prev, requiresInspection: e.target.checked }))}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20 cursor-pointer"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">Yêu cầu kiểm tra ngoại quan máy</span>
                      <span className="block text-[10px] text-gray-400 font-medium">Bắt buộc KTV cửa hàng duyệt đạt chuẩn ngoại quan rồi mới cho thanh toán.</span>
                    </div>
                  </label>

                  {/* Is Active */}
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={packageFormData.isActive}
                      onChange={(e) => setPackageFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20 cursor-pointer"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">Kích hoạt gói dịch vụ</span>
                      <span className="block text-[10px] text-gray-400 font-medium">Cho phép hiển thị và bán gói bảo hành này trên website.</span>
                    </div>
                  </label>
                </div>

                {/* Submit buttons */}
                <button
                  type="submit"
                  disabled={crudSubmitting}
                  className="w-full py-3 bg-primary hover:bg-secondary text-white text-xs font-black uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98]"
                >
                  {crudSubmitting ? 'Đang lưu...' : 'Lưu thông tin gói'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      {/* MODAL 1: NHẬP IMEI KHI DUYỆT */}
      {imeiModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-gray-100 w-full max-w-md p-6 space-y-4 shadow-xl text-left">
            <h3 className="text-sm font-black text-gray-900 uppercase border-b border-gray-100 pb-2">Bổ sung IMEI cho thiết bị</h3>
            <p className="text-[11px] text-gray-500 font-bold leading-normal">
              Thiết bị thuộc đơn #PS{imeiModal.item?.orderId} chưa có mã IMEI. Vui lòng nhập đúng 15 số IMEI để tiếp tục phê duyệt.
            </p>
            <form onSubmit={handleImeiSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nhập 15 số IMEI (chỉ chữ số)"
                maxLength={15}
                required
                value={imeiModal.imei}
                onChange={(e) => setImeiModal(prev => ({ ...prev, imei: e.target.value.replace(/\D/g, '') }))}
                className="w-full p-2.5 border border-gray-250 rounded text-xs font-semibold focus:border-primary outline-none"
              />
              <div className="flex justify-end gap-2 text-xs font-black uppercase">
                <button
                  type="button"
                  onClick={() => setImeiModal({ isOpen: false, item: null, imei: '' })}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 cursor-pointer font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer shadow font-bold"
                >
                  Xác nhận & Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỌN LÝ DO TỪ CHỐI */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-gray-100 w-full max-w-md p-6 space-y-4 shadow-xl text-left font-sans">
            <h3 className="text-sm font-black text-gray-900 uppercase border-b border-gray-100 pb-2">Từ chối đơn thẩm định #PS{rejectModal.item?.orderId}</h3>
            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-black text-gray-400">Chọn lý do từ chối:</label>
                <select
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-2.5 border border-gray-250 rounded bg-white text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="Màn hình nứt vỡ">Màn hình nứt vỡ</option>
                  <option value="Máy vào nước">Máy vào nước</option>
                  <option value="Đã tháo sửa">Đã tháo sửa linh kiện</option>
                  <option value="Trầy xước ngoại quan quá nặng">Trầy xước ngoại quan quá nặng</option>
                  <option value="Lý do khác">Lý do khác...</option>
                </select>
              </div>
              
              {rejectModal.reason === 'Lý do khác' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                  <label className="block text-[10px] uppercase font-black text-gray-400">Lý do cụ thể:</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập lý do từ chối khác..."
                    required
                    value={rejectModal.customReason}
                    onChange={(e) => setRejectModal(prev => ({ ...prev, customReason: e.target.value }))}
                    className="w-full p-2.5 border border-gray-250 rounded text-xs outline-none focus:border-primary font-medium"
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-2 font-black uppercase">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isOpen: false, item: null, reason: 'Màn hình nứt vỡ', customReason: '' })}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 cursor-pointer font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-650 text-white rounded hover:bg-red-750 cursor-pointer shadow font-bold"
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
