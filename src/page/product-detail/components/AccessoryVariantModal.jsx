import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../../../services/api';
import { useCart } from '../../../context/CartContext';

export default function AccessoryVariantModal({ isOpen, onClose, productId, basePrice, comboPrice, campaignId, maxQuantityAllowed = 5, hideQuantity = false }) {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [attributeOptions, setAttributeOptions] = useState({});
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !productId) return;
    setLoading(true);
    setQuantity(1);
    Promise.all([
      api.get(`/Product/${productId}`),
      api.get(`/ProductVariant?productId=${productId}`)
    ]).then(([prodRes, varRes]) => {
      const prod = prodRes.data || prodRes;
      setProduct(prod);
      const vars = varRes.data || varRes || [];

      const parsedVars = vars.map(v => {
        let attrs = {};
        if (v.attributes) {
          try {
            attrs = JSON.parse(v.attributes);
          } catch (e) { }
        } else if (v.name && v.name.includes(' - ')) {
          const parts = v.name.split(' - ');
          if (parts.length > 1) attrs['Phiên bản'] = parts[1];
          if (parts.length > 2) attrs['Màu sắc'] = parts[2];
        }
        return {
          ...v,
          parsedAttrs: attrs
        };
      });

      const options = {};
      parsedVars.forEach(v => {
        Object.entries(v.parsedAttrs).forEach(([key, val]) => {
          if (val) {
            if (!options[key]) options[key] = new Set();
            options[key].add(val);
          }
        });
      });

      const finalOptions = {};
      const initialSelected = {};
      Object.keys(options).forEach(k => {
        finalOptions[k] = [...options[k]];
        initialSelected[k] = finalOptions[k][0]; // default to first option
      });

      setVariants(parsedVars);
      setAttributeOptions(finalOptions);
      setSelectedAttributes(initialSelected);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    const selectedVar = variants.find(v => {
      return Object.entries(selectedAttributes).every(([k, val]) => v.parsedAttrs[k] === val);
    }) || variants[0];

    // Tìm key tương ứng với màu và dung lượng để truyền vào cartItem
    const colorKey = Object.keys(selectedAttributes).find(k => k.toLowerCase().includes('màu') || k.toLowerCase().includes('color'));
    const storageKey = Object.keys(selectedAttributes).find(k => k.toLowerCase().includes('dung lượng') || k.toLowerCase().includes('storage') || k.toLowerCase().includes('ram') || k.toLowerCase().includes('phiên bản'));

    addToCart({
      ...product,
      id: product.id,
      name: product.name,
      price: comboPrice,
      originalBasePrice: basePrice,
      selectedAttributes: { ...selectedAttributes },
      selectedColor: colorKey ? selectedAttributes[colorKey] : null,
      selectedStorage: storageKey ? selectedAttributes[storageKey] : null,
      variantId: selectedVar?.id,
      image: selectedVar?.imageId || product.thumbnailImage,
      appliedCampaignId: campaignId,
      isAddon: true,
      maxQuantityAllowed: maxQuantityAllowed
    }, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900">Chọn tùy chọn phụ kiện</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Product Info */}
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 bg-gray-50 rounded-xl p-2 border border-gray-100 shrink-0 flex items-center justify-center">
                  <img src={product?.thumbnailImage} alt={product?.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-snug">{product?.name}</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-red-600">{comboPrice?.toLocaleString('vi-VN')}đ</span>
                    {basePrice > comboPrice && (
                      <span className="text-xs font-semibold text-gray-400 line-through">{basePrice?.toLocaleString('vi-VN')}đ</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Attributes */}
              {Object.entries(attributeOptions).map(([attrName, options]) => (
                <div key={attrName} className="mb-5">
                  <h5 className="text-sm font-bold text-gray-700 mb-3">{attrName}:</h5>
                  <div className="flex flex-wrap gap-2">
                    {options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelectedAttributes(prev => ({ ...prev, [attrName]: opt }))}
                        className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-all ${selectedAttributes[attrName] === opt ? 'border-blue-600 text-blue-700 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!hideQuantity && (
                <div className="mb-2">
                  <h5 className="text-sm font-bold text-gray-700 mb-3">Số lượng (Tối đa {maxQuantityAllowed}/món/Chiến dịch):</h5>
                  <div className="flex items-center w-32 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 py-2 text-gray-500 hover:bg-gray-200 font-bold">-</button>
                    <span className="flex-1 text-center py-2 bg-white border-x border-gray-200 font-bold text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(maxQuantityAllowed, quantity + 1))} className="flex-1 py-2 text-gray-500 hover:bg-gray-200 font-bold disabled:opacity-50" disabled={quantity >= maxQuantityAllowed}>+</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500">Tạm tính:</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-red-600">{(comboPrice * quantity).toLocaleString('vi-VN')}đ</span>
            </div>
            {basePrice > comboPrice && (
              <div className="text-[12px] font-bold text-blue-600 mt-0.5">
                Tiết kiệm: {((basePrice - comboPrice) * quantity).toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 uppercase text-sm tracking-wide"
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}
