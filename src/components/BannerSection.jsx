import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannerService } from '../services/bannerService';
//quảng cáo tĩnh phòng trường hợp lỗi
// Banner dọc 2 bên mép
import bannerLeft from '../assets/banner-left.png';
import bannerRight from '../assets/banner-right.png';

// Banner ngang trên cùng 
import topBannerImg from '../assets/top-banner.png'; 
// Banner cho Slider trượt
import banner1 from '../assets/banner-1.jpg';
import banner2 from '../assets/banner-2.png';
import banner3 from '../assets/banner-3.png';
import banner4 from '../assets/banner-4.webp';
import banner5 from '../assets/banner-5.png';
import banner6 from '../assets/banner-6.png';

// Tạo danh sách banner mặc định tĩnh để fallback
const DEFAULT_BANNERS = [
  { id: 's1', imageUrl: banner1, linkUrl: '/khuyen-mai-1', type: 'Slider', isActive: true, position: 0 },
  { id: 's2', imageUrl: banner2, linkUrl: '/khuyen-mai-2', type: 'Slider', isActive: true, position: 1 },
  { id: 's3', imageUrl: banner3, linkUrl: '/khuyen-mai-3', type: 'Slider', isActive: true, position: 2 },
  { id: 's4', imageUrl: banner4, linkUrl: '/khuyen-mai-4', type: 'Slider', isActive: true, position: 3 },
  { id: 's5', imageUrl: banner5, linkUrl: '/khuyen-mai-5', type: 'Slider', isActive: true, position: 4 },
  { id: 's6', imageUrl: banner6, linkUrl: '/khuyen-mai-6', type: 'Slider', isActive: true, position: 5 },
  { id: 'top', imageUrl: topBannerImg, linkUrl: '/khuyen-mai-hot', type: 'Top', isActive: true, position: 0 },
  { id: 'left', imageUrl: bannerLeft, linkUrl: '/khuyen-mai-trai', type: 'Left', isActive: true, position: 0 },
  { id: 'right', imageUrl: bannerRight, linkUrl: '/khuyen-mai-phai', type: 'Right', isActive: true, position: 0 },
];

const LinkWrapper = ({ to, children }) => {
  if (!to) return children;
  const isExternal = to.startsWith('http://') || to.startsWith('https://');
  if (isExternal) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className="block w-full h-full">
      {children}
    </Link>
  );
};

