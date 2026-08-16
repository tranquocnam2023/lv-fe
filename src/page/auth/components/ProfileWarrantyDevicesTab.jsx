/**
 * =========================================================================
 * 📌 FILE: ProfileWarrantyDevicesTab.jsx
 * - CHỨC NĂNG: Tab "Thiết bị & Bảo hành" (Danh sách thiết bị đã mua, thời hạn bảo hành, số seri và yêu cầu kích hoạt/bảo hành).
 * - HIỂN THỊ Ở ĐÂU: Xuất hiện khi người dùng mở Trang cá nhân `/profile?tab=warranties`.
 * =========================================================================
 */
import React, { useState, useEffect } from 'react';
import { warrantyService } from '../../../services/warrantyService';
import { ShieldCheck, Smartphone, CheckCircle, AlertCircle, RefreshCw, Sparkles, Clock, Calendar, Check } from 'lucide-react';

export default function ProfileWarrantyDevicesTab() {
  // State: data - Quản lý trạng thái và dữ liệu của data trong giao diện
  const [data, setData] = useState({ devices: [], warranties: [] });
  // State: loading - Quản lý trạng thái và dữ liệu của loading trong giao diện
  const [loading, setLoading] = useState(true);
  // State: errorMsg - Quản lý trạng thái và dữ liệu của errorMsg trong giao diện
  const [errorMsg, setErrorMsg] = useState('');
  // State: successMsg - Quản lý trạng thái và dữ liệu của successMsg trong giao diện
  const [successMsg, setSuccessMsg] = useState('');

  // State nhập IMEI
  const [activeInputId, setActiveInputId] = useState(null);
  // State: imeiInputs - Quản lý trạng thái và dữ liệu của imeiInputs trong giao diện
  const [imeiInputs, setImeiInputs] = useState({});
  // State: activatingId - Quản lý trạng thái và dữ liệu của activatingId trong giao diện
  const [activatingId, setActivatingId] = useState(null);

  // Hàm thực thi logic: loadData
  const loadData = async () => {
    setLoading(true);
    try {
      // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
      const res = await warrantyService.getMyDevices();
      // Khai báo biến/hằng số: payload - Dùng trong logic xử lý của component
      const payload = res?.data || res;
      setData(payload);
    } catch (err) {
      console.error("Lỗi lấy danh sách bảo hành của tôi:", err);
      setErrorMsg("Không thể tải thông tin bảo hành & thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Hàm xử lý logic/sự kiện: handleImeiChange
  const handleImeiChange = (orderItemId, val) => {
    // Khai báo biến/hằng số: cleanVal - Dùng trong logic xử lý của component
    const cleanVal = val.replace(/\D/g, '').slice(0, 15);
    setImeiInputs(prev => ({ ...prev, [orderItemId]: cleanVal }));
  };

  // Hàm xử lý logic/sự kiện: handleActivate
  const handleActivate = async (orderItemId) => {
    // Khai báo biến/hằng số: imeiVal - Dùng trong logic xử lý của component
    const imeiVal = imeiInputs[orderItemId] || '';
    if (imeiVal.length !== 15) {
      setErrorMsg('Mã IMEI phải có đúng 15 chữ số từ 0-9.');
      return;
    }

    setActivatingId(orderItemId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
      const res = await warrantyService.activateImei({ orderItemId, imei: imeiVal });
      // Khai báo biến/hằng số: msg - Dùng trong logic xử lý của component
      const msg = res?.data?.message || 'Kích hoạt mã IMEI thành công!';
      setSuccessMsg(msg);
      setActiveInputId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Không thể kích hoạt IMEI. Vui lòng thử lại.');
    } finally {
      setActivatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
        <RefreshCw className="animate-spin text-primary" size={16} />
        <span>Đang nạp thông tin bảo hành &amp; thiết bị...</span>
      </div>
    );
  }

  // Cấu hình/Hằng số/Dịch vụ dữ liệu: warrantiesList
  const warrantiesList = data.warranties || [];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-150 pb-4">
        <div>
          <h2 className="text-base font-black text-gray-900 uppercase">Thiết Bị &amp; Bảo Hành Của Tôi</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Quản lý tất cả các gói bảo hành đã đăng ký và nhập mã IMEI để kích hoạt hiệu lực bảo hiểm.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0"
        >
          <RefreshCw size={13} />
          <span>Làm mới</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {warrantiesList.length === 0 ? (
        <div className="p-10 text-center space-y-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            <ShieldCheck size={26} />
          </div>
          <p className="text-xs text-gray-500 font-bold">Bạn chưa mua hoặc kích hoạt gói bảo hành nào.</p>
          <a
            href="/warranty-purchase"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-secondary transition"
          >
            Khám phá dịch vụ bảo hành
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {warrantiesList.map(item => {
            // Khai báo biến/hằng số: isActivated - Dùng trong logic xử lý của component
            const isActivated = item.isActivated;
            // Khai báo biến/hằng số: inputVal - Dùng trong logic xử lý của component
            const inputVal = imeiInputs[item.orderItemId] ?? '';
            // Khai báo biến/hằng số: isEditing - Dùng trong logic xử lý của component
            const isEditing = activeInputId === item.orderItemId;

            const status = item.inspectionStatus;
            const isApproved = status === 'Approved' || status === 'Approved_Passed' || status === 'ĐÃ DUYỆT';
            const isRejected = status === 'Rejected' || status === 'Rejected_Failed' || status === 'TỪ CHỐI';

            // Khách chỉ được phép nhập/sửa IMEI khi chưa được Admin duyệt (Chưa kích hoạt hoặc Đang chờ duyệt)
            const canEditImei = !isApproved && !isRejected;

            return (
              <div
                key={item.orderItemId}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 hover:border-gray-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-900">{item.warrantyName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-150">
                      Mã đơn #{item.orderId}
                    </span>
                  </div>

                  <div>
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                        <CheckCircle size={12} />
                        <span>Đã thẩm định &amp; Kích hoạt</span>
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                        <AlertCircle size={12} />
                        <span>Từ chối bảo hành</span>
                      </span>
                    ) : isActivated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock size={12} />
                        <span>Chờ Admin thẩm định máy</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                        <Clock size={12} />
                        <span>Chờ nhập mã IMEI kích hoạt</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-semibold text-gray-600">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Tên thiết bị:</span>
                    <span className="text-gray-900 font-bold flex items-center gap-1">
                      <Smartphone size={13} className="text-primary" />
                      <span>{item.productName}</span>
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Thời gian hiệu lực:</span>
                    <span className="text-gray-800 font-bold flex items-center gap-1">
                      <Calendar size={13} className="text-blue-500" />
                      <span>{item.durationMonths} Tháng (đến {new Date(item.expireDate).toLocaleDateString('vi-VN')})</span>
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Mã IMEI / Serial:</span>
                    <span className="font-mono text-gray-900 font-bold">
                      {isActivated ? item.imei : 'CHƯA_KÍCH_HOẠT'}
                    </span>
                  </div>
                </div>

                {/* Khung nhập / sửa IMEI: Chỉ hiện khi chưa duyệt (Chưa kích hoạt hoặc Đang chờ Admin thẩm định) */}
                {canEditImei && (!isActivated || isEditing) && (
                  <div className="pt-3 border-t border-dashed border-gray-200 bg-amber-50/50 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                        <Sparkles size={14} className="text-amber-600" />
                        <span>{isActivated ? 'Cập nhật lại mã IMEI (trường hợp gõ nhầm):' : 'Nhập mã IMEI (15 chữ số) của máy bạn để bắt đầu tính hạn bảo hành:'}</span>
                      </span>
                      {isEditing && isActivated && (
                        <button
                          onClick={() => setActiveInputId(null)}
                          className="text-[10px] text-gray-500 hover:underline cursor-pointer border-0 bg-transparent"
                        >
                          Hủy sửa
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="Nhấn *#06# trên máy để xem 15 chữ số IMEI"
                        value={inputVal}
                        onChange={(e) => handleImeiChange(item.orderItemId, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-mono text-gray-900 outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleActivate(item.orderItemId)}
                        disabled={activatingId === item.orderItemId || inputVal.length !== 15}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white rounded-lg font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer border-0 shrink-0 flex items-center justify-center gap-1"
                      >
                        {activatingId === item.orderItemId ? 'Đang cập nhật...' : (isActivated ? 'Cập nhật IMEI' : 'Kích Hoạt Bảo Hành')}
                      </button>
                    </div>
                    {inputVal && inputVal.length < 15 && (
                      <span className="text-[10px] text-amber-700 font-bold block">
                        Đã nhập {inputVal.length}/15 chữ số
                      </span>
                    )}
                  </div>
                )}

                {/* Nút Cập nhật lại số IMEI khác: Chỉ hiện khi ĐANG CHỜ DUYỆT và chưa bật khung sửa */}
                {isActivated && canEditImei && !isEditing && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveInputId(item.orderItemId);
                        setImeiInputs(prev => ({ ...prev, [item.orderItemId]: item.imei }));
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer border-0 bg-transparent flex items-center gap-1"
                    >
                      <span> Cập nhật lại số IMEI</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
