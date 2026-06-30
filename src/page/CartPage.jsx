// src/page/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Breadcrumb from '../components/Breadcrumb';
import PromotionSelector from '../components/PromotionSelector';
import OtpVerification from '../components/OtpVerification';
import { shippingInfoService } from '../services/shippingInfoService';
import { orderService } from '../services/orderService';
import api from '../services/api';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import SearchableSelect from '../components/SearchableSelect';



import {
  User, Lock, MapPin, Edit2, Trash2, ArrowLeft,
  CreditCard, Truck, ChevronRight, X, Sparkles, Gift,
  ShieldCheck, AlertCircle, ShoppingBag, Info, CheckCircle2
} from 'lucide-react';


export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);

  // Load user profile on mount & when login state changes
  useEffect(() => {
    if (isLoggedIn) {
      userService.getProfile()
        .then(res => {
          if (res) {
            setCurrentUser(res);
            localStorage.setItem('user', JSON.stringify(res));
          }
        })
        .catch(err => {
          console.error("Lỗi lấy thông tin profile:", err);
          const userJson = localStorage.getItem('user');
          if (userJson && userJson !== 'undefined' && userJson !== 'null') {
            try {
              setCurrentUser(JSON.parse(userJson));
            } catch (err2) {
              console.debug(err2);
            }
          }
        });
    } else {
      setCurrentUser(null);
    }
  }, [isLoggedIn]);

  // Inline Auth Form Input states
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlineUsername, setInlineUsername] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineAuthLoading, setInlineAuthLoading] = useState(false);
  const [inlineAuthError, setInlineAuthError] = useState('');
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'

  // Delivery configuration states
  const [deliveryMethod, setDeliveryMethod] = useState('ship'); // 'ship' | 'store'
  const [addressProvided, setAddressProvided] = useState(false);

  // Shipping details state
  const [formData, setFormData] = useState({
    gender: 'Anh',
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Hồ Chí Minh',
    ward: '',
    streetAddress: '',
    someoneElse: false,
    someoneElseName: '',
    someoneElsePhone: '',
    note: '',
    wardId: ''
  });

  // Modal temporary inputs
  const [modalGender, setModalGender] = useState('Anh');
  const [modalFullName, setModalFullName] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalCity, setModalCity] = useState('Hồ Chí Minh');
  const [modalWard, setModalWard] = useState('');
  const [modalStreetAddress, setModalStreetAddress] = useState('');
  const [modalSomeoneElse, setModalSomeoneElse] = useState(false);
  const [modalSomeoneElseName, setModalSomeoneElseName] = useState('');
  const [modalSomeoneElsePhone, setModalSomeoneElsePhone] = useState('');

  // Location list states from SQL Server
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [modalWardId, setModalWardId] = useState('');

  // Modal toggle states
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Special Request configuration
  const [specialRequests, setSpecialRequests] = useState({
    transferData: false,
    companyInvoice: false,
    otherRequest: false
  });
  const [otherRequestText, setOtherRequestText] = useState('');
  const [companyInvoiceDetails, setCompanyInvoiceDetails] = useState({
    companyName: '',
    taxCode: '',
    companyAddress: ''
  });

  // Loyalty and promotion calculation
  const [appliedPromo, setAppliedPromo] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  // Dynamic Shipping Fee states
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingEstimatedDays, setShippingEstimatedDays] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);

  // Effect to calculate shipping fee dynamically
  useEffect(() => {
    if (deliveryMethod === 'ship' && formData.wardId) {
      setShippingLoading(true);
      api.post('/Shipping/calculate-fee', {
        wardId: formData.wardId,
        totalWeightKg: 1.0
      })
      .then(res => {
        if (res) {
          setShippingFee(Number(res.fee || res.Fee || 0));
          setShippingCarrier(res.carrier || res.Carrier || 'Giao Hàng Nhanh (GHN)');
          setShippingEstimatedDays(res.estimatedDeliveryDays || res.EstimatedDeliveryDays || '2-3 ngày');
        }
      })
      .catch(err => {
        console.error("Lỗi tính phí vận chuyển:", err);
        setShippingFee(25000); // fallback
        setShippingCarrier('Giao Hàng Nhanh (GHN)');
        setShippingEstimatedDays('3-5 ngày');
      })
      .finally(() => {
        setShippingLoading(false);
      });
    } else {
      setShippingFee(0);
      setShippingCarrier('');
      setShippingEstimatedDays('');
    }
  }, [formData.wardId, deliveryMethod]);

  // Form submission state
  const [paymentMethod, setPaymentMethod] = useState('transfer'); // default 'transfer' for guest, COD require login
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Success screen state
  const [isFinished, setIsFinished] = useState(false);
  const [orderCode, setOrderCode] = useState('');

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch provinces list on mount
  useEffect(() => {
    api.get('/Location/provinces')
      .then(res => {
        if (Array.isArray(res)) {
          setProvinces(res);
        }
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách tỉnh/thành:", err);
      });
  }, []);

  // Fetch wards when selectedProvinceId changes
  useEffect(() => {
    if (selectedProvinceId) {
      api.get(`/Location/provinces/${selectedProvinceId}/wards`)
        .then(res => {
          if (Array.isArray(res)) {
            setWards(res);
          }
        })
        .catch(err => {
          console.error("Lỗi lấy danh sách phường/xã:", err);
          setWards([]);
        });
    } else {
      setWards([]);
    }
  }, [selectedProvinceId]);

  // Sync selectedProvinceId when modalCity is set from default address
  useEffect(() => {
    if (provinces.length > 0 && modalCity) {
      const match = provinces.find(p => p.name === modalCity || p.fullName === modalCity);
      if (match) {
        setSelectedProvinceId(match.id);
      }
    }
  }, [modalCity, provinces]);

  // Sync logged in address details automatically
  useEffect(() => {
    if (isLoggedIn) {
      setPaymentMethod('cod'); // Default COD for members
      shippingInfoService.getAll()
        .then(res => {
          if (Array.isArray(res) && res.length > 0) {
            const defaultAddr = res.find(addr => addr.isDefault) || res[0];
            const recipient = defaultAddr.recipientName || '';
            const phoneNum = defaultAddr.phoneNumber || '';
            const fullAddress = `${defaultAddr.addressLine}, ${defaultAddr.wardName || defaultAddr.ward || ''}, ${defaultAddr.provinceName || defaultAddr.province || ''}`;

            setFormData(prev => ({
              ...prev,
              fullName: recipient,
              phone: phoneNum,
              address: fullAddress,
              city: defaultAddr.provinceName || defaultAddr.province || 'Hồ Chí Minh',
              ward: defaultAddr.wardName || defaultAddr.ward || '',
              streetAddress: defaultAddr.addressLine || '',
              wardId: defaultAddr.wardId || ''
            }));

            // Sync modal temporary states as well
            setModalFullName(recipient);
            setModalPhone(phoneNum);
            setModalStreetAddress(defaultAddr.addressLine || '');
            setModalCity(defaultAddr.provinceName || defaultAddr.province || 'Hồ Chí Minh');
            setModalWard(defaultAddr.wardName || defaultAddr.ward || '');
            setModalWardId(defaultAddr.wardId || '');
            setAddressProvided(true);
          }
        })
        .catch(err => {
          console.error("Lỗi lấy danh sách địa chỉ nhận hàng:", err);
        });
    } else {
      setPaymentMethod('transfer');
    }
  }, [isLoggedIn, provinces]);

  // Open shipping modal, copy current formData values to temp modal states
  const openAddressModal = () => {
    setModalGender(formData.gender);
    setModalFullName(formData.fullName);
    setModalPhone(formData.phone);
    setModalEmail(formData.email);
    setModalCity(formData.city);
    setModalWard(formData.ward);
    setModalStreetAddress(formData.streetAddress);
    setModalSomeoneElse(formData.someoneElse);
    setModalSomeoneElseName(formData.someoneElseName);
    setModalSomeoneElsePhone(formData.someoneElsePhone);
    setModalWardId(formData.wardId || '');
    setValidationErrors({});
    setShowAddressModal(true);
  };

  const handleProvinceChange = (provinceId) => {
    setSelectedProvinceId(provinceId);
    const matchedProv = provinces.find(p => String(p.id) === String(provinceId));
    if (matchedProv) {
      setModalCity(matchedProv.name);
    } else {
      setModalCity('');
    }
    setModalWard('');
    setModalWardId('');
  };

  const handleWardChange = (wardId) => {
    setModalWardId(wardId);
    const matchedWard = wards.find(w => String(w.id) === String(wardId));
    if (matchedWard) {
      setModalWard(matchedWard.fullName || matchedWard.name);
    } else {
      setModalWard('');
    }
  };

  // Confirm shipping address, copying temp states to formData
  const confirmAddress = () => {
    const errors = {};
    if (!modalFullName.trim()) errors.fullName = 'Vui lòng nhập họ tên người nhận';
    if (!modalPhone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';

    if (deliveryMethod === 'ship') {
      if (!modalStreetAddress.trim()) errors.streetAddress = 'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)';
      if (!selectedProvinceId) errors.city = 'Vui lòng chọn Tỉnh/Thành phố';
    }

    if (modalSomeoneElse) {
      if (!modalSomeoneElseName.trim()) errors.someoneElseName = 'Vui lòng nhập họ tên người nhận thay';
      if (!modalSomeoneElsePhone.trim()) errors.someoneElsePhone = 'Vui lòng nhập số điện thoại người nhận thay';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    let generatedAddress = '';
    if (deliveryMethod === 'ship') {
      const parts = [modalStreetAddress.trim()];
      if (modalWard) parts.push(modalWard);
      if (modalCity) parts.push(modalCity);
      generatedAddress = parts.join(', ');
    } else {
      generatedAddress = 'Nhận tại Cửa hàng PhoneShop: 120 Đường 3/2, Quận 10, Thành phố Hồ Chí Minh';
    }

    setFormData(prev => ({
      ...prev,
      gender: modalGender,
      fullName: modalFullName,
      phone: modalPhone,
      email: modalEmail,
      city: modalCity,
      ward: modalWard,
      streetAddress: modalStreetAddress,
      address: generatedAddress,
      someoneElse: modalSomeoneElse,
      someoneElseName: modalSomeoneElseName,
      someoneElsePhone: modalSomeoneElsePhone,
      wardId: modalWardId
    }));

    setAddressProvided(true);
    setShowAddressModal(false);
  };

  // Inline Registration Submit Action
  const handleInlineRegister = async () => {
    setInlineAuthError('');
    if (!formData.fullName.trim()) {
      setInlineAuthError('Vui lòng cung cấp Họ và Tên trong thông tin nhận hàng trước.');
      return;
    }
    if (!formData.phone.trim()) {
      setInlineAuthError('Vui lòng cung cấp Số điện thoại nhận hàng trước.');
      return;
    }

    const emailToUse = inlineEmail.trim() || formData.email.trim();
    if (!emailToUse) {
      setInlineAuthError('Vui lòng nhập địa chỉ Email.');
      return;
    }
    if (!inlinePassword) {
      setInlineAuthError('Vui lòng nhập mật khẩu.');
      return;
    }
    if (inlinePassword.length < 6) {
      setInlineAuthError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }

    setInlineAuthLoading(true);
    try {
      // Generate unique username from email split and random code
      const baseUsername = emailToUse.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedUsername = `${baseUsername}_${randSuffix}`;

      // Call register API
      await authService.register({
        username: generatedUsername,
        email: emailToUse,
        password: inlinePassword
      });

      // Auto login on success
      const loginData = await authService.login({
        username: generatedUsername,
        password: inlinePassword
      });

      const token = loginData.token || loginData.accessToken || (loginData.data && loginData.data.token);
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          id: loginData.id,
          username: generatedUsername,
          email: emailToUse,
          role: loginData.role
        }));

        setFormData(prev => ({ ...prev, email: emailToUse }));
        setIsLoggedIn(true);
        setInlinePassword('');
        setInlineEmail('');
        alert("Đăng ký thành viên và đăng nhập thành công! Giỏ hàng vẫn được giữ nguyên.");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setInlineAuthError(typeof err.response.data === 'string' ? err.response.data : 'Lỗi đăng ký thành viên.');
      } else {
        setInlineAuthError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại.');
      }
    } finally {
      setInlineAuthLoading(false);
    }
  };

  // Inline Login Submit Action
  const handleInlineLogin = async () => {
    setInlineAuthError('');
    if (!inlineUsername.trim()) {
      setInlineAuthError('Vui lòng nhập tên đăng nhập hoặc Email.');
      return;
    }
    if (!inlinePassword) {
      setInlineAuthError('Vui lòng nhập mật khẩu.');
      return;
    }

    setInlineAuthLoading(true);
    try {
      const loginData = await authService.login({
        username: inlineUsername.trim(),
        password: inlinePassword
      });

      const token = loginData.token || loginData.accessToken || (loginData.data && loginData.data.token);
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          id: loginData.id,
          username: loginData.username || inlineUsername.trim(),
          email: loginData.email || '',
          role: loginData.role
        }));

        setIsLoggedIn(true);
        setInlinePassword('');
        setInlineUsername('');
        alert("Đăng nhập thành công! Giỏ hàng vẫn được giữ nguyên.");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setInlineAuthError(typeof err.response.data === 'string' ? err.response.data : 'Lỗi đăng nhập.');
      } else {
        setInlineAuthError(err.message || 'Đăng nhập thất bại.');
      }
    } finally {
      setInlineAuthLoading(false);
    }
  };

  // Submit Order Checkout (Direct Placement, No pre-otp verification)
  const handleCheckoutSubmit = async (e) => {
    if (e) e.preventDefault();

    // 1. Validation check
    if (!addressProvided || !formData.fullName || !formData.phone) {
      alert("Vui lòng cung cấp thông tin người nhận và địa chỉ trước khi đặt hàng.");
      openAddressModal();
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Guest auto registration/login underneath if NOT logged in (compatibility fallback)
      if (!isLoggedIn) {
        // Create an automatic guest user so we have a token
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const guestEmail = formData.email.trim() || `guest_${formData.phone}@phoneshop.com`;
        const guestUser = `guest_${formData.phone}_${randSuffix}`;
        const guestPass = `Guest@${formData.phone}`;

        try {
          await api.post('/Auth/register', {
            username: guestUser,
            email: guestEmail,
            password: guestPass
          });

          const loginRes = await api.post('/Auth/login', {
            username: guestUser,
            password: guestPass
          });

          localStorage.setItem('token', loginRes.token);
          localStorage.setItem('user', JSON.stringify({
            id: loginRes.id,
            username: guestUser,
            email: guestEmail,
            role: loginRes.role
          }));
        } catch (authErr) {
          console.error("Lỗi đăng ký ngầm:", authErr);
          throw new Error("Không thể khởi tạo phiên giao dịch cho khách vãng lai. Vui lòng đăng ký tài khoản.");
        }
      }

      // Build Order Payload
      const finalNote = [
        specialRequests.transferData ? "Yêu cầu: Chuyển dữ liệu qua máy mới" : "",
        specialRequests.companyInvoice
          ? `Xuất HĐ Cty: ${companyInvoiceDetails.companyName}, MST: ${companyInvoiceDetails.taxCode}, ĐC: ${companyInvoiceDetails.companyAddress}`
          : "",
        specialRequests.otherRequest ? `Yêu cầu khác: ${otherRequestText}` : "",
        formData.note ? `Ghi chú: ${formData.note}` : ""
      ].filter(n => n !== "").join(" | ");

      const payload = {
        recipientName: formData.fullName,
        phoneNumber: formData.phone,
        addressLine: deliveryMethod === 'ship' ? formData.streetAddress : 'Nhận tại Cửa hàng PhoneShop: 120 Đường 3/2, Quận 10, Thành phố Hồ Chí Minh',
        wardId: deliveryMethod === 'ship' ? formData.wardId : null,
        promotionCode: appliedPromo || '',
        pointsToRedeem: usePoints ? pointsDiscount : 0,
        note: finalNote,
        paymentMethod: paymentMethod, // stripe/momo/transfer/cod (left as placeholder for backend API integration)
        items: cartItems.map(item => ({
          productId: item.id || item.Id,
          storage: item.selectedStorage || '',
          color: item.selectedColor || '',
          quantity: item.quantity,
          price: item.price
        }))
      };

      // 3. Sync cart to database before checking out
      const syncItems = [];
      await Promise.all(cartItems.map(async (item) => {
        const productId = item.id || item.Id;
        if (!productId) return;

        try {
          const variants = await api.get(`/ProductVariant?productId=${productId}`);
          let matchedVariant = null;

          if (Array.isArray(variants) && variants.length > 0) {
            matchedVariant = variants.find(v =>
              v.name && (
                (item.selectedStorage && v.name.toLowerCase().includes(item.selectedStorage.toLowerCase())) ||
                (item.selectedColor && v.name.toLowerCase().includes(item.selectedColor.toLowerCase()))
              )
            );
            if (!matchedVariant) matchedVariant = variants[0];
          }

          if (matchedVariant) {
            syncItems.push({
              variantId: matchedVariant.id,
              quantity: item.quantity
            });
          }
        } catch (err) {
          console.error(`Error resolving variant for product ${productId}:`, err);
        }
      }));

      // Gửi request đồng bộ batch duy nhất lên server
      await api.post('/Cart/sync', syncItems);

      // 4. Place order
      const checkoutRes = await orderService.checkout(payload);

      // Refresh points balance
      if (isLoggedIn) {
        userService.getProfile()
          .then(res => {
            if (res) {
              setCurrentUser(res);
              localStorage.setItem('user', JSON.stringify(res));
            }
          })
          .catch(e => console.error("Lỗi lấy thông tin profile:", e));
      }

      const newOrderId = checkoutRes?.orderId || checkoutRes?.OrderId || `PS${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderCode(newOrderId);
      setIsFinished(true);
      clearCart();
    } catch (err) {
      console.error('Lỗi đặt hàng:', err);
      let errorMsg = 'Lỗi hệ thống, vui lòng thử lại sau.';
      if (typeof err === 'string') {
        errorMsg = err;
      } else if (err && typeof err === 'object') {
        errorMsg = err.title || err.message || JSON.stringify(err);
      }
      alert('Đặt hàng thất bại: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subtotal and final values
  const userPoints = currentUser?.rewardPoints || 0;
  const pointsDiscount = usePoints ? Math.min(userPoints, cartTotal - discountAmount) : 0;
  const finalTotalPay = Math.max(0, cartTotal - discountAmount - pointsDiscount + shippingFee);


  // Render Success Screen
  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-[600px] mx-auto bg-white rounded-md border border-gray-100 p-8 my-8">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <ShieldCheck size={40} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Đặt hàng thành công!</h2>
        <p className="text-gray-500 text-sm font-medium leading-relaxed px-4 mb-8">
          Cảm ơn bạn đã tin dùng PhoneShop. Mã đơn hàng của bạn là <span className="font-extrabold text-blue-600">#{orderCode}</span>.
          Chúng tôi đã gửi thông tin xác thực đến số điện thoại và email của bạn. Nhân viên CSKH sẽ gọi xác nhận trong 15 phút tới.
        </p>

        {paymentMethod === 'transfer' && (
          <div className="w-full bg-gray-50 rounded-md p-5 border border-gray-150 mb-8 text-left space-y-3">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
              <CreditCard size={14} />
              Thông tin thanh toán ngân hàng
            </p>
            <div className="text-xs text-gray-700 space-y-1.5 font-semibold">
              <p>Ngân hàng: <strong className="text-gray-900">MB BANK (Quân Đội)</strong></p>
              <p>Chủ tài khoản: <strong className="text-gray-900 uppercase">PHONESHOP OFFICIAL</strong></p>
              <p>Số tài khoản: <strong className="text-blue-600 text-sm font-black tracking-wider">098 7654 3210</strong></p>
              <p>Số tiền cần chuyển: <strong className="text-red-600 font-extrabold text-sm">{finalTotalPay.toLocaleString('vi-VN')}₫</strong></p>
              <p className="text-[10px] text-gray-400 italic font-medium pt-1">Nội dung chuyển khoản ghi rõ: "Thanh toan don hang {orderCode}"</p>
            </div>
          </div>
        )}

        {paymentMethod === 'stripe' && (
          <div className="w-full bg-gray-50 rounded-md p-5 border border-gray-150 mb-8 text-left space-y-3">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
              <CreditCard size={14} />
              Thanh toán trực tuyến qua Stripe
            </p>
            <div className="text-xs text-gray-700 space-y-1.5 font-semibold">
              <p>Trạng thái cổng thanh toán: <strong className="text-green-600 font-bold">Hoạt động</strong></p>
              <p>Số tiền thanh toán: <strong className="text-red-600 font-extrabold text-sm">{finalTotalPay.toLocaleString('vi-VN')}₫</strong></p>
              <p className="text-[10px] text-gray-400 italic font-medium pt-1">Hệ thống đang chuyển hướng bạn tới trang thanh toán bảo mật của Stripe...</p>
            </div>
          </div>
        )}

        {paymentMethod === 'momo' && (
          <div className="w-full bg-gray-50 rounded-md p-5 border border-gray-150 mb-8 text-left space-y-3">
            <p className="text-xs font-bold text-[#A50064] uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-4 h-4 bg-[#A50064] text-white text-[7px] font-black rounded flex items-center justify-center">M</span>
              Thanh toán qua ví điện tử MoMo
            </p>
            <div className="text-xs text-gray-700 space-y-1.5 font-semibold flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-grow w-full">
                <p>Số tài khoản MoMo: <strong className="text-gray-900">098 7654 3210</strong></p>
                <p>Chủ tài khoản: <strong className="text-gray-900 uppercase">PHONESHOP OFFICIAL</strong></p>
                <p>Số tiền: <strong className="text-red-600 font-extrabold text-sm">{finalTotalPay.toLocaleString('vi-VN')}₫</strong></p>
                <p className="text-[10px] text-gray-400 italic font-medium pt-1">Vui lòng quét mã QR bên cạnh để hoàn tất thanh toán.</p>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-white border border-gray-250 rounded-md shrink-0">
                <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center text-gray-300">
                  <svg className="w-10 h-10 text-[#A50064]" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm1 1v4h4V4H4zm1 1h2v2H5V5zM3 15h6v6H3v-6zm1 1v4h4v-4H4zm1 1h2v2H5v-2zM15 3h6v6h-6V3zm1 1v4h4V4h-4zm1 1h2v2h-2V5zM15 15h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 2v2h-2v-2zm2 0h2v2h-2v-2zM10 3h4v2h-4V3zm0 4h4v2h-4V7zm0 8h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z" /></svg>
                </div>
                <span className="text-[8px] text-[#A50064] font-bold uppercase tracking-wider mt-1">QR MOMO</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-black transition active:scale-95 uppercase tracking-wider text-sm"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }



  return (
    <div className="w-full min-h-screen bg-gray-100 py-6 font-sans">
      <div className="max-w-[660px] mx-auto px-4 space-y-4">

        {/* Simple Navigation Header */}
        <div className="flex items-center justify-between pb-2">
          <Link to="/" className="text-blue-600 flex items-center gap-1 text-xs font-extrabold hover:underline">
            <ArrowLeft size={14} />
            <span>Mua thêm sản phẩm khác</span>
          </Link>
          <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">Giỏ hàng của bạn</span>
        </div>

        {cartItems.length === 0 ? (
          // Empty Cart View
          <div className="bg-white border border-bordercustom p-8 rounded-md w-full max-w-md mx-auto text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-md flex items-center justify-center">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-2xl font-bold text-primary text-center">Giỏ hàng đang trống</h2>
            <p className="text-xs text-gray-500 font-semibold max-w-xs leading-relaxed text-center">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy tham khảo hàng nghìn smartphone cao cấp tại trang chủ.
            </p>
            <Link
              to="/"
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-2.5 rounded transition uppercase text-xs flex items-center justify-center"
            >
              Quay lại mua sắm
            </Link>
          </div>
        ) : (
          // Main Ordering form
          <div className="space-y-4">

            {/* Card 1: Selected Products */}
            <div className="bg-white rounded-md border border-gray-100 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                <ShoppingBag className="text-blue-600 shrink-0" size={18} />
                <h2 className="text-sm font-black text-gray-900">
                  Có {cartItems.length} sản phẩm trong giỏ hàng
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    {/* Image */}
                    <div className="w-16 h-16 bg-white p-1 border border-gray-100 rounded-md shrink-0 flex justify-center items-center">
                      <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link to={`/product/${item.id}`} className="font-extrabold text-gray-900 text-xs leading-snug hover:text-blue-600 transition truncate block max-w-[120px] xs:max-w-[180px] sm:max-w-xs md:max-w-[300px]">
                            {item.name}
                          </Link>
                          <div className="text-right shrink-0">
                            <span className="font-black text-red-600 text-xs">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                            {item.originalPrice && (
                              <p className="text-[10px] text-gray-400 line-through font-semibold">{(item.originalPrice * item.quantity).toLocaleString('vi-VN')}₫</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                          Dung lượng: {item.selectedStorage || 'Standard'} | Màu: {item.selectedColor || 'Mặc định'}
                        </span>
                      </div>

                      {/* Qty selector & Delete */}
                      <div className="flex justify-between items-center mt-2 pt-1 border-t border-dashed border-gray-50">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartId)}
                          className="text-[10px] text-gray-400 hover:text-red-500 font-extrabold transition flex items-center gap-0.5"
                        >
                          <Trash2 size={11} />
                          <span>Xóa</span>
                        </button>

                        <div className="flex border border-gray-200 rounded-md overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs"
                          >-</button>
                          <span className="w-7 h-6 flex items-center justify-center text-xs font-bold bg-white border-x border-gray-200 text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold">Tạm tính:</span>
                <span className="font-black text-gray-900 text-sm">{cartTotal.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {/* Card 2: Inline Registration / Login for Guest */}
            {!isLoggedIn ? (
              <div className="bg-white rounded-md border border-blue-100 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h3 className="font-extrabold text-xs text-blue-700 uppercase tracking-wider">
                      Đăng ký thành viên PhoneShop VIP
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Đăng ký ngay để nhận ưu đãi tích điểm VIP, thanh toán COD và theo dõi đơn hàng dễ dàng.
                    </p>
                  </div>
                </div>

                {authMode === 'register' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Họ tên & SĐT</label>
                        <div className="text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex justify-between items-center">
                          <span>
                            {formData.fullName && formData.phone
                              ? `${formData.fullName} - ${formData.phone}`
                              : "Lấy từ thông tin giao nhận..."}
                          </span>
                          <button
                            type="button"
                            onClick={openAddressModal}
                            className="text-blue-600 hover:underline text-[10px]"
                          >
                            Thiết lập
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Email đăng ký *</label>
                        <input
                          type="email"
                          placeholder="nhapemail@gmail.com..."
                          value={inlineEmail}
                          onChange={(e) => setInlineEmail(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Mật khẩu đăng ký *</label>
                      <input
                        type="password"
                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                        value={inlinePassword}
                        onChange={(e) => setInlinePassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
                      />
                    </div>

                    {inlineAuthError && (
                      <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{inlineAuthError}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <button
                        type="button"
                        onClick={handleInlineRegister}
                        disabled={inlineAuthLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-md transition"
                      >
                        {inlineAuthLoading ? 'Đang xử lý...' : 'Đăng ký & Đăng nhập'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setInlineAuthError('');
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        Đăng nhập nhanh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Tên đăng nhập / Email *</label>
                        <input
                          type="text"
                          placeholder="Nhập username hoặc email..."
                          value={inlineUsername}
                          onChange={(e) => setInlineUsername(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Mật khẩu *</label>
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu..."
                          value={inlinePassword}
                          onChange={(e) => setInlinePassword(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
                        />
                      </div>
                    </div>

                    {inlineAuthError && (
                      <p className="text-red-500 text-xs font-bold flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{inlineAuthError}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <button
                        type="button"
                        onClick={handleInlineLogin}
                        disabled={inlineAuthLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-md transition"
                      >
                        {inlineAuthLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setInlineAuthError('');
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        Tạo tài khoản mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-md border border-green-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                  <span className="text-xs font-extrabold text-gray-700">
                    Thành viên VIP: <span className="text-blue-600">{currentUser?.username || 'admin'}</span>, đơn hàng của bạn sắp hoàn thành rồi
                  </span>
                </div>
              </div>
            )}

            {/* Card 3: Delivery Options & Address Preview */}
            <div className="bg-white rounded-md border border-gray-100 p-4 space-y-4">

              {/* Delivery Tabs */}
              <div className="flex bg-gray-50 rounded-md p-1 border border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('ship')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${deliveryMethod === 'ship'
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
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${deliveryMethod === 'store'
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
                <button className="text-xs font-black text-blue-600 hover:underline inline-flex items-center gap-0.5 shrink-0">
                  <Edit2 size={11} />
                  <span>{addressProvided && formData.fullName ? 'Thay đổi' : 'Cung cấp'}</span>
                </button>
              </div>

            </div>

            {/* Card 4: Support Request Checklist */}
            <div className="bg-white rounded-md border border-gray-100 p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yêu cầu hỗ trợ đặc biệt</h3>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900 select-none">
                  <input
                    type="checkbox"
                    checked={specialRequests.transferData}
                    onChange={(e) => setSpecialRequests({ ...specialRequests, transferData: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Chuyển danh bạ, sao lưu dữ liệu sang máy mới (Miễn phí)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900 select-none">
                  <input
                    type="checkbox"
                    checked={specialRequests.companyInvoice}
                    onChange={(e) => setSpecialRequests({ ...specialRequests, companyInvoice: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Yêu cầu xuất hóa đơn công ty</span>
                </label>

                {specialRequests.companyInvoice && (
                  <div className="ml-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <input
                      type="text"
                      placeholder="Tên công ty"
                      value={companyInvoiceDetails.companyName}
                      onChange={(e) => setCompanyInvoiceDetails({ ...companyInvoiceDetails, companyName: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
                    />
                    <input
                      type="text"
                      placeholder="Mã số thuế"
                      value={companyInvoiceDetails.taxCode}
                      onChange={(e) => setCompanyInvoiceDetails({ ...companyInvoiceDetails, taxCode: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
                    />
                    <input
                      type="text"
                      placeholder="Địa chỉ công ty"
                      value={companyInvoiceDetails.companyAddress}
                      onChange={(e) => setCompanyInvoiceDetails({ ...companyInvoiceDetails, companyAddress: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900 select-none">
                  <input
                    type="checkbox"
                    checked={specialRequests.otherRequest}
                    onChange={(e) => setSpecialRequests({ ...specialRequests, otherRequest: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Yêu cầu giao nhận hàng đặc biệt khác</span>
                </label>

                {specialRequests.otherRequest && (
                  <div className="ml-6 animate-in slide-in-from-top-2 duration-150">
                    <textarea
                      placeholder="Ví dụ: Giao ngoài giờ hành chính, gọi trước khi đến..."
                      value={otherRequestText}
                      onChange={(e) => setOtherRequestText(e.target.value)}
                      rows="2"
                      className="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 resize-none text-gray-800"
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            {/* Card 5: Voucher discount selector */}
            <div className="bg-white rounded-md border border-gray-100 p-4">
              <PromotionSelector
                subTotal={cartTotal}
                onApplyPromotion={(code, discount) => {
                  setAppliedPromo(code);
                  setDiscountAmount(discount);
                }}
              />
            </div>



            {/* Card 7: Payment Methods */}
            <div className="bg-white rounded-md border border-gray-100 p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hình thức thanh toán</h3>
              <div className="space-y-2">

                {/* Stripe */}
                <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${paymentMethod === 'stripe' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs flex-1">
                    <p className="font-bold text-gray-800">Thanh toán qua cổng Stripe</p>
                    <p className="text-[10px] text-gray-400">Hỗ trợ thẻ quốc tế Visa, Mastercard, JCB</p>
                  </div>
                  <CreditCard size={16} className="text-gray-400" />
                </label>

                {/* MoMo */}
                <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${paymentMethod === 'momo' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={() => setPaymentMethod('momo')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs flex-1">
                    <p className="font-bold text-gray-800">Thanh toán qua ví điện tử MoMo</p>
                    <p className="text-[10px] text-gray-400">Quét mã QR thanh toán nhanh chóng bằng ví MoMo</p>
                  </div>
                  <span className="w-6 h-6 bg-[#A50064] text-white text-[8px] font-black rounded flex items-center justify-center select-none shrink-0">MoMo</span>
                </label>

                {/* Bank transfer */}
                <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${paymentMethod === 'transfer' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs flex-1">
                    <p className="font-bold text-gray-800">Chuyển khoản ngân hàng trực tuyến</p>
                    <p className="text-[10px] text-gray-400">Đăng ký duyệt nhanh, giảm thêm 100,000₫</p>
                  </div>
                  <CreditCard size={16} className="text-gray-400" />
                </label>

                {/* COD (requires login) */}
                <label className={`flex items-center gap-3 p-3 border rounded-md transition select-none ${!isLoggedIn
                  ? 'opacity-50 bg-gray-50 border-gray-100 cursor-not-allowed'
                  : paymentMethod === 'cod'
                    ? 'border-blue-500 bg-blue-50/20 cursor-pointer'
                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    disabled={!isLoggedIn}
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="text-xs flex-1">
                    <p className="font-bold text-gray-800">Thanh toán tiền mặt khi nhận hàng (COD)</p>
                    <p className="text-[10px] text-gray-400">Chỉ áp dụng cho thành viên PhoneShop VIP</p>
                  </div>
                  <Truck size={16} className="text-gray-400" />
                </label>

                {!isLoggedIn && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-md flex gap-2 text-amber-800 text-[10px] font-medium leading-relaxed">
                    <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p>
                      Hình thức <strong>Thanh toán tiền mặt (COD)</strong> bị khóa vì quý khách đang đặt dưới dạng khách vãng lai. Vui lòng đăng ký/đăng nhập VIP để kích hoạt.
                    </p>
                  </div>
                )}
              </div>

              {/* Bank Transfer QR details */}
              {paymentMethod === 'transfer' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-xs space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="font-black text-blue-600 uppercase tracking-widest text-[9px]">Thông tin chuyển khoản nhanh</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full space-y-1.5 font-semibold text-gray-700">
                      <p className="flex justify-between border-b border-gray-200 pb-1">Ngân hàng: <span className="font-bold text-gray-900">MB BANK (Quân Đội)</span></p>
                      <p className="flex justify-between border-b border-gray-200 pb-1">Chủ tài khoản: <span className="font-bold text-gray-900 uppercase">PHONESHOP OFFICIAL</span></p>
                      <p className="flex justify-between border-b border-gray-200 pb-1">Số tài khoản: <span className="font-bold text-blue-600 tracking-wider">098 7654 3210</span></p>
                      <p className="flex justify-between pt-1">Số tiền chuyển: <span className="font-black text-red-600 text-sm">{(finalTotalPay).toLocaleString('vi-VN')}₫</span></p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2.5 bg-white border border-gray-200 rounded-md shrink-0">
                      <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center text-gray-300">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm1 1v4h4V4H4zm1 1h2v2H5V5zM3 15h6v6H3v-6zm1 1v4h4v-4H4zm1 1h2v2H5v-2zM15 3h6v6h-6V3zm1 1v4h4V4h-4zm1 1h2v2h-2V5zM15 15h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 2v2h-2v-2zm2 0h2v2h-2v-2zM10 3h4v2h-4V3zm0 4h4v2h-4V7zm0 8h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z" /></svg>
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1">Mã QR</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 8: Total summary and checkout button */}
            <div className="bg-white rounded-md border border-gray-100 p-4 md:p-6 space-y-4">
              {isLoggedIn && currentUser && (
                <div className="flex items-center justify-between p-3.5 bg-yellow-50/50 border border-yellow-100/70 rounded-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-white select-none shrink-0">
                      <Gift size={15} className="fill-current" />
                    </div>
                    <div className="text-xs">
                      <p className="font-extrabold text-gray-800">Dùng điểm Quà Tặng VIP</p>
                      <p className="text-[10px] text-gray-400 font-bold">Điểm khả dụng: <span className="text-yellow-600 font-extrabold">{currentUser.rewardPoints?.toLocaleString('vi-VN')}</span></p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
              )}

              <div className="space-y-2 text-xs font-semibold text-gray-500 uppercase tracking-tighter">
                <div className="flex justify-between">
                  <span>Tạm tính ({cartItems.length} sản phẩm)</span>
                  <span className="text-gray-900 font-bold">{cartTotal.toLocaleString('vi-VN')}₫</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Mã giảm giá ({appliedPromo})</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                {usePoints && pointsDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Quy đổi điểm VIP</span>
                    <span>-{pointsDiscount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Phí vận chuyển {shippingCarrier && `(${shippingCarrier})`}</span>
                  <span>
                    {shippingLoading ? (
                      <span className="text-gray-400 italic">Đang tính...</span>
                    ) : deliveryMethod === 'store' ? (
                      <span className="text-green-600 font-bold">Miễn phí</span>
                    ) : shippingFee > 0 ? (
                      <span className="text-gray-900 font-bold">{shippingFee.toLocaleString('vi-VN')}₫</span>
                    ) : (
                      <span className="text-green-600 font-bold">Miễn phí</span>
                    )}
                  </span>
                </div>
                {deliveryMethod === 'ship' && shippingEstimatedDays && (
                  <div className="flex justify-between text-[11px] text-gray-400 font-medium normal-case">
                    <span>Thời gian giao hàng dự kiến</span>
                    <span>{shippingEstimatedDays}</span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-dashed border-gray-100 items-center">
                  <span className="text-xs font-black text-gray-900">Tổng tiền</span>
                  <span className="text-lg font-black text-red-600 tracking-tight">{finalTotalPay.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                  <span>Điểm tích lũy Quà Tặng VIP</span>
                  <span className="font-bold text-gray-700">{(Math.floor(finalTotalPay * 0.002)).toLocaleString('vi-VN')} điểm</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleCheckoutSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-md font-black transition active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 group cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>ĐANG XỬ LÝ...</span>
                  </>
                ) : (
                  <>
                    <span>Đặt hàng ngay</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-[9px] text-center text-gray-400 font-medium">
                Bằng cách đặt hàng, quý khách đồng ý với các Điều khoản & Chính sách giao nhận của PhoneShop.
              </p>
            </div>

          </div>
        )}

      </div>

      {/* Address Information Modal */}
      {showAddressModal && (
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
                className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs font-semibold text-gray-700">

              {/* Gender Radio */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Danh xưng *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="modalGender"
                      checked={modalGender === 'Anh'}
                      onChange={() => setModalGender('Anh')}
                      className="w-4 h-4 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Anh</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
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

              {/* Name & Phone - MOBILE: Stacked grid, DESKTOP: 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Họ và Tên *</label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn A..."
                    value={modalFullName}
                    onChange={(e) => setModalFullName(e.target.value)}
                    className={`w-full bg-gray-50 border ${validationErrors.fullName ? 'border-red-500' : 'border-gray-200'} rounded-md px-3 py-2 font-bold focus:outline-none focus:border-blue-500`}
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
                    className={`w-full bg-gray-50 border ${validationErrors.phone ? 'border-red-500' : 'border-gray-200'} rounded-md px-3 py-2 font-bold focus:outline-none focus:border-blue-500`}
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

                  {/* City & Ward - MOBILE: Stacked grid, DESKTOP: 2 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Số nhà, tên đường *</label>
                      <input
                        type="text"
                        placeholder="Số nhà, tên đường..."
                        value={modalStreetAddress}
                        onChange={(e) => setModalStreetAddress(e.target.value)}
                        className={`w-full bg-gray-50 border ${validationErrors.streetAddress ? 'border-red-500' : 'border-gray-200'} rounded-md px-3 py-2 font-bold focus:outline-none focus:border-blue-500`}
                      />
                      {validationErrors.streetAddress && <p className="text-red-500 text-[9px] font-medium">{validationErrors.streetAddress}</p>}
                    </div>
                  </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-150 rounded-md animate-in slide-in-from-top-2 duration-150">
                    {/* Someone else picking up - MOBILE: Stacked grid, DESKTOP: 2 columns */}
                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold text-gray-400 uppercase">Họ tên người nhận hộ *</label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn B..."
                        value={modalSomeoneElseName}
                        onChange={(e) => setModalSomeoneElseName(e.target.value)}
                        className={`w-full bg-white border ${validationErrors.someoneElseName ? 'border-red-500' : 'border-gray-200'} rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-500`}
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
                        className={`w-full bg-white border ${validationErrors.someoneElsePhone ? 'border-red-500' : 'border-gray-200'} rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-500`}
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
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-black rounded-md text-xs transition active:scale-95 uppercase tracking-wider"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmAddress}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-md text-xs transition active:scale-95 uppercase tracking-wider"
              >
                Xác nhận
              </button>
            </div>

          </div>
        </div>
      )}



    </div>
  );
}
