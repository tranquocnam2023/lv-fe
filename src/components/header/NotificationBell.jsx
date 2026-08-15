import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Package, Tag, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await notificationService.getNotifications();
      if (res) {
        setNotifications(res.items || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Lỗi lấy thông báo:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Event listener cho thông báo mới hoặc đăng nhập/xuất
    const handleAuthChange = () => fetchNotifications();
    window.addEventListener('auth-change', handleAuthChange);

    // Click outside to close dropdown
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Poll định kỳ 30 giây để cập nhật thông báo mới
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const handleMarkAsRead = async (id, productSlug) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (productSlug) {
        setIsOpen(false);
        navigate(`/product/${productSlug}`);
      }
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    if (type === 'PriceDrop') return <Tag className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (type === 'Restock') return <Package className="w-4 h-4 text-blue-500 shrink-0" />;
    return <Info className="w-4 h-4 text-purple-500 shrink-0" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer border-0 bg-transparent"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-slate-800 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between bg-gray-50/80 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 text-xs font-semibold rounded-full">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Body List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
                <p className="text-xs">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id, item.productSlug)}
                  className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 ${
                    !item.isRead
                      ? 'bg-blue-50/40 dark:bg-blue-950/20'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.title}
                      className="w-10 h-10 object-contain rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shrink-0 p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-semibold truncate ${!item.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 block">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
