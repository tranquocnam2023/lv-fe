// COMPONENT NHẬP GIÁ TIỀN TỰ ĐỘNG ĐỊNH DẠNG HÀNG NGHÌN (PRICE INPUT FIELD)
// Chức năng: Giúp người dùng/Admin dễ dàng nhập giá tiền lớn bằng cách tự động thêm dấu phân cách hàng nghìn (dấu chấm)
import React, { useState } from 'react';

export default function PriceInput({ value, onChange, placeholder, className, required, id, errorAbsolute }) {
  // Quản lý thông tin lỗi khi nhập giá trị không hợp lệ
  const [error, setError] = useState('');

  // HÀM ĐỊNH DẠNG SỐ SANG CHUỖI TIẾNG VIỆT (VÍ DỤ: 20000000 -> 20.000.000)
  const formatNumber = (numStr) => {
    if (numStr === '' || numStr === null || numStr === undefined) return '';
    return Number(numStr).toLocaleString('vi-VN').replace(/,/g, '.');
  };

  // HÀM XỬ LÝ KHI NGƯỜI DÙNG THAY ĐỔI GIÁ TRỊ NHẬP
  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    // Nếu ô nhập trống, xóa thông báo lỗi và gửi chuỗi rỗng về component cha
    if (rawValue === '') {
      setError('');
      onChange('');
      return;
    }

    // LOẠI BỎ TẤT CẢ DẤU CHẤM PHÂN CÁCH HÀNG NGHÌN ĐỂ LẤY SỐ NGUYÊN GỐC
    const stringWithoutDots = rawValue.replace(/\./g, '');
    
    // KIỂM TRA CHỈ CHO PHÉP NHẬP KÝ TỰ SỐ (KHÔNG NHẬP CHỮ HAY KÝ TỰ ĐẶC BIỆT)
    if (!/^\d+$/.test(stringWithoutDots)) {
      setError('Giá trị nhập không hợp lệ !');
      return; 
    }

    const numericValue = parseInt(stringWithoutDots, 10);
    
    // KIỂM TRA RÀNG BUỘC GIỚI HẠN GIÁ TIỀN TỪ 1.000 ĐỒNG ĐẾN 500 TRIỆU ĐỒNG
    if (numericValue < 1000 || numericValue > 500000000) {
      setError('giới hạn số tiền nhập vào từ 1 nghìn đến 500 triệu');
    } else {
      setError('');
    }

    // Truyền giá trị số nguyên thô (không có dấu chấm) về cho component cha quản lý
    onChange(numericValue);
  };

  // Định dạng số nguyên nhận được thành chuỗi hiển thị có dấu chấm
  const displayValue = formatNumber(value);

  return (
    <div className={`w-full ${errorAbsolute ? 'relative' : ''}`}>
      <input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        required={required}
      />
      {/* Hiển thị lỗi nếu có */}
      {error && (
        <p className={errorAbsolute 
          ? "absolute left-0 top-full mt-1 z-50 text-admin-danger text-[10px] font-bold whitespace-nowrap bg-white px-2 py-0.5 border border-red-200 rounded shadow-md" 
          : "text-admin-danger text-xs font-bold mt-1"
        }>
          {error}
        </p>
      )}
    </div>
  );
}
