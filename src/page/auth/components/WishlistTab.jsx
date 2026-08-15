import { useState, useEffect } from 'react';
import { Heart, Bell, Package, Trash2, ExternalLink, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { wishlistService } from '../../../services/wishlistService';

export default function WishlistTab() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await wishlistService.getWishlist();
      setWishlistItems(res || []);
    } catch (err) {
      console.error('Lỗi lấy wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleToggleNotification = async (item, type) => {
    setUpdatingId(item.id);
    const newPriceDrop = type === 'priceDrop' ? !item.notifyOnPriceDrop : item.notifyOnPriceDrop;
    const newRestock = type === 'restock' ? !item.notifyOnRestock : item.notifyOnRestock;

    try {
      await wishlistService.updateNotificationSettings(item.productId, newPriceDrop, newRestock);
      setWishlistItems((prev) =>
        prev.map((w) =>
          w.id === item.id
            ? { ...w, notifyOnPriceDrop: newPriceDrop, notifyOnRestock: newRestock }
            : w
        )
      );
    } catch (err) {
      console.error('Lỗi cập nhật cài đặt thông báo:', err);
      alert('Cập nhật cài đặt thông báo thất bại.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách yêu thích?')) return;
    try {
      await wishlistService.toggleWishlist(productId);
      setWishlistItems((prev) => prev.filter((w) => w.productId !== productId));
    } catch (err) {
      console.error('Lỗi xóa wishlist:', err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang tải sản phẩm yêu thích...
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <Heart className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4 stroke-1" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chưa có sản phẩm yêu thích</h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
          Hãy bấm vào biểu tượng Trái tim ❤️ ở các sản phẩm bạn ưa thích để dễ dàng theo dõi biến động giá và tồn kho!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-blue-500/20"
        >
          <ShoppingBag className="w-4 h-4" />
          Khám phá sản phẩm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            Sản phẩm đã lưu ({wishlistItems.length})
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Quản lý các sản phẩm bạn quan tâm và bật/tắt thông báo biến động giá hoặc hàng về kho.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wishlistItems.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Top row: Image + Details */}
            <div className="flex gap-4 mb-4">
              <Link to={`/product/${item.productSlug}`} className="shrink-0 group">
                <img
                  src={item.productImage || '/placeholder.png'}
                  alt={item.productName}
                  className="w-20 h-20 object-contain rounded-xl border border-gray-100 dark:border-slate-800 bg-white p-1.5 group-hover:scale-105 transition-transform"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.productSlug}`}
                  className="font-semibold text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 transition-colors flex items-center gap-1"
                >
                  {item.productName}
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0 inline" />
                </Link>

                <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {item.minPrice === item.maxPrice
                      ? formatPrice(item.minPrice)
                      : `${formatPrice(item.minPrice)} - ${formatPrice(item.maxPrice)}`}
                  </span>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      item.totalStock > 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {item.totalStock > 0 ? `Còn hàng (${item.totalStock})` : 'Hết hàng'}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Toggles & Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle Price Drop */}
                <button
                  type="button"
                  disabled={updatingId === item.id}
                  onClick={() => handleToggleNotification(item, 'priceDrop')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    item.notifyOnPriceDrop
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-400 line-through opacity-70'
                  }`}
                  title="Thông báo khi giá giảm"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Giảm giá</span>
                </button>

                {/* Toggle Restock */}
                <button
                  type="button"
                  disabled={updatingId === item.id}
                  onClick={() => handleToggleNotification(item, 'restock')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    item.notifyOnRestock
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 font-medium'
                      : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-400 line-through opacity-70'
                  }`}
                  title="Thông báo khi có hàng lại"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Hàng về</span>
                </button>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(item.productId)}
                className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Xóa khỏi danh sách yêu thích"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
