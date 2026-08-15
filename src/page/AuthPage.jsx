import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import Breadcrumb from '../components/Breadcrumb';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { shippingInfoService } from '../services/shippingInfoService';
import { orderService } from '../services/orderService';
import { useFormat } from '../hooks/useFormat';

import api from '../services/api';

// Subcomponents
import AuthGuestForms from './auth/components/AuthGuestForms';
import ProfileSidebar from './auth/components/ProfileSidebar';
import ProfileInfoTab from './auth/components/ProfileInfoTab';
import ProfileAddressTab from './auth/components/ProfileAddressTab';
import ProfileOrderHistoryTab from './auth/components/ProfileOrderHistoryTab';
import ProfilePasswordTab from './auth/components/ProfilePasswordTab';
import ProfileWarrantyDevicesTab from './auth/components/ProfileWarrantyDevicesTab';
import ProfileTrackOrderTab from './auth/components/ProfileTrackOrderTab';

export default function AuthPage() {
  // Khai báo giải nén các thuộc tính/hàm (stopLoading) từ Hook / Context / Props
  const { stopLoading } = useLoading();
  // Hook lấy thông tin đường dẫn/location hiện tại (useLocation)
  const location = useLocation();
  // Hook điều hướng trang (useNavigate) để chuyển hướng Route
  const navigate = useNavigate();

  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  // State: username - Quản lý trạng thái và dữ liệu của username trong giao diện
  const [username, setUsername] = useState('');
  // State: email - Quản lý trạng thái và dữ liệu của email trong giao diện
  const [email, setEmail] = useState('');
  // State: password - Quản lý trạng thái và dữ liệu của password trong giao diện
  const [password, setPassword] = useState('');
  // State: confirmPassword - Quản lý trạng thái và dữ liệu của confirmPassword trong giao diện
  const [confirmPassword, setConfirmPassword] = useState('');
  // State: loading - Quản lý trạng thái và dữ liệu của loading trong giao diện
  const [loading, setLoading] = useState(false);
  // State: error - Quản lý trạng thái và dữ liệu của error trong giao diện
  const [error, setError] = useState('');

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  // State: resetUsername - Quản lý trạng thái và dữ liệu của resetUsername trong giao diện
  const [resetUsername, setResetUsername] = useState('');
  // State: resetEmail - Quản lý trạng thái và dữ liệu của resetEmail trong giao diện
  const [resetEmail, setResetEmail] = useState('');
  // State: resetNewPassword - Quản lý trạng thái và dữ liệu của resetNewPassword trong giao diện
  const [resetNewPassword, setResetNewPassword] = useState('');
  // State: resetConfirmPassword - Quản lý trạng thái và dữ liệu của resetConfirmPassword trong giao diện
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  // State: forgotPasswordStep - Quản lý trạng thái và dữ liệu của forgotPasswordStep trong giao diện
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  // State: forgotPasswordOtp - Quản lý trạng thái và dữ liệu của forgotPasswordOtp trong giao diện
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  // State: enteredOtp - Quản lý trạng thái và dữ liệu của enteredOtp trong giao diện
  const [enteredOtp, setEnteredOtp] = useState('');
  // State: forgotPasswordError - Quản lý trạng thái và dữ liệu của forgotPasswordError trong giao diện
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  // Check login state
  const token = localStorage.getItem('token');
  // Khai báo biến/hằng số: userJson - Dùng trong logic xử lý của component
  const userJson = localStorage.getItem('user');
  // Khai báo biến/hằng số: initialUser - Dùng trong logic xử lý của component
  const initialUser = userJson ? JSON.parse(userJson) : null;
  // Khai báo biến/hằng số: isLoggedIn - Dùng trong logic xử lý của component
  const isLoggedIn = !!(initialUser && token);

  // Profile management state
  const [profileTab, setProfileTab] = useState('info'); // 'info', 'addresses', 'password', 'history'

  // Stop loading on mount/data loaded
  useEffect(() => {
    if (!isLoggedIn) {
      stopLoading();
    } else {
      Promise.all([
        userService.getProfile().catch(() => null),
        shippingInfoService.getAll().catch(() => []),
        api.get('/Location/provinces').catch(() => [])
      ]).finally(() => {
        stopLoading();
      });
    }
  }, [isLoggedIn, stopLoading]);

  useEffect(() => {
    // Khai báo biến/hằng số: searchParams - Dùng trong logic xử lý của component
    const searchParams = new URLSearchParams(location.search);
    // Khai báo biến/hằng số: redirectUrl - Dùng trong logic xử lý của component
    const redirectUrl = searchParams.get('redirect');
    if (isLoggedIn && redirectUrl) {
      navigate(redirectUrl);
      return;
    }
    // truyền tab từ url vào state
    const tab = searchParams.get('tab');
    if (tab && ['info', 'addresses', 'password', 'history', 'track', 'warranties', 'warranty'].includes(tab)) {
      setProfileTab(tab === 'warranty' ? 'warranties' : tab);
    }

    // CƠ CHẾ CHUYỂN TỰ ĐỘNG GIỮA ĐĂNG KÝ / ĐĂNG NHẬP:
    // Nhận diện tham số 'mode' truyền vào từ đường dẫn (ví dụ: /auth?mode=register&redirect=/cart).
    // Phục vụ luồng chuyển hướng khi khách hàng bấm Đăng ký hoặc Đăng nhập trên popup giỏ hàng.
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [location.search, isLoggedIn, navigate]);

  // State: userProfile - Quản lý trạng thái và dữ liệu của userProfile trong giao diện
  const [userProfile, setUserProfile] = useState(initialUser);
  // State: shippingInfos - Quản lý trạng thái và dữ liệu của shippingInfos trong giao diện
  const [shippingInfos, setShippingInfos] = useState([]);
  // State: infoLoading - Quản lý trạng thái và dữ liệu của infoLoading trong giao diện
  const [infoLoading, setInfoLoading] = useState(false);

  // Lịch sử đơn hàng
  const [orders, setOrders] = useState([]);
  // State: ordersLoading - Quản lý trạng thái và dữ liệu của ordersLoading trong giao diện
  const [ordersLoading, setOrdersLoading] = useState(false);
  // State: selectedOrder - Quản lý trạng thái và dữ liệu của selectedOrder trong giao diện
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Profile edit state
  const [editProfileData, setEditProfileData] = useState({ username: '', email: '' });
  // State: isEditingProfile - Quản lý trạng thái và dữ liệu của isEditingProfile trong giao diện
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  // Address Form state
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  // State: editingAddressId - Quản lý trạng thái và dữ liệu của editingAddressId trong giao diện
  const [editingAddressId, setEditingAddressId] = useState(null);
  // State: provinces - Quản lý trạng thái và dữ liệu của provinces trong giao diện
  const [provinces, setProvinces] = useState([]);
  // State: wards - Quản lý trạng thái và dữ liệu của wards trong giao diện
  const [wards, setWards] = useState([]);
  // State: selectedProvinceId - Quản lý trạng thái và dữ liệu của selectedProvinceId trong giao diện
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  // State: addressForm - Quản lý trạng thái và dữ liệu của addressForm trong giao diện
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phoneNumber: '',
    addressLine: '',
    wardId: '',
    isDefault: false
  });

  // Khai báo giải nén các thuộc tính/hàm (formatDate) từ Hook / Context / Props
  const { formatDate } = useFormat();

  // Fetch user profile from API to sync
  const fetchProfile = () => {
    if (!isLoggedIn) return;
    userService.getProfile()
      .then(res => {
        if (res) {
          setUserProfile(res);
          setEditProfileData({ username: res.username, email: res.email });
          // Đồng bộ lại localStorage và phát sự kiện cập nhật Header
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...localUser, ...res }));
          window.dispatchEvent(new Event('auth-change'));
        }
      })
      .catch(err => console.error("Lỗi đồng bộ profile:", err));
  };

  // Fetch shipping info
  const fetchShippingInfos = () => {
    if (!isLoggedIn) return;
    setInfoLoading(true);
    shippingInfoService.getAll()
      .then(res => {
        if (Array.isArray(res)) setShippingInfos(res);
      })
      .catch(err => console.error("Lỗi tải danh sách địa chỉ:", err))
      .finally(() => setInfoLoading(false));
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      fetchShippingInfos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

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

  // Hàm xử lý logic/sự kiện: fetchMyOrders
  const fetchMyOrders = (updatedSelectedId = null) => {
    if (!isLoggedIn) return;
    setOrdersLoading(true);
    orderService.getMyOrders()
      .then(res => {
        if (Array.isArray(res)) {
          setOrders(res);
          if (updatedSelectedId) {
            // Hàm thực thi logic: updated
            const updated = res.find(o => o.id === updatedSelectedId);
            if (updated) setSelectedOrder(updated);
          }
        }
      })
      .catch(err => console.error("Lỗi tải lịch sử đơn hàng:", err))
      .finally(() => setOrdersLoading(false));
  };

  // Fetch lịch sử mua hàng khi chuyển sang tab history
  useEffect(() => {
    if (profileTab === 'history') {
      fetchMyOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileTab, isLoggedIn]);

  // Hàm xử lý logic/sự kiện: handleGoogleLoginSuccess
  const handleGoogleLoginSuccess = async (response) => {
    setLoading(true);
    setError('');
    try {
      // Khai báo biến/hằng số: idToken - Dùng trong logic xử lý của component
      const idToken = response.credential;
      // Cấu hình/Hằng số/Dịch vụ dữ liệu: loginData
      const loginData = await authService.googleLogin(idToken);
      // Khai báo biến/hằng số: token - Dùng trong logic xử lý của component
      const token = loginData.token || loginData.accessToken || (loginData.data && loginData.data.token);
      if (token) {
        localStorage.setItem('token', token);

        // Giải mã JWT của Google để lấy Tên và Email người dùng
        const base64Url = idToken.split('.')[1];
        // Khai báo biến/hằng số: base64 - Dùng trong logic xử lý của component
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Hàm thực thi logic: jsonPayload
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        // Khai báo biến/hằng số: googlePayload - Dùng trong logic xử lý của component
        const googlePayload = JSON.parse(jsonPayload);

        localStorage.setItem('user', JSON.stringify({
          id: loginData.id,
          username: googlePayload.name || 'Khách hàng',
          email: googlePayload.email || '',
          role: loginData.role
        }));

        window.dispatchEvent(new Event('auth-change'));

        if (loginData.role === 'Admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        setError('Không nhận được token từ server!');
      }
    } catch (err) {
      console.error("Lỗi đăng nhập Google:", err);
      if (err.response && err.response.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : 'Đăng nhập bằng Google thất bại.');
      } else {
        setError(err.message || 'Xác thực Google thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      // Hàm thực thi logic: initGoogleBtn
      const initGoogleBtn = () => {
        if (window.google) {
          // Khai báo biến/hằng số: googleClientId - Dùng trong logic xử lý của component
          const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "702529174883-k7q714ds1n185oaabhl85hfhhqhqg7dq.apps.googleusercontent.com";
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleLoginSuccess
          });
          // Khai báo biến/hằng số: btnParent - Dùng trong logic xử lý của component
          const btnParent = document.getElementById("google-signin-btn");
          if (btnParent) {
            window.google.accounts.id.renderButton(
              btnParent,
              { theme: "outline", size: "large", text: "signin_with", shape: "rectangular", width: "100%" }
            );
          }
        }
      };

      initGoogleBtn();

      // Hàm thực thi logic: timer
      const timer = setInterval(() => {
        if (window.google) {
          initGoogleBtn();
          clearInterval(timer);
        }
      }, 500);

      return () => clearInterval(timer);
    }
  }, [isLoggedIn, isLogin]);

  // Handle Authentication (Login / Register)
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
        const res = await authService.login({ username, password });
        // Khai báo biến/hằng số: token - Dùng trong logic xử lý của component
        const token = res?.token || res?.accessToken || res?.data?.token;
        // Khai báo biến/hằng số: id - Dùng trong logic xử lý của component
        const id = res?.id || res?.data?.id;
        // Khai báo biến/hằng số: role - Dùng trong logic xử lý của component
        const role = res?.role || res?.data?.role;

        if (!token) {
          setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
          return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ id, username, role }));

        try {
          // Khai báo biến/hằng số: cartRes - Dùng trong logic xử lý của component
          const cartRes = await api.get('/Cart');
          // Cấu hình/Hằng số/Dịch vụ dữ liệu: cartData
          const cartData = cartRes?.data || cartRes;
          if (cartData) {
            localStorage.setItem('cart', JSON.stringify(cartData));
          }
        } catch (cErr) {
          console.log('Chưa có giỏ hàng cũ:', cErr);
        }

        window.dispatchEvent(new Event('auth-change'));

        // Khai báo biến/hằng số: searchParams - Dùng trong logic xử lý của component
        const searchParams = new URLSearchParams(location.search);
        // Khai báo biến/hằng số: redirectUrl - Dùng trong logic xử lý của component
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        const res = await authService.register({ username, email, password });
        if (res.data && res.data.token) {
          alert('Đăng ký tài khoản thành công!');
          const redirectUrl = searchParams.get('redirect');
          if (redirectUrl) {
            navigate(redirectUrl);
          } else {
            navigate('/');
          }
        } else {
          alert('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsLogin(true);
        }
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      // Khai báo biến/hằng số: msg - Dùng trong logic xử lý của component
      const msg = typeof err === 'string' ? err : (err?.message || err?.response?.data || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Reset OTP via SMTP API
  const handleSendResetOtp = async (e) => {
    if (e) e.preventDefault();
    // Khai báo biến/hằng số: targetInput - Dùng trong logic xử lý của component
    const targetInput = resetEmail.trim() || resetUsername.trim();
    if (!targetInput) {
      setError('Vui lòng nhập Email hoặc Tên đăng nhập.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
      const res = await authService.sendForgotPasswordOtp(targetInput);
      // Khai báo biến/hằng số: emailRes - Dùng trong logic xử lý của component
      const emailRes = res?.email || res?.data?.email;
      if (emailRes) {
        setResetEmail(emailRes);
      }
      setForgotPasswordOtp(''); // Set rỗng để ẨN Trình giả lập Email (Demo)
      setForgotPasswordStep(2);
    } catch (err) {
      // Khai báo biến/hằng số: msg - Dùng trong logic xử lý của component
      const msg = typeof err === 'string' ? err : (err?.message || err?.response?.data || 'Không thể gửi mã OTP qua Email.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Reset OTP (Nhận mã OTP thực tế từ email của user)
  const handleVerifyResetOtp = (otpCode) => {
    if (!otpCode || otpCode.length < 6) {
      setForgotPasswordError('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    setEnteredOtp(otpCode);
    setForgotPasswordStep(3);
    setForgotPasswordError('');
  };

  // Resend OTP
  const handleResendResetOtp = async () => {
    // Khai báo biến/hằng số: targetInput - Dùng trong logic xử lý của component
    const targetInput = resetEmail.trim() || resetUsername.trim();
    if (!targetInput) return;
    setLoading(true);
    setForgotPasswordError('');
    try {
      await authService.sendForgotPasswordOtp(targetInput);
      setForgotPasswordOtp('');
      alert('Đã gửi lại mã OTP đến email của bạn.');
    } catch (err) {
      setForgotPasswordError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle Forgot Password Submit (Gửi OTP và mật khẩu mới lên Backend)
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (resetNewPassword !== resetConfirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword({
        email: resetEmail.trim() || resetUsername.trim(),
        otp: enteredOtp,
        newPassword: resetNewPassword
      });
      alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      setIsForgotPassword(false);
      setForgotPasswordStep(1);
      setForgotPasswordOtp('');
      setEnteredOtp('');
      if (resetUsername) setUsername(resetUsername);
      setIsLogin(true);
      // Clear fields
      setResetUsername('');
      setResetEmail('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (err) {
      // Khai báo biến/hằng số: msg - Dùng trong logic xử lý của component
      const msg = typeof err === 'string' ? err : (err?.message || err?.response?.data || 'Đặt lại mật khẩu thất bại.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      authService.logout();
      window.location.href = '/';
    }
  };

  // Update profile info
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await userService.updateProfile({
        username: editProfileData.username,
        email: editProfileData.email
      });
      const msg = res?.message || (typeof res === 'string' ? res : 'Cập nhật thông tin cá nhân thành công!');
      alert(msg);
      setIsEditingProfile(false);
      fetchProfile();
    } catch (err) {
      const errorMsg = typeof err === 'string' 
        ? err 
        : (err?.message || (err?.errors ? Object.values(err.errors).flat().join(', ') : 'Cập nhật thất bại. Vui lòng kiểm tra lại.'));
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu mới nhập lại không khớp!');
      return;
    }
    setLoading(true);
    try {
      await userService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      alert('Đổi mật khẩu thành công!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      alert('Đổi mật khẩu thất bại: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  // Address actions
  const handleOpenAddressForm = (address = null) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        addressLine: address.addressLine,
        wardId: address.wardId || '',
        isDefault: address.isDefault
      });
      setSelectedProvinceId(address.provinceId || '');
    } else {
      setEditingAddressId(null);
      setAddressForm({
        recipientName: '',
        phoneNumber: '',
        addressLine: '',
        wardId: '',
        isDefault: shippingInfos.length === 0 // Default true if first address
      });
      setSelectedProvinceId('');
    }
    setIsAddressFormOpen(true);
  };

  // Hàm xử lý logic/sự kiện: handleProvinceChange
  const handleProvinceChange = (provinceId) => {
    setSelectedProvinceId(provinceId);
    setAddressForm(prev => ({
      ...prev,
      wardId: ''
    }));
  };

  // Hàm xử lý logic/sự kiện: handleWardChange
  const handleWardChange = (wardId) => {
    setAddressForm(prev => ({
      ...prev,
      wardId: wardId
    }));
  };

  // Hàm xử lý logic/sự kiện: handleSaveAddress
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.wardId) {
      alert('Vui lòng chọn Phường / Xã.');
      return;
    }
    setLoading(true);
    try {
      // Khai báo biến/hằng số: payload - Dùng trong logic xử lý của component
      const payload = {
        recipientName: addressForm.recipientName,
        phoneNumber: addressForm.phoneNumber,
        addressLine: addressForm.addressLine.trim(),
        wardId: addressForm.wardId,
        isDefault: addressForm.isDefault
      };

      if (editingAddressId) {
        await shippingInfoService.update(editingAddressId, payload);
        alert('Cập nhật địa chỉ thành công!');
      } else {
        await shippingInfoService.create(payload);
        alert('Thêm địa chỉ giao hàng thành công!');
      }
      setIsAddressFormOpen(false);
      fetchShippingInfos();
    } catch (err) {
      alert('Lưu địa chỉ thất bại: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý logic/sự kiện: handleDeleteAddress
  const handleDeleteAddress = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        await shippingInfoService.delete(id);
        alert('Đã xóa địa chỉ thành công!');
        fetchShippingInfos();
      } catch (err) {
        alert('Lỗi: ' + (err.message || 'Không thể xóa địa chỉ.'));
      }
    }
  };

  // ================= IF LOGGED IN: RENDER PROFILE PANEL =================
  if (isLoggedIn) {
    return (
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 py-6 font-sans">
        <Breadcrumb items={[{ label: 'Trang cá nhân của bạn' }]} />

        <div className="flex flex-col md:flex-row gap-6 mt-6">
          {/* Sidebar */}
          <ProfileSidebar
            userProfile={userProfile}
            profileTab={profileTab}
            setProfileTab={setProfileTab}
            setSelectedOrder={setSelectedOrder}
            handleLogout={handleLogout}
          />

          {/* Main Panel Content */}
          <main className="flex-1 bg-white rounded-md border border-gray-200 p-6">

            {profileTab === 'info' && (
              <ProfileInfoTab
                userProfile={userProfile}
                isEditingProfile={isEditingProfile}
                setIsEditingProfile={setIsEditingProfile}
                editProfileData={editProfileData}
                setEditProfileData={setEditProfileData}
                handleUpdateProfile={handleUpdateProfile}
                formatDate={formatDate}
                loading={loading}
                onRefreshProfile={fetchProfile}
              />
            )}

            {profileTab === 'addresses' && (
              <ProfileAddressTab
                shippingInfos={shippingInfos}
                infoLoading={infoLoading}
                isAddressFormOpen={isAddressFormOpen}
                setIsAddressFormOpen={setIsAddressFormOpen}
                editingAddressId={editingAddressId}
                handleOpenAddressForm={handleOpenAddressForm}
                handleDeleteAddress={handleDeleteAddress}
                addressForm={addressForm}
                setAddressForm={setAddressForm}
                provinces={provinces}
                selectedProvinceId={selectedProvinceId}
                handleProvinceChange={handleProvinceChange}
                wards={wards}
                handleWardChange={handleWardChange}
                handleSaveAddress={handleSaveAddress}
                loading={loading}
              />
            )}

            {(profileTab === 'track' || profileTab === 'history') && (
              <ProfileTrackOrderTab />
            )}

            {profileTab === 'warranties' && (
              <ProfileWarrantyDevicesTab />
            )}

            {profileTab === 'password' && (
              <ProfilePasswordTab
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                handleChangePassword={handleChangePassword}
                loading={loading}
              />
            )}

          </main>
        </div>
      </div>
    );
  }

  // ================= IF NOT LOGGED IN =================
  return (
    <AuthGuestForms
      isLogin={isLogin}
      setIsLogin={setIsLogin}
      username={username}
      setUsername={setUsername}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      loading={loading}
      error={error}
      setError={setError}
      handleAuth={handleAuth}
      isForgotPassword={isForgotPassword}
      setIsForgotPassword={setIsForgotPassword}
      resetUsername={resetUsername}
      setResetUsername={setResetUsername}
      resetEmail={resetEmail}
      setResetEmail={setResetEmail}
      resetNewPassword={resetNewPassword}
      setResetNewPassword={setResetNewPassword}
      resetConfirmPassword={resetConfirmPassword}
      setResetConfirmPassword={setResetConfirmPassword}
      forgotPasswordStep={forgotPasswordStep}
      setForgotPasswordStep={setForgotPasswordStep}
      forgotPasswordOtp={forgotPasswordOtp}
      forgotPasswordError={forgotPasswordError}
      handleSendResetOtp={handleSendResetOtp}
      handleVerifyResetOtp={handleVerifyResetOtp}
      handleResendResetOtp={handleResendResetOtp}
      handleForgotPasswordSubmit={handleForgotPasswordSubmit}
    />
  );
}
