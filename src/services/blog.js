import api from './api';

export const blogService = {

    getBlogs: (params) => api.get('/Blog', { params }),
    getBlogsPublish: (params) => api.get('/Blog/publish', { params }),
    getBlogsDraft: (params) => api.get('/Blog/draft', { params }),

    //getBlog: (id) => api.get(`/Blog/${id}`),
    getBlogBySlug: (slug) => api.get(`/Blog/slug/${slug}`),

    //createBlog: (data) => api.post('/Blog', data),
    createBlogBySlug: (slug, data) => api.post(`/Blog/slug/${slug}`, data),

    //updateBlog: (id, data) => api.put(`/Blog/${id}`, data),
    updateBlogBySlug: (slug, data) => api.put(`/Blog/slug/${slug}`, data),

    //deleteBlog: (id) => api.delete(`/Blog/${id}`),
    deleteBlogSlug: (slug) => api.delete(`/Blog/slug/${slug}`),
};