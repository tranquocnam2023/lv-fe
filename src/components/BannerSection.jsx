// src/components/BannerSection.jsx
/**
 * ============================================================================
 * COMPONENT: BannerSection (Quản lý & Hiển thị các khối Banner Quảng cáo)
 * ============================================================================
 * Chức năng & Nâng cấp tối ưu:
 *  1. Quản lý 3 loại Banner: Top Banner, Side Banners (Cố định 2 bên), Slider Banners (Trượt 2 hình).
 *  2. Tối ưu LCP (Largest Contentful Paint): Bổ sung `fetchpriority="high"` cho Top Banner đầu trang.
 *  3. Chống giật trang (Anti-CLS): Giữ cố định aspect-ratio (21/4 cho Top Banner, 21/9 cho Slider).
 *  4. Tối ưu nạp ảnh: Slider tự động chọn `loading="eager"` cho 2 hình đầu và `loading="lazy"` cho các hình sau.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannerService } from '../services/bannerService';
//quảng cáo tĩnh phòng trường hợp lỗi

// Banner  side - banner dọc 2 bên màn hình)
import bannerLeft from '../assets/banner-left.png';
import bannerRight from '../assets/banner-right.png';

// Banner top - banner trên đầu trang)
import topBannerImg from '../assets/top-banner.png';
// Banner cho Slider trượt
import banner1 from '../assets/banner-1.jpg';
import banner2 from '../assets/banner-2.png';
import banner3 from '../assets/banner-3.png';
import banner4 from '../assets/banner-4.webp';
import banner5 from '../assets/banner-5.png';
import banner6 from '../assets/banner-6.png';

// Hằng số đường dẫn chương trình khuyến mãi Thế Giới Di Động (TGDD)
const TGDD_LINKS = {
  SLIDER: 'https://www.thegioididong.com/chuong-trinh-back-to-cool',
  TOP: 'https://www.thegioididong.com/chuong-trinh-apple-back-to-school',
  SIDE: 'https://www.thegioididong.com/tuu-truong-2026'
};

// Danh sách banner mặc định được tối ưu gọn gàng
const DEFAULT_BANNERS = [
  ...[banner1, banner2, banner3, banner4, banner5, banner6].map((img, idx) => ({
    id: `s${idx + 1}`, imageUrl: img, linkUrl: TGDD_LINKS.SLIDER, type: 'Slider', isActive: true, position: idx
  })),
  { id: 'top', imageUrl: topBannerImg, linkUrl: TGDD_LINKS.TOP, type: 'Top', isActive: true, position: 0 },
  { id: 'left', imageUrl: bannerLeft, linkUrl: TGDD_LINKS.SIDE, type: 'Left', isActive: true, position: 0 },
  { id: 'right', imageUrl: bannerRight, linkUrl: TGDD_LINKS.SIDE, type: 'Right', isActive: true, position: 0 },
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
    const ensureTgddLink = (list) => {
      if (!Array.isArray(list)) return DEFAULT_BANNERS;
      return list.map(b => {
        let url = b.linkUrl;
        if (!url || url.startsWith('/khuyen-mai')) {
          if (b.type === 'Top') url = TGDD_LINKS.TOP;
          else if (b.type === 'Left' || b.type === 'Right') url = TGDD_LINKS.SIDE;
          else url = TGDD_LINKS.SLIDER;
        }
        return { ...b, linkUrl: url };
      });
    };

    if (bannersData) {
      setBanners(ensureTgddLink(bannersData));
    } else {
      const fetchBanners = async () => {
        try {
          const data = await bannerService.getBanners();
          if (data && data.length > 0) {
            setBanners(ensureTgddLink(data));
          } else {
            setBanners(DEFAULT_BANNERS);
          }
        } catch (error) {
          console.error('Error loading published banners from backend:', error);
          try {
            const saved = localStorage.getItem('publishedBanners');
            if (saved) {
              setBanners(ensureTgddLink(JSON.parse(saved)));
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

  // Logic tự động trượt cho Slider đoàn tàu
  useEffect(() => {
    // nếu chỉ có 2 banner thì không cần slide chạy
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
    }, 4000); // thời gian slide
    return () => clearInterval(slideInterval);
  }, [sliderBanners.length]);

  const nextSlide = () => {
    if (sliderBanners.length <= 2) return;
    //xử lý số lượng banner hiển thị, Nếu tổng số banner là số chẵn thì trượt 2 banner mỗi lần bấm
    const step = sliderBanners.length % 2 === 0 ? 2 : 1;
    // Nếu tổng số banner là số lẻ thì trượt 1 banner mỗi lần
    setCurrentIndex((prev) => (prev >= sliderBanners.length - 2 ? 0 : prev + step));
  };

  const prevSlide = () => {
    if (sliderBanners.length <= 2) return;
    const step = sliderBanners.length % 2 === 0 ? 2 : 1;
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, sliderBanners.length - 2) : prev - step));
  };

  return (
    <>
      {/* QUẢNG CÁO DỌC BÁM MÀN HÌNH (FIXED-cố định) */}
      {showSideBanners && (
        <>
          {/* Trái */}
          {leftBanner && (
            <div className="fixed top-28 right-[calc(50%+620px)] w-[120px] hidden min-[1440px]:flex flex-col gap-3 z-40 pointer-events-auto side-banner side-banner-left">
              <LinkWrapper to={leftBanner.linkUrl}>
                <img
                  src={leftBanner.imageUrl}
                  alt="Quảng cáo trái "
                  loading="lazy"
                  className="w-full h-auto rounded-lg shadow-md hover:scale-105 transition-transform"
                />
              </LinkWrapper>
              {/*làm cho 2 banner song song thì đổi flex-col thành flex-row và gap-3 thành gap-2. Copy từ <linkwrapper> xuống hết}*/}
            </div>
          )}

          {/* Phải */}
          {rightBanner && (
            <div className="fixed top-28 left-[calc(50%+620px)] w-[120px] hidden min-[1440px]:flex flex-col gap-3 z-40 pointer-events-auto side-banner side-banner-right">
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
            <div className="block w-full aspect-[21/6] md:aspect-[21/4] rounded-xl overflow-hidden shadow-sm hover:opacity-95 transition-opacity bg-slate-100 dark:bg-slate-800">
              <img
                src={topBanner.imageUrl}
                alt="Quảng cáo nổi bật"
                fetchpriority="high"
                decoding="async"
                className="w-full h-full object-cover"
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
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
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