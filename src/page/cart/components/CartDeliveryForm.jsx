import React from 'react';
import { Truck, MapPin, Edit2 } from 'lucide-react';

export default function CartDeliveryForm({
  deliveryMethod,
  setDeliveryMethod,
  addressProvided,
  formData,
  openAddressModal
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

      {/* Address Preview Box */}
      <div
        onClick={openAddressModal}
        className="border border-orange-200 bg-orange-50/50 hover:bg-orange-50 rounded-md p-3.5 cursor-pointer transition flex items-start justify-between gap-3"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={12} className="shrink-0" />
            <span>Địa chỉ nhận hàng</span>
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
          <span>{addressProvided && formData.fullName ? 'Thay đổi' : 'Cung cấp'}</span>
        </button>
      </div>
    </div>
  );
}
