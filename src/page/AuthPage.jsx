import { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { shippingInfoService } from '../services/shippingInfoService';
import { orderService } from '../services/orderService';
import OrderDetailsTracker from '../components/OrderDetailsTracker';
import { User, MapPin, Key, Trash2, Edit2, Plus, Check, X, ShieldAlert, LogOut, CheckCircle, ClipboardList, ArrowLeft } from 'lucide-react';
import { useFormat } from '../hooks/useFormat';
import OtpVerification from '../components/OtpVerification';
import api from '../services/api';

export default function AuthPage() {

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
  const [provinceSearch, setProvinceSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');
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
          const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "702529174883-iffoamg48nsk77o02opdvoptl2rhnecb.apps.googleusercontent.com";
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
        district: '',
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
        district: '',
        wardId: '',
        isDefault: shippingInfos.length === 0 // Default true if first address
      });
      setSelectedProvinceId('');
    }
    setProvinceSearch('');
    setWardSearch('');
    setIsAddressFormOpen(true);
  };

  const handleProvinceChange = (e) => {
    const provinceId = e.target.value;
    setSelectedProvinceId(provinceId);
    setWardSearch('');
    setAddressForm(prev => ({
      ...prev,
      wardId: ''
    }));
  };

  const handleWardChange = (e) => {
    const wardId = e.target.value;
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
      const combinedAddressLine = addressForm.district
        ? `${addressForm.addressLine.trim()}, ${addressForm.district.trim()}`
        : addressForm.addressLine.trim();

      const payload = {
        recipientName: addressForm.recipientName,
        phoneNumber: addressForm.phoneNumber,
        addressLine: combinedAddressLine,
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

  const filteredProvinces = provinces.filter(p => {
    const matchesSearch = (p.fullName || p.name || '').toLowerCase().includes(provinceSearch.toLowerCase());
    const isCurrentlySelected = String(p.id) === String(selectedProvinceId);
    return matchesSearch || isCurrentlySelected;
  });

  const filteredWards = wards.filter(w => {
    const matchesSearch = (w.fullName || w.name || '').toLowerCase().includes(wardSearch.toLowerCase());
    const isCurrentlySelected = String(w.id) === String(addressForm.wardId);
    return matchesSearch || isCurrentlySelected;
  });

  // ================= IF LOBBED IN: RENDER PROFILE PANEL (TGDĐ / ĐMX Style) =================
  if (isLoggedIn) {
    return (
      <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: 'Trang cá nhân của bạn' }]} />

        <div className="flex flex-col md:flex-row gap-6 mt-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 bg-white rounded-md border border-gray-200 p-4 h-fit">
            <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-white text-lg">
                {(userProfile?.username || 'U')[0].toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-gray-800 truncate">{userProfile?.username}</span>
                <span className="text-xs text-gray-500 truncate">{userProfile?.email}</span>
                <span className="text-[10px] uppercase font-bold text-primary mt-0.5">{userProfile?.role}</span>
              </div>
            </div>

            <nav className="flex flex-col space-y-1">
              <button
                onClick={() => setProfileTab('info')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold transition-all text-left ${profileTab === 'info'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <User size={18} />
                <span>Thông tin tài khoản</span>
              </button>

              <button
                onClick={() => setProfileTab('addresses')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold transition-all text-left ${profileTab === 'addresses'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <MapPin size={18} />
                <span>Sổ địa chỉ nhận hàng</span>
              </button>

              <button
                onClick={() => { setProfileTab('history'); setSelectedOrder(null); }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold transition-all text-left ${profileTab === 'history'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <ClipboardList size={18} />
                <span>Lịch sử mua hàng</span>
              </button>

              <button
                onClick={() => setProfileTab('password')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold transition-all text-left ${profileTab === 'password'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Key size={18} />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold text-red-600 hover:bg-red-50 transition-all text-left mt-4 border-t border-gray-100 pt-4"
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </nav>
          </aside>

          {/* Main Panel Content */}
          <main className="flex-1 bg-white rounded-md border border-gray-200 p-6">

            {/* 1. Account Info Tab */}
            {profileTab === 'info' && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-xl font-bold text-gray-800">Thông tin tài khoản cá nhân</h3>
                  <p className="text-xs text-gray-500">Quản lý tên hiển thị và email nhận hóa đơn của bạn</p>
                </div>

                {!isEditingProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-md border border-gray-100">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Họ và tên</span>
                      <p className="font-bold text-gray-800 text-lg">{userProfile?.username}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Email</span>
                      <p className="font-bold text-gray-800 text-lg">{userProfile?.email}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Ngày đăng ký</span>
                      <p className="font-bold text-gray-800">{formatDate(userProfile?.createdAt)}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Vai trò tài khoản</span>
                      <p className="font-bold text-primary">{userProfile?.role}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 font-bold uppercase">Điểm tích lũy Quà Tặng VIP</span>
                      <p className="font-bold text-yellow-600 text-lg">{(userProfile?.rewardPoints || 0).toLocaleString('vi-VN')} điểm</p>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-gray-200/50 flex justify-end">
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm"
                      >
                        Chỉnh sửa thông tin
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Tên tài khoản (Họ tên)</label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-sm font-semibold"
                        value={editProfileData.username}
                        onChange={(e) => setEditProfileData({ ...editProfileData, username: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Email liên lạc</label>
                      <input
                        type="email"
                        required
                        className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-sm font-semibold"
                        value={editProfileData.email}
                        onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-md hover:bg-gray-200 transition text-sm"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm"
                      >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 2. Addresses Tab */}
            {profileTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Sổ địa chỉ nhận hàng</h3>
                    <p className="text-xs text-gray-500">Quản lý danh sách các địa chỉ giao nhận hàng của bạn</p>
                  </div>
                  {!isAddressFormOpen && (
                    <button
                      onClick={() => handleOpenAddressForm()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm"
                    >
                      <Plus size={16} />
                      <span>Thêm địa chỉ</span>
                    </button>
                  )}
                </div>

                {isAddressFormOpen ? (
                  <form onSubmit={handleSaveAddress} className="space-y-4 max-w-lg bg-gray-50 p-6 rounded-md border border-gray-200">
                    <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-2">
                      {editingAddressId ? 'Cập nhật địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tên người nhận</label>
                        <input
                          type="text"
                          required
                          placeholder="Họ và tên..."
                          className="w-full border border-gray-300 p-2.5 rounded-md text-sm font-semibold focus:outline-none focus:border-primary"
                          value={addressForm.recipientName}
                          onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label>
                        <input
                          type="text"
                          required
                          placeholder="SĐT liên hệ..."
                          className="w-full border border-gray-300 p-2.5 rounded-md text-sm font-semibold focus:outline-none focus:border-primary"
                          value={addressForm.phoneNumber}
                          onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ chi tiết (Số nhà, tên đường)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: 120/5 Nguyễn Văn Cừ..."
                          className="w-full border border-gray-300 p-2.5 rounded-md text-sm font-semibold focus:outline-none focus:border-primary"
                          value={addressForm.addressLine}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tỉnh / Thành phố *</label>
                        <input
                          type="text"
                          placeholder="🔍 Tìm nhanh Tỉnh/Thành..."
                          value={provinceSearch}
                          onChange={(e) => setProvinceSearch(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-md text-xs font-semibold focus:outline-none focus:border-primary mb-1"
                        />
                        <select
                          required
                          value={selectedProvinceId}
                          onChange={handleProvinceChange}
                          className="w-full border border-gray-300 p-2.5 rounded-md text-sm font-semibold focus:outline-none focus:border-primary"
                        >
                          <option value="">Chọn Tỉnh/Thành phố</option>
                          {filteredProvinces.map(p => (
                            <option key={p.id} value={p.id}>{p.fullName || p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Quận / Huyện</label>
                        <input
                          type="text"
                          placeholder="Quận/Huyện..."
                          className="w-full border border-gray-300 p-2.5 rounded-md text-sm font-semibold focus:outline-none focus:border-primary"
                          value={addressForm.district}
                          onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Phường / Xã *</label>
                        {selectedProvinceId && (
                          <input
                            type="text"
                            placeholder="🔍 Tìm nhanh Phường/Xã..."
                            value={wardSearch}
                            onChange={(e) => setWardSearch(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded-md text-xs font-semibold focus:outline-none focus:border-primary mb-1"
                          />
                        )}
                        <select
                          required
                          value={addressForm.wardId}
                          onChange={handleWardChange}
                          disabled={!selectedProvinceId}
                          className="w-full border border-gray-300 p-2.5 rounded-md text-sm font-semibold focus:outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="">Chọn Phường/Xã</option>
                          {filteredWards.map(w => (
                            <option key={w.id} value={w.id}>{w.fullName || w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        checked={addressForm.isDefault}
                        disabled={!editingAddressId && shippingInfos.length === 0} // Lock to true if first address
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      />
                      <label htmlFor="isDefault" className="text-xs font-bold text-gray-700 cursor-pointer">Đặt làm địa chỉ nhận hàng mặc định</label>
                    </div>

                    <div className="flex gap-3 pt-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddressFormOpen(false)}
                        className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-100 transition text-sm"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm"
                      >
                        {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {infoLoading ? (
                      <div className="flex justify-center items-center py-10 text-primary gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-bold text-xs">Đang tải sổ địa chỉ...</span>
                      </div>
                    ) : shippingInfos.length > 0 ? (
                      shippingInfos.map((item) => (
                        <div
                          key={item.id}
                          className={`p-5 rounded-md border flex justify-between items-start transition-all ${item.isDefault
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 text-base">{item.recipientName}</span>
                              {item.isDefault && (
                                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-primary text-white font-bold text-[10px] rounded-full uppercase">
                                  <Check size={8} /> Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 font-medium">Số điện thoại: <strong className="text-gray-700">{item.phoneNumber}</strong></p>
                            <p className="text-gray-600">Địa chỉ: {item.addressLine}{item.wardName ? `, ${item.wardName}` : ''}{item.provinceName ? `, ${item.provinceName}` : ''}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenAddressForm(item)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                              title="Sửa địa chỉ"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(item.id)}
                              disabled={item.isDefault && shippingInfos.length > 1} // Can't delete default unless it's the last one
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30"
                              title="Xóa địa chỉ"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-gray-50 rounded-md border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                        <MapPin size={48} className="mb-2 opacity-50 text-gray-300" />
                        <p className="font-bold text-gray-600">Bạn chưa có địa chỉ nhận hàng nào</p>
                        <p className="text-xs mt-0.5">Vui lòng bấm nút "Thêm địa chỉ" để nhận hàng khi đặt sản phẩm</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Password Tab */}
            {profileTab === 'password' && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-xl font-bold text-gray-800">Đổi mật khẩu tài khoản</h3>
                  <p className="text-xs text-gray-500">Nên sử dụng mật khẩu mạnh có chứa chữ, số và ký tự đặc biệt</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      required
                      className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-sm font-semibold"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-sm font-semibold"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-sm font-semibold"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm"
                    >
                      {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 4. Lịch sử đơn hàng Tab */}
            {profileTab === 'history' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Lịch sử đơn hàng của bạn</h3>
                    <p className="text-xs text-gray-500">Xem trạng thái giao nhận và lịch sử các đơn hàng đã đặt</p>
                  </div>
                  {selectedOrder && (
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-bold text-gray-600 transition-all flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Quay lại danh sách
                    </button>
                  )}
                </div>

                {selectedOrder ? (
                  <OrderDetailsTracker order={selectedOrder} onOrderCancelled={() => fetchMyOrders(selectedOrder.id)} />
                ) : ordersLoading ? (
                  <div className="flex justify-center items-center py-10 text-primary gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-xs">Đang tải lịch sử đơn hàng...</span>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 rounded-md border border-gray-200 hover:border-gray-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white"
                      >
                        <div className="space-y-1.5 text-xs text-gray-500 font-bold">
                          <p className="text-sm font-black text-gray-800">Mã đơn hàng: #PS{item.id}</p>
                          <p>Ngày đặt: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                          <p className="text-gray-600">Sản phẩm: {item.items ? item.items.map(i => `${i.productName} (${i.quantity})`).join(', ') : 'Chưa cập nhật'}</p>
                          <p className="text-red-600 font-black text-sm">Tổng cộng: {item.totalPrice.toLocaleString('vi-VN')}₫</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wide border ${
                            item.status === 'Delivered' || item.status === 'Completed'
                              ? 'bg-green-50 border-green-200 text-green-600'
                              : item.status === 'Shipping' || item.status === 'Shipped'
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : 'bg-orange-50 border-orange-200 text-orange-500'
                          }`}>
                            {item.status === 'Pending' ? 'Chờ xác nhận' :
                             item.status === 'Confirmed' ? 'Đã xác nhận' :
                             item.status === 'Processing' ? 'Đang đóng gói' :
                             item.status === 'Shipping' || item.status === 'Shipped' ? 'Đang giao hàng' :
                             item.status === 'Delivered' || item.status === 'Completed' ? 'Đã giao hàng' : item.status}
                          </span>
                          <button
                            onClick={() => setSelectedOrder(item)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-md transition-all"
                          >
                            Theo dõi đơn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-md border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <ClipboardList size={48} className="mb-2 opacity-50 text-gray-300" />
                    <p className="font-bold text-gray-600">Bạn chưa mua đơn hàng nào</p>
                    <p className="text-xs mt-0.5">Các đơn hàng bạn mua sẽ xuất hiện tại đây để theo dõi hành trình giao nhận</p>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    );
  }

  // ================= IF NOT LOGGED IN: RENDER LOGIN/REGISTER FORM =================
  if (isForgotPassword) {
    return (
      <div className="flex flex-col h-full w-full">
        <Breadcrumb items={[{ label: 'Quên mật khẩu' }]} />
        <div className="flex justify-center items-start pt-6 w-full px-4">
          <div className="bg-white border border-bordercustom p-8 rounded-md w-full max-w-md space-y-4">
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${forgotPasswordStep >= 1 ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>1</div>
                <span className="text-[10px] font-semibold text-gray-500 mt-1">Nhập tài khoản</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 transition-all ${forgotPasswordStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${forgotPasswordStep >= 2 ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>2</div>
                <span className="text-[10px] font-semibold text-gray-500 mt-1">Xác thực OTP</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 transition-all ${forgotPasswordStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${forgotPasswordStep >= 3 ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>3</div>
                <span className="text-[10px] font-semibold text-gray-500 mt-1">Đổi mật khẩu</span>
              </div>
            </div>

            {error && forgotPasswordStep !== 2 && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            {/* STEP 1: Enter Username & Email */}
            {forgotPasswordStep === 1 && (
              <form className="flex flex-col space-y-4" onSubmit={handleSendResetOtp}>
                <h2 className="text-2xl font-bold text-primary mb-2 text-center">Yêu Cầu Đặt Lại Mật Khẩu</h2>
                <p className="text-xs text-gray-500 text-center font-medium mb-4">Nhập tên tài khoản và email đã đăng ký để nhận mã xác thực OTP.</p>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary text-sm font-semibold"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    placeholder="VD: email@example.com"
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary text-sm font-semibold"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold py-2.5 rounded mt-4 hover:bg-secondary transition uppercase flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>ĐANG XỬ LÝ...</span>
                    </>
                  ) : (
                    'GỬI MÃ XÁC NHẬN OTP'
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {forgotPasswordStep === 2 && (
              <OtpVerification
                email={resetEmail}
                mockOtp={forgotPasswordOtp}
                onVerify={handleVerifyResetOtp}
                onCancel={() => setForgotPasswordStep(1)}
                onResend={handleResendResetOtp}
                isSubmitting={loading}
                error={forgotPasswordError}
                title="Xác thực OTP"
                description="Hệ thống đã tạo mã xác nhận đổi mật khẩu, vui lòng nhập mã OTP để tiếp tục."
              />
            )}

            {/* STEP 3: Change Password */}
            {forgotPasswordStep === 3 && (
              <form className="flex flex-col space-y-4 animate-fade-in" onSubmit={handleForgotPasswordSubmit}>
                <h2 className="text-2xl font-bold text-primary mb-2 text-center">Thiết Lập Mật Khẩu Mới</h2>
                <p className="text-xs text-gray-500 text-center font-medium mb-4">Vui lòng nhập mật khẩu mới từ 6 ký tự để hoàn tất quy trình.</p>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu mới *</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary text-sm font-semibold"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary text-sm font-semibold"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white font-bold py-2.5 rounded mt-4 hover:bg-green-700 transition uppercase flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>ĐANG LƯU...</span>
                    </>
                  ) : (
                    'CẬP NHẬT MẬT KHẨU MỚI'
                  )}
                </button>
              </form>
            )}

            {forgotPasswordStep !== 2 && (
              <div className="text-center pt-2">
                <span 
                  className="text-primary font-bold text-sm cursor-pointer hover:underline" 
                  onClick={() => { setIsForgotPassword(false); setForgotPasswordStep(1); setError(''); }}
                >
                  Quay lại Đăng nhập
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Breadcrumb items={[{ label: isLogin ? 'Đăng nhập' : 'Đăng ký' }]} />
      <div className="flex justify-center items-start pt-6 w-full">
        <div className="bg-white border border-bordercustom p-8 rounded-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">
            {isLogin ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form className="flex flex-col space-y-4" onSubmit={handleAuth}>
            {isLogin ? (
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ Email hoặc Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Nhập email hoặc tên đăng nhập"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Tên người dùng</label>
                <input
                  type="text"
                  placeholder="Nhập tên người dùng"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Nhập địa chỉ Email"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Mật khẩu</label>
                {isLogin && (
                  <span 
                    onClick={() => { setIsForgotPassword(true); setError(''); }}
                    className="text-xs text-primary font-bold cursor-pointer hover:underline"
                  >
                    Quên mật khẩu?
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu để xác nhận"
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-white font-bold py-2 rounded mt-4 hover:bg-secondary transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ')}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase">Hoặc</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div id="google-signin-btn" className="w-full flex justify-center"></div>
          </form>

          <div className="mt-6 text-center text-sm">
            {isLogin ? (
              <p>Chưa có tài khoản? <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => { setIsLogin(false); setError(''); setUsername(''); setEmail(''); setPassword(''); setConfirmPassword(''); }}>Đăng ký ngay</span></p>
            ) : (
              <p>Đã có tài khoản? <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => { setIsLogin(true); setError(''); setUsername(''); setEmail(''); setPassword(''); setConfirmPassword(''); }}>Đăng nhập</span></p>
            )
            }
          </div>
        </div>
      </div>
    </div>
  );
}