const BannerSection = ({ showSideBanners = true, showTopBanner = true, showSlider = true, bannersData = null }) => {
  const [banners, setBanners] = useState(bannersData || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Đồng bộ banners khi bannersData thay đổi hoặc khi có sự kiện cập nhật từ API hoặc localStorage
  useEffect(() => {
    if (bannersData) {
      setBanners(bannersData);
    } else {
      const fetchBanners = async () => {
        try {
          const data = await bannerService.getBanners();
          if (data && data.length > 0) {
            setBanners(data);
          } else {
            setBanners(DEFAULT_BANNERS);
          }
        } catch (error) {
          console.error('Error loading published banners from backend:', error);
          try {
            const saved = localStorage.getItem('publishedBanners');
            if (saved) {
              setBanners(JSON.parse(saved));
            } else {
              setBanners(DEFAULT_BANNERS);
            }
          } catch (e) {
            setBanners(DEFAULT_BANNERS);
          }
        }
      };

      fetchBanners();
      window.addEventListener('storage', fetchBanners);
      window.addEventListener('banners-updated', fetchBanners);
      return () => {
        window.removeEventListener('storage', fetchBanners);
        window.removeEventListener('banners-updated', fetchBanners);
      };
    }
  }, [bannersData]);

  // Phân loại banner
  const sliderBanners = banners
    .filter(b => b.type === 'Slider' && b.isActive)
    .sort((a, b) => a.position - b.position);

  const topBanner = banners.find(b => b.type === 'Top' && b.isActive);
  const leftBanner = banners.find(b => b.type === 'Left' && b.isActive);
  const rightBanner = banners.find(b => b.type === 'Right' && b.isActive);

  // Logic tự động trượt cho Slider
  useEffect(() => {
    if (sliderBanners.length <= 2) {
      setCurrentIndex(0);
      return;
    }
    const step = sliderBanners.length % 2 === 0 ? 2 : 1;
    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= sliderBanners.length - 2) {
          return 0;
        }
        return prevIndex + step;
      });
    }, 4000);
    return () => clearInterval(slideInterval);
  }, [sliderBanners.length]);

  const nextSlide = () => {
    if (sliderBanners.length <= 2) return;
    const step = sliderBanners.length % 2 === 0 ? 2 : 1;
    setCurrentIndex((prev) => (prev >= sliderBanners.length - 2 ? 0 : prev + step));
  };

  const prevSlide = () => {
    if (sliderBanners.length <= 2) return;
    const step = sliderBanners.length % 2 === 0 ? 2 : 1;
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, sliderBanners.length - 2) : prev - step));
  };

  return (
    <>
      {/* QUẢNG CÁO DỌC BÁM MÀN HÌNH (FIXED) */}
      {showSideBanners && (
        <>
          {/* Trái */}
          {leftBanner && (
            <div className="fixed top-28 right-[calc(50%+620px)] w-[120px] hidden min-[1440px]:block z-40 pointer-events-auto side-banner side-banner-left">
              <LinkWrapper to={leftBanner.linkUrl}>
                <img
                  src={leftBanner.imageUrl}
                  alt="Quảng cáo trái"
                  loading="lazy"
                  className="w-full h-auto rounded-lg shadow-md hover:scale-105 transition-transform"
                />
              </LinkWrapper>
            </div>
          )}

          {/* Phải */}
          {rightBanner && (
            <div className="fixed top-28 left-[calc(50%+620px)] w-[120px] hidden min-[1440px]:block z-40 pointer-events-auto side-banner side-banner-right">
              <LinkWrapper to={rightBanner.linkUrl}>
                <img
                  src={rightBanner.imageUrl}
                  alt="Quảng cáo phải"
                  loading="lazy"
                  className="w-full h-auto rounded-lg shadow-md hover:scale-105 transition-transform"
                />
              </LinkWrapper>
            </div>
          )}
        </>
      )}

      {/* QUẢNG CÁO TĨNH TRÊN CÙNG (TOP BANNER) */}
      {showTopBanner && topBanner && (
        <div className="w-full max-w-[1200px] px-4 mx-auto mt-4 relative z-0">
          <LinkWrapper to={topBanner.linkUrl}>
            <div className="block w-full rounded-xl overflow-hidden shadow-sm hover:opacity-95 transition-opacity">
              <img
                src={topBanner.imageUrl}
                alt="Quảng cáo nổi bật"
                className="w-full h-auto object-cover"
              />
            </div>
          </LinkWrapper>
        </div>
      )}

      {/* ĐOÀN TÀU SLIDER CHẠY 2 HÌNH SONG SONG */}
      {showSlider && sliderBanners.length > 0 && (
        <div className="relative w-full max-w-[1200px] px-4 mx-auto mt-4 mb-6 overflow-hidden group select-none z-0">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 50}%)` }}
          >
            {sliderBanners.map((banner, index) => (
              <div key={banner.id || index} className="w-1/2 flex-shrink-0 px-2">
                <div className="w-full aspect-[16/7] md:aspect-[21/9] rounded-md overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
                  <LinkWrapper to={banner.linkUrl}>
                    <img
                      src={banner.imageUrl}
                      alt={`Khuyến mãi ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                    />
                  </LinkWrapper>
                </div>
              </div>
            ))}
          </div>

          {/* Nút Điều Hướng Trái / Phải */}
          {sliderBanners.length > 2 && (
            <>
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
            </>
          )}
        </div>
      )}
    </>
  );
};

export default BannerSection;