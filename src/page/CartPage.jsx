// src/page/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { shippingInfoService } from '../services/shippingInfoService';
import { orderService } from '../services/orderService';
import api from '../services/api';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

// Subcomponents
import CartItemsList from './cart/components/CartItemsList';
import CartAuthSection from './cart/components/CartAuthSection';
import CartDeliveryForm from './cart/components/CartDeliveryForm';
import CartAddressModal from './cart/components/CartAddressModal';
import CartSpecialRequests from './cart/components/CartSpecialRequests';
import CartSummaryPayment from './cart/components/CartSummaryPayment';
import CartSuccessScreen from './cart/components/CartSuccessScreen';

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
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // default 'stripe'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Success screen state
  const [isFinished, setIsFinished] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [orderSuccessTotal, setOrderSuccessTotal] = useState(0);

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
      const baseUsername = emailToUse.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedUsername = `${baseUsername}_${randSuffix}`;

      await authService.register({
        username: generatedUsername,
        email: emailToUse,
        password: inlinePassword
      });

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

  // Submit Order Checkout
  const handleCheckoutSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!addressProvided || !formData.fullName || !formData.phone) {
      alert("Vui lòng cung cấp thông tin người nhận và địa chỉ trước khi đặt hàng.");
      openAddressModal();
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isLoggedIn) {
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
        paymentMethod: paymentMethod,
        items: cartItems.map(item => ({
          productId: item.id || item.Id,
          storage: item.selectedStorage || '',
          color: item.selectedColor || '',
          quantity: item.quantity,
          price: item.price
        }))
      };

      const syncItems = [];
      await Promise.all(cartItems.map(async (item) => {
        const productId = item.id || item.Id;
        if (!productId) return;

        try {
          const variants = await api.get(`/ProductVariant?productId=${productId}`);
          let matchedVariant = null;

          if (Array.isArray(variants) && variants.length > 0) {
            matchedVariant = variants.find(v => {
              if (!v.name) return false;
              let parsedAttrs = {};
              if (v.attributes) {
                try {
                  parsedAttrs = JSON.parse(v.attributes);
                } catch (e) {
                  console.error("Lỗi parse attributes:", e);
                }
              }
              
              if (Object.keys(parsedAttrs).length === 0 && v.name.includes(' - ')) {
                const parts = v.name.split(' - ');
                if (parts.length > 1) {
                  parsedAttrs["Dung lượng RAM - ROM"] = parts[1].trim();
                }
                if (parts.length > 2) {
                  parsedAttrs["Màu sắc"] = parts[2].trim();
                }
              }

              const cleanString = (str) => {
                if (!str) return '';
                return String(str).toLowerCase().replace(/[\s-]/g, '');
              };

              const colorMatch = !item.selectedColor || 
                Object.entries(parsedAttrs).some(([k, val]) => 
                  (k.toLowerCase().includes('màu') || k.toLowerCase().includes('color')) && 
                  cleanString(val) === cleanString(item.selectedColor)
                ) || 
                cleanString(v.name).includes(cleanString(item.selectedColor));

              const storageMatch = !item.selectedStorage || 
                Object.entries(parsedAttrs).some(([k, val]) => 
                  (k.toLowerCase().includes('dung lượng') || k.toLowerCase().includes('bộ nhớ') || k.toLowerCase().includes('ram') || k.toLowerCase().includes('rom') || k.toLowerCase().includes('storage')) && 
                  cleanString(val) === cleanString(item.selectedStorage)
                ) || 
                cleanString(v.name).includes(cleanString(item.selectedStorage));

              return colorMatch && storageMatch;
            });
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

      await api.post('/Cart/sync', syncItems);

      const checkoutRes = await orderService.checkout(payload);

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
      clearCart();

      // Xử lý chuyển hướng cổng thanh toán online
      if (paymentMethod === 'stripe' || paymentMethod === 'momo') {
        try {
          const paymentRes = await api.post(`/Payment/create-checkout-session/${newOrderId}?provider=${paymentMethod}`);
          const paymentUrl = paymentRes?.url || paymentRes?.Url;
          if (paymentUrl) {
            window.location.href = paymentUrl;
            return;
          } else {
            throw new Error("Không nhận được đường dẫn thanh toán từ Server.");
          }
        } catch (payErr) {
          console.error("Lỗi khởi tạo cổng thanh toán online:", payErr);
          alert("Đơn hàng đã được tạo thành công! Tuy nhiên, không thể kết nối tới cổng thanh toán trực tuyến. Quý khách vui lòng thực hiện chuyển khoản hoặc liên hệ CSKH.");
        }
      }

      setIsFinished(true);
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

  const userPoints = currentUser?.rewardPoints || 0;
  const pointsDiscount = usePoints ? Math.min(userPoints, cartTotal - discountAmount) : 0;
  const finalTotalPay = Math.max(0, cartTotal - discountAmount - pointsDiscount + shippingFee);

  // Render Success Screen
  if (isFinished) {
    return (
      <CartSuccessScreen
        orderCode={orderCode}
        paymentMethod={paymentMethod}
        finalTotalPay={orderSuccessTotal}
        navigate={navigate}
      />
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
          <div className="bg-white border border-gray-150 p-8 rounded-md w-full max-w-md mx-auto text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-2xl font-bold text-blue-600 text-center">Giỏ hàng đang trống</h2>
            <p className="text-xs text-gray-500 font-semibold max-w-xs leading-relaxed text-center">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy tham khảo hàng nghìn smartphone cao cấp tại trang chủ.
            </p>
            <Link
              to="/"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded transition uppercase text-xs flex items-center justify-center"
            >
              Quay lại mua sắm
            </Link>
          </div>
        ) : (
          // Main Ordering form
          <div className="space-y-4">

            {/* Card 1: Selected Products */}
            <CartItemsList
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              cartTotal={cartTotal}
            />

            {/* Card 2: Inline Registration / Login for Guest */}
            <CartAuthSection
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              authMode={authMode}
              setAuthMode={setAuthMode}
              formData={formData}
              openAddressModal={openAddressModal}
              inlineEmail={inlineEmail}
              setInlineEmail={setInlineEmail}
              inlineUsername={inlineUsername}
              setInlineUsername={setInlineUsername}
              inlinePassword={inlinePassword}
              setInlinePassword={setInlinePassword}
              inlineAuthError={inlineAuthError}
              inlineAuthLoading={inlineAuthLoading}
              handleInlineRegister={handleInlineRegister}
              handleInlineLogin={handleInlineLogin}
            />

            {/* Card 3: Delivery Options & Address Preview */}
            <CartDeliveryForm
              deliveryMethod={deliveryMethod}
              setDeliveryMethod={setDeliveryMethod}
              addressProvided={addressProvided}
              formData={formData}
              openAddressModal={openAddressModal}
            />

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
                <label className="flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none border-blue-500 bg-blue-50/20">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={true}
                    readOnly
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs flex-1">
                    <p className="font-bold text-gray-800">Thanh toán qua cổng Stripe</p>
                    <p className="text-[10px] text-gray-400">Hỗ trợ thẻ quốc tế Visa, Mastercard, JCB</p>
                  </div>
                  <CreditCard size={16} className="text-gray-400" />
                </label>

              </div>
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
      <CartAddressModal
        showAddressModal={showAddressModal}
        setShowAddressModal={setShowAddressModal}
        deliveryMethod={deliveryMethod}
        modalGender={modalGender}
        setModalGender={setModalGender}
        modalFullName={modalFullName}
        setModalFullName={setModalFullName}
        modalPhone={modalPhone}
        setModalPhone={setModalPhone}
        modalEmail={modalEmail}
        setModalEmail={setModalEmail}
        provinces={provinces}
        selectedProvinceId={selectedProvinceId}
        handleProvinceChange={handleProvinceChange}
        wards={wards}
        modalWardId={modalWardId}
        handleWardChange={handleWardChange}
        modalStreetAddress={modalStreetAddress}
        setModalStreetAddress={setModalStreetAddress}
        modalSomeoneElse={modalSomeoneElse}
        setModalSomeoneElse={setModalSomeoneElse}
        modalSomeoneElseName={modalSomeoneElseName}
        setModalSomeoneElseName={setModalSomeoneElseName}
        modalSomeoneElsePhone={modalSomeoneElsePhone}
        setModalSomeoneElsePhone={setModalSomeoneElsePhone}
        validationErrors={validationErrors}
        confirmAddress={confirmAddress}
      />

    </div>
  );
}
