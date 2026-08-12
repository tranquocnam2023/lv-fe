import api from './api';

export const blogService = {
    // ── LẤY DANH SÁCH BÀI VIẾT ──
    getBlogs: (params) => api.get('/Blog', { params }),
    getBlogsPublish: (params) => api.get('/Blog', { params: { ...params, isPublished: true } }),
    getBlogsDraft: (params) => api.get('/Blog', { params: { ...params, isPublished: false } }),

    // ── LẤY CHI TIẾT BÀI VIẾT ──
    // [1] Lấy theo ID:
    getBlog: (id) => api.get(`/Blog/${id}`),
    
    // [2] Lấy theo SLUG:
    getBlogBySlug: (slug) => api.get(`/Blog/slug/${slug}`),

    // ── TẠO MỚI BÀI VIẾT ──
    createBlog: (data) => api.post('/Blog', data),
    createBlogBySlug: (slug, data) => api.post(`/Blog/slug/${slug}`, data),

    // ── CẬP NHẬT BÀI VIẾT ──
    // [1] Cập nhật theo ID:
    updateBlog: (id, data) => api.put(`/Blog/${id}`, data),
    
    // [2] Cập nhật theo SLUG:
    updateBlogBySlug: (slug, data) => api.put(`/Blog/slug/${slug}`, data),

    // ── XÓA BÀI VIẾT ──
    // [1] Xóa theo ID:
    deleteBlog: (id) => api.delete(`/Blog/${id}`),
    
    // [2] Xóa theo SLUG:
    deleteBlogBySlug: (slug) => api.delete(`/Blog/slug/${slug}`),
};

export default blogService;