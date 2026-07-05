import React, { useState, useEffect } from 'react';

// thêm các hình trong assets
import banner1 from '../assets/banner-1.jpg';
import banner2 from '../assets/banner-2.png';
import banner3 from '../assets/banner-3.png';
import banner4 from '../assets/banner-4.webp';
import banner5 from '../assets/banner-5.png';
import banner6 from '../assets/banner-6.png';

// hình ảnh
const sliderData = [banner1, banner2, banner3, banner4, banner5, banner6];

const BannerSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Tự động trượt theo cụm 2 hình mỗi 4 giây
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        // Nếu đã đến cặp cuối cùng (index lớn hơn hoặc bằng Tổng số ảnh - 2) thì quay về 0
        // Ngược lại thì nhảy thêm 2 bước
        prevIndex >= sliderData.length - 2 ? 0 : prevIndex + 2
      );
    }, 4000); //4 giây thì chuyển trang
    return () => clearInterval(slideInterval);
  }, []);

  // nút bấm chuyển tới
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= sliderData.length - 2 ? 0 : prev + 2));
  };
 // nút lui 
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? sliderData.length - 2 : prev - 2));
  };

  return (
    // KHUNG CỬA SỔ (Chứa các nút bấm và giấu phần ảnh dư)
    // CẢI TIẾN 1: Thêm max-w-6xl và px-4 để giới hạn độ to của banner trên màn hình máy tính rộng
    <div className="relative w-full max-w-6xl px-4 mx-auto my-6 overflow-hidden group select-none">
      
      {/*cách hoạt động */}
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        // Công thức dịch chuyển: Lấy index hiện tại nhân với 50%
        style={{ transform: `translateX(-${currentIndex * 50}%)` }}
      >
        {sliderData.map((img, index) => (
          // Mỗi hình ảnh chiếm đúng 50% (w-1/2) và px-2 tạo khoảng trống ở 2 bên mép ảnh để 2 ảnh không bị dính
          <div key={index} className="w-1/2 flex-shrink-0 px-2">
            
            {/* CẢI TIẾN 2: Thêm div bọc ngoài với aspect-[16/7] để ÉP TẤT CẢ CÁC ẢNH PHẢI CAO BẰNG NHAU */}
            <div className="w-full aspect-[16/7] md:aspect-[21/9] rounded-md overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
              <img
                src={img}
                alt={`Khuyến mãi ${index + 1}`}
                // CẢI TIẾN 3: Đổi h-auto thành h-full và thêm object-cover (hoặc object-contain) để ảnh vừa khít khung
                className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
              />
            </div>

          </div>
        ))}
      </div>

      {/* --- Hover NÚT ĐIỀU HƯỚNG BÊN TRÁI (<) --- */}
      {/* Ẩn mặc định, chỉ hiện khi rê chuột vào khung quảng cáo (group-hover:opacity-100) */}
      <button 
        onClick={prevSlide}
        className="absolute top-1/2 left-6 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md border-none cursor-pointer"
      >
        ❮
      </button>

      {/* --- Hover NÚT ĐIỀU HƯỚNG BÊN PHẢI (>) --- */}
      <button 
        onClick={nextSlide}
        className="absolute top-1/2 right-6 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md border-none cursor-pointer"
      >
        ❯
      </button>

    </div>
  );
};

export default BannerSection;