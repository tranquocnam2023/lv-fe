import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';

export default function CheckoutPage() {
  // Hook điều hướng trang (useNavigate) để chuyển hướng Route
  const navigate = useNavigate();
  // Khai báo giải nén các thuộc tính/hàm (stopLoading) từ Hook / Context / Props
  const { stopLoading } = useLoading();
  
  useEffect(() => {
    stopLoading();
    navigate('/cart', { replace: true });
  }, [navigate, stopLoading]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 font-bold text-sm">
      Đang chuyển hướng về giỏ hàng...
    </div>
  );
}
