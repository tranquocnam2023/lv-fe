import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, User, Clock, ArrowLeft, Tag, 
  ChevronRight, BookOpen, Newspaper 
} from 'lucide-react';
import api from '../../services/api';
import { blogService } from '../../services/Blog';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendOrigin = (import.meta.env.VITE_API_URL || api.defaults?.baseURL || 'https://localhost:7279/api')
    .replace(/\/api\/?$/, '');
  
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendOrigin}${cleanPath}`;
};

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(12);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchBlogDetail();
  }, [id]);

  const fetchBlogDetail = async () => {
    setLoading(true);
    try {
      // 1. Tải chi tiết bài viết hiện tại (Thử lấy theo Slug, nếu không được lấy theo ID)
      const isNumeric = !isNaN(id) && !isNaN(parseFloat(id));
      let res;
      try {
        res = isNumeric ? await blogService.getBlog(id) : await blogService.getBlogBySlug(id);
      } catch (errSlug) {
        res = isNumeric ? await blogService.getBlogBySlug(id) : await blogService.getBlog(id);
      }
      const data = res.data || res;
      setBlog(data);

      // 2. Tải bài viết liên quan / mới nhất
      const listRes = await blogService.getBlogs({ isPublished: true });
      const listData = listRes.data || listRes;
      const allBlogs = Array.isArray(listData) ? listData : (listData.items || []);
      const otherBlogs = allBlogs.filter(b => String(b.id) !== String(data.id) && b.slug !== id);
      setRelatedBlogs(otherBlogs.slice(0, 5));
    } catch (err) {
      console.error('Lỗi tải bài viết:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-gray-500 text-sm">Đang tải nội dung bài viết...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
          <BookOpen size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-800">Không tìm thấy bài viết</h2>
        <p className="text-gray-500 text-sm">Bài viết bạn tìm kiếm có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-300">
      
      {/* ── BREADCRUMB NAVIGATION ── */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 overflow-x-auto pb-1">
        <Link to="/" className="hover:text-blue-600 transition-colors shrink-0 flex items-center gap-1">
          <span>Trang chủ</span>
        </Link>
        <ChevronRight size={13} className="shrink-0 text-gray-300" />
        <Link to="/blog" className="hover:text-blue-600 transition-colors shrink-0">
          Tin tức &amp; Blog
        </Link>
        {blog.category && (
          <>
            <ChevronRight size={13} className="shrink-0 text-gray-300" />
            <Link 
              to={`/blog?category=${encodeURIComponent(blog.category)}`} 
              className="hover:text-blue-600 transition-colors shrink-0"
            >
              {blog.category}
            </Link>
          </>
        )}
        <ChevronRight size={13} className="shrink-0 text-gray-300" />
        <span className="text-gray-900 font-bold truncate max-w-sm">
          {blog.title || blog.name}
        </span>
      </nav>

      {/* ── MAIN CONTENT & SIDEBAR GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: MAIN ARTICLE (8 COLS) */}
        <article className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          
          {/* Header Info */}
          <div className="space-y-4">
            {blog.category && (
              <span className="inline-block bg-blue-600/10 text-blue-700 text-xs font-extrabold px-3.5 py-1.5 rounded-xl uppercase tracking-wider">
                {blog.category}
              </span>
            )}

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
              {blog.title || blog.name}
            </h1>

            {/* Author & Date Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-gray-100 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-gray-800 font-bold">
                  <User size={15} className="text-blue-600" />
                  <span>{blog.authorName || blog.author || 'Ban Biên Tập PhoneShop'}</span>
                </span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('vi-VN') : 'Mới xuất bản'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock size={14} />
                  <span>3 phút đọc</span>
                </span>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {blog.thumbnailUrl && (
            <div className="w-full max-h-[420px] rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100 relative group">
              <img
                src={getMediaUrl(blog.thumbnailUrl)}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Excerpt / Summary Quote */}
          {blog.summary && (
            <div className="p-4 md:p-5 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-l-4 border-blue-600 rounded-r-2xl text-blue-950 font-bold text-sm leading-relaxed italic shadow-xs">
              "{blog.summary}"
            </div>
          )}

          {/* Detailed Article Body */}
          <div className="text-gray-800 text-base md:text-lg leading-relaxed space-y-5 font-normal whitespace-pre-line border-t border-gray-100 pt-6">
            {blog.content}
          </div>

          {/* Tags */}
          {blog.tags && (
            <div className="pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              <Tag size={15} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thẻ bài viết:</span>
              {blog.tags.split(',').map((tag, idx) => (
                <span key={idx} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}


        </article>

        {/* RIGHT COLUMN: SIDEBAR RELATED POSTS (4 COLS) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Card: Bài viết liên quan */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 sticky top-24">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Newspaper size={18} className="text-blue-600" />
              <span>Bài viết khác dành cho bạn</span>
            </h3>

            <div className="space-y-4">
              {relatedBlogs.map(item => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/blog/${item.id}`)}
                  className="group flex gap-3 items-center cursor-pointer p-2 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  {/* Small Thumbnail */}
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 relative">
                    {item.thumbnailUrl ? (
                      <img
                        src={getMediaUrl(item.thumbnailUrl)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold bg-slate-100">
                        Blog
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-xs leading-snug">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium block mt-1">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Xem tất cả bài viết trên Trang Chủ
              </button>
            </div>
          </div>

        </aside>
      </div>

    </div>
  );
}
