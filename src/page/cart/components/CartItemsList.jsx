import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';

export default function CartItemsList({ cartItems, updateQuantity, removeFromCart, cartTotal }) {
  // Khai báo biến/hằng số: cartSavings - Dùng trong logic xử lý của component
  const cartSavings = cartItems.reduce(
    (total, item) => {
      const orig = item.originalBasePrice || item.originalPrice || item.price;
      return total + (orig > item.price ? (orig - item.price) * item.quantity : 0);
    },
    0
  );

  return (
    <div className="bg-white rounded-md border border-gray-100 p-4 space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
        <ShoppingBag className="text-blue-600 shrink-0" size={18} />
        <h2 className="text-sm font-black text-gray-900">
          Có {cartItems.length} sản phẩm trong giỏ hàng
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {(() => {
          const mainProducts = cartItems.filter(item => !item.isAddon);
          const addonItems = cartItems.filter(item => item.isAddon);

          const comboGroups = [];
          const standaloneProducts = [];
          const assignedAddonIds = new Set();

          mainProducts.forEach(mainProd => {
            const matchedAddons = addonItems.filter(
              addon =>
                !assignedAddonIds.has(addon.cartId) &&
                (Number(addon.parentProductId) === Number(mainProd.id) ||
                 addon.parentCartItemId === mainProd.cartId)
            );

            if (matchedAddons.length > 0) {
              matchedAddons.forEach(a => assignedAddonIds.add(a.cartId));
              comboGroups.push({
                mainProduct: mainProd,
                addons: matchedAddons
              });
            } else {
              standaloneProducts.push(mainProd);
            }
          });

          // Unassigned addons fallback
          const unassignedAddons = addonItems.filter(addon => !assignedAddonIds.has(addon.cartId));
          if (unassignedAddons.length > 0) {
            if (comboGroups.length > 0) {
              comboGroups[0].addons.push(...unassignedAddons);
            } else {
              comboGroups.push({
                mainProduct: null,
                addons: unassignedAddons
              });
            }
          }

          // Hàm xử lý logic/sự kiện: renderItem
          const renderItem = (item) => (
            <div key={item.cartId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              {/* Image */}
              <div className="w-16 h-16 bg-white p-1 border border-gray-100 rounded-md shrink-0 flex justify-center items-center overflow-hidden">
                {(item.image || item.thumbnailImage || item.mainImage) ? (
                  <img
                    src={item.image || item.thumbnailImage || item.mainImage}
                    alt={item.name || 'Sản phẩm'}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <ShoppingBag size={24} className="text-gray-300" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <Link
                      to={`/product/${item.id}`}
                      className="font-extrabold text-gray-900 text-xs leading-snug hover:text-blue-600 transition truncate block max-w-[300px]"
                    >
                      {item.name}
                    </Link>
                     <div className="text-right shrink-0">
                      <span className="font-black text-red-600 text-xs">
                        {((item.price + (item.warrantyPrice || 0)) * item.quantity).toLocaleString('vi-VN')}₫
                      </span>
                      {(() => {
                        const orig = item.originalPrice || item.originalBasePrice;
                        if (orig && orig > item.price) {
                          return (
                            <p className="text-[10px] text-gray-400 line-through font-semibold">
                              {((orig + (item.warrantyPrice || 0)) * item.quantity).toLocaleString('vi-VN')}₫
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 ? (
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                      {Object.entries(item.selectedAttributes)
                        .filter(([_, val]) => val)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(' | ')}
                    </span>
                  ) : (
                    (item.selectedStorage || item.selectedColor) ? (
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                        {item.selectedStorage ? `Dung lượng: ${item.selectedStorage}` : ''}
                        {item.selectedStorage && item.selectedColor ? ' | ' : ''}
                        {item.selectedColor ? `Màu: ${item.selectedColor}` : ''}
                      </span>
                    ) : null
                  )}

                  {item.warrantyId && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-blue-700 font-bold bg-blue-50/75 border border-blue-100 px-2 py-0.5 rounded w-fit select-none">
                      <span>🛡️ Bảo hành mở rộng: {item.warrantyName} (+{item.warrantyPrice?.toLocaleString('vi-VN')}₫ / sản phẩm)</span>
                    </div>
                  )}
                </div>

                {/* Qty selector & Delete */}
                <div className="flex justify-between items-center mt-2 pt-1 border-t border-dashed border-gray-50">
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.cartId)}
                    className="text-[10px] text-gray-400 hover:text-red-500 font-extrabold transition flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Xóa</span>
                  </button>

                  <div className="flex border border-gray-200 rounded-md overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-7 h-6 flex items-center justify-center text-xs font-bold bg-white border-x border-gray-200 text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      disabled={item.isAddon && item.maxQuantityAllowed && item.quantity >= item.maxQuantityAllowed}
                      className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-bold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );

          return (
            <div className="space-y-4 pt-1">
              {/* Render các khung Combo Mua Kèm */}
              {comboGroups.map(({ mainProduct, addons }, groupIdx) => (
                <div
                  key={mainProduct?.cartId || `combo-group-${groupIdx}`}
                  className="border-2 border-dashed border-red-200 bg-red-50/20 rounded-2xl p-4 space-y-3 relative my-2"
                >
                  <div className="flex items-center justify-between border-b border-red-100 pb-2">
                    <span className="text-[11px] font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                      🔥 Combo Mua Kèm Tiết Kiệm
                    </span>
                    {mainProduct && (
                      <span className="text-[10px] font-bold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-red-100">
                        Theo sản phẩm: <strong className="text-gray-800">{mainProduct.name}</strong>
                      </span>
                    )}
                  </div>

                  {/* Sản phẩm chính trong khung Combo */}
                  {mainProduct && (
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                      {renderItem(mainProduct)}
                    </div>
                  )}

                  {/* Các sản phẩm phụ thuộc Combo này */}
                  {addons.length > 0 && (
                    <div className="bg-white/90 rounded-xl p-3 border border-red-100 space-y-2">
                      <div className="text-[11px] font-bold text-red-600 flex items-center justify-between pb-1.5 border-b border-red-50">
                        <span>🎁 Sản phẩm phụ mua kèm ({addons.length} món):</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {addons.map(renderItem)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Render các sản phẩm độc lập / không thuộc combo */}
              {standaloneProducts.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {standaloneProducts.map(renderItem)}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="border-t border-gray-50 pt-4 flex flex-col gap-2">
        {cartSavings > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold">Tiết kiệm mua kèm:</span>
            <span className="font-black text-green-600 text-[13px]">- {cartSavings.toLocaleString('vi-VN')}₫</span>
          </div>
        )}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-bold">Tạm tính:</span>
          <span className="font-black text-gray-900 text-[15px]">{cartTotal.toLocaleString('vi-VN')}₫</span>
        </div>
        {/*tạm tính chia đôi trong giỏ hàng*/}
        {/*
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-bold">Tạm tính:</span>
          <span className="font-black text-gray-900 text-[15px]">{(cartTotal / 2).toLocaleString('vi-VN')}₫</span>
        </div>
        */}
      </div>
    </div>
  );
}
