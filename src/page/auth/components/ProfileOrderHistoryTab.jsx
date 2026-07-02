import React from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import OrderDetailsTracker from '../../../components/OrderDetailsTracker';

export default function ProfileOrderHistoryTab({
  orders,
  ordersLoading,
  selectedOrder,
  setSelectedOrder,
  fetchMyOrders
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Lịch sử đơn hàng của bạn</h3>
          <p className="text-xs text-gray-500">Xem trạng thái giao nhận và lịch sử các đơn hàng đã đặt</p>
        </div>
        {selectedOrder && (
          <button
            onClick={() => setSelectedOrder(null)}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-bold text-gray-600 transition-all flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} /> Quay lại danh sách
          </button>
        )}
      </div>

      {selectedOrder ? (
        <OrderDetailsTracker
          order={selectedOrder}
          onOrderCancelled={() => fetchMyOrders(selectedOrder.id)}
        />
      ) : ordersLoading ? (
        <div className="flex justify-center items-center py-10 text-primary gap-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold text-xs">Đang tải lịch sử đơn hàng...</span>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-md border border-gray-200 hover:border-gray-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white"
            >
              <div className="space-y-1.5 text-xs text-gray-500 font-bold">
                <p className="text-sm font-black text-gray-800">Mã đơn hàng: #PS{item.id}</p>
                <p>Ngày đặt: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                <p className="text-gray-600">Sản phẩm: {item.items ? item.items.map(i => `${i.productName} (${i.quantity})`).join(', ') : 'Chưa cập nhật'}</p>
                <p className="text-red-600 font-black text-sm">Tổng cộng: {item.totalPrice.toLocaleString('vi-VN')}₫</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wide border ${
                  item.status === 'Delivered' || item.status === 'Completed'
                    ? 'bg-green-50 border-green-200 text-green-600'
                    : item.status === 'Shipping' || item.status === 'Shipped'
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-orange-50 border-orange-200 text-orange-500'
                }`}>
                  {item.status === 'Pending' ? 'Chờ xác nhận' :
                   item.status === 'Confirmed' ? 'Đã xác nhận' :
                   item.status === 'Processing' ? 'Đang đóng gói' :
                   item.status === 'Shipping' || item.status === 'Shipped' ? 'Đang giao hàng' :
                   item.status === 'Delivered' || item.status === 'Completed' ? 'Đã giao hàng' : item.status}
                </span>
                <button
                  onClick={() => setSelectedOrder(item)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-md transition-all cursor-pointer border-0"
                >
                  Theo dõi đơn
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-md border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
          <ClipboardList size={48} className="mb-2 opacity-50 text-gray-300" />
          <p className="font-bold text-gray-600">Bạn chưa mua đơn hàng nào</p>
          <p className="text-xs mt-0.5">Các đơn hàng bạn mua sẽ xuất hiện tại đây để theo dõi hành trình giao nhận</p>
        </div>
      )}
    </div>
  );
}
