import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Home, Cpu, Star, Lightbulb, Tag, Folder, Search, 
  Eye, Calendar, User, ChevronRight, Newspaper, Flame, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { blogService } from '../../services/Blog';
import { THEME } from '../../utils/theme';

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategoryParam = searchParams.get('category') || 'ALL';

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(activeCategoryParam);

  // Sync category param with URL
  useEffect(() => {
    setActiveCategory(activeCategoryParam);
  }, [activeCategoryParam]);

  // Sidebar categories requested by user
  const categories = [
    { id: 'ALL', name: 'Tất cả (Trang chủ)', icon: Home },
    { id: 'Tin công nghệ', name: 'Tin công nghệ', icon: Cpu },
    { id: 'Đánh giá sản phẩm', name: 'Đánh giá sản phẩm', icon: Star },
    { id: 'Mẹo hay & Thủ thuật', name: 'Mẹo hay & Thủ thuật', icon: Lightbulb },
    { id: 'Khuyến mãi & Ưu đãi', name: 'Khuyến mãi & Ưu đãi', icon: Tag },
    { id: 'Chuyên mục khác', name: 'Chuyên mục khác', icon: Folder },
  ];

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await blogService.getBlogs();
      const data = res.data || res;
      const list = Array.isArray(data) ? data : (data.items || []);
      setBlogs(list);
    } catch (err) {
      console.error('Lỗi tải tin tức:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleCategorySelect = (catId) => {
    setActiveCategory(catId);
    if (catId === 'ALL') {
      setSearchParams({});
    } else {
      setSearchParams({ category: catId });
    }
  };

  // Filtered blogs by search and category
  const filteredBlogs = blogs.filter(item => {
    const titleMatch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (item.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!titleMatch) return false;

    if (activeCategory !== 'ALL') {
      const itemCat = (item.category || '').toLowerCase().trim();
      const targetCat = activeCategory.toLowerCase().trim();
      
      if (activeCategory === 'Chuyên mục khác') {
        const knownCats = ['tin công nghệ', 'đánh giá sản phẩm', 'mẹo hay & thủ thuật', 'khuyến mãi & ưu đãi'];
        if (knownCats.includes(itemCat)) return false;
      } else {
        if (!itemCat.includes(targetCat) && !targetCat.includes(itemCat)) return false;
      }
    }

    return true;
  });

  // Featured post (big banner card)
  const featuredPost = blogs.find(b => b.isFeatured) || blogs[0];
  const regularPosts = filteredBlogs.filter(b => b.id !== featuredPost?.id);

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16 pt-4 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── BREADCRUMB ── */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 font-semibold">
          <Link to="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Home size={14} />
            <span>Trang chủ</span>
          </Link>

          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-gray-800 font-bold">Tin tức - Blog Công Nghệ</span>
        </div>

        {/* ── MAIN LAYOUT: SIDEBAR + CONTENT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="lg:col-span-3 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs sticky top-20 z-20">
            <div className="flex items-center gap-2 px-3 py-2.5 mb-3 border-b border-gray-100 pb-3">
              <Newspaper className="text-blue-600" size={20} />
              <h2 className="font-black text-gray-900 text-sm uppercase tracking-wider">Chuyên mục tin tức</h2>
            </div>

            <nav className="space-y-1">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent size={17} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                      <span>{cat.name}</span>
                    </div>

                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── MAIN CONTENT AREA ── */}
          <main className="lg:col-span-9 space-y-6">

            {/* TOP BAR: SEARCH & HEADER */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span>{activeCategory === 'ALL' ? 'TẤT CẢ BÀI VIẾT' : activeCategory.toUpperCase()}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {filteredBlogs.length} bài
                  </span>
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Cập nhật thông tin công nghệ, đánh giá và thủ thuật mới nhất.
                </p>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* FEATURED POST HERO CARD (If ALL and no search) */}
            {activeCategory === 'ALL' && !searchQuery && featuredPost && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden group">
                <Link to={`/blog/${featuredPost.slug || featuredPost.id}`} className="grid grid-cols-1 md:grid-cols-12">
                  <div className="md:col-span-7 aspect-video md:aspect-auto relative overflow-hidden bg-gray-100">
                    <img
                      src={featuredPost.thumbnailUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                      <Flame size={12} />
                      <span>Nổi Bật</span>
                    </span>
                  </div>

                  <div className="md:col-span-5 p-6 flex flex-col justify-between bg-white">
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 inline-block">
                        {featuredPost.category || 'Tin nổi bật'}
                      </span>
                      <h2 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-3">
                        {featuredPost.title}
                      </h2>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {featuredPost.summary || 'Đọc chi tiết bài viết mới nhất được cập nhật trên trang tin công nghệ.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold pt-4 border-t border-gray-100 mt-4">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <User size={13} className="text-gray-400" />
                        <span>{featuredPost.authorName || featuredPost.author || 'Admin'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>{new Date(featuredPost.createdAt).toLocaleDateString('vi-VN')}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* REGULAR POSTS GRID */}
            {loading ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-200/80 flex flex-col items-center justify-center text-blue-600">
                <RefreshCw size={28} className="animate-spin mb-3" />
                <p className="font-bold text-xs text-gray-500">Đang tải tin tức...</p>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center">
                <p className="font-bold text-gray-700 text-sm">Không tìm thấy bài viết nào phù hợp.</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc chuyển chuyên mục.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(activeCategory === 'ALL' && !searchQuery ? regularPosts : filteredBlogs).map((item) => (
                  <Link
                    key={item.id}
                    to={`/blog/${item.slug || item.id}`}
                    className="bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group hover:-translate-y-0.5 duration-200"
                  >
                    <div className="aspect-video relative overflow-hidden bg-gray-100">
                      <img
                        src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'; }}
                      />
                      <span className="absolute top-2.5 left-2.5 bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {item.category || 'Tin tức'}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                          {item.summary || 'Thông tin chi tiết bài viết...'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1 text-gray-600">
                          <User size={12} className="text-gray-400" />
                          <span>{item.authorName || item.author || 'Admin'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
}
