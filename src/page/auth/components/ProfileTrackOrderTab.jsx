/**
 * =========================================================================
 * 📌 FILE: ProfileTrackOrderTab.jsx
 * - CHỨC NĂNG: Tab "Tra cứu đơn hàng" (Wrapper nhúng giao diện tra cứu tiến độ đơn hàng).
 * - HIỂN THỊ Ở ĐÂU: Xuất hiện khi người dùng mở Trang cá nhân `/profile?tab=track`.
 * // Qua OrderTrackingPage mà thao tác d:/LUANVAN/lv-fe-main/src/page/OrderTrackingPage
 * =========================================================================
 */
import React from 'react';
import OrderTrackingPage from '../../OrderTrackingPage';// Qua OrderTrackingPage mà thao tác

export default function ProfileTrackOrderTab() {
  return (
    <div className="w-full">
      <OrderTrackingPage />
    </div>
  );
}