// src/page/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

export default function AuthPage() {
  const location = useLocation();

  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  // Check login state
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const initialUser = userJson ? JSON.parse(userJson) : null;
  const isLoggedIn = !!(initialUser && token);

  // Profile management state
  const [profileTab, setProfileTab] = useState('info'); // 'info', 'addresses', 'password', 'history'

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['info', 'addresses', 'password', 'history'].includes(tab)) {
      setProfileTab(tab);
    }
  }, [location.search]);

  const [userProfile, setUserProfile] = useState(initialUser);
  const [shippingInfos, setShippingInfos] = useState([]);
  const [infoLoading, setInfoLoading] = useState(false);

  // Lịch sử đơn hàng
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Profile edit state
  const [editProfileData, setEditProfileData] = useState({ username: '', email: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  // Address Form state
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phoneNumber: '',
    addressLine: '',
    wardId: '',
    isDefault: false
  });

  const { formatDate } = useFormat();

  // Fetch user profile from API to sync
  const fetchProfile = () => {
    if (!isLoggedIn) return;
    userService.getProfile()
      .then(res => {
        if (res) {
          setUserProfile(res);
          setEditProfileData({ username: res.username, email: res.email });
          // Đồng bộ lại localStorage
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...localUser, ...res }));
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

  const fetchMyOrders = (updatedSelectedId = null) => {
    if (!isLoggedIn) return;
    setOrdersLoading(true);
    orderService.getMyOrders()
      .then(res => {
        if (Array.isArray(res)) {
          setOrders(res);
          if (updatedSelectedId) {
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

  const handleGoogleLoginSuccess = async (response) => {
    setLoading(true);
    setError('');
    try {
      const idToken = response.credential;
      const loginData = await authService.googleLogin(idToken);
      const token = loginData.token || loginData.accessToken || (loginData.data && loginData.data.token);
      if (token) {
        localStorage.setItem('token', token);
        
        // Giải mã JWT của Google để lấy Tên và Email người dùng
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const googlePayload = JSON.parse(jsonPayload);
        
        localStorage.setItem('user', JSON.stringify({
          id: loginData.id,
          username: googlePayload.name || 'Khách hàng',
          email: googlePayload.email || '',
          role: loginData.role
        }));

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
      const initGoogleBtn = () => {
        if (window.google) {
          const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "702529174883-k7q714ds1n185oaabhl85hfhhqhqg7dq.apps.googleusercontent.com";
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleLoginSuccess
          });
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
      
      const timer = setInterval(() => {
        if (window.google) {
          initGoogleBtn();
          clearInterval(timer);
        }
      }, 500);

      return () => clearInterval(timer);
    }
  }, [isLoggedIn, isLogin]);

  // Handle Login / Register
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const data = await authService.login({
          username: username,
          password: password
        });

        const userToken = data.token || data.accessToken || (data.data && data.data.token);
        if (userToken) {
          data.username = username;
          localStorage.setItem('token', userToken);
          localStorage.setItem('user', JSON.stringify(data));
          
          if (data.role === 'Admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        } else {
          setError('Không nhận được token từ server!');
          setLoading(false);
          return;
        }
      } else {
        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp.');
          setLoading(false);
          return;
        }
        await authService.register({
          username: username,
          email: email,
          password: password
        });

        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
        setConfirmPassword('');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : 'Lỗi từ server');
      } else {
        setError(err.message || (isLogin ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại.' : 'Đăng ký thất bại.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate 6-digit OTP
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Step 1: Send Reset OTP
  const handleSendResetOtp = (e) => {
    if (e) e.preventDefault();
    if (!resetUsername.trim() || !resetEmail.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và email.');
      return;
    }
    setLoading(true);
    setError('');
    
    // Simulate API delay
    setTimeout(() => {
      const code = generateOtp();
      setForgotPasswordOtp(code);
      setForgotPasswordStep(2);
      setLoading(false);
    }, 800);
  };

  // Step 2: Verify Reset OTP
  const handleVerifyResetOtp = (otpCode) => {
    setLoading(true);
    setForgotPasswordError('');
    
    setTimeout(() => {
      if (otpCode === forgotPasswordOtp) {
        setForgotPasswordStep(3);
        setForgotPasswordError('');
      } else {
        setForgotPasswordError('Mã OTP không chính xác. Vui lòng nhập lại!');
      }
      setLoading(false);
    }, 600);
  };

  // Resend OTP
  const handleResendResetOtp = () => {
    const code = generateOtp();
    setForgotPasswordOtp(code);
    setForgotPasswordError('');
  };

  // Step 3: Handle Forgot Password Submit
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (resetNewPassword !== resetConfirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword({
        username: resetUsername,
        email: resetEmail,
        newPassword: resetNewPassword
      });
      alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      setIsForgotPassword(false);
      setForgotPasswordStep(1);
      setForgotPasswordOtp('');
      setUsername(resetUsername);
      setIsLogin(true);
      // Clear fields
      setResetUsername('');
      setResetEmail('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (err) {
      if (err.response && err.response.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : 'Đặt lại mật khẩu thất bại.');
      } else {
        setError(err.message || 'Đặt lại mật khẩu thất bại.');
      }
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
      await userService.updateProfile({
        username: editProfileData.username,
        email: editProfileData.email
      });
      alert('Cập nhật thông tin cá nhân thành công!');
      setIsEditingProfile(false);
      fetchProfile();
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.message || JSON.stringify(err)));
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

  const handleProvinceChange = (provinceId) => {
    setSelectedProvinceId(provinceId);
    setAddressForm(prev => ({
      ...prev,
      wardId: ''
    }));
  };

  const handleWardChange = (wardId) => {
    setAddressForm(prev => ({
      ...prev,
      wardId: wardId
    }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.wardId) {
      alert('Vui lòng chọn Phường / Xã.');
      return;
    }
    setLoading(true);
    try {
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

            {profileTab === 'password' && (
              <ProfilePasswordTab
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                handleChangePassword={handleChangePassword}
                loading={loading}
              />
            )}

            {profileTab === 'history' && (
              <ProfileOrderHistoryTab
                orders={orders}
                ordersLoading={ordersLoading}
                selectedOrder={selectedOrder}
                setSelectedOrder={setSelectedOrder}
                fetchMyOrders={fetchMyOrders}
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
