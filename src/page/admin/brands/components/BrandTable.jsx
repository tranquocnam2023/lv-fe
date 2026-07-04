import React from 'react';
import { Loader2, Image as ImageIcon, X, Edit, Trash2, ChevronUp, ChevronDown, FolderOpen, Plus } from 'lucide-react';

export default function BrandTable({
  brands,
  loading,
  pageSize,
  currentPage,
  setCurrentPage,
  totalItems,
  totalPages,
  expandedBrands,
  brandStats,
  loadingStats,
  inlineUploadingBrandId,
  handleToggleExpand,
  handleToggleActive,
  handleDeleteLogo,
  handleUploadLogoInline,
  handleOpenModal,
  handleDelete,
  onRedirectToProducts,
  onRedirectToCreateProduct
}) {
  return (
    <div className="bg-white rounded-md overflow-hidden mb-8 border border-admin-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr className="border-b border-admin-border">
              <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase">Thương hiệu</th>
              <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Mã (BrandCode)</th>
              <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Tổng sản phẩm</th>
              <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Trạng thái</th>
              <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted uppercase text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className={`text-sm bg-white transition-opacity duration-200 ${loading && brands.length > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
            {loading && brands.length === 0 ? (
              [...Array(pageSize)].map((_, idx) => (
                <tr key={idx} className="border-b border-admin-border h-[68px]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-neutral-100 animate-pulse border border-admin-border"></div>
                      <div className="space-y-2">
                        <div className="w-24 h-4 bg-neutral-100 rounded animate-pulse"></div>
                        <div className="w-36 h-3 bg-neutral-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="w-16 h-6 bg-neutral-100 rounded-md animate-pulse mx-auto"></div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="w-20 h-4 bg-neutral-100 rounded animate-pulse mx-auto"></div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="w-12 h-6 bg-neutral-100 rounded-full animate-pulse mx-auto"></div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-100 animate-pulse"></div>
                      <div className="w-8 h-8 rounded-md bg-neutral-100 animate-pulse"></div>
                      <div className="w-8 h-8 rounded-md bg-neutral-100 animate-pulse"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : brands.length > 0 ? (
              brands.map((brand) => {
                const isExpanded = expandedBrands[brand.id];
                const stats = brandStats[brand.id];
                const statsLoading = loadingStats[brand.id];
                const isBrandActive = brand.isActive !== false;

                return (
                  <React.Fragment key={brand.id}>
                    {/* Main Row */}
                    <tr className={`hover:bg-admin-bg transition-all group border-b border-admin-border ${!isBrandActive ? 'opacity-50 grayscale bg-gray-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-md bg-white border border-admin-border flex items-center justify-center overflow-hidden flex-shrink-0 group/logo cursor-pointer hover:border-primary transition-colors">
                            {inlineUploadingBrandId === brand.id ? (
                              <Loader2 className="animate-spin text-primary" size={16} />
                            ) : brand.imageUrl ? (
                              <>
                                <img src={brand.imageUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeleteLogo(brand);
                                  }}
                                  className="absolute top-0 right-0 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-bl opacity-0 group-hover/logo:opacity-100 transition-opacity z-20 cursor-pointer shadow flex items-center justify-center w-4 h-4"
                                  title="Xóa logo"
                                >
                                  <X size={10} strokeWidth={3} />
                                </button>
                              </>
                            ) : (
                              <ImageIcon className="text-admin-text-muted" size={20} />
                            )}
                            {inlineUploadingBrandId !== brand.id && (
                              <input
                                type="file"
                                accept=".svg,.webp,.png,.jpg,.jpeg"
                                onChange={(e) => handleUploadLogoInline(e, brand)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title={brand.imageUrl ? "Nhấp để thay đổi logo" : "Nhấp để tải lên logo"}
                              />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-admin-text-main">{brand.name}</span>
                              {!isBrandActive && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-admin-danger/25 text-admin-danger border border-admin-danger/35">
                                  Đang ẩn
                                </span>
                              )}
                            </div>
                            {brand.description && (
                              <span className="block text-xs text-admin-text-muted max-w-xs truncate mt-0.5">{brand.description}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-primary bg-admin-bg px-3 py-1 rounded-md">
                          {brand.brandCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-admin-text-main">
                        {brand.productsCount || 0} sản phẩm
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isBrandActive}
                              onChange={() => handleToggleActive(brand)}
                            />
                            <div className="w-11 h-6 bg-admin-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(brand)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer bg-transparent border-0"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(brand)}
                            className="p-2 text-admin-danger hover:bg-admin-danger/10 rounded-md transition-colors cursor-pointer bg-transparent border-0"
                            title="Xóa thương hiệu"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleExpand(brand)}
                            className={`p-2 rounded-md transition-all cursor-pointer border-0 ${isExpanded ? 'bg-primary text-white' : 'text-admin-text-muted hover:text-primary hover:bg-admin-bg bg-transparent'}`}
                            title={isExpanded ? 'Thu gọn' : 'Xem thống kê'}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Stats Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/40">
                        <td colSpan="5" className="p-0 border-b border-admin-border">
                          <div className="px-12 py-5 border-l-4 border-primary/30 bg-gray-50/20">
                            {statsLoading ? (
                              <div className="flex justify-center items-center py-6">
                                <Loader2 size={24} className="animate-spin text-primary" />
                                <span className="text-sm font-semibold text-admin-text-main ml-2">Đang tải thống kê nhanh...</span>
                              </div>
                            ) : (brand.productsCount === 0 || !stats || (stats.totalActive === 0 && stats.totalStock === 0)) ? (
                              <div className="flex items-center justify-between h-16 px-6 bg-white rounded-md border border-dashed border-admin-border">
                                <div className="flex items-center text-admin-text-muted gap-2">
                                  <FolderOpen size={20} className="text-admin-text-muted opacity-50" />
                                  <span className="text-sm font-semibold">Chưa có sản phẩm nào thuộc thương hiệu này.</span>
                                </div>
                                <button 
                                  type="button" 
                                  className="flex items-center gap-1.5 px-4 py-2 bg-admin-bg text-primary hover:bg-primary/10 rounded-md text-xs font-bold transition-all active:scale-[0.98] cursor-pointer border-0"
                                  onClick={() => onRedirectToCreateProduct && onRedirectToCreateProduct(brand.id)}
                                >
                                  <Plus size={14} />
                                  <span>Thêm sản phẩm</span>
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 bg-neutral-50/80 rounded-md border border-neutral-100 p-5 divide-y md:divide-y-0 md:divide-x divide-gray-200 animate-in slide-in-from-top-2 duration-300">
                                {/* Cột 1: Hiệu suất */}
                                <div className="pb-4 md:pb-0 md:pr-6 flex flex-col justify-center">
                                  <h5 className="text-xs font-extrabold text-admin-text-muted uppercase tracking-wider mb-3">Hiệu suất (Performance)</h5>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                      <span className="text-admin-text-main flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-success inline-block"></span>
                                        Đang bán:
                                      </span>
                                      <span className="text-success font-bold">{stats.totalActive} SP</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium">
                                      <span className="text-admin-text-main flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-admin-danger inline-block"></span>
                                        Hết hàng:
                                      </span>
                                      <span className="text-admin-danger font-bold">{stats.outOfStock} SP</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium">
                                      <span className="text-admin-text-main flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                                        Tồn kho tổng:
                                      </span>
                                      <span className="text-admin-text-main font-bold">{stats.totalStock?.toLocaleString('vi-VN') || 0} thiết bị</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Cột 2: Bán chạy */}
                                <div className="py-4 md:py-0 md:px-6 flex flex-col justify-center">
                                  <h5 className="text-xs font-extrabold text-admin-text-muted uppercase tracking-wider mb-3">Sản phẩm bán chạy (Top Sellers)</h5>
                                  {stats.topSellers && stats.topSellers.length > 0 ? (
                                    <div className="space-y-2">
                                      {stats.topSellers.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2.5">
                                          <div className="w-6 h-6 rounded bg-white border border-admin-border flex items-center justify-center overflow-hidden shrink-0">
                                            {item.thumbnailImage ? (
                                              <img src={item.thumbnailImage} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <ImageIcon className="text-admin-text-muted" size={12} />
                                            )}
                                          </div>
                                          <span className="truncate text-xs font-bold text-admin-text-main" title={item.name}>{item.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-admin-text-muted italic py-2">Chưa có thông tin bán hàng.</span>
                                  )}
                                </div>

                                {/* Cột 3: Hành động nhanh */}
                                <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-center gap-2">
                                  <button
                                    onClick={() => onRedirectToProducts && onRedirectToProducts(brand.id)}
                                    className="w-full py-2 bg-primary hover:bg-admin-primary-hover text-white text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer border-0"
                                  >
                                    <span>Xem toàn bộ {brand.productsCount || 0} sản phẩm</span>
                                  </button>
                                  <button
                                    onClick={() => onRedirectToCreateProduct && onRedirectToCreateProduct(brand.id)}
                                    className="w-full py-2 bg-transparent hover:bg-neutral-100 text-primary text-xs font-bold rounded-md transition-all border border-admin-border flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                                  >
                                    <Plus size={14} />
                                    <span>Thêm sản phẩm</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-admin-text-muted">
                    <FolderOpen size={64} strokeWidth={1} className="mb-4 opacity-50 text-primary" />
                    <p className="text-lg font-bold text-admin-text-main">Không tìm thấy thương hiệu nào</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="px-6 py-4 border-t border-admin-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-admin-text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            Hiển thị {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
            {Math.min(currentPage * pageSize, totalItems)} trên tổng số {totalItems} thương hiệu
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-xs font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer border-0 ${currentPage === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-xs font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
