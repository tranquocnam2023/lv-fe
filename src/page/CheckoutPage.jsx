import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/cart', { replace: true });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 font-bold text-sm">
      Đang chuyển hướng về giỏ hàng...
    </div>
  );
}
