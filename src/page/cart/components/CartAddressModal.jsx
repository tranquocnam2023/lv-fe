import React from 'react';
import { MapPin, X } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';
import GoongAutocomplete from '../../../components/GoongAutocomplete';

export default function CartAddressModal({
  showAddressModal,
  setShowAddressModal,
  deliveryMethod,
  modalGender,
  setModalGender,
  modalFullName,
  setModalFullName,
  modalPhone,
  setModalPhone,
  modalEmail,
  setModalEmail,
  provinces,
  selectedProvinceId,
  handleProvinceChange,
  wards,
  modalWardId,
  handleWardChange,
  modalStreetAddress,
  setModalStreetAddress,
  modalSomeoneElse,
  setModalSomeoneElse,
  modalSomeoneElseName,
  setModalSomeoneElseName,
  modalSomeoneElsePhone,
  setModalSomeoneElsePhone,
  validationErrors,
  confirmAddress,
  modalLatitude,
  modalLongitude,
  onSelectGoongAddress,
  isLoggedIn,
  userAddresses,
  saveToAddressBook,
  setSaveToAddressBook,
  onSelectSavedAddress,
  onAddNewAddress
}) {
  if (!showAddressModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-md flex flex-col relative max-h-[90vh] border border-gray-150 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
            <MapPin className="text-blue-600" size={16} />
            Thông tin giao nhận hàng
          </h3>
          <button
            onClick={() => setShowAddressModal(false)}
            className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition cursor-pointer bg-transparent border-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs font-semibold text-gray-700">
          
          {/* Sổ địa chỉ đã lưu */}
          {isLoggedIn && userAddresses && userAddresses.length > 0 && (
            <div className="space-y-2 pb-3 border-b border-gray-100">
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={10} className="text-blue-500" /> Chọn địa chỉ đã lưu
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                {userAddresses.map((addr) => {
                  const isSelected = 
                    modalFullName === addr.recipientName && 
                    modalPhone === addr.phoneNumber && 
                    modalStreetAddress === addr.addressLine && 
                    modalWardId === addr.wardId;
                  
                  return (
                    <div
                      key={addr.id || addr.Id}
                      onClick={() => onSelectSavedAddress(addr)}
                      className={`p-2 rounded-md border text-left cursor-pointer transition flex items-start gap-2 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 w-3.5 h-3.5 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-gray-900">{addr.recipientName}</span>
                          <span className="text-[10px] text-gray-400 font-bold">({addr.phoneNumber})</span>
                          {addr.isDefault && (
                            <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-black tracking-tight uppercase">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium mt-1 leading-normal">
                          {addr.addressLine}, {addr.wardName || addr.ward || ''}, {addr.provinceName || addr.province || ''}
                        </p>
                        {addr.latitude && addr.longitude && (
                          <span className="text-[8px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold inline-block mt-0.5">
                            📍 Đã định vị Lat/Lng
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onAddNewAddress}
                  className="text-[10px] text-blue-600 font-black hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  + Nhập địa chỉ khác / Thêm địa chỉ mới
                </button>
              </div>
            </div>
          )}

          {/* Gender Radio */}
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Danh xưng *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none">
                <input
                  type="radio"
                  name="modalGender"
                  checked={modalGender === 'Anh'}
                  onChange={() => setModalGender('Anh')}
                  className="w-4 h-4 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Anh</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none">
                <input
                  type="radio"
                  name="modalGender"
                  checked={modalGender === 'Chị'}
                  onChange={() => setModalGender('Chị')}
                  className="w-4 h-4 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Chị</span>
              </label>
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Họ và Tên *</label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn A..."
                value={modalFullName}
                onChange={(e) => setModalFullName(e.target.value)}
                className={`w-full bg-gray-50 border ${
                  validationErrors.fullName ? 'border-red-500' : 'border-gray-200'
                } rounded-md px-3 py-2 font-bold focus:outline-none focus:border-blue-500`}
              />
              {validationErrors.fullName && <p className="text-red-500 text-[9px] font-medium">{validationErrors.fullName}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại *</label>
              <input
                type="text"
                placeholder="VD: 0987654321..."
                value={modalPhone}
                onChange={(e) => setModalPhone(e.target.value)}
                className={`w-full bg-gray-50 border ${
                  validationErrors.phone ? 'border-red-500' : 'border-gray-200'
                } rounded-md px-3 py-2 font-bold focus:outline-none focus:border-blue-500`}
              />
              {validationErrors.phone && <p className="text-red-500 text-[9px] font-medium">{validationErrors.phone}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Email (Để nhận thông tin đơn hàng)</label>
            <input
              type="email"
              placeholder="nhapemail@gmail.com..."
              value={modalEmail}
              onChange={(e) => setModalEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-bold focus:outline-none focus:border-blue-500 text-gray-800"
            />
          </div>

          {/* Address dropdowns */}
          {deliveryMethod === 'ship' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Địa chỉ giao hàng tận nơi</p>

              {/* City & Ward */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tỉnh / Thành phố *</label>
                  <SearchableSelect
                    placeholder="Chọn Tỉnh/Thành phố"
                    searchPlaceholder="🔍 Tìm nhanh Tỉnh/Thành..."
                    options={provinces}
                    value={selectedProvinceId}
                    onChange={handleProvinceChange}
                    className="font-bold text-gray-850"
                  />
                  {validationErrors.city && <p className="text-red-500 text-[9px] font-medium">{validationErrors.city}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Phường / Xã *</label>
                  <SearchableSelect
                    placeholder="Chọn Phường/Xã"
                    searchPlaceholder="🔍 Tìm nhanh Phường/Xã..."
                    options={wards}
                    value={modalWardId}
                    onChange={handleWardChange}
                    disabled={!selectedProvinceId}
                    className="font-bold text-gray-850"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Số nhà, tên đường *</label>
                    {modalLatitude && modalLongitude && (
                      <span className="text-[9px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded font-black tracking-tight flex items-center gap-0.5">
                        📍 Đã lấy tọa độ bản đồ
                      </span>
                    )}
                  </div>
                  <GoongAutocomplete
                    value={modalStreetAddress}
                    onChange={setModalStreetAddress}
                    onSelectLocation={onSelectGoongAddress}
                    placeholder="Tìm kiếm số nhà, tên đường bằng Goong Maps..."
                    error={validationErrors.streetAddress}
                    className={`w-full bg-gray-50 border ${
                      validationErrors.streetAddress ? 'border-red-500' : 'border-gray-200'
                    } rounded-md px-3 py-2 font-bold focus:outline-none focus:border-blue-500 text-gray-800`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lưu vào sổ địa chỉ */}
          {isLoggedIn && deliveryMethod === 'ship' && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={saveToAddressBook}
                  onChange={(e) => setSaveToAddressBook(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Lưu thông tin giao hàng này vào Sổ địa chỉ để dùng cho lần sau</span>
              </label>
            </div>
          )}

          {/* Someone else picking up */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-gray-700">
              <input
                type="checkbox"
                checked={modalSomeoneElse}
                onChange={(e) => setModalSomeoneElse(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>Yêu cầu người khác nhận hàng hộ (Nếu có)</span>
            </label>

            {modalSomeoneElse && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-150 rounded-md animate-in slide-in-from-top-2 duration-150">
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase">Họ tên người nhận hộ *</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn B..."
                    value={modalSomeoneElseName}
                    onChange={(e) => setModalSomeoneElseName(e.target.value)}
                    className={`w-full bg-white border ${
                      validationErrors.someoneElseName ? 'border-red-500' : 'border-gray-200'
                    } rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-500`}
                  />
                  {validationErrors.someoneElseName && <p className="text-red-500 text-[8px] font-medium">{validationErrors.someoneElseName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase">SĐT người nhận hộ *</label>
                  <input
                    type="text"
                    placeholder="Số điện thoại..."
                    value={modalSomeoneElsePhone}
                    onChange={(e) => setModalSomeoneElsePhone(e.target.value)}
                    className={`w-full bg-white border ${
                      validationErrors.someoneElsePhone ? 'border-red-500' : 'border-gray-200'
                    } rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-500`}
                  />
                  {validationErrors.someoneElsePhone && <p className="text-red-500 text-[8px] font-medium">{validationErrors.someoneElsePhone}</p>}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3.5 bg-gray-50 flex gap-3 rounded-b-md">
          <button
            type="button"
            onClick={() => setShowAddressModal(false)}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-black rounded-md text-xs transition active:scale-95 uppercase tracking-wider cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={confirmAddress}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-md text-xs transition active:scale-95 uppercase tracking-wider cursor-pointer"
          >
            Xác nhận
          </button>
        </div>

      </div>
    </div>
  );
}
