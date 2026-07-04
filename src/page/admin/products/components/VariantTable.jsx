import React from 'react';
import { Image as ImageIcon, X, FolderOpen, Loader2, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function VariantTable({
  paginatedVariants,
  getProductById,
  generateSkuFromName,
  inlineUploadingVariantId,
  handleDeleteImageInline,
  handleUploadImageInline,
  handleOpenModal,
  handleDelete,
  totalPages,
  currentPage,
  goToPage,
  prevPage,
  nextPage,
  startIndex,
  endIndex,
  totalItems
}) {
  return (
    <div className="bg-white rounded-md overflow-hidden mb-8 p-6 flex flex-col border border-admin-border shadow-sm">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-admin-border bg-slate-50/50">
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted w-16 uppercase">ID</th>
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted w-24 uppercase">Hình ảnh</th>
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted uppercase">Sản phẩm gốc</th>
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted uppercase">Mã SKU</th>
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted uppercase">Thông số biến thể</th>
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted text-right uppercase">Giá bán</th>
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted text-center uppercase">Tồn kho</th>
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted text-center uppercase">Trạng thái</th>
              <th className="px-4 py-4 text-[12px] font-bold text-admin-text-muted text-center uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border text-sm">
            {paginatedVariants.length > 0 ? (
              paginatedVariants.map((v) => {
                const product = getProductById(v.productId);
                let parsedAttr = {};
                try { parsedAttr = v.attributes ? JSON.parse(v.attributes) : {}; } catch { /* ignore JSON parse error */ }
                const sku = parsedAttr["SKU"] || generateSkuFromName(v.name);

                return (
                  <tr key={v.id} className="hover:bg-admin-bg transition-colors group">
                    <td className="px-4 py-4">
                      <span className="text-admin-text-muted font-bold">#{v.id}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative w-14 h-14 rounded-md bg-white border border-admin-border flex items-center justify-center overflow-hidden flex-shrink-0 group/img cursor-pointer hover:border-primary transition-colors p-1 shadow-sm">
                        {inlineUploadingVariantId === v.id ? (
                          <Loader2 className="animate-spin text-primary animate-in fade-in duration-300" size={16} />
                        ) : v.imageId ? (
                          <>
                            <img src={v.imageId} alt="Variant" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={(e) => handleDeleteImageInline(e, v)}
                              className="absolute top-0 right-0 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-bl opacity-0 group-hover/img:opacity-100 transition-opacity z-20 cursor-pointer shadow flex items-center justify-center w-4 h-4 border-0"
                              title="Xóa hình ảnh"
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          </>
                        ) : (
                          <ImageIcon className="text-admin-text-muted" size={20} />
                        )}
                        {inlineUploadingVariantId !== v.id && (
                          <input
                            type="file"
                            accept=".svg,.webp,.png,.jpg,.jpeg"
                            onChange={(e) => handleUploadImageInline(e, v)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            title={v.imageId ? "Nhấp để thay đổi hình ảnh" : "Nhấp để tải lên hình ảnh"}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-admin-text-main">{product ? product.name : `Sản phẩm #${v.productId}`}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200 shadow-sm">
                        {sku}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(parsedAttr)
                          .filter(([key]) => key !== 'SKU')
                          .map(([key, val]) => (
                            <span key={key} className="text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                              <strong className="text-gray-500">{key}:</strong> {String(val)}
                            </span>
                          ))
                        }
                        {Object.keys(parsedAttr).filter(k => k !== 'SKU').length === 0 && (
                          <span className="text-xs text-gray-400 italic">Mặc định</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-admin-text-main text-base">{(v.price || 0).toLocaleString('vi-VN')} ₫</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${v.totalStock > 0 ? 'bg-success/10 text-success' : 'bg-admin-danger/10 text-admin-danger'}`}>
                        {v.totalStock > 0 ? `Còn ${v.totalStock}` : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${v.isActive ? 'bg-success/10 text-success' : 'bg-admin-danger/10 text-admin-danger'}`}>
                        {v.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(v)}
                          className="p-2 text-admin-text-muted hover:text-warning hover:bg-warning/10 rounded-md transition-all cursor-pointer border-0 bg-transparent"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2 text-admin-text-muted hover:text-admin-danger hover:bg-admin-danger/10 rounded-md transition-all cursor-pointer border-0 bg-transparent"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-20 text-center bg-white">
                  <div className="flex flex-col items-center justify-center text-admin-text-muted">
                    <FolderOpen size={64} strokeWidth={1} className="mb-4 opacity-50 text-primary" />
                    <p className="text-lg font-bold text-admin-text-main">Không tìm thấy biến thể nào</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-admin-border pt-4">
          <div className="text-sm font-bold text-admin-text-muted">
            Hiển thị {startIndex}-{endIndex} trên {totalItems} biến thể
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-admin-bg text-admin-text-main border border-admin-border rounded-md text-sm font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={16} /> TRƯỚC
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-bold transition-all border-0 cursor-pointer ${currentPage === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-admin-bg text-admin-text-main border border-admin-border rounded-md text-sm font-bold hover:bg-admin-border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              SAU <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
