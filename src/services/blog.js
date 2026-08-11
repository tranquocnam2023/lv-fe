import api from './api';
export const blogService = {
    getBlogs: () => api.get('/blog'),

    getBlog: (id) => api.get(`/blog/${id}`),

    createBlog: (data) => api.post('/blog', data),

    updateBlog: (id, data) => api.put(`/blog/${id}`, data),

    deleteBlog: (id) => api.delete(`/blog/${id}`),

}