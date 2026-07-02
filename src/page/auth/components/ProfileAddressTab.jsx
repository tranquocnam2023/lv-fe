import React from 'react';
import { Plus, Check, Edit2, Trash2, MapPin } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';

export default function ProfileAddressTab({
  shippingInfos,
  infoLoading,
  isAddressFormOpen,
  setIsAddressFormOpen,
  editingAddressId,
  handleOpenAddressForm,
  handleDeleteAddress,
  addressForm,
  setAddressForm,
  provinces,
  selectedProvinceId,
  handleProvinceChange,
  wards,
  handleWardChange,
  handleSaveAddress,
  loading
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Sổ địa chỉ nhận hàng</h3>
          <p className="text-xs text-gray-500">Quản lý danh sách các địa chỉ giao nhận hàng của bạn</p>
        </div>
        {!isAddressFormOpen && (
          <button
            onClick={() => handleOpenAddressForm()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm cursor-pointer border-0"
          >
            <Plus size={16} />
            <span>Thêm địa chỉ</span>
          </button>
        )}
      </div>

      {isAddressFormOpen ? (
        <form onSubmit={handleSaveAddress} className="space-y-4 max-w-lg bg-gray-50 p-6 rounded-md border border-gray-200 text-xs font-semibold text-gray-700">
          <h4 className="font-bold text-gray-850 border-b border-gray-200 pb-2 text-sm">
            {editingAddressId ? 'Cập nhật địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tên người nhận</label>
              <input
                type="text"
                required
                placeholder="Họ và tên..."
                className="w-full border border-gray-300 p-2.5 rounded-md text-xs font-bold text-gray-850 focus:outline-none focus:border-primary"
                value={addressForm.recipientName}
                onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Số điện thoại</label>
              <input
                type="text"
                required
                placeholder="SĐT liên hệ..."
                className="w-full border border-gray-300 p-2.5 rounded-md text-xs font-bold text-gray-855 focus:outline-none focus:border-primary"
                value={addressForm.phoneNumber}
                onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Địa chỉ chi tiết (Số nhà, tên đường)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 120/5 Nguyễn Văn Cừ..."
                className="w-full border border-gray-300 p-2.5 rounded-md text-xs font-bold text-gray-855 focus:outline-none focus:border-primary"
                value={addressForm.addressLine}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tỉnh / Thành phố *</label>
              <SearchableSelect
                placeholder="Chọn Tỉnh/Thành phố"
                searchPlaceholder="🔍 Tìm nhanh Tỉnh/Thành..."
                options={provinces}
                value={selectedProvinceId}
                onChange={handleProvinceChange}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phường / Xã *</label>
              <SearchableSelect
                placeholder="Chọn Phường/Xã"
                searchPlaceholder="🔍 Tìm nhanh Phường/Xã..."
                options={wards}
                value={addressForm.wardId}
                onChange={handleWardChange}
                disabled={!selectedProvinceId}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              checked={addressForm.isDefault}
              disabled={!editingAddressId && shippingInfos.length === 0} // Lock to true if first address
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
            />
            <label htmlFor="isDefault" className="text-xs font-bold text-gray-700 cursor-pointer select-none">Đặt làm địa chỉ nhận hàng mặc định</label>
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <button
              type="button"
              onClick={() => setIsAddressFormOpen(false)}
              className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-100 transition text-sm cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm cursor-pointer border-0"
            >
              {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {infoLoading ? (
            <div className="flex justify-center items-center py-10 text-primary gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="font-bold text-xs">Đang tải sổ địa chỉ...</span>
            </div>
          ) : shippingInfos.length > 0 ? (
            shippingInfos.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-md border flex justify-between items-start transition-all ${
                  item.isDefault
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-base">{item.recipientName}</span>
                    {item.isDefault && (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 bg-primary text-white font-bold text-[10px] rounded-full uppercase select-none">
                        <Check size={8} /> Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 font-medium">Số điện thoại: <strong className="text-gray-700">{item.phoneNumber}</strong></p>
                  <p className="text-gray-600">Địa chỉ: {item.addressLine}{item.wardName ? `, ${item.wardName}` : ''}{item.provinceName ? `, ${item.provinceName}` : ''}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddressForm(item)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer bg-transparent border-0"
                    title="Sửa địa chỉ"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(item.id)}
                    disabled={item.isDefault && shippingInfos.length > 1} // Can't delete default unless it's the last one
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 cursor-pointer bg-transparent border-0"
                    title="Xóa địa chỉ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-md border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <MapPin size={48} className="mb-2 opacity-50 text-gray-300" />
              <p className="font-bold text-gray-600">Bạn chưa có địa chỉ nhận hàng nào</p>
              <p className="text-xs mt-0.5">Vui lòng bấm nút "Thêm địa chỉ" để nhận hàng khi đặt sản phẩm</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
