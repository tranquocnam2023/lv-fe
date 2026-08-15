import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { wishlistService } from '../../services/wishlistService';

export default function WishlistButton({ productId, className = '', iconSize = 20 }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');
    if (token && productId) {
      wishlistService.checkWishlistStatus(productId)
        .then((res) => {
          if (isMounted) setIsSaved(!!res?.isSaved);
        })
        .catch(() => {
          if (isMounted) setIsSaved(false);
        });
    }
    return () => { isMounted = false; };
  }, [productId]);

  const handleToggle = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích!');
      return;
    }

    setLoading(true);
    try {
      const res = await wishlistService.toggleWishlist(productId);
      setIsSaved(!!res?.isSaved);
      window.dispatchEvent(new CustomEvent('wishlist-change', { detail: { productId, isSaved: !!res?.isSaved } }));
    } catch (err) {
      console.error('Lỗi toggle wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={isSaved ? 'Xóa khỏi yêu thích' : 'Lưu sản phẩm yêu thích'}
      className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
        isSaved
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50'
          : 'bg-white/80 dark:bg-slate-800/80 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
      } shadow-xs border border-gray-200/60 dark:border-slate-700/60 ${className}`}
    >
      <Heart
        size={iconSize}
        className={`transition-all ${isSaved ? 'fill-rose-500 text-rose-500 scale-110' : 'scale-100'}`}
      />
    </button>
  );
}
