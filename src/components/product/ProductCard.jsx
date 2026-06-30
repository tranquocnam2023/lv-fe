import { Link } from 'react-router-dom';
import { GitCompare } from 'lucide-react';
import { THEME } from '../../utils/theme';

const parseSpecs = (specsInput) => {
  if (!specsInput) return [];
  
  let parsed = specsInput;
  if (typeof specsInput === 'string') {
    try {
      parsed = JSON.parse(specsInput);
    } catch (e) {
      return specsInput.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  
  if (!Array.isArray(parsed)) return [];
  if (parsed.length === 0) return [];
  
  if (typeof parsed[0] === 'string') {
    return parsed;
  }
  
  const tags = [];
  parsed.forEach(group => {
    if (group && Array.isArray(group.items)) {
      group.items.forEach(item => {
        if (item && item.value && item.value.trim() !== '') {
          const val = item.value.trim();
          if (!tags.includes(val)) {
            tags.push(val);
          }
        }
      });
    }
  });
  return tags;
};

export default function ProductCard({ 
  id,
  name, 
  image, 
  price, 
  originalPrice, 
  specs, 
  discount,
  stockQuantity,
  isFeatured,
  badgeText,
  badgeBg = 'bg-gray-500',
  averageRating = 5,
  reviewCount = 0
}) {
  const specTags = parseSpecs(specs);

  return (
    <Link 
      to={`/product/${id}`}
      className="group flex flex-col bg-white border rounded-md p-3 transition-all duration-300 relative cursor-pointer h-full overflow-hidden"
      style={{ borderColor: THEME.border }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = THEME.primary; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = THEME.border; }}
    >
      {/* Compare Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const event = new CustomEvent('add-to-compare', {
            detail: {
              id,
              name,
              thumbnailImage: image,
              basePrice: price,
              originalPrice,
              discount,
              stockQuantity
            }
          });
          window.dispatchEvent(event);
        }}
        className="absolute top-2 left-2 z-20 p-1.5 bg-gray-50 hover:bg-primary text-gray-500 hover:text-white rounded-full border border-gray-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
        title="So sánh sản phẩm"
      >
        <GitCompare size={13} />
      </button>

      {/* Badge Giảm giá & Nổi bật */}
      <div className="absolute top-2 right-2 flex flex-col space-y-1 z-10 text-[11px] font-bold">
        {badgeText && (
          <span className={`${badgeBg} text-white px-1.5 py-0.5 rounded-sm text-center`}>
            {badgeText}
          </span>
        )}
        {discount && (
          <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-sm text-center">
            GIẢM {discount}%
          </span>
        )}
        {isFeatured && (
          <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-sm text-center">
            HOT
          </span>
        )}
      </div>

      {/* Product Image */}
      <div className="w-full h-44 mb-3 mt-4 overflow-hidden flex items-center justify-center relative">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="object-contain h-full w-full group-hover:-translate-y-1 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-50 rounded flex flex-col items-center justify-center text-gray-300">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mb-1">
               <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
             </svg>
          </div>
        )}
      </div>

      {/* Product Name */}
      <h3 
        className="font-bold text-sm line-clamp-2 mb-2 transition-colors leading-snug"
        style={{ color: THEME.textDark }}
        onMouseOver={(e) => { e.currentTarget.style.color = THEME.primary; }}
        onMouseOut={(e) => { e.currentTarget.style.color = THEME.textDark; }}
      >
        {name}
      </h3>

      {/* Specs / Thông số kỹ thuật (e.g. ['6.7"', '8GB', '256GB']) */}
      {specTags && specTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {specTags.slice(0, 4).map((spec, idx) => (
            <span key={idx} className="text-[11px] bg-gray-50 text-gray-500 px-1.5 py-0.5 border border-gray-200 rounded">
              {spec}
            </span>
          ))}
        </div>
      )}

      {/* Tự động đẩy phần giá xuống đáy sát lề (Sticky bottom inner) */}
      <div className="mt-auto pt-2">
        {/* Price */}
        <div className="flex flex-col">
          {originalPrice ? (
            <div className="text-xs text-gray-400 line-through mb-0.5">
              {originalPrice.toLocaleString('vi-VN')}₫
            </div>
          ) : (
            <div className="h-4"></div> /* Khung trống để các card bằng nhau */
          )}
          <div 
            className="font-bold text-base md:text-lg"
            style={{ color: THEME.primary }}
          >
            {price ? price.toLocaleString('vi-VN') : '0'}₫
          </div>
        </div>

        {/* Rating & reviews */}
        <div className="flex items-center mt-2 justify-between">
          {reviewCount > 0 ? ( /*điều kiện sao, đánh giá */
            <div className="flex items-center text-xs gap-1 font-bold text-yellow-500">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-3.5 h-3.5 text-yellow-400"
              >
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
              </svg>
              <span>{Number(averageRating).toFixed(1)}</span> {/* Số sao trung bình */}
              <span className="text-gray-400 font-normal mx-0.5">•</span>
              <span className="text-[10px] text-gray-500 font-normal">{reviewCount} đánh giá</span>
            </div>
          ) : (
            <div className="h-4"></div> /* Khung trống giữ chiều cao cho card đều nhau, nếu không có sao, đánh giá thì trả về div rỗng */
          )}

          {/* Stock Display */}
          <div className="text-[10px] font-bold">
            {stockQuantity > 0 ? (
              <span className="text-green-600">Còn {stockQuantity} máy</span>
            ) : (
              <span className="text-red-500">Hết hàng</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

