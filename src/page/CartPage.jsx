// src/page/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { shippingInfoService } from '../services/shippingInfoService';
import { orderService } from '../services/orderService';
import api from '../services/api';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { ArrowLeft, ShoppingBag, X, AlertTriangle } from 'lucide-react';

// Subcomponents
import CartItemsList from './cart/components/CartItemsList';
import CartAuthSection from './cart/components/CartAuthSection';
import CartDeliveryForm from './cart/components/CartDeliveryForm';
import CartAddressModal from './cart/components/CartAddressModal';
import CartSpecialRequests from './cart/components/CartSpecialRequests';
import CartSummaryPayment from './cart/components/CartSummaryPayment';
import CartPaymentMethods from './cart/components/CartPaymentMethods';
import CartSuccessScreen from './cart/components/CartSuccessScreen';
import PromotionSelector from '../components/PromotionSelector';
import CoPurchaseRecommendation from './product-detail/components/CoPurchaseRecommendation';
import EmailVerificationModal from '../components/auth/EmailVerificationModal';

export default function CartPage() {
  // Khai báo giải nén các thuộc tính/hàm (stopLoading) từ Hook / Context / Props
  const { stopLoading } = useLoading();
  // Khai báo giải nén các thuộc tính/hàm (cartItems, updateQuantity, removeFromCart, cartTotal, clearCart) từ Hook / Context / Props
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  // Hook điều hướng trang (useNavigate) để chuyển hướng Route
  const navigate = useNavigate();

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  // State: currentUser - Quản lý trạng thái và dữ liệu của currentUser trong giao diện
  const [currentUser, setCurrentUser] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Stop loading on mount/data loaded
  useEffect(() => {
    if (!isLoggedIn) {
      stopLoading();
    } else {
      Promise.all([
        userService.getProfile().catch(() => null),
        shippingInfoService.getAll().catch(() => [])
      ]).finally(() => {
        stopLoading();
      });
    }
  }, [isLoggedIn, stopLoading]);

  // Load user profile on mount & when login state changes
  useEffect(() => {
    if (isLoggedIn) {
      userService.getProfile()
        .then(res => {
          if (res) {
            setCurrentUser(res);
            localStorage.setItem('user', JSON.stringify(res));
            if (res.email) {
              setFormData(prev => ({ ...prev, email: res.email }));
            }
          }
        })
        .catch(err => {
          console.error("Lỗi lấy thông tin profile:", err);
          // Khai báo biến/hằng số: userJson - Dùng trong logic xử lý của component
          const userJson = localStorage.getItem('user');
          if (userJson && userJson !== 'undefined' && userJson !== 'null') {
            try {
              const u = JSON.parse(userJson);
              setCurrentUser(u);
              if (u?.email) {
                setFormData(prev => ({ ...prev, email: u.email }));
              }
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
  // State: inlineUsername - Quản lý trạng thái và dữ liệu của inlineUsername trong giao diện
  const [inlineUsername, setInlineUsername] = useState('');
  // State: inlinePassword - Quản lý trạng thái và dữ liệu của inlinePassword trong giao diện
  const [inlinePassword, setInlinePassword] = useState('');
  // State: inlineAuthLoading - Quản lý trạng thái và dữ liệu của inlineAuthLoading trong giao diện
  const [inlineAuthLoading, setInlineAuthLoading] = useState(false);
  // State: inlineAuthError - Quản lý trạng thái và dữ liệu của inlineAuthError trong giao diện
  const [inlineAuthError, setInlineAuthError] = useState('');
  // State: authMode - Quản lý trạng thái và dữ liệu của authMode trong giao diện
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  // State: showAuthModal - Quản lý trạng thái và dữ liệu của showAuthModal trong giao diện
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Delivery configuration states
  const [deliveryMethod, setDeliveryMethod] = useState('ship'); // 'ship' | 'store'
  // State: addressProvided - Quản lý trạng thái và dữ liệu của addressProvided trong giao diện
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
    wardId: '',
    deliveryLatitude: null,
    deliveryLongitude: null
  });

  // Modal temporary inputs
  const [modalGender, setModalGender] = useState('Anh');
  // State: modalFullName - Quản lý trạng thái và dữ liệu của modalFullName trong giao diện
  const [modalFullName, setModalFullName] = useState('');
  // State: modalPhone - Quản lý trạng thái và dữ liệu của modalPhone trong giao diện
  const [modalPhone, setModalPhone] = useState('');
  // State: modalEmail - Quản lý trạng thái và dữ liệu của modalEmail trong giao diện
  const [modalEmail, setModalEmail] = useState('');
  // State: modalCity - Quản lý trạng thái và dữ liệu của modalCity trong giao diện
  const [modalCity, setModalCity] = useState('Hồ Chí Minh');
  // State: modalWard - Quản lý trạng thái và dữ liệu của modalWard trong giao diện
  const [modalWard, setModalWard] = useState('');
  // State: modalStreetAddress - Quản lý trạng thái và dữ liệu của modalStreetAddress trong giao diện
  const [modalStreetAddress, setModalStreetAddress] = useState('');
  // State: modalSomeoneElse - Quản lý trạng thái và dữ liệu của modalSomeoneElse trong giao diện
  const [modalSomeoneElse, setModalSomeoneElse] = useState(false);
  // State: modalSomeoneElseName - Quản lý trạng thái và dữ liệu của modalSomeoneElseName trong giao diện
  const [modalSomeoneElseName, setModalSomeoneElseName] = useState('');
  // State: modalSomeoneElsePhone - Quản lý trạng thái và dữ liệu của modalSomeoneElsePhone trong giao diện
  const [modalSomeoneElsePhone, setModalSomeoneElsePhone] = useState('');
  // State: modalLatitude - Quản lý trạng thái và dữ liệu của modalLatitude trong giao diện
  const [modalLatitude, setModalLatitude] = useState(null);
  // State: modalLongitude - Quản lý trạng thái và dữ liệu của modalLongitude trong giao diện
  const [modalLongitude, setModalLongitude] = useState(null);
  // State: pendingWardName - Quản lý trạng thái và dữ liệu của pendingWardName trong giao diện
  const [pendingWardName, setPendingWardName] = useState('');
  // State: pendingWardId - Quản lý trạng thái và dữ liệu của pendingWardId trong giao diện
  const [pendingWardId, setPendingWardId] = useState('');

  // Location list states from SQL Server
  const [provinces, setProvinces] = useState([]);
  // State: wards - Quản lý trạng thái và dữ liệu của wards trong giao diện
  const [wards, setWards] = useState([]);
  // State: selectedProvinceId - Quản lý trạng thái và dữ liệu của selectedProvinceId trong giao diện
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  // State: modalWardId - Quản lý trạng thái và dữ liệu của modalWardId trong giao diện
  const [modalWardId, setModalWardId] = useState('');

  // Modal toggle states
  const [showAddressModal, setShowAddressModal] = useState(false);
  // State: showCodLimitModal - Quản lý trạng thái và dữ liệu của showCodLimitModal trong giao diện
  const [showCodLimitModal, setShowCodLimitModal] = useState(false);

  // Special Request configuration
  const [specialRequests, setSpecialRequests] = useState({
    transferData: false,
    companyInvoice: false,
    otherRequest: false
  });
  // State: otherRequestText - Quản lý trạng thái và dữ liệu của otherRequestText trong giao diện
  const [otherRequestText, setOtherRequestText] = useState('');
  // State: companyInvoiceDetails - Quản lý trạng thái và dữ liệu của companyInvoiceDetails trong giao diện
  const [companyInvoiceDetails, setCompanyInvoiceDetails] = useState({
    companyName: '',
    taxCode: '',
    companyAddress: ''
  });

  // Loyalty and promotion calculation
  const [appliedPromo, setAppliedPromo] = useState('');
  // State: discountAmount - Quản lý trạng thái và dữ liệu của discountAmount trong giao diện
  const [discountAmount, setDiscountAmount] = useState(0);
  // State: usePoints - Quản lý trạng thái và dữ liệu của usePoints trong giao diện
  const [usePoints, setUsePoints] = useState(false);

  // Dynamic Shipping Fee states
  const [shippingFee, setShippingFee] = useState(0);
  // State: shippingCarrier - Quản lý trạng thái và dữ liệu của shippingCarrier trong giao diện
  const [shippingCarrier, setShippingCarrier] = useState('');
  // State: shippingEstimatedDays - Quản lý trạng thái và dữ liệu của shippingEstimatedDays trong giao diện
  const [shippingEstimatedDays, setShippingEstimatedDays] = useState('');
  // State: shippingLoading - Quản lý trạng thái và dữ liệu của shippingLoading trong giao diện
  const [shippingLoading, setShippingLoading] = useState(false);
  // State: shippingOptions - Quản lý trạng thái và dữ liệu của shippingOptions trong giao diện
  const [shippingOptions, setShippingOptions] = useState([]);

  // Effect to calculate shipping fee dynamically
  useEffect(() => {
    if (deliveryMethod === 'ship' && formData.wardId) {
      setShippingLoading(true);
      api.post('/Shipping/calculate-fee', {
        wardId: formData.wardId,
        totalWeightKg: 1.0,
        latitude: formData.deliveryLatitude,
        longitude: formData.deliveryLongitude,
        addressLine: formData.streetAddress || formData.address
      })
        .then(res => {
          if (res) {
            const options = res.options || res.Options || [];
            setShippingOptions(options);

            if (options.length > 0) {
              const currentOrStd = options.find(o => (o.carrier || o.Carrier) === shippingCarrier) ||
                                  options.find(o => (o.carrier || o.Carrier) === 'Giao Hàng Tiêu Chuẩn') ||
                                  [...options].sort((a, b) => (Number(a.fee || a.Fee || 0)) - (Number(b.fee || b.Fee || 0)))[0];
              setShippingFee(Number(currentOrStd.fee || currentOrStd.Fee || 0));
              setShippingCarrier(currentOrStd.carrier || currentOrStd.Carrier || '');
              setShippingEstimatedDays(currentOrStd.estimatedDeliveryDays || currentOrStd.EstimatedDeliveryDays || '');
            } else {
              setShippingFee(Number(res.fee || res.Fee || 0));
              setShippingCarrier(res.carrier || res.Carrier || 'Giao Hàng Tiêu Chuẩn');
              setShippingEstimatedDays(res.estimatedDeliveryDays || res.EstimatedDeliveryDays || '2-3 ngày');
            }
          }
        })
        .catch(err => {
          console.error("Lỗi tính phí vận chuyển:", err);
          const isHcmCity = formData.city && (formData.city.includes('Hồ Chí Minh') || formData.city.includes('HCM'));
          const fallbackFee = isHcmCity ? 28000 : 45000;
          const fallbackDays = isHcmCity ? '1-2 ngày' : '3-5 ngày';
          const fallbackOption = { Fee: fallbackFee, Carrier: 'Giao Hàng Tiêu Chuẩn', EstimatedDeliveryDays: fallbackDays };
          setShippingOptions([fallbackOption]);
          setShippingFee(fallbackFee);
          setShippingCarrier('Giao Hàng Tiêu Chuẩn');
          setShippingEstimatedDays(fallbackDays);
        })
        .finally(() => {
          setShippingLoading(false);
        });
    } else {
      setShippingOptions([]);
      setShippingFee(0);
      setShippingCarrier('');
      setShippingEstimatedDays('');
    }
  }, [formData.wardId, deliveryMethod, formData.deliveryLatitude, formData.deliveryLongitude, formData.streetAddress, formData.city]);

  // Form submission state
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // default 'stripe'
  // State: installmentMonths - Quản lý trạng thái và dữ liệu của installmentMonths trong giao diện
  const [installmentMonths, setInstallmentMonths] = useState(6);
  // State: isSubmitting - Quản lý trạng thái và dữ liệu của isSubmitting trong giao diện
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Success screen state
  const [isFinished, setIsFinished] = useState(false);
  // State: orderCode - Quản lý trạng thái và dữ liệu của orderCode trong giao diện
  const [orderCode, setOrderCode] = useState('');
  // State: orderSuccessTotal - Quản lý trạng thái và dữ liệu của orderSuccessTotal trong giao diện
  const [orderSuccessTotal, setOrderSuccessTotal] = useState(0);

  // Address Book states
  const [userAddresses, setUserAddresses] = useState([]);
  // State: saveToAddressBook - Quản lý trạng thái và dữ liệu của saveToAddressBook trong giao diện
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Danh sách Tỉnh/Thành phố dự phòng sẵn sàng cho khách vãng lai nếu kết nối chậm
  const DEFAULT_PROVINCES = [
    { id: '79', name: 'Hồ Chí Minh', fullName: 'Thành phố Hồ Chí Minh' },
    { id: '01', name: 'Hà Nội', fullName: 'Thành phố Hà Nội' },
    { id: '48', name: 'Đà Nẵng', fullName: 'Thành phố Đà Nẵng' },
    { id: '74', name: 'Bình Dương', fullName: 'Tỉnh Bình Dương' },
    { id: '75', name: 'Đồng Nai', fullName: 'Tỉnh Đồng Nai' },
    { id: '92', name: 'Cần Thơ', fullName: 'Thành phố Cần Thơ' },
    { id: '31', name: 'Hải Phòng', fullName: 'Thành phố Hải Phòng' },
    { id: '49', name: 'Quảng Nam', fullName: 'Tỉnh Quảng Nam' },
    { id: '35', name: 'Ninh Bình', fullName: 'Tỉnh Ninh Bình' },
    { id: '68', name: 'Lâm Đồng', fullName: 'Tỉnh Lâm Đồng' },
    { id: '77', name: 'Bà Rịa - Vũng Tàu', fullName: 'Tỉnh Bà Rịa - Vũng Tàu' },
    { id: '80', name: 'Long An', fullName: 'Tỉnh Long An' },
    { id: '82', name: 'Tiền Giang', fullName: 'Tỉnh Tiền Giang' },
    { id: '86', name: 'Vĩnh Long', fullName: 'Tỉnh Vĩnh Long' },
    { id: '89', name: 'An Giang', fullName: 'Tỉnh An Giang' }
  ];

  // Fetch provinces list on mount and whenever address modal opens
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await api.get('/Location/provinces');
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          setProvinces(list);
          return;
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách tỉnh/thành:", err);
      }
      setProvinces(prev => prev.length > 0 ? prev : DEFAULT_PROVINCES);
    };

    loadProvinces();
  }, [showAddressModal]);

  // Fetch wards when selectedProvinceId changes
  useEffect(() => {
    if (selectedProvinceId) {
      api.get(`/Location/provinces/${selectedProvinceId}/wards`)
        .then(res => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          setWards(Array.isArray(list) ? list : []);
        })
        .catch(err => {
          console.error("Lỗi lấy danh sách phường/xã:", err);
          setWards([]);
        });
    } else {
      setWards([]);
    }
  }, [selectedProvinceId]);

  // Tự động tìm phường/xã khớp sau khi danh sách wards tải xong
  useEffect(() => {
    if (wards.length > 0 && (pendingWardId || pendingWardName)) {
      // Hàm thực thi logic: cleanNameStr
      const cleanNameStr = (str) => String(str).toLowerCase().replace(/^(phường|xã|thị trấn|p\.?)\s+/i, '').trim();
      // Khai báo biến/hằng số: targetName - Dùng trong logic xử lý của component
      const targetName = cleanNameStr(pendingWardName);

      // Hàm thực thi logic: matchedWard
      const matchedWard = (pendingWardId && wards.find(w => String(w.id) === String(pendingWardId))) ||
        wards.find(w => {
          if (!targetName) return false;
          // Khai báo biến/hằng số: wName - Dùng trong logic xử lý của component
          const wName = cleanNameStr(w.fullName || w.name);
          return wName === targetName || wName.includes(targetName) || targetName.includes(wName);
        });

      if (matchedWard) {
        setModalWardId(matchedWard.id);
        setModalWard(matchedWard.fullName || matchedWard.name);
      }
      setPendingWardId('');
      setPendingWardName('');
    }
  }, [wards, pendingWardId, pendingWardName]);

  // Hàm xử lý logic/sự kiện: handleSelectGoongAddress
  const handleSelectGoongAddress = (locationData) => {
    // Khai báo giải nén các thuộc tính/hàm (formattedAddress, lat, lng, compound) từ Hook / Context / Props
    const { formattedAddress, lat, lng, compound } = locationData;

    setModalLatitude(lat);
    setModalLongitude(lng);

    if (compound) {
      // 1. Khớp Tỉnh / Thành phố
      if (compound.province && provinces.length > 0) {
        // Hàm thực thi logic: cleanProvinceStr
        const cleanProvinceStr = (str) => String(str).toLowerCase().replace(/^(tỉnh|thành phố|tp\.?)\s+/i, '').trim();
        // Khai báo biến/hằng số: goongProvName - Dùng trong logic xử lý của component
        const goongProvName = cleanProvinceStr(compound.province);
        // Hàm thực thi logic: matchedProv
        const matchedProv = provinces.find(p => {
          // Khai báo biến/hằng số: pName - Dùng trong logic xử lý của component
          const pName = cleanProvinceStr(p.fullName || p.name);
          return pName.includes(goongProvName) || goongProvName.includes(pName);
        });

        if (matchedProv) {
          // Chỉ đổi tỉnh (và reset phường/xã) nếu tỉnh mới khác tỉnh đang chọn
          if (String(matchedProv.id) !== String(selectedProvinceId)) {
            handleProvinceChange(matchedProv.id);

            // 2. Lưu lại tên phường/xã để so khớp khi API tải xong wards của tỉnh mới
            if (compound.commune) {
              setPendingWardName(compound.commune);
            }
          } else {
            // Nếu trùng tỉnh, cố gắng khớp ward mới từ Goong.
            // Nếu không tìm thấy khớp hoặc commune trống, giữ nguyên ward người dùng đã chọn thay vì reset!
            if (compound.commune) {
              // Hàm thực thi logic: cleanNameStr
              const cleanNameStr = (str) => String(str).toLowerCase().replace(/^(phường|xã|thị trấn|p\.?)\s+/i, '').trim();
              // Khai báo biến/hằng số: targetName - Dùng trong logic xử lý của component
              const targetName = cleanNameStr(compound.commune);
              // Hàm thực thi logic: matchedWard
              const matchedWard = wards.find(w => {
                // Khai báo biến/hằng số: wName - Dùng trong logic xử lý của component
                const wName = cleanNameStr(w.fullName || w.name);
                return wName === targetName || wName.includes(targetName) || targetName.includes(wName);
              });
              if (matchedWard) {
                setModalWardId(matchedWard.id);
                setModalWard(matchedWard.fullName || matchedWard.name);
              }
            }
          }
        }
      }
    }

    if (formattedAddress) {
      // Khai báo biến/hằng số: parts - Dùng trong logic xử lý của component
      const parts = formattedAddress.split(',');
      if (parts.length > 0) {
        setModalStreetAddress(parts[0].trim());
      } else {
        setModalStreetAddress(formattedAddress);
      }
    }
  };

  // Hàm xử lý logic/sự kiện: handleSelectSavedAddress
  const handleSelectSavedAddress = async (addr) => {
    if (addr?.id || addr?.Id) {
      sessionStorage.setItem('selectedShippingAddressId', String(addr.id || addr.Id));
    }
    // Khai báo biến/hằng số: recipient - Dùng trong logic xử lý của component
    const recipient = addr.recipientName || '';
    // Khai báo biến/hằng số: phoneNum - Dùng trong logic xử lý của component
    const phoneNum = addr.phoneNumber || '';
    // Khai báo biến/hằng số: street - Dùng trong logic xử lý của component
    const street = addr.addressLine || '';
    let lat = addr.latitude || null;
    let lng = addr.longitude || null;

    setModalFullName(recipient);
    setModalPhone(phoneNum);
    setModalStreetAddress(street);

    // Nếu địa chỉ chưa có tọa độ trong DB → tự động geocode bằng Goong Maps
    if (!lat || !lng) {
      setModalLatitude(null);
      setModalLongitude(null);
      // Khai báo biến/hằng số: goongApiKey - Dùng trong logic xử lý của component
      const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || '';
      if (goongApiKey && street) {
        try {
          // Khai báo biến/hằng số: fullAddr - Dùng trong logic xử lý của component
          const fullAddr = [street, addr.wardName || addr.ward || '', addr.provinceName || addr.province || ''].filter(Boolean).join(', ');
          // Khai báo biến/hằng số: searchRes - Dùng trong logic xử lý của component
          const searchRes = await fetch(`https://rsapi.goong.io/Place/Autocomplete?input=${encodeURIComponent(fullAddr)}&api_key=${goongApiKey}&limit=1`);
          // Cấu hình/Hằng số/Dịch vụ dữ liệu: searchData
          const searchData = await searchRes.json();
          // Khai báo biến/hằng số: placeId - Dùng trong logic xử lý của component
          const placeId = searchData?.predictions?.[0]?.place_id;
          if (placeId) {
            // Khai báo biến/hằng số: detailRes - Dùng trong logic xử lý của component
            const detailRes = await fetch(`https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${goongApiKey}`);
            // Cấu hình/Hằng số/Dịch vụ dữ liệu: detailData
            const detailData = await detailRes.json();
            // Khai báo biến/hằng số: location - Dùng trong logic xử lý của component
            const location = detailData?.result?.geometry?.location;
            if (location?.lat && location?.lng) {
              lat = location.lat;
              lng = location.lng;
            }
          }
        } catch (geoErr) {
          console.warn('Goong geocode failed for saved address:', geoErr);
        }
      }
    }

    setModalLatitude(lat);
    setModalLongitude(lng);

    let cityVal = addr.provinceName || addr.province || 'Hồ Chí Minh';
    let wardVal = addr.wardName || addr.ward || '';
    let wardIdVal = addr.wardId || '';

    if (provinces && provinces.length > 0) {
      // Hàm thực thi logic: cleanProvinceStr
      const cleanProvinceStr = (str) => String(str).toLowerCase().replace(/^(tỉnh|thành phố|tp\.?)\s+/i, '').trim();
      // Khai báo biến/hằng số: addrProvName - Dùng trong logic xử lý của component
      const addrProvName = cleanProvinceStr(cityVal);
      // Hàm thực thi logic: match
      const match = provinces.find(p => {
        if (addr.provinceId && String(p.id) === String(addr.provinceId)) return true;
        // Khai báo biến/hằng số: pName - Dùng trong logic xử lý của component
        const pName = cleanProvinceStr(p.fullName || p.name);
        return pName.includes(addrProvName) || addrProvName.includes(pName);
      });

      if (match) {
        setSelectedProvinceId(match.id);
        cityVal = match.fullName || match.name || cityVal;
        setModalCity(cityVal);

        let currentWards = wards;
        if (String(selectedProvinceId) !== String(match.id) || currentWards.length === 0) {
          try {
            // Khai báo biến/hằng số: wardRes - Dùng trong logic xử lý của component
            const wardRes = await api.get(`/Location/provinces/${match.id}/wards`);
            if (Array.isArray(wardRes)) {
              currentWards = wardRes;
              setWards(wardRes);
            }
          } catch (err) {
            console.error("Lỗi lấy danh sách phường/xã:", err);
          }
        }

        // Hàm thực thi logic: cleanNameStr
        const cleanNameStr = (str) => String(str).toLowerCase().replace(/^(phường|xã|thị trấn|p\.?)\s+/i, '').trim();
        // Khai báo biến/hằng số: targetName - Dùng trong logic xử lý của component
        const targetName = cleanNameStr(wardVal);

        // Hàm thực thi logic: matchedWard
        const matchedWard = (wardIdVal && currentWards.find(w => String(w.id) === String(wardIdVal))) ||
          currentWards.find(w => {
            if (!targetName) return false;
            // Khai báo biến/hằng số: wName - Dùng trong logic xử lý của component
            const wName = cleanNameStr(w.fullName || w.name);
            return wName === targetName || wName.includes(targetName) || targetName.includes(wName);
          });

        if (matchedWard) {
          wardIdVal = matchedWard.id;
          wardVal = matchedWard.fullName || matchedWard.name;
          setModalWardId(matchedWard.id);
          setModalWard(wardVal);
        } else {
          setModalWardId(wardIdVal);
          setModalWard(wardVal);
        }
      }
    }

    // Khai báo biến/hằng số: fullAddrString - Dùng trong logic xử lý của component
    const fullAddrString = [street, wardVal, cityVal].filter(Boolean).join(', ');

    // CẬP NHẬT FORM DATA CHÍNH DÙNG CHO CHECKOUT & VẬN CHUYỂN
    setFormData(prev => ({
      ...prev,
      fullName: recipient,
      phone: phoneNum,
      address: fullAddrString,
      city: cityVal,
      ward: wardVal,
      streetAddress: street,
      wardId: wardIdVal,
      deliveryLatitude: lat,
      deliveryLongitude: lng
    }));

    setAddressProvided(true);
  };

  // Hàm xử lý logic/sự kiện: handleAddNewAddressClick
  const handleAddNewAddressClick = () => {
    setModalFullName('');
    setModalPhone('');
    setModalStreetAddress('');
    setModalCity('');
    setModalWard('');
    setModalWardId('');
    setModalLatitude(null);
    setModalLongitude(null);
    setSelectedProvinceId('');
    setWards([]);
  };

  // Sync selectedProvinceId when modalCity is set from default address
  useEffect(() => {
    if (provinces.length > 0 && modalCity) {
      // Hàm thực thi logic: match
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
        .then(async res => {
          if (Array.isArray(res)) {
            setUserAddresses(res);
            if (res.length > 0) {
              const savedId = sessionStorage.getItem('selectedShippingAddressId');
              const defaultAddr = (savedId && res.find(addr => String(addr.id || addr.Id) === String(savedId))) ||
                                  res.find(addr => addr.isDefault) || res[0];
              // Khai báo biến/hằng số: recipient - Dùng trong logic xử lý của component
              const recipient = defaultAddr.recipientName || '';
              // Khai báo biến/hằng số: phoneNum - Dùng trong logic xử lý của component
              const phoneNum = defaultAddr.phoneNumber || '';
              // Khai báo biến/hằng số: fullAddress - Dùng trong logic xử lý của component
              const fullAddress = `${defaultAddr.addressLine}, ${defaultAddr.wardName || defaultAddr.ward || ''}, ${defaultAddr.provinceName || defaultAddr.province || ''}`;

              // Nếu địa chỉ mặc định chưa có tọa độ → geocode qua Goong Maps
              let lat = defaultAddr.latitude || null;
              let lng = defaultAddr.longitude || null;
              if ((!lat || !lng) && defaultAddr.addressLine) {
                // Khai báo biến/hằng số: goongApiKey - Dùng trong logic xử lý của component
                const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || '';
                if (goongApiKey) {
                  try {
                    // Khai báo biến/hằng số: fullAddrStr - Dùng trong logic xử lý của component
                    const fullAddrStr = [defaultAddr.addressLine, defaultAddr.wardName || '', defaultAddr.provinceName || ''].filter(Boolean).join(', ');
                    // Khai báo biến/hằng số: searchRes - Dùng trong logic xử lý của component
                    const searchRes = await fetch(`https://rsapi.goong.io/Place/Autocomplete?input=${encodeURIComponent(fullAddrStr)}&api_key=${goongApiKey}&limit=1`);
                    // Cấu hình/Hằng số/Dịch vụ dữ liệu: searchData
                    const searchData = await searchRes.json();
                    // Khai báo biến/hằng số: placeId - Dùng trong logic xử lý của component
                    const placeId = searchData?.predictions?.[0]?.place_id;
                    if (placeId) {
                      // Khai báo biến/hằng số: detailRes - Dùng trong logic xử lý của component
                      const detailRes = await fetch(`https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${goongApiKey}`);
                      // Cấu hình/Hằng số/Dịch vụ dữ liệu: detailData
                      const detailData = await detailRes.json();
                      // Khai báo biến/hằng số: loc - Dùng trong logic xử lý của component
                      const loc = detailData?.result?.geometry?.location;
                      if (loc?.lat && loc?.lng) {
                        lat = loc.lat;
                        lng = loc.lng;
                      }
                    }
                  } catch (geoErr) {
                    console.warn('Goong geocode failed for default address:', geoErr);
                  }
                }
              }

              setFormData(prev => ({
                ...prev,
                fullName: recipient,
                phone: phoneNum,
                address: fullAddress,
                city: defaultAddr.provinceName || defaultAddr.province || 'Hồ Chí Minh',
                ward: defaultAddr.wardName || defaultAddr.ward || '',
                streetAddress: defaultAddr.addressLine || '',
                wardId: defaultAddr.wardId || '',
                deliveryLatitude: lat,
                deliveryLongitude: lng
              }));

              // Sync modal temporary states as well
              setModalFullName(recipient);
              setModalPhone(phoneNum);
              setModalStreetAddress(defaultAddr.addressLine || '');
              setModalCity(defaultAddr.provinceName || defaultAddr.province || 'Hồ Chí Minh');
              setModalWard(defaultAddr.wardName || defaultAddr.ward || '');
              setModalWardId(defaultAddr.wardId || '');
              setModalLatitude(lat);
              setModalLongitude(lng);
              setAddressProvided(true);
            }
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
    setModalLatitude(formData.deliveryLatitude || null);
    setModalLongitude(formData.deliveryLongitude || null);
    setValidationErrors({});
    setShowAddressModal(true);
  };

  // Hàm xử lý logic/sự kiện: handleProvinceChange
  const handleProvinceChange = (provinceId) => {
    setSelectedProvinceId(provinceId);
    // Hàm thực thi logic: matchedProv
    const matchedProv = provinces.find(p => String(p.id) === String(provinceId));
    if (matchedProv) {
      setModalCity(matchedProv.name);
    } else {
      setModalCity('');
    }
    setModalWard('');
    setModalWardId('');
  };

  // Hàm xử lý logic/sự kiện: handleWardChange
  const handleWardChange = (wardId) => {
    setModalWardId(wardId);
    // Hàm thực thi logic: matchedWard
    const matchedWard = wards.find(w => String(w.id) === String(wardId));
    if (matchedWard) {
      setModalWard(matchedWard.fullName || matchedWard.name);
    } else {
      setModalWard('');
    }
  };

  // Confirm shipping address, copying temp states to formData
  const confirmAddress = () => {
    // Khai báo biến/hằng số: errors - Dùng trong logic xử lý của component
    const errors = {};
    if (!modalFullName.trim()) errors.fullName = 'Vui lòng nhập họ tên người nhận';
    if (!modalPhone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';

    if (deliveryMethod === 'ship') {
      if (!selectedProvinceId) {
        errors.city = 'Vui lòng chọn Tỉnh/Thành phố';
      }
      if (!modalWardId) {
        errors.ward = 'Vui lòng chọn Phường/Xã';
      }
      if (!modalStreetAddress.trim()) {
        errors.streetAddress = 'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)';
      }
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
      // Khai báo biến/hằng số: parts - Dùng trong logic xử lý của component
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
      wardId: modalWardId,
      deliveryLatitude: modalLatitude,
      deliveryLongitude: modalLongitude
    }));

    // Lưu vào sổ địa chỉ nếu được tick chọn
    if (isLoggedIn && saveToAddressBook && deliveryMethod === 'ship') {
      // Khai báo biến/hằng số: newAddrPayload - Dùng trong logic xử lý của component
      const newAddrPayload = {
        recipientName: modalFullName.trim(),
        phoneNumber: modalPhone.trim(),
        addressLine: modalStreetAddress.trim(),
        wardId: modalWardId,
        latitude: modalLatitude,
        longitude: modalLongitude,
        isDefault: userAddresses.length === 0
      };

      shippingInfoService.create(newAddrPayload)
        .then(() => {
          shippingInfoService.getAll().then(res => {
            if (Array.isArray(res)) {
              setUserAddresses(res);
            }
          });
        })
        .catch(err => {
          console.error("Lỗi khi thêm địa chỉ mới vào sổ địa chỉ:", err);
        });
    }

    setAddressProvided(true);
    setShowAddressModal(false);
    setSaveToAddressBook(false); // Reset checkbox
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

    // Khai báo biến/hằng số: emailToUse - Dùng trong logic xử lý của component
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
      // Khai báo biến/hằng số: baseUsername - Dùng trong logic xử lý của component
      const baseUsername = emailToUse.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      // Khai báo biến/hằng số: randSuffix - Dùng trong logic xử lý của component
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      // Khai báo biến/hằng số: generatedUsername - Dùng trong logic xử lý của component
      const generatedUsername = `${baseUsername}_${randSuffix}`;

      await authService.register({
        username: generatedUsername,
        email: emailToUse,
        password: inlinePassword
      });

      // Cấu hình/Hằng số/Dịch vụ dữ liệu: loginData
      const loginData = await authService.login({
        username: generatedUsername,
        password: inlinePassword
      });

      // Khai báo biến/hằng số: token - Dùng trong logic xử lý của component
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
        setShowAuthModal(false);
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
      // Cấu hình/Hằng số/Dịch vụ dữ liệu: loginData
      const loginData = await authService.login({
        username: inlineUsername.trim(),
        password: inlinePassword
      });

      // Khai báo biến/hằng số: token - Dùng trong logic xử lý của component
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
        setShowAuthModal(false);
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

    // CƠ CHẾ CHẶN ĐẶT HÀNG KHÁCH VÃNG LAI (CELLPHONES STYLE):
    // Phía Backend yêu cầu tài khoản người dùng thực tế (JWT Token / UserId) để xử lý giỏ hàng/đơn hàng.
    // Thay vì tự động tạo tài khoản guest ngầm như cũ, nếu người dùng chưa đăng nhập,
    // ta hiển thị popup gợi ý chuyển sang trang Đăng ký/Đăng nhập chuyên biệt.
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    // RÀNG BUỘC TỒN KHO TRƯỚC KHITHỰC HIỆN CHECKOUT
    for (const item of cartItems) {
      const maxStock = item.availableStock ?? item.stockQuantity ?? item.stock ?? item.totalStock ?? 999;
      if (maxStock < 999 && item.quantity > maxStock) {
        alert(`Sản phẩm "${item.name}" trong giỏ hàng (Số lượng: ${item.quantity}) đã vượt quá số lượng tồn kho khả dụng (${maxStock} sản phẩm). Vui lòng giảm số lượng trước khi đặt hàng.`);
        return;
      }
    }

    if (!addressProvided || !formData.fullName || !formData.phone) {
      alert("Vui lòng cung cấp thông tin người nhận và địa chỉ trước khi đặt hàng.");
      openAddressModal();
      return;
    }

    if (deliveryMethod === 'ship') {
      if (!formData.city || !formData.wardId || !formData.streetAddress) {
        alert("Địa chỉ giao hàng chưa đầy đủ (Tỉnh/Thành phố, Phường/Xã, Số nhà/Đường). Vui lòng cập nhật trước khi đặt hàng.");
        openAddressModal();
        return;
      }
    }

    // Kiểm tra giới hạn thu hộ (COD) của Ahamove (Tối đa 10.000.000đ)
    const finalTotalPay = cartTotal + (deliveryMethod === 'ship' ? shippingFee : 0) - discountAmount - (usePoints ? pointsDiscount : 0);
    if (deliveryMethod === 'ship' && paymentMethod === 'cod' && shippingCarrier && shippingCarrier.toLowerCase().includes('ahamove') && finalTotalPay > 10000000) {
      setShowCodLimitModal(true);
      return;
    }

    setIsSubmitting(true);

    try {

      // Khai báo biến/hằng số: finalNote - Dùng trong logic xử lý của component
      const finalNote = [
        paymentMethod === 'vnpay_installment'
          ? `[ĐƠN TRẢ GÓP 0%] Kỳ hạn: ${installmentMonths} tháng (${Math.round(finalTotalPay / (installmentMonths || 6)).toLocaleString('vi-VN')}₫/tháng)`
          : "",
        specialRequests.transferData ? "Yêu cầu: Chuyển dữ liệu qua máy mới" : "",
        specialRequests.companyInvoice
          ? `Xuất HĐ Cty: ${companyInvoiceDetails.companyName}, MST: ${companyInvoiceDetails.taxCode}, ĐC: ${companyInvoiceDetails.companyAddress}`
          : "",
        specialRequests.otherRequest ? `Yêu cầu khác: ${otherRequestText}` : "",
        formData.note ? `Ghi chú: ${formData.note}` : ""
      ].filter(n => n !== "").join(" | ");

      /*
       * LUỒNG TỰ ĐỘNG GỬI EMAIL THÔNG BÁO ĐƠN HÀNG (AUTOMATED EMAIL NOTIFICATION SYSTEM):
       * - Mục đích: Loại bỏ việc người dùng phải nhập Email thủ công khi thanh toán (tránh gõ sai/gõ nhầm địa chỉ email).
       * - Logic hoạt động: Hệ thống tự động truy xuất địa chỉ Email chính chủ đã được người dùng sử dụng để ĐĂNG KÝ TÀI KHOẢN 
       *   từ `currentUser.email` hoặc bộ nhớ tạm `localStorage.user`.
       * - Tác dụng: Địa chỉ email này sẽ được gắn trực tiếp vào `payload.email` để chuyển xuống Backend (`OrderService.cs`).
       *   Backend sẽ kích hoạt Background Task (`Task.Run`) tự động gửi Email xác nhận hóa đơn, thông báo hành trình vận chuyển
       *   Ahamove và cập nhật trạng thái đơn hàng realtime mà không làm chậm tốc độ phản hồi API.
       */
      let registeredEmail = currentUser?.email;
      if (!registeredEmail) {
        try {
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          registeredEmail = userObj?.email;
        } catch (e) {
          console.debug(e);
        }
      }
      const finalEmail = registeredEmail || formData.email || '';

      // Khai báo biến/hằng số: payload - Dùng trong logic xử lý của component
      const payload = {
        recipientName: formData.fullName,
        phoneNumber: formData.phone,
        addressLine: deliveryMethod === 'ship' ? formData.streetAddress : 'Nhận tại Cửa hàng PhoneShop: 120 Đường 3/2, Quận 10, Thành phố Hồ Chí Minh',
        wardId: deliveryMethod === 'ship' ? formData.wardId : null,
        promotionCode: appliedPromo || '',
        pointsToRedeem: usePoints ? pointsDiscount : 0,
        note: finalNote,
        paymentMethod: paymentMethod,
        shippingCarrier: shippingCarrier,
        deliveryLatitude: deliveryMethod === 'ship' ? formData.deliveryLatitude : null,
        deliveryLongitude: deliveryMethod === 'ship' ? formData.deliveryLongitude : null,
        email: finalEmail,
        items: cartItems.map(item => ({
          productId: item.id || item.Id,
          storage: item.selectedStorage || '',
          color: item.selectedColor || '',
          quantity: item.quantity,
          price: item.price
        }))
      };

      // Khai báo biến/hằng số: syncItems - Dùng trong logic xử lý của component
      const syncItems = [];
      await Promise.all(cartItems.map(async (item) => {
        // Khai báo biến/hằng số: productId - Dùng trong logic xử lý của component
        const productId = item.id || item.Id;
        if (!productId) return;

        try {
          // Khai báo biến/hằng số: variants - Dùng trong logic xử lý của component
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
                // Khai báo biến/hằng số: parts - Dùng trong logic xử lý của component
                const parts = v.name.split(' - ');
                if (parts.length > 1) {
                  parsedAttrs["Dung lượng RAM - ROM"] = parts[1].trim();
                }
                if (parts.length > 2) {
                  parsedAttrs["Màu sắc"] = parts[2].trim();
                }
              }

              // Hàm thực thi logic: cleanString
              const cleanString = (str) => {
                if (!str) return '';
                return String(str).toLowerCase().replace(/[\s-]/g, '');
              };

              // Khai báo biến/hằng số: colorMatch - Dùng trong logic xử lý của component
              const colorMatch = !item.selectedColor ||
                Object.entries(parsedAttrs).some(([k, val]) =>
                  (k.toLowerCase().includes('màu') || k.toLowerCase().includes('color')) &&
                  cleanString(val) === cleanString(item.selectedColor)
                ) ||
                cleanString(v.name).includes(cleanString(item.selectedColor));

              // Khai báo biến/hằng số: storageMatch - Dùng trong logic xử lý của component
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
              quantity: item.quantity,
              appliedCampaignId: item.appliedCampaignId,
              isAddon: item.isAddon || false,
              warrantyId: item.warrantyId || null
            });
          }
        } catch (err) {
          console.error(`Error resolving variant for product ${productId}:`, err);
        }
      }));

      await api.post('/Cart/sync', syncItems);

      // Khai báo biến/hằng số: checkoutRes - Dùng trong logic xử lý của component
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

      // Khai báo biến/hằng số: newOrderId - Dùng trong logic xử lý của component
      const newOrderId = checkoutRes?.orderId || checkoutRes?.OrderId || `PS${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderCode(newOrderId);
      clearCart();

      // Xử lý chuyển hướng cổng thanh toán online
      if (paymentMethod === 'stripe' || paymentMethod === 'vnpay') {
        try {
          // Khai báo biến/hằng số: paymentRes - Dùng trong logic xử lý của component
          const paymentRes = await api.post(`/Payment/create-checkout-session/${newOrderId}?provider=${paymentMethod}`);
          // Khai báo biến/hằng số: paymentUrl - Dùng trong logic xử lý của component
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

      //  Truyền dữ liệu thanh toán COD về Server để lưu trong Nhật ký giao dịch thanh toán
      /*
      if (paymentMethod === 'cod') {
        try {
          await api.post(`/Payment/create-checkout-session/${newOrderId}?provider=cod`);
        } catch (payErr) {
          console.error("Lỗi gửi thông tin giao dịch COD:", payErr);
        }
      }
      */

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

  // Khai báo biến/hằng số: userPoints - Dùng trong logic xử lý của component
  const userPoints = currentUser?.rewardPoints || 0;
  // Khai báo biến/hằng số: pointsDiscount - Dùng trong logic xử lý của component
  const pointsDiscount = usePoints ? Math.min(userPoints, cartTotal - discountAmount) : 0;
  // Khai báo biến/hằng số: finalTotalPay - Dùng trong logic xử lý của component
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
      <div className="max-w-6xl mx-auto px-4 space-y-4">

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
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Left Column (Main Content) */}
            <div className="w-full lg:w-2/3 flex flex-col space-y-4">

              {/* Card 1: Selected Products */}
            <CartItemsList
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              cartTotal={cartTotal}
            />

              {/* Co-Purchase Recommendation */}
              {cartItems.length > 0 && cartItems.some(i => !i.isAddon) && (
                <div className="mt-2">
                  <CoPurchaseRecommendation 
                    isCartPage={true}
                    cartItems={cartItems}
                    onAddComboToCart={(comboData) => {
                      const mainItem = cartItems.find(i => Number(i.id) === Number(comboData.parentProductId)) || cartItems.find(i => !i.isAddon);
                      const origPrice = comboData.basePrice || comboData.originalPrice || comboData.price;
                      addToCart({
                        id: comboData.variantId,
                        name: comboData.productName,
                        price: comboData.price,
                        originalBasePrice: origPrice,
                        originalPrice: origPrice,
                        isAddon: true,
                        appliedCampaignId: comboData.campaignId,
                        parentProductId: comboData.parentProductId || mainItem?.id,
                        parentCartItemId: mainItem?.cartId
                      }, comboData.quantity);
                    }}
                  />
                </div>
              )}


            {/* Card 3: Delivery Options & Address Preview */}
            <CartDeliveryForm
              deliveryMethod={deliveryMethod}
              setDeliveryMethod={setDeliveryMethod}
              addressProvided={addressProvided}
              formData={formData}
              openAddressModal={openAddressModal}
              isLoggedIn={isLoggedIn}
              userAddresses={userAddresses}
              onSelectSavedAddress={handleSelectSavedAddress}
            />

            {/* Card 4: Support Request Checklist */}
            <CartSpecialRequests
              specialRequests={specialRequests}
              setSpecialRequests={setSpecialRequests}
              companyInvoiceDetails={companyInvoiceDetails}
              setCompanyInvoiceDetails={setCompanyInvoiceDetails}
              otherRequestText={otherRequestText}
              setOtherRequestText={setOtherRequestText}
            />

            {/* Card 5: Payment Methods and Shipping Options */}
            <CartPaymentMethods
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              setIsVerifyModalOpen={setIsVerifyModalOpen}
              deliveryMethod={deliveryMethod}
              shippingCarrier={shippingCarrier}
              shippingOptions={shippingOptions}
              onSelectShippingOption={(option) => {
                setShippingFee(Number(option.fee || option.Fee || 0));
                setShippingCarrier(option.carrier || option.Carrier || '');
                setShippingEstimatedDays(option.estimatedDeliveryDays || option.EstimatedDeliveryDays || '');
              }}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              finalTotalPay={finalTotalPay}
              installmentMonths={installmentMonths}
              setInstallmentMonths={setInstallmentMonths}
            />

            </div>

            {/* Right Column (Summary & Payment) */}
            <div className="w-full lg:w-1/3 sticky top-6 space-y-4">
              {/* Cards 6-7: Checkout Summary */}
              <CartSummaryPayment
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                usePoints={usePoints}
                setUsePoints={setUsePoints}
                pointsDiscount={pointsDiscount}
                cartItems={cartItems}
                cartTotal={cartTotal}
                appliedPromo={appliedPromo}
                onApplyPromotion={(code, discount) => {
                  setAppliedPromo(code);
                  setDiscountAmount(discount);
                }}
                discountAmount={discountAmount}
                shippingCarrier={shippingCarrier}
                shippingLoading={shippingLoading}
                deliveryMethod={deliveryMethod}
                shippingFee={shippingFee}
                shippingEstimatedDays={shippingEstimatedDays}
                finalTotalPay={finalTotalPay}
                isSubmitting={isSubmitting}
                handleCheckoutSubmit={handleCheckoutSubmit}
              />
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
        modalLatitude={modalLatitude}
        modalLongitude={modalLongitude}
        onSelectGoongAddress={handleSelectGoongAddress}
        isLoggedIn={isLoggedIn}
        userAddresses={userAddresses}
        saveToAddressBook={saveToAddressBook}
        setSaveToAddressBook={setSaveToAddressBook}
        onSelectSavedAddress={handleSelectSavedAddress}
        onAddNewAddress={handleAddNewAddressClick}
      />

      {/* CƠ CHẾ XÁC THỰC CELLPHONES: Hộp thoại yêu cầu đăng ký / đăng nhập dành cho khách vãng lai */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl flex flex-col relative p-6 animate-in zoom-in-95 duration-200 shadow-2xl border border-gray-100 text-center">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition cursor-pointer bg-transparent border-0"
            >
              <X size={18} />
            </button>

            {/* Title / Logo */}
            <h3 className="font-extrabold text-xl text-blue-600 mb-2 mt-2">
              PhoneMember
            </h3>

            {/* Cute Mascot / Icon */}
            <div className="flex justify-center my-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-bounce">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5a13.92 13.92 0 00-2.318-7.755m11.302 11.755a13.882 13.882 0 001.07-4.755c0-1.808-.344-3.513-.974-5.078m-2.458 10.134A13.9 13.9 0 0018 11.5c0-3.517-1.009-6.799-2.753-9.571m-3.44 2.04l-.054.09A13.916 13.916 0 0015 11.5a13.92 13.92 0 002.318 7.755M12 2a10 10 0 100 20 10 10 0 000-20z"></path>
                </svg>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-xs font-semibold px-4 mb-6 leading-relaxed">
              Vui lòng đăng nhập tài khoản PhoneMember để xem ưu đãi và thanh toán dễ dàng hơn.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/auth?mode=register&redirect=/cart');
                }}
                className="w-full py-2.5 bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 rounded-lg text-xs font-extrabold transition cursor-pointer"
              >
                Đăng ký
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/auth?mode=login&redirect=/cart');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold transition cursor-pointer border-0"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ahamove COD Limit Warning Modal */}
      {showCodLimitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowCodLimitModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition bg-transparent border-0 cursor-pointer p-1 rounded-full hover:bg-gray-100"
            >
              <X size={18} />
            </button>

            {/* Warning Icon */}
            <div className="flex justify-center my-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                <AlertTriangle size={36} />
              </div>
            </div>

            {/* Title */}
            <h3 className="font-extrabold text-lg text-gray-800 mb-2">
              Giới Hạn Thu Hộ (COD) Ahamove
            </h3>

            {/* Description */}
            <div className="text-gray-655 text-xs font-semibold px-2 mb-6 leading-relaxed space-y-2 text-left bg-gray-50 p-4 rounded-xl border border-gray-200/50">
              <p className="text-gray-700">
                Để đảm bảo an toàn giao dịch, dịch vụ vận chuyển hỏa tốc <strong className="text-red-600">Ahamove</strong> chỉ hỗ trợ giao hàng thu hộ (COD) tối đa <strong className="text-red-600 text-sm">10.000.000₫</strong> cho mỗi đơn hàng.
              </p>
              <p className="text-gray-500 font-medium">
                Vui lòng lựa chọn một trong các phương án xử lý sau để tiếp tục đặt hàng:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-500 font-medium text-[11px]">
                <li>Chuyển sang thanh toán trực tuyến qua cổng <strong className="text-gray-700">Stripe</strong>.</li>
                <li>Đổi phương thức giao hàng sang <strong className="text-gray-700">Giao Hàng Tiêu Chuẩn</strong> (Không giới hạn COD).</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowCodLimitModal(false);
                }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-extrabold transition cursor-pointer border-0"
              >
                Đóng lại
              </button>
              <button
                onClick={() => {
                  setShowCodLimitModal(false);
                  // Tự động cuộn mượt xuống khu vực thanh toán/giao hàng để đổi
                  const el = document.getElementById('payment-section') || document.querySelector('.sticky');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold transition cursor-pointer border-0 shadow-md shadow-red-100"
              >
                Thay đổi thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      <EmailVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        email={currentUser?.email}
        onVerifiedSuccess={() => {
          userService.getProfile().then(res => {
            if (res) {
              setCurrentUser(res);
              localStorage.setItem('user', JSON.stringify(res));
            }
          });
        }}
      />

    </div>
  );
}
