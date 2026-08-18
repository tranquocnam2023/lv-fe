import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { userService } from '../services/userService';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, CreditCard, ShoppingBag } from 'lucide-react';
import { useLoading } from '../context/LoadingContext';

export default function PaymentCallbackPage() {
  // Khai báo giải nén các thuộc tính/hàm (stopLoading) từ Hook / Context / Props
  const { stopLoading } = useLoading();
  // State: searchParams - Quản lý trạng thái và dữ liệu của searchParams trong giao diện
  const [searchParams] = useSearchParams();
  // Hook điều hướng trang (useNavigate) để chuyển hướng Route
  const navigate = useNavigate();
  // State: loading - Quản lý trạng thái và dữ liệu của loading trong giao diện
  const [loading, setLoading] = useState(true);
  // State: status - Quản lý trạng thái và dữ liệu của status trong giao diện
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'failed'
  // State: message - Quản lý trạng thái và dữ liệu của message trong giao diện
  const [message, setMessage] = useState('');
  // State: orderId - Quản lý trạng thái và dữ liệu của orderId trong giao diện
  const [orderId, setOrderId] = useState(null);

  // Khai báo biến/hằng số: sessionId - Dùng trong logic xử lý của component
  const sessionId = searchParams.get('session_id') || searchParams.get('vnp_TxnRef');
  // Khai báo biến/hằng số: provider - Dùng trong logic xử lý của component
  const provider = searchParams.get('provider') || 'stripe';
  // Khai báo biến/hằng số: isCancel - Dùng trong logic xử lý của component
  const isCancel = searchParams.get('cancel') === 'true';

  // Khôi phục giỏ hàng và đồng bộ lại Profile người dùng khi bấm quay lại giỏ hàng
  const handleReturnToCart = async () => {
    try {
      const backup = localStorage.getItem('cart_backup');
      if (backup) {
        localStorage.setItem('cart', backup);
        localStorage.removeItem('cart_backup');
      }

      // Cập nhật lại profile user (điểm thưởng đã được hoàn lại từ CSDL)
      const token = localStorage.getItem('token');
      if (token) {
        const profile = await userService.getProfile();
        if (profile) {
          localStorage.setItem('user', JSON.stringify(profile));
        }
      }
    } catch (err) {
      console.error("Lỗi khi khôi phục giỏ hàng:", err);
    } finally {
      window.location.href = '/cart';
    }
  };

  useEffect(() => {
    if (!loading) {
      stopLoading();
    }
  }, [loading, stopLoading]);

  useEffect(() => {
    if (isCancel) {
      // Hàm thực thi logic: reportCancel
      const reportCancel = async () => {
        try {
          if (sessionId) {
            await api.post(`/Payment/cancel-session?session_id=${sessionId}&provider=${provider}`);
          }
        } catch (err) {
          console.error("Lỗi khi báo hủy thanh toán:", err);
        } finally {
          setLoading(false);
          setStatus('failed');
          setMessage('Giao dịch thanh toán trực tuyến đã bị hủy bởi người dùng.');
        }
      };
      reportCancel();
      return;
    }

    if (!sessionId) {
      setLoading(false);
      setStatus('failed');
      setMessage('Không tìm thấy thông tin phiên giao dịch thanh toán.');
      return;
    }

    // Hàm thực thi logic: verifyPayment
    const verifyPayment = async () => {
      try {
        // Khai báo biến/hằng số: query - Dùng trong logic xử lý của component
        const query = new URLSearchParams(searchParams);
        if (!query.get('session_id') && sessionId) {
          query.set('session_id', sessionId);
        }
        query.set('provider', provider);
        // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
        const res = await api.get(`/Payment/verify-session?${query.toString()}`);
        if (res) {
          setStatus('success');
          setMessage(res.message || 'Thanh toán đơn hàng thành công!');
          setOrderId(res.orderId || res.OrderId);
        } else {
          throw new Error("Không nhận được phản hồi xác thực từ Server.");
        }
      } catch (err) {
        console.error("Lỗi xác minh thanh toán:", err);
        setStatus('failed');
        setMessage(
          typeof err === 'string'
            ? err
            : err.message || err.response?.data?.message || 'Có lỗi xảy ra trong quá trình xác minh giao dịch.'
        );
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, provider, isCancel, searchParams]);

  return (
    <div className="w-full min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-100 flex flex-col items-center text-center shadow-lg animate-in zoom-in-95 duration-200">
        
        {/* State: Verifying */}
        {loading && (
          <div className="space-y-6 py-6">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" strokeWidth={1.5} />
              <CreditCard className="w-6 h-6 text-secondary absolute" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Đang xác thực thanh toán</h2>
              <p className="text-sm text-gray-400 font-medium">
                Vui lòng không tắt trình duyệt hoặc tải lại trang khi hệ thống đang kiểm tra giao dịch của bạn...
              </p>
            </div>
          </div>
        )}

        {/* State: Success */}
        {!loading && status === 'success' && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={44} strokeWidth={2.5} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Thanh toán thành công!</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed px-2">
                {message}
              </p>
              {orderId && (
                <div className="inline-block bg-primary/10 text-primary text-xs font-extrabold px-3 py-1.5 rounded-full mt-2">
                  Đơn hàng: #{orderId}
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-100 pt-6 space-y-3 w-full">
              <button
                onClick={() => navigate('/track')}
                className="w-full py-3.5 bg-primary hover:bg-secondary text-white rounded-lg font-black transition active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 group cursor-pointer"
              >
                <span>Kiểm tra đơn hàng</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-white hover:bg-gray-50 text-text border border-gray-200 rounded-lg font-bold transition active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>Quay lại trang chủ</span>
              </button>
            </div>
          </div>
        )}

        {/* State: Failed */}
        {!loading && status === 'failed' && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto animate-pulse">
              <XCircle size={44} strokeWidth={2.5} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-danger">Thanh toán không thành công</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed px-2">
                {message}
              </p>
            </div>

            <div className="border-t border-dashed border-gray-100 pt-6 space-y-3 w-full">
              <button
                onClick={handleReturnToCart}
                className="w-full py-3.5 bg-warning hover:bg-warning/90 text-white rounded-lg font-black transition active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Quay lại giỏ hàng thanh toán lại</span>
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-white hover:bg-gray-50 text-text border border-gray-200 rounded-lg font-bold transition active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>Quay về trang chủ</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
