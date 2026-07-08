import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Banner dọc 2 bên mép
import bannerLeft from '../assets/banner-left.png';
import bannerRight from '../assets/banner-right.png';

// Banner ngang trên cùng 
import topBannerImg from '../assets/top-banner.png'; //Hoặc đuôi .jpg 
// Banner cho Slider trượt
import banner1 from '../assets/banner-1.jpg';
import banner2 from '../assets/banner-2.png';
import banner3 from '../assets/banner-3.png';
import banner4 from '../assets/banner-4.webp';
import banner5 from '../assets/banner-5.png';
import banner6 from '../assets/banner-6.png';

const sliderData = [banner1, banner2, banner3, banner4, banner5, banner6];

const BannerSection = ({ showSideBanners = true, showTopBanner = true, showSlider = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Logic tự động trượt cho Slider
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex >= sliderData.length - 2 ? 0 : prevIndex + 2
      );
    }, 4000);
    return () => clearInterval(slideInterval);
  }, []);

  const nextSlide = () => setCurrentIndex((prev) => (prev >= sliderData.length - 2 ? 0 : prev + 2));
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? sliderData.length - 2 : prev - 2));

  return (
    <>
      {/*QUẢNG CÁO DỌC BÁM MÀN HÌNH (FIXED) */}
      {showSideBanners && (
        <>
          {/* Trái */}
          <div className="fixed top-28 right-[calc(50%+620px)] w-[120px] hidden min-[1440px]:block z-40 pointer-events-auto">
            <Link to="/khuyen-mai-trai">
              <img src={bannerLeft} alt="Quảng cáo trái" className="w-full h-auto rounded-lg shadow-md hover:scale-105 transition-transform" />
            </Link>
          </div>

          {/* Phải */}
          <div className="fixed top-28 left-[calc(50%+620px)] w-[120px] hidden min-[1440px]:block z-40 pointer-events-auto">
            <Link to="/khuyen-mai-phai">
              <img src={bannerRight} alt="Quảng cáo phải" className="w-full h-auto rounded-lg shadow-md hover:scale-105 transition-transform" />
            </Link>
          </div>
        </>
      )}

      {/*  QUẢNG CÁO TĨNH TRÊN CÙNG (TOP BANNER) */}
      {showTopBanner && (
        <div className="w-full max-w-[1200px] px-4 mx-auto mt-4 relative z-0">
          <Link to="/khuyen-mai-hot" className="block w-full rounded-xl overflow-hidden shadow-sm hover:opacity-95 transition-opacity">
            <img
              src={topBannerImg}
              alt="Quảng cáo nổi bật"
              className="w-full h-auto object-cover"
            />
          </Link>
        </div>
      )}

      {/* ĐOÀN TÀU SLIDER CHẠY 2 HÌNH SONG SONG */}
      {showSlider && (
        <div className="relative w-full max-w-[1200px] px-4 mx-auto mt-4 mb-6 overflow-hidden group select-none z-0">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 50}%)` }}
          >
            {sliderData.map((img, index) => (
              <div key={index} className="w-1/2 flex-shrink-0 px-2">
                <div className="w-full aspect-[16/7] md:aspect-[21/9] rounded-md overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
                  <img
                    src={img}
                    alt={`Khuyến mãi ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Nút Điều Hướng Trái / Phải */}
          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-6 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md border-none cursor-pointer"
          >
            ❮
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-6 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md border-none cursor-pointer"
          >
            ❯
          </button>
        </div>
      )}

    </>
  );
};

export default BannerSection;