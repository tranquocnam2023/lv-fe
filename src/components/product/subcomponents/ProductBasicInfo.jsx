import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductFormContext } from '../context/ProductFormContext';

export default function ProductBasicInfo({ productId }) {
  const [searchParams] = useSearchParams();
  const {
    formData,
    setFormData,
    categories,
    brands,
    handleNameChange
  } = useProductFormContext();

  return (
    <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50">
      <h3 className="text-lg font-bold text-admin-text-main mb-4">Khối A - Thông tin cơ bản</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-admin-text-main mb-2">Tên sản phẩm *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={handleNameChange}
            className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white text-sm font-medium"
            placeholder="Nhập tên sản phẩm..."
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-bold text-admin-text-main mb-2">Đường dẫn (Slug)</label>
          <input
            type="text"
            value={formData.slug}
            className="w-full px-4 py-3 border border-admin-border bg-gray-100 rounded-md outline-none text-admin-text-muted cursor-not-allowed text-sm font-medium"
            placeholder="tu-dong-tao-tu-ten-san-pham"
            disabled
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-bold text-admin-text-main mb-2">Mã sản phẩm (ProductCode)</label>
          <input
            type="text"
            value={formData.productCode}
            onChange={(e) => setFormData(prev => ({ ...prev, productCode: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
            className="w-full px-4 py-3 border border-admin-border rounded-md outline-none text-admin-text-main uppercase focus:border-primary bg-white text-sm font-medium"
            placeholder="Để trống tự tạo..."
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-admin-text-main mb-2">Danh mục *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white text-sm font-medium"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-admin-text-main mb-2">Thương hiệu</label>
          <select
            value={formData.brandId}
            onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
            disabled={!productId && !!searchParams.get('brandId')}
            className={`w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main text-sm font-medium ${(!productId && searchParams.get('brandId')) ? 'bg-gray-100 cursor-not-allowed text-admin-text-muted' : 'bg-white'
              }`}
          >
            <option value="">-- Chọn thương hiệu --</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-admin-text-main mb-2">Mô tả chi tiết</label>
          <textarea
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-admin-text-main bg-white text-sm font-medium"
            placeholder="Nhập mô tả sản phẩm..."
          />
        </div>
      </div>
    </div>
  );
}
