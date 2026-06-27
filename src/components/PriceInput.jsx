import React, { useState } from 'react';

export default function PriceInput({ value, onChange, placeholder, className, required, id }) {
  const [error, setError] = useState('');

  const formatNumber = (numStr) => {
    if (numStr === '' || numStr === null || numStr === undefined) return '';
    return Number(numStr).toLocaleString('vi-VN').replace(/,/g, '.');
  };

  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    if (rawValue === '') {
      setError('');
      onChange('');
      return;
    }

    const stringWithoutDots = rawValue.replace(/\./g, '');
    
    if (!/^\d+$/.test(stringWithoutDots)) {
      setError('Giá trị nhập không hợp lệ !');
      return; 
    }

    const numericValue = parseInt(stringWithoutDots, 10);
    
    if (numericValue < 1000 || numericValue > 500000000) {
      setError('giới hạn số tiền nhập vào từ 1 nghìn đến 500 triệu');
    } else {
      setError('');
    }

    onChange(numericValue);
  };

  const displayValue = formatNumber(value);

  return (
    <div className="w-full">
      <input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        required={required}
      />
      {error && <p className="text-admin-danger text-xs font-bold mt-1">{error}</p>}
    </div>
  );
}
