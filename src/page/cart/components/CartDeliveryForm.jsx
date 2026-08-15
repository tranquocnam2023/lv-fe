import React from 'react';
import { Truck, MapPin, Edit2, CheckCircle2, Plus } from 'lucide-react';

export default function CartDeliveryForm({
  deliveryMethod,
  setDeliveryMethod,
  addressProvided,
  formData,
  openAddressModal,
  isLoggedIn,
  userAddresses,
  onSelectSavedAddress
}) {
  return (
    <div className="bg-white rounded-md border border-gray-100 p-4 space-y-4">
      {/* Delivery Tabs */}
      <div className="flex bg-gray-50 rounded-md p-1 border border-gray-100">
        <button
          type="button"
          onClick={() => setDeliveryMethod('ship')}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            deliveryMethod === 'ship'
              ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Truck size={13} />
          <span>GIAO TẬN NƠI</span>
        </button>
        <button
          type="button"
          onClick={() => setDeliveryMethod('store')}
          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            deliveryMethod === 'store'
              ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <MapPin size={13} />
          <span>NHẬN TẠI CỬA HÀNG</span>
        </button>
      </div>

      {/* CHỌN NHANH ĐỊA CHỈ ĐÃ LƯU TRỰC TIẾP TRÊN TRANG CHECKOUT */}
      {isLoggedIn && deliveryMethod === 'ship' && userAddresses && userAddresses.length > 0 && (
        <div className="space-y-2 pt-1 border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider flex items-center gap-1">
              <MapPin size={12} />
              Chọn nhanh địa chỉ đã lưu
            </span>
            <button
              type="button"
              onClick={openAddressModal}
              className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
            >
              <Plus size={11} />
              Thêm địa chỉ mới
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {userAddresses.map((addr) => {
              // Khai báo biến/hằng số: isSelected - Dùng trong logic xử lý của component
              const isSelected =
                formData.fullName === addr.recipientName &&
                formData.phone === addr.phoneNumber &&
                formData.address &&
                formData.address.includes(addr.addressLine);

              return (
                <div
                  key={addr.id || addr.Id}
                  onClick={() => onSelectSavedAddress(addr)}
                  className={`p-2.5 rounded-md border text-left cursor-pointer transition flex items-start justify-between gap-2.5 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-2xs'
                      : 'border-gray-200 hover:border-blue-300 bg-gray-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2 flex-1">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 w-3.5 h-3.5 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-gray-900">{addr.recipientName}</span>
                        <span className="text-[10px] text-gray-500 font-bold">({addr.phoneNumber})</span>
                        {addr.isDefault && (
                          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black tracking-tight uppercase">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        {addr.addressLine}, {addr.wardName || addr.ward || ''}, {addr.provinceName || addr.province || ''}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Address Preview Box */}
      <div
        onClick={openAddressModal}
        className="border border-orange-200 bg-orange-50/50 hover:bg-orange-50 rounded-md p-3.5 cursor-pointer transition flex items-start justify-between gap-3"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={12} className="shrink-0" />
            <span>Thông tin người nhận chi tiết</span>
          </p>
          {addressProvided && formData.fullName ? (
            <div className="text-xs text-gray-700 font-semibold space-y-0.5">
              <p className="text-sm font-bold text-gray-800">
                {formData.gender} {formData.fullName} - {formData.phone}
              </p>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                {deliveryMethod === 'ship'
                  ? `Địa chỉ: ${formData.address}`
                  : 'Địa chỉ nhận hàng: Cửa hàng PhoneShop (120 Đường 3/2, Quận 10, Thành phố Hồ Chí Minh)'}
              </p>
              {formData.someoneElse && (
                <p className="text-[10px] text-orange-600 bg-orange-100/50 border border-orange-100 px-2 py-0.5 rounded-md italic font-semibold w-fit mt-1">
                  Người nhận thay: {formData.someoneElseName} ({formData.someoneElsePhone})
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-600 font-medium italic">
              {deliveryMethod === 'ship'
                ? 'Thành phố Hồ Chí Minh. Vui lòng cung cấp thông tin nhận hàng'
                : 'Vui lòng cung cấp thông tin người nhận tại cửa hàng.'}
            </p>
          )}
        </div>
        <button className="text-xs font-black text-blue-600 hover:underline inline-flex items-center gap-0.5 shrink-0 cursor-pointer bg-transparent border-0">
          <Edit2 size={11} />
          <span>{addressProvided && formData.fullName ? 'Sửa chi tiết' : 'Cung cấp'}</span>
        </button>
      </div>
    </div>
  );
}
