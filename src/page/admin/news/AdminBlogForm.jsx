import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Save, Sparkles, Newspaper, Image as ImageIcon,
  CheckCircle2, Upload, X, Tag, User, Star, FileText,
  Search, Globe, Calendar, Clock, Edit3, Trash2, RotateCcw, FileEdit, Eye
} from 'lucide-react';
import api from '../../../services/api';
import { blogService } from '../../../services/Blog';

export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendOrigin = (import.meta.env.VITE_API_URL || api.defaults?.baseURL || 'https://localhost:7279/api')
    .replace(/\/api\/?$/, '');

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendOrigin}${cleanPath}`;
};

const generateSlug = (text) => {
  if (!text) return '';
  let str = text.toLowerCase().trim();
  const from = "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ";
  const to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";
  for (let i = 0; i < from.length; i++) {
    str = str.replaceAll(from[i], to[i]);
  }
  return str
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default function AdminBlogForm({ blogId = null, onBack }) {
  const isEdit = Boolean(blogId);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  // Form State matching Backend BlogRequest DTO + SEO Metadata
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    thumbnailUrl: '',
    author: 'Admin',
    category: 'Tin công nghệ',
    tags: '',
    publishStatus: 'published', // 'published', 'draft', 'scheduled'
    scheduledDate: '',
    isPublished: true,
    isFeatured: false,
    // SEO fields
    seoTitle: '',
    metaDescription: '',
    focusKeyword: ''
  });

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: isSlugManuallyEdited ? prev.slug : generateSlug(val),
      seoTitle: prev.seoTitle ? prev.seoTitle : val
    }));
  };

  const handleSlugChange = (e) => {
    setIsSlugManuallyEdited(true);
    setFormData(prev => ({ ...prev, slug: e.target.value }));
  };

  // Upload & Replace local image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP, GIF...).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Dung lượng ảnh tối đa 10MB.');
      return;
    }

    // Instant zero-delay local preview using Object URL
    const localPreviewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, thumbnailUrl: localPreviewUrl }));

    setUploadingImage(true);
    try {
      const res = await productService.uploadLocalImage(file, 'blogs');
      const uploadedUrl = res?.data?.url || res?.url || (typeof res?.data === 'string' ? res.data : null);
      if (uploadedUrl) {
        const fullUrl = getMediaUrl(uploadedUrl);
        setFormData(prev => ({ ...prev, thumbnailUrl: fullUrl }));
      }
    } catch (err) {
      console.warn('Lỗi upload server, giữ xem trước đệm:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, thumbnailUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Load Edit Data
  useEffect(() => {
    if (!blogId) return;

    const fetchBlogDetail = async () => {
      setFetchingData(true);
      try {
        // 👉 ĐỌC CHI TIẾT BÀI VIẾT:
        // CÁCH 1: Lấy theo SLUG (Hiện tại đang dùng)
        const res = await blogService.getBlogBySlug(blogId);

        // CÁCH 2: Nếu muốn lấy theo ID thì mở comment dòng dưới và comment dòng CÁCH 1 ở trên:
        // const res = await blogService.getBlog(blogId);

        const data = res.data || res;

        const isPub = data.isPublished ?? data.isActive ?? true;

        setFormData({
          title: data.title || data.name || '',
          slug: data.slug || generateSlug(data.title || data.name || ''),
          summary: data.summary || data.description || '',
          content: data.content || '',
          thumbnailUrl: data.thumbnailUrl ? getMediaUrl(data.thumbnailUrl) : (data.image ? getMediaUrl(data.image) : ''),
          author: data.author || 'Admin',
          category: data.category || 'Tin công nghệ',
          tags: data.tags || '',
          publishStatus: isPub ? 'published' : 'draft',
          scheduledDate: '',
          isPublished: isPub,
          isFeatured: Boolean(data.isFeatured),
          seoTitle: data.title || '',
          metaDescription: data.summary || '',
          focusKeyword: ''
        });
        setIsSlugManuallyEdited(true);
      } catch (err) {
        console.error('Lỗi tải thông tin bài viết:', err);
        alert('Không thể tải thông tin bài viết. Vui lòng thử lại sau.');
      } finally {
        setFetchingData(false);
      }
    };

    fetchBlogDetail();
  }, [blogId]);


  // Submit Handler
  const handleSubmit = async (e, forcedPublishState = null) => {
    if (e) e.preventDefault();

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết.');
      return;
    }

    if (!formData.content.trim()) {
      alert('Vui lòng nhập nội dung chi tiết bài viết.');
      return;
    }

    // Determine publish status: true if published/forced, false if draft
    const isPub = forcedPublishState !== null ? forcedPublishState : (formData.publishStatus === 'published');

    const payload = {
      title: formData.title.trim(),
      slug: (formData.slug.trim() || generateSlug(formData.title)).slice(0, 255),
      summary: formData.summary?.trim() || formData.metaDescription?.trim() || null,
      content: formData.content.trim(),
      thumbnailUrl: formData.thumbnailUrl?.trim() || null,
      author: formData.author?.trim() || 'Admin',
      category: formData.category?.trim() || 'Tin tức',
      tags: formData.tags?.trim() || (formData.focusKeyword ? `SEO:${formData.focusKeyword}` : null),
      isPublished: isPub,
      isFeatured: formData.isFeatured
    };

    setLoading(true);
    try {
      if (isEdit) {
        // 👉 CẬP NHẬT BÀI VIẾT:
        // CÁCH 1: Cập nhật theo SLUG (Hiện tại đang dùng)
        await blogService.updateBlogBySlug(blogId, payload);

        // CÁCH 2: Nếu muốn cập nhật theo ID thì mở comment dòng dưới và comment dòng CÁCH 1 ở trên:
        // await blogService.updateBlog(blogId, payload);

        alert(isPub ? 'Cập nhật và xuất bản bài viết thành công!' : 'Đã lưu bản nháp bài viết!');
      } else {
        await blogService.createBlog(payload);
        alert(isPub ? 'Đăng bài viết mới thành công!' : 'Đã tạo bản nháp bài viết!');
      }
      if (onBack) onBack();
    } catch (err) {
      console.error('Lỗi lưu bài viết:', err);
      const errMsg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : (err.response?.data?.message || err.response?.data || err.message || 'Lỗi hệ thống');
      alert('Lưu thất bại:\n' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-gray-500 text-sm">Đang tải thông tin bài viết...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24">
      {/* ── STICKY TOP HEADER ACTION BAR ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Newspaper className="text-blue-600" size={22} />
              <span>{isEdit ? 'Chỉnh sửa Bài Viết' : 'Tạo Bài Viết Mới'}</span>
              <span className={`ml-2 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${formData.publishStatus === 'published' ? 'bg-green-100 text-green-700' :
                formData.publishStatus === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                {formData.publishStatus === 'published' ? ' Đã xuất bản' :
                  formData.publishStatus === 'scheduled' ? ' Hẹn giờ đăng' :
                    ' Bản nháp'}
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              {isEdit ? `Bài viết #${blogId}` : 'Soạn thảo nội dung và cấu hình SEO xuất bản'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileEdit size={15} />
            <span>Lưu Nháp</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Save size={15} strokeWidth={2.5} />
            <span>{loading ? 'Đang lưu...' : (isEdit ? 'Cập Nhật' : 'Đăng Bài')}</span>
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, null)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN: MAIN CONTENT & SEO (8 Cols) ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Card 1: Main Content Editor */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Sparkles size={20} className="text-blue-500" />
              <span>1. Nội dung bài viết</span>
            </h2>

            <div className="space-y-4">
              {/* Tiêu đề */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Tiêu đề Bài viết *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-gray-900 text-lg"
                  placeholder="Nhập tiêu đề thu hút người đọc..."
                  value={formData.title}
                  onChange={handleTitleChange}
                />
              </div>

              {/* Slug URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Đường dẫn thân thiện (URL Slug) *</span>
                  <span className="text-[11px] text-gray-400 font-normal">Tự động sinh từ tiêu đề</span>
                </label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-600 focus-within:border-blue-500 focus-within:bg-white">
                  <span className="text-gray-400 select-none">/blog/</span>
                  <input
                    type="text"
                    required
                    className="w-full bg-transparent border-none outline-none font-mono text-gray-800 text-xs"
                    placeholder="url-bai-viet"
                    value={formData.slug}
                    onChange={handleSlugChange}
                  />
                </div>
              </div>

              {/* Mô tả ngắn / Summary Excerpt */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText size={15} className="text-blue-500" />
                    <span>Mô tả ngắn / Tóm tắt (Excerpt)</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">{formData.summary.length}/300 ký tự</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-gray-800 text-sm leading-relaxed"
                  placeholder="Viết 2-3 câu tóm tắt nội dung hấp dẫn để hiển thị ngoài danh sách bài viết hoặc làm Meta Description..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                />
              </div>

              {/* Nội dung chi tiết */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Nội dung chi tiết bài viết *
                </label>
                <textarea
                  rows={15}
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-normal text-gray-900 text-sm leading-relaxed"
                  placeholder="Soạn thảo toàn bộ nội dung chi tiết bài viết tin tức tại đây..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: SIDEBAR SETTINGS (4 Cols) ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Card 1: Ảnh đại diện (Featured Image) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-base font-black text-gray-900 flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-500" />
                <span>Ảnh đại diện Bài viết</span>
              </span>
            </h3>

            {/* Input URL & Upload */}
            <div className="space-y-3">
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:border-blue-500 focus:bg-white outline-none"
                placeholder="Dán URL ảnh đại diện (https://...)"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={handleImageUpload}
              />

              {/* Image Operations: Preview & Actions */}
              {formData.thumbnailUrl ? (
                <div className="space-y-3">
                  <div className="relative w-full h-44 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 shadow-sm group">
                    <img
                      src={getMediaUrl(formData.thumbnailUrl)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14" font-weight="bold"%3EH%C3%ACnh+anh+khong+ton+tai%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Actions Bar for Image */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Chọn ảnh khác</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 size={14} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full py-8 border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-blue-50/30 transition-all cursor-pointer group"
                >
                  <div className="p-3 bg-white rounded-full border border-gray-200 group-hover:scale-110 transition-transform">
                    <Upload size={20} className="text-blue-600" />
                  </div>
                  <span className="font-bold text-xs text-gray-700">
                    {uploadingImage ? 'Đang tải ảnh lên...' : 'Tải ảnh từ máy tính'}
                  </span>
                  <span className="text-[10px] text-gray-400">PNG, JPG, WEBP tối đa 10MB</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Trạng thái & Xuất bản */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <CheckCircle2 size={18} className="text-green-500" />
              <span>Trạng thái xuất bản</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Trạng thái đăng
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 text-xs focus:border-blue-500 outline-none"
                  value={formData.publishStatus}
                  onChange={(e) => {
                    const status = e.target.value;
                    setFormData({
                      ...formData,
                      publishStatus: status,
                      isPublished: status === 'published'
                    });
                  }}
                >
                  <option value="published"> Công khai (Xuất bản ngay)</option>
                  <option value="draft"> Bản nháp (Save Draft)</option>
                  <option value="scheduled"> Hẹn giờ đăng</option>
                </select>
              </div>

              {/* Hẹn giờ đăng bài */}
              {formData.publishStatus === 'scheduled' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <label className="block text-xs font-bold text-amber-900 flex items-center gap-1">
                    <Clock size={14} />
                    <span>Thời gian hẹn giờ xuất bản</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-gray-800 outline-none"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
              )}

              {/* Toggle Đánh dấu Tin Mới */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                    <Star size={16} className={formData.isFeatured ? "text-blue-600 fill-blue-600" : "text-gray-400"} />
                    <span>Đánh dấu Tin Mới (Hiển thị đầu trang)</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Phân loại & Tác giả */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Tag size={18} className="text-purple-500" />
              <span>Phân loại &amp; Tác giả</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Chuyên mục Blog
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 text-xs focus:border-blue-500 outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Tin công nghệ"> Tin công nghệ</option>
                  <option value="Đánh giá sản phẩm"> Đánh giá sản phẩm</option>
                  <option value="Mẹo hay & Thủ thuật"> Mẹo hay &amp; Thủ thuật</option>
                  <option value="Khuyến mãi"> Khuyến mãi &amp; Ưu đãi</option>
                  <option value="Khác"> Chuyên mục khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <User size={13} className="text-gray-500" />
                  <span>Tác giả bài viết</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:border-blue-500 outline-none"
                  placeholder="VD: Ban Biên Tập PhoneShop"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
