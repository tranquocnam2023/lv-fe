import React, { useState, useEffect } from 'react';
import { Package, Layout, Bell, ShoppingCart, Settings2, Plus, Edit, Trash2, X, FolderTree, UploadCloud, Loader2, Link2, ChevronDown, ChevronUp, Image as ImageIcon, Search, Eye } from 'lucide-react';
// import { TRANSACTIONS_MOCK } from '../utils/constants'; // Removed invalid import
import AdminProductVariants from '../components/AdminProductVariants';
import { categoryService } from '../services/categoryService';
import { brandService } from '../services/brandService';
import { productService } from '../services/productService';
import { usePagination } from '../hooks/usePagination';
import { useFormat } from '../hooks/useFormat';
import PriceInput from '../components/PriceInput';

export default function AdminProducts({ onCreate, onEdit, defaultBrandFilter, clearBrandFilter }) {
  const [categories, setCategories] = useState([]); // Sidebar brands
  const [dbCategories, setDbCategories] = useState([]); // Database categories
  const [products, setProducts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isActiveFilter, setIsActiveFilter] = useState('ALL'); // 'ALL', 'TRUE', 'FALSE'
  const [isFeaturedFilter, setIsFeaturedFilter] = useState('ALL'); // 'ALL', 'TRUE', 'FALSE'
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (defaultBrandFilter) {
      setSelectedBrand(String(defaultBrandFilter));
      if (clearBrandFilter) clearBrandFilter();
    }
  }, [defaultBrandFilter, clearBrandFilter]);



  // Khởi tạo các hook
  const filteredProducts = products.filter(p => {
    let match = true;
    if (selectedBrand !== 'ALL' && String(p.brandId) !== String(selectedBrand)) match = false;
    if (selectedCategory !== 'ALL' && String(p.categoryId) !== String(selectedCategory)) match = false;
    if (isActiveFilter !== 'ALL') {
      const activeValue = isActiveFilter === 'TRUE';
      if (p.isActive !== activeValue) match = false;
    }
    if (isFeaturedFilter !== 'ALL') {
      const featuredValue = isFeaturedFilter === 'TRUE';
      if (p.isFeatured !== featuredValue) match = false;
    }
    if (searchQuery) {
      if (!p.name.toLowerCase().includes(searchQuery.toLowerCase())) match = false;
    }
    return match;
  });

  const { formatCurrency, formatNumber } = useFormat();
  const {
    currentData: paginatedProducts,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredProducts, 10); // Hiển thị 10 sản phẩm mỗi trang

  const fetchProducts = async () => {
    try {
      const allProducts = await productService.getAll(true);
      if (Array.isArray(allProducts)) {
        setProducts(allProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      setProducts([]);
    }
  };

  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const [brandsData, catsData] = await Promise.all([
          brandService.getAll(),
          categoryService.getAll(true)
        ]);
        if (brandsData && brandsData.length > 0) {
          setCategories(brandsData);
          // setSelectedBrand('ALL');
        }
        if (catsData) {
          setDbCategories(catsData);
        }
      } catch (error) {
        console.log("Lỗi tải dữ liệu Thương hiệu/Danh mục", error);
      }
    };

    fetchCategoriesData();
  }, []);



  useEffect(() => {
    fetchProducts();
  }, []);

  const stats = [
    { label: 'Tổng sản phẩm', value: products.length, icon: 'Package', bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-primary)' },
    { label: 'Giá trị tồn kho', value: products.reduce((acc, p) => acc + ((p.basePrice || p.price || 0) * (p.totalStock ?? p.stock ?? p.stockQuantity ?? 0)), 0), icon: 'Layout', bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', isCurrency: true, iconColor: 'var(--color-success)' },
    { label: 'Sắp hết hàng', value: products.filter(p => (p.totalStock ?? p.stock ?? p.stockQuantity ?? 0) < 5).length, icon: 'Bell', bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-warning)' },
    { label: 'Đã bán tháng này', value: 24, icon: 'ShoppingCart', bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-info)' },
  ];



  const handleDeleteProduct = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await productService.delete(id);
        alert('Xóa sản phẩm thành công!');
        fetchProducts();
      } catch (error) {
        alert('Lỗi: ' + (error.message || 'Không thể xóa sản phẩm'));
      }
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const updatedData = {
        name: product.name,
        slug: product.slug,
        productCode: product.productCode || '',
        description: product.description || '',
        basePrice: product.basePrice || 0,
        originalPrice: product.originalPrice || 0,
        totalStock: product.totalStock ?? product.stock ?? product.stockQuantity ?? 0,
        isActive: !product.isActive,
        isFeatured: product.isFeatured || false,
        categoryId: product.categoryId,
        brandId: product.brandId,
        thumbnailImage: product.thumbnailImage || '',
        mainImage: product.mainImage || '',
        images: product.images || []
      };

      await productService.update(product.id, updatedData);
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, isActive: !p.isActive } : p
        )
      );
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      alert('Không thể cập nhật trạng thái sản phẩm!');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-full gap-6">
      {/* Sidebar Bộ lọc */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-md overflow-hidden h-fit md:h-auto">
        <div className="px-6 py-5 border-b border-admin-border font-bold text-admin-text-main flex items-center text-lg">
          <Settings2 className="w-5 h-5 mr-3 text-primary" />
          Bộ lọc sản phẩm
        </div>
        <div className="flex flex-col p-4 gap-4">

          {/* Lọc theo Brand */}
          <div>
            <label className="block text-sm font-bold text-admin-text-main mb-2">Thương hiệu</label>
            <select
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); goToPage(1); }}
              className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
            >
              <option value="ALL">Tất cả thương hiệu</option>
              {categories.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Lọc theo Category */}
          <div>
            <label className="block text-sm font-bold text-admin-text-main mb-2">Danh mục</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); goToPage(1); }}
              className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
            >
              <option value="ALL">Tất cả danh mục</option>
              {dbCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Lọc theo IsActive */}
          <div>
            <label className="block text-sm font-bold text-admin-text-main mb-2">Trạng thái</label>
            <select
              value={isActiveFilter}
              onChange={(e) => { setIsActiveFilter(e.target.value); goToPage(1); }}
              className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="TRUE">Đang bán (Active)</option>
              <option value="FALSE">Ngừng bán (Inactive)</option>
            </select>
          </div>

          {/* Lọc theo IsFeatured */}
          <div>
            <label className="block text-sm font-bold text-admin-text-main mb-2">Sản phẩm nổi bật</label>
            <select
              value={isFeaturedFilter}
              onChange={(e) => { setIsFeaturedFilter(e.target.value); goToPage(1); }}
              className="w-full border border-admin-border text-admin-text-main rounded-md px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
            >
              <option value="ALL">Tất cả</option>
              <option value="TRUE">Có</option>
              <option value="FALSE">Không</option>
            </select>
          </div>

        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-admin-text-main">Quản lý sản phẩm</h2>
            <p className="text-sm text-admin-text-muted font-medium mt-1">Xem danh sách, chỉnh sửa thông tin sản phẩm</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); goToPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-semibold text-admin-text-main placeholder-admin-text-muted text-sm"
              />
            </div>
            <button
              onClick={onCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-admin-primary-hover transition-all active:scale-95 text-sm whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Thêm sản phẩm</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((item, i) => {
            return (
              <div
                key={i}
                className="p-5 rounded-md transition-all flex items-center justify-between h-28 bg-white"
              >
                <div className="flex flex-col">
                  <p className="text-[12px] font-bold text-admin-text-muted mb-1">
                    {item.label}
                  </p>
                  <h3 className="text-2xl font-bold text-admin-text-main leading-none">
                    {item.isCurrency ? formatCurrency(item.value) : formatNumber(item.value)}
                  </h3>
                </div>
                <div className="w-14 h-14 rounded-full bg-admin-bg flex items-center justify-center flex-shrink-0">
                  {item.icon === 'Package' && <Package className="text-primary" size={24} />}
                  {item.icon === 'Layout' && <Layout className="text-success" size={24} />}
                  {item.icon === 'Bell' && <Bell className="text-warning" size={24} />}
                  {item.icon === 'ShoppingCart' && <ShoppingCart className="text-info" size={24} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Product Table List */}
        <div className="bg-white rounded-md p-6 flex-1 flex flex-col mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-admin-text-main">Danh sách sản phẩm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-muted text-[12px] font-bold">
                  <th className="pb-3 px-2">Tên sản phẩm({products.length})</th>
                  <th className="pb-3 px-2">Thương hiệu</th>
                  <th className="pb-3 px-2">Danh mục</th>
                  <th className="pb-3 px-2 text-right">Giá bán</th>
                  <th className="pb-3 px-2 text-center">Tồn kho</th>
                  <th className="pb-3 px-2 text-center">Trạng thái</th>
                  <th className="pb-3 px-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => {
                    const brandName = categories.find(c => c.id === product.brandId)?.name || product.brandName || 'N/A';
                    const categoryName = dbCategories.find(c => c.id === product.categoryId)?.name || 'N/A';

                    const showBrandDisabledBadge = product.isActive !== false && product.brandIsActive === false;
                    const showCategoryDisabledBadge = product.isActive !== false && product.isAvailable === false && !showBrandDisabledBadge;
                    const isInheritedInactive = showCategoryDisabledBadge || showBrandDisabledBadge;

                    return (
                      <tr key={product.id} className={`border-b border-admin-border hover:bg-admin-bg transition-colors group cursor-pointer ${isInheritedInactive ? 'opacity-60 grayscale bg-gray-50/50' : ''}`} onClick={() => onEdit(product.id)}>
                        <td className="py-4 px-2 font-bold text-admin-text-main">
                          <div className="flex items-center gap-2">
                            {product.name}
                            {product.isFeatured && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning">
                                Nổi bật
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/product/${product.id}`, '_blank');
                              }}
                              className="p-1 text-admin-text-muted hover:text-primary hover:bg-primary/10 rounded transition-all cursor-pointer"
                              title="Xem trước trên cửa hàng"
                            >
                              <Eye size={15} />
                            </button>
                            {showCategoryDisabledBadge && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/30 whitespace-nowrap animate-pulse">
                                Đang bị ẩn (Do danh mục tắt)
                              </span>
                            )}
                            {showBrandDisabledBadge && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/30 whitespace-nowrap animate-pulse">
                                Đang bị ẩn (Do Thương hiệu đã tắt)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-admin-text-main">{brandName}</td>
                        <td className="py-4 px-2 text-admin-text-main">{categoryName}</td>
                        <td className="py-4 px-2 font-bold text-admin-text-main text-right">{formatCurrency(product.basePrice ?? product.price ?? 0)}</td>
                        <td className="py-4 px-2 text-center font-bold text-admin-text-main">
                          {(() => {
                            const stock = product.totalStock ?? product.stock ?? product.stockQuantity ?? 0;
                            if (stock === 0) {
                              return <span className="px-2 py-1 bg-admin-danger/10 text-admin-danger rounded-md text-xs whitespace-nowrap">Hết hàng</span>;
                            } else if (stock < 5) {
                              return <span className="text-warning">{stock}</span>;
                            }
                            return stock;
                          })()}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={product.isActive !== false}
                                onChange={(e) => { e.stopPropagation(); handleToggleActive(product); }}
                              />
                              <div className="w-9 h-5 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
                            </label>
                            <span className={`text-[10px] font-bold ${product.isActive !== false ? 'text-success' : 'text-admin-text-muted'}`}>
                              {product.isActive !== false ? 'Đang bán' : 'Ngừng kinh doanh'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEdit(product.id); }}
                              className="p-2 text-admin-text-muted hover:text-warning hover:bg-warning/10 rounded-md transition-all"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                              className="p-2 text-admin-text-muted hover:text-admin-danger hover:bg-admin-danger/10 rounded-md transition-all"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 bg-white">
                      Chưa có dữ liệu sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm font-bold text-admin-text-muted">
              Hiển thị {startIndex}-{endIndex} trên {totalItems} sản phẩm
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                TRƯỚC
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SAU
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
