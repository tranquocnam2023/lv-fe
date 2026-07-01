import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ProductFormProvider } from './context/ProductFormContext';
import { useProductForm } from './hooks/useProductForm';
import PriceInput from '../PriceInput';
import ProductBasicInfo from './subcomponents/ProductBasicInfo';
import ProductImageUpload from './subcomponents/ProductImageUpload';
import ProductSpecsBuilder from './subcomponents/ProductSpecsBuilder';
import ProductOptionsBuilder from './subcomponents/ProductOptionsBuilder';
import ProductVariantsMatrix from './subcomponents/ProductVariantsMatrix';

export default function ProductForm({ productId, onBack, onSaveSuccess }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const formState = useProductForm({ productId, onBack, onSaveSuccess, searchParams, setSearchParams });

  const {
    loading,
    saving,
    toast,
    formData,
    setFormData,
    handleSave
  } = formState;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProductFormProvider value={formState}>
      <div className="flex flex-col gap-6 font-sans">
        {/* Top Header (Sticky with Glassmorphism) */}
        <div className="sticky top-0 z-40 bg-admin-bg/90 backdrop-blur-sm -mt-4 pt-4 pb-4 -mx-8 px-8 border-b border-admin-border/40 flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white rounded-full text-admin-text-muted hover:text-admin-text-main border border-admin-border transition-colors cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-admin-text-main">
                {productId ? `Cập nhật sản phẩm #${productId}` : 'Thêm sản phẩm mới'}
              </h2>
              <p className="text-xs text-admin-text-muted font-medium mt-0.5">
                {productId ? 'Quản lý thông tin chi tiết và các biến thể của sản phẩm này' : 'Thiết lập các thông số để tạo sản phẩm và biến thể'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-admin-border text-admin-text-main rounded-md font-bold hover:bg-admin-bg transition-colors text-sm cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-primary/30 text-primary rounded-md font-bold hover:bg-primary/5 transition-colors disabled:opacity-70 text-sm cursor-pointer"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Lưu & Tiếp tục
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-colors disabled:opacity-70 text-sm cursor-pointer"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Lưu & Quay lại
            </button>
          </div>
        </div>

        {/* Middle Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left Side (Columns 1 & 2) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Khối A - Thông tin cơ bản */}
            <ProductBasicInfo productId={productId} />

            {/* Khối C - Hình ảnh chung */}
            <ProductImageUpload />

            {/* Khối F - Thông số kỹ thuật phân nhóm */}
            <ProductSpecsBuilder />
          </div>

          {/* Right Side (Column 3) */}
          <div className="flex flex-col gap-6">

            {/* Khối B - Trạng thái & Phân loại */}
            <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50">
              <h3 className="text-lg font-bold text-admin-text-main mb-4">Khối B - Trạng thái & Phân loại</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Trạng thái bán</label>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="text-sm font-bold text-admin-text-main">
                      {formData.isActive ? 'Đang bán (Active)' : 'Ngừng kinh doanh (Inactive)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-admin-text-muted mt-1.5 font-semibold">(Phím tắt: Space ngoài ô nhập liệu)</p>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="w-5 h-5 text-warning border-admin-border rounded focus:ring-warning"
                    />
                    <span className="text-sm font-bold text-admin-text-main">Sản phẩm nổi bật</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Khối D - Giá & Tồn kho mặc định */}
            <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50">
              <h3 className="text-lg font-bold text-admin-text-main mb-4">Khối D - Giá & Tồn kho mặc định</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Giá khuyến mãi / Giá bán *</label>
                  <div className="relative">
                    <PriceInput
                      value={formData.basePrice}
                      onChange={(val) => setFormData(prev => ({ ...prev, basePrice: val }))}
                      className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main bg-white text-sm font-medium"
                      required={true}
                    />
                    <span className="absolute right-4 top-3.5 text-admin-text-muted font-bold text-sm">VNĐ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-admin-text-main mb-2">Giá gốc</label>
                  <div className="relative">
                    <PriceInput
                      value={formData.originalPrice}
                      onChange={(val) => setFormData(prev => ({ ...prev, originalPrice: val }))}
                      className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main bg-white text-sm font-medium"
                    />
                    <span className="absolute right-4 top-3.5 text-admin-text-muted font-bold text-sm">VNĐ</span>
                  </div>
                </div>

                {/* Tồn kho input: ONLY shown if hasVariants is false */}
                {!formData.hasVariants && (
                  <div>
                    <label className="block text-sm font-bold text-admin-text-main mb-2">Tồn kho mặc định</label>
                    <input
                      type="number"
                      value={formData.totalStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalStock: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-admin-border rounded-md focus:border-primary outline-none text-admin-text-main bg-white text-sm font-medium"
                      placeholder="Nhập số lượng tồn kho..."
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Block (Khối E) */}
        <div className="bg-white p-6 rounded-md border-0 bg-gray-50/50 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-admin-text-main">Khối E - Tùy chọn biến thể sản phẩm</h3>
              <p className="text-xs text-admin-text-muted font-medium mt-1">Cấu hình màu sắc, dung lượng để tạo ma trận biến thể</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.hasVariants}
                onChange={(e) => setFormData(prev => ({ ...prev, hasVariants: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {formData.hasVariants && (
            <div className="space-y-6 mt-4">
              {/* Shopify style Options attributes config list */}
              <ProductOptionsBuilder />

              {/* Combinations Matrix Table */}
              <ProductVariantsMatrix />
            </div>
          )}
        </div>

        {/* Premium Toast Notification */}
        {toast && (
          <div className={`fixed bottom-5 right-5 z-[200] max-w-sm w-full bg-white rounded-md shadow-xl border p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'border-l-4 border-l-success border-admin-border' :
            toast.type === 'error' ? 'border-l-4 border-l-admin-danger border-admin-border' :
              'border-l-4 border-l-[#FFB800] border-admin-border'
            }`}>
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">✓</div>
              ) : toast.type === 'error' ? (
                <div className="w-8 h-8 rounded-full bg-admin-danger/10 text-admin-danger flex items-center justify-center font-bold">✕</div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center font-bold">!</div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-admin-text-main text-sm">
                {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi hệ thống' : 'Thông báo'}
              </h4>
              <p className="text-xs text-admin-text-muted mt-1 font-semibold leading-relaxed">{toast.message}</p>
              {toast.description && (
                <p className="text-[10px] text-admin-text-muted mt-1 font-medium leading-relaxed">{toast.description}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ProductFormProvider>
  );
}
