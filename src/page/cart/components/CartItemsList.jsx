import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';

export default function CartItemsList({ cartItems, updateQuantity, removeFromCart, cartTotal }) {
  const cartSavings = cartItems.reduce(
    (total, item) => total + ((item.originalBasePrice || item.price) - item.price) * item.quantity,
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
          const standaloneItems = [];
          const comboGroups = {};

          cartItems.forEach(item => {
            if (item.appliedComboId) {
              if (!comboGroups[item.appliedComboId]) {
                comboGroups[item.appliedComboId] = [];
              }
              comboGroups[item.appliedComboId].push(item);
            } else {
              standaloneItems.push(item);
            }
          });

          const renderItem = (item) => (
            <div key={item.cartId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              {/* Image */}
              <div className="w-16 h-16 bg-white p-1 border border-gray-100 rounded-md shrink-0 flex justify-center items-center">
                <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
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
                        {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                      </span>
                      {item.originalPrice && (
                        <p className="text-[10px] text-gray-400 line-through font-semibold">
                          {(item.originalPrice * item.quantity).toLocaleString('vi-VN')}₫
                        </p>
                      )}
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
                      className="w-6 h-6 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );

          return (
            <>
              {Object.entries(comboGroups).map(([comboId, groupItems]) => {
                const mainItem = groupItems.find(i => i.isComboMain) || groupItems[0];
                return (
                  <div key={`combo-${comboId}`} className="border-2 border-dashed border-red-200 rounded-xl p-4 relative mt-6 mb-4 bg-red-50/20">
                    <div className="absolute -top-3.5 left-4 bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase shadow-md flex items-center gap-1.5">
                      <span>🎉</span> Áp dụng thành công Combo {mainItem.name}
                    </div>
                    <div className="divide-y divide-gray-100 pt-2">
                      {groupItems.map(renderItem)}
                    </div>
                  </div>
                );
              })}
              {standaloneItems.map(renderItem)}
            </>
          );
        })()}
      </div>

      <div className="border-t border-gray-50 pt-4 flex flex-col gap-2">
        {cartSavings > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold">Tiết kiệm từ Combo:</span>
            <span className="font-black text-green-600 text-[13px]">- {cartSavings.toLocaleString('vi-VN')}₫</span>
          </div>
        )}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-bold">Tạm tính:</span>
          <span className="font-black text-gray-900 text-[15px]">{cartTotal.toLocaleString('vi-VN')}₫</span>
        </div>
      </div>
    </div>
  );
}
