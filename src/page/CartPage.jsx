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
import { ArrowLeft, ShoppingBag, CreditCard, Gift, ChevronRight, X } from 'lucide-react';

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

export default function CartPage() {
  const { stopLoading } = useLoading();
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);

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
  const [showAuthModal, setShowAuthModal] = useState(false);

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
    wardId: '',
    deliveryLatitude: null,
    deliveryLongitude: null
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
  const [modalLatitude, setModalLatitude] = useState(null);
  const [modalLongitude, setModalLongitude] = useState(null);
  const [pendingWardName, setPendingWardName] = useState('');
  const [pendingWardId, setPendingWardId] = useState('');

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
        addressLine: formData.streetAddress
      })
        .then(res => {
          if (res) {
            const options = res.options || res.Options || [];
            setShippingOptions(options);

            if (options.length > 0) {
              // Mặc định chọn phương thức rẻ nhất (thường là Giao Hàng Tiêu Chuẩn) để không làm khách hoảng vì phí ship cao
              const cheapestOption = [...options].sort((a, b) => (Number(a.fee || a.Fee || 0)) - (Number(b.fee || b.Fee || 0)))[0];
              setShippingFee(Number(cheapestOption.fee || cheapestOption.Fee || 0));
              setShippingCarrier(cheapestOption.carrier || cheapestOption.Carrier || '');
              setShippingEstimatedDays(cheapestOption.estimatedDeliveryDays || cheapestOption.EstimatedDeliveryDays || '');
            } else {
              setShippingFee(Number(res.fee || res.Fee || 0));
              setShippingCarrier(res.carrier || res.Carrier || 'Giao Hàng Nhanh (GHN)');
              setShippingEstimatedDays(res.estimatedDeliveryDays || res.EstimatedDeliveryDays || '2-3 ngày');
            }
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
  }, [formData.wardId, deliveryMethod, formData.deliveryLatitude, formData.deliveryLongitude, formData.streetAddress]);

  // Form submission state
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // default 'stripe'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Success screen state
  const [isFinished, setIsFinished] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [orderSuccessTotal, setOrderSuccessTotal] = useState(0);

  // Address Book states
  const [userAddresses, setUserAddresses] = useState([]);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);

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

  // Tự động tìm phường/xã khớp sau khi danh sách wards tải xong
  useEffect(() => {
    if (wards.length > 0 && (pendingWardId || pendingWardName)) {
      const cleanNameStr = (str) => String(str).toLowerCase().replace(/^(phường|xã|thị trấn|p\.?)\s+/i, '').trim();
      const targetName = cleanNameStr(pendingWardName);

      const matchedWard = (pendingWardId && wards.find(w => String(w.id) === String(pendingWardId))) ||
        wards.find(w => {
          if (!targetName) return false;
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

  const handleSelectGoongAddress = (locationData) => {
    const { formattedAddress, lat, lng, compound } = locationData;

    setModalLatitude(lat);
    setModalLongitude(lng);

    if (compound) {
      // 1. Khớp Tỉnh / Thành phố
      if (compound.province && provinces.length > 0) {
        const cleanProvinceStr = (str) => String(str).toLowerCase().replace(/^(tỉnh|thành phố|tp\.?)\s+/i, '').trim();
        const goongProvName = cleanProvinceStr(compound.province);
        const matchedProv = provinces.find(p => {
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
              const cleanNameStr = (str) => String(str).toLowerCase().replace(/^(phường|xã|thị trấn|p\.?)\s+/i, '').trim();
              const targetName = cleanNameStr(compound.commune);
              const matchedWard = wards.find(w => {
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
      const parts = formattedAddress.split(',');
      if (parts.length > 0) {
        setModalStreetAddress(parts[0].trim());
      } else {
        setModalStreetAddress(formattedAddress);
      }
    }
  };

  const handleSelectSavedAddress = async (addr) => {
    setModalFullName(addr.recipientName || '');
    setModalPhone(addr.phoneNumber || '');
    setModalStreetAddress(addr.addressLine || '');

    // Nếu địa chỉ đã có tọa độ trong DB → dùng luôn
    if (addr.latitude && addr.longitude) {
      setModalLatitude(addr.latitude);
      setModalLongitude(addr.longitude);
    } else {
      // Không có tọa độ → tự động geocode bằng Goong Maps
      setModalLatitude(null);
      setModalLongitude(null);
      const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || '';
      if (goongApiKey && addr.addressLine) {
        try {
          const fullAddr = [addr.addressLine, addr.wardName || addr.ward || '', addr.provinceName || addr.province || ''].filter(Boolean).join(', ');
          const searchRes = await fetch(`https://rsapi.goong.io/Place/Autocomplete?input=${encodeURIComponent(fullAddr)}&api_key=${goongApiKey}&limit=1`);
          const searchData = await searchRes.json();
          const placeId = searchData?.predictions?.[0]?.place_id;
          if (placeId) {
            const detailRes = await fetch(`https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${goongApiKey}`);
            const detailData = await detailRes.json();
            const location = detailData?.result?.geometry?.location;
            if (location?.lat && location?.lng) {
              setModalLatitude(location.lat);
              setModalLongitude(location.lng);
            }
          }
        } catch (geoErr) {
          console.warn('Goong geocode failed for saved address:', geoErr);
        }
      }
    }

    if (provinces && provinces.length > 0) {
      const cleanProvinceStr = (str) => String(str).toLowerCase().replace(/^(tỉnh|thành phố|tp\.?)\s+/i, '').trim();
      const addrProvName = cleanProvinceStr(addr.provinceName || addr.province || '');
      const match = provinces.find(p => {
        if (addr.provinceId && String(p.id) === String(addr.provinceId)) return true;
        const pName = cleanProvinceStr(p.fullName || p.name);
        return pName.includes(addrProvName) || addrProvName.includes(pName);
      });

      if (match) {
        setSelectedProvinceId(match.id);
        setModalCity(match.fullName || match.name || '');

        let currentWards = wards;
        if (String(selectedProvinceId) !== String(match.id) || currentWards.length === 0) {
          try {
            const wardRes = await api.get(`/Location/provinces/${match.id}/wards`);
            if (Array.isArray(wardRes)) {
              currentWards = wardRes;
              setWards(wardRes);
            }
          } catch (err) {
            console.error("Lỗi lấy danh sách phường/xã:", err);
          }
        }

        const targetWardId = addr.wardId || '';
        const targetWardName = addr.wardName || addr.ward || '';
        const cleanNameStr = (str) => String(str).toLowerCase().replace(/^(phường|xã|thị trấn|p\.?)\s+/i, '').trim();
        const targetName = cleanNameStr(targetWardName);

        const matchedWard = (targetWardId && currentWards.find(w => String(w.id) === String(targetWardId))) ||
          currentWards.find(w => {
            if (!targetName) return false;
            const wName = cleanNameStr(w.fullName || w.name);
            return wName === targetName || wName.includes(targetName) || targetName.includes(wName);
          });

        if (matchedWard) {
          setModalWardId(matchedWard.id);
          setModalWard(matchedWard.fullName || matchedWard.name);
        } else {
          setModalWardId(targetWardId);
          setModalWard(targetWardName);
        }
      }
    }
  };

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
              const defaultAddr = res.find(addr => addr.isDefault) || res[0];
              const recipient = defaultAddr.recipientName || '';
              const phoneNum = defaultAddr.phoneNumber || '';
              const fullAddress = `${defaultAddr.addressLine}, ${defaultAddr.wardName || defaultAddr.ward || ''}, ${defaultAddr.provinceName || defaultAddr.province || ''}`;

              // Nếu địa chỉ mặc định chưa có tọa độ → geocode qua Goong Maps
              let lat = defaultAddr.latitude || null;
              let lng = defaultAddr.longitude || null;
              if ((!lat || !lng) && defaultAddr.addressLine) {
                const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || '';
                if (goongApiKey) {
                  try {
                    const fullAddrStr = [defaultAddr.addressLine, defaultAddr.wardName || '', defaultAddr.provinceName || ''].filter(Boolean).join(', ');
                    const searchRes = await fetch(`https://rsapi.goong.io/Place/Autocomplete?input=${encodeURIComponent(fullAddrStr)}&api_key=${goongApiKey}&limit=1`);
                    const searchData = await searchRes.json();
                    const placeId = searchData?.predictions?.[0]?.place_id;
                    if (placeId) {
                      const detailRes = await fetch(`https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${goongApiKey}`);
                      const detailData = await detailRes.json();
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
      alert("Ahamove chỉ hỗ trợ giao hàng thu hộ (COD) tối đa 10.000.000₫ cho mỗi đơn hàng để đảm bảo an toàn. Vui lòng chuyển sang hình thức thanh toán trực tuyến (Stripe, MoMo, Chuyển khoản) hoặc đổi phương thức sang Giao Hàng Tiêu Chuẩn.");
      return;
    }

    setIsSubmitting(true);

    try {

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
        shippingCarrier: shippingCarrier,
        deliveryLatitude: deliveryMethod === 'ship' ? formData.deliveryLatitude : null,
        deliveryLongitude: deliveryMethod === 'ship' ? formData.deliveryLongitude : null,
        email: formData.email,
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
              quantity: item.quantity,
              appliedCampaignId: item.appliedCampaignId,
              isAddon: item.isAddon || false
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
              {cartItems.length > 0 && cartItems.find(i => !i.isAddon) && (
                <div className="mt-2">
                  <CoPurchaseRecommendation 
                    isCartPage={true}
                    mainProduct={{ id: cartItems.find(i => !i.isAddon).id }} 
                    mainProductPrice={cartItems.find(i => !i.isAddon).price}
                    selectedVariantId={cartItems.find(i => !i.isAddon).variantId}
                    onAddComboToCart={(comboData) => {
                      addToCart({
                        id: comboData.variantId,
                        name: comboData.productName,
                        price: comboData.price,
                        isAddon: true,
                        appliedCampaignId: comboData.campaignId,
                        parentCartItemId: cartItems.find(i => !i.isAddon).id
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
                  navigate('/auth?mode=register');
                }}
                className="w-full py-2.5 bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 rounded-lg text-xs font-extrabold transition cursor-pointer"
              >
                Đăng ký
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/auth?mode=login');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold transition cursor-pointer border-0"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
