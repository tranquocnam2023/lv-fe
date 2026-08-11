// Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { THEME } from '../utils/theme';

import topzoneLogo from '../assets/mwg-logos/topzone.svg';
import dienmayxanhLogo from '../assets/mwg-logos/dienmayxanh.svg';
import bachhoaxanhLogo from '../assets/mwg-logos/bachhoaxanh.svg';
import ankhangLogo from '../assets/mwg-logos/ankhang.svg';
import avakidsLogo from '../assets/mwg-logos/avakids.svg';
import vieclamLogo from '../assets/mwg-logos/vieclam.svg';
import erablueLogo from '../assets/mwg-logos/erablue.svg';
import thodmxLogo from '../assets/mwg-logos/thodmx.svg';

export default function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check login status dynamically
  const userJson = localStorage.getItem('user');
  let isLoggedIn = false;
  if (userJson && userJson !== 'undefined' && userJson !== 'null') {
    try {
      const u = JSON.parse(userJson);
      isLoggedIn = !!(u && (u.id || u.Id));
    } catch (e) {}
  }

  return (
    <footer
      className="w-full mt-auto text-sm border-t pt-6"
      style={{ backgroundColor: THEME.footerBg, borderColor: THEME.border }}
    >
      <div className="container-box grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 px-4" style={{ color: THEME.textDark }}>
        {/* Col 1 */}
        <div className="flex flex-col space-y-3">
          <h3 className="font-bold uppercase mb-2" style={{ color: THEME.textDark }}>Tổng đài hỗ trợ (Miễn phí gọi)</h3>
          <p>Gọi mua: <span className="font-bold text-base" style={{ color: THEME.primary }}>1800.1060</span> (7:30 - 22:00)</p>
          <p>Kỹ thuật: <span className="font-bold text-base" style={{ color: THEME.primary }}>1800.1763</span> (7:30 - 22:00)</p>
          <p>Khiếu nại: <span className="font-bold text-base" style={{ color: THEME.primary }}>1800.1062</span> (8:00 - 21:30)</p>
          <p>Bảo hành: <span className="font-bold text-base" style={{ color: THEME.primary }}>1800.1064</span> (8:00 - 21:00)</p>
        </div>

        {/* Col 2 */}
        <div className="flex flex-col space-y-3">
          <h3 className="font-bold text-gray-800 uppercase mb-2">Về công ty</h3>
          <a href="https://mwg.vn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Giới thiệu công ty (MWG.vn)</a>
          <a href="https://vieclam.thegioididong.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Tuyển dụng</a>
          <a href="https://www.thegioididong.com/lien-he" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Gửi góp ý, khiếu nại</a>
          <a href="https://www.thegioididong.com/he-thong-sieu-thi-the-gioi-di-dong" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Tìm siêu thị (2.948 shop)</a>
        </div>

        {/* Col 3 */}
        <div className="flex flex-col space-y-3 text-gray-700">
          <h3 className="font-bold text-gray-800 uppercase mb-2">Thông tin khác</h3>
          <Link to="#" className="hover:text-primary transition">Tích điểm Quà tặng VIP</Link>
          <Link to={isLoggedIn ? "/profile?tab=history" : "/track"} className="hover:text-primary transition">Lịch sử mua hàng</Link>
          <Link to="#" className="hover:text-primary transition">Đăng ký bán hàng CTV chiết khấu cao</Link>
          <Link to="/chinh-sach/tra-gop" className="hover:text-primary transition">Tìm hiểu về mua trả chậm</Link>
          <Link to="/chinh-sach/bao-hanh" className="hover:text-primary transition">Chính sách bảo hành</Link>

          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-left hover:text-primary font-bold transition flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0 text-sm mt-1"
              style={{ color: THEME.primary }}
            >
              Xem thêm ▾
            </button>
          ) : (
            <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <Link to="/chinh-sach/doi-tra" className="hover:text-primary transition">Chính sách đổi trả</Link>
              <Link to="/chinh-sach/giao-hang" className="hover:text-primary transition">Giao hàng & Thanh toán</Link>
              <Link to="/chinh-sach/mua-online" className="hover:text-primary transition">Hướng dẫn mua online</Link>
              <Link to="/donate" className="hover:text-primary transition">Donate cho thằng thiết kế Frontend</Link>

              <button
                onClick={() => setIsExpanded(false)}
                className="text-left hover:text-primary font-bold transition flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0 text-sm mt-2"
                style={{ color: THEME.primary }}
              >
                Thu gọn ▴
              </button>
            </div>
          )}
        </div>

        {/* Col 4 */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider">Website cùng tập đoàn</h3>
          
          {/* Grid logo tập đoàn chuẩn MWG Thế Giới Di Động */}
          <div className="grid grid-cols-2 gap-2.5 max-w-xs font-sans select-none">
            {/* 1. TopZone */}
            <a 
              href="https://www.topzone.vn" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-102 active:scale-95 shadow-xs overflow-hidden"
            >
              <img src={topzoneLogo} alt="TopZone" className="w-full h-full object-contain" />
            </a>
            
            {/* 2. Điện Máy XANH */}
            <a 
              href="https://www.dienmayxanh.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-102 active:scale-95 shadow-xs overflow-hidden"
            >
              <img src={dienmayxanhLogo} alt="Điện máy XANH" className="w-full h-full object-contain" />
            </a>

            {/* 3. Bách Hóa XANH */}
            <a 
              href="https://www.bachhoaxanh.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-102 active:scale-95 shadow-xs overflow-hidden"
            >
              <img src={bachhoaxanhLogo} alt="Bách hóa XANH" className="w-full h-full object-contain" />
            </a>

            {/* 4. Nhà Thuốc An Khang */}
            <a 
              href="https://www.nhathuocankhang.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-102 active:scale-95 shadow-xs overflow-hidden"
            >
              <img src={ankhangLogo} alt="Nhà Thuốc An Khang" className="w-full h-full object-contain" />
            </a>

            {/* 5. AVAKids */}
            <a 
              href="https://www.avakids.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-102 active:scale-95 shadow-xs overflow-hidden"
            >
              <img src={avakidsLogo} alt="AVAKids" className="w-full h-full object-contain" />
            </a>

            {/* 6. VIỆC LÀM */}
            <a 
              href="https://vieclam.thegioididong.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-102 active:scale-95 shadow-xs overflow-hidden"
            >
              <img src={vieclamLogo} alt="Việc Làm" className="w-full h-full object-contain" />
            </a>

            {/* 7. EraBlue */}
            <a 
              href="https://www.erablue.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-102 active:scale-95 shadow-xs overflow-hidden"
            >
              <img src={erablueLogo} alt="EraBlue" className="w-full h-full object-contain" />
            </a>

            {/* 8. Thợ Điện Máy Xanh */}
            <a 
              href="#" 
              className="h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-102 active:scale-95 shadow-xs overflow-hidden"
            >
              <img src={thodmxLogo} alt="Thợ Điện Máy Xanh" className="w-full h-full object-contain" />
            </a>
          </div>

          {/* Mạng xã hội theo đúng thiết kế Thế Giới Di Động */}
          <div className="pt-3 flex flex-col space-y-3 select-none">
            <div className="flex items-center gap-5">
              {/* Facebook Fanpage */}
              <a 
                href="https://www.facebook.com/thegioididongcom" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group"
              >
                <div className="w-8 h-8 rounded-full bg-[#3b5998] flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C20.478 23.47 24 18.063 24 12.073z"/>
                  </svg>
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-blue-600">3886.8k Fan</span>
                  <span className="text-xs font-bold text-blue-600">TGDĐ</span>
                </div>
              </a>

              {/* Youtube Channel (Đỏ Tròn Play chuẩn TGDĐ) */}
              <a 
                href="https://www.youtube.com/user/TGDDVideoReviews" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group"
              >
                <div className="w-8 h-8 rounded-full bg-[#d0021b] flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-4.5 h-4.5 fill-white ml-0.5" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-red-600">678.9k Đăng</span>
                  <span className="text-xs font-bold text-red-600">ký</span>
                </div>
              </a>
            </div>

            {/* Zalo Page */}
            <div>
              <a 
                href="https://zalo.me" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity w-fit group"
              >
                <div className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center text-white font-black text-[9px] shadow-xs shrink-0 group-hover:scale-105 transition-transform tracking-tighter">
                  Zalo
                </div>
                <span className="text-xs font-bold text-blue-500">Zalo</span>
              </a>
            </div>
          </div>

          {/* Chứng nhận Bộ Công Thương & DMCA */}
          <div className="pt-2 flex items-center gap-3">
            <a href="#" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-85">
              <img src="https://cdn.tgdd.vn/mwgcart/mwg-site/Content/images/logo-da-thong-bao.png" alt="Đã thông báo bộ công thương" className="h-7 object-contain" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-85">
              <img src="https://images.dmca.com/Badges/dmca_protected_sml_120m.png?ID=1" alt="DMCA" className="h-6 object-contain" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright row */}
      <div
        className="mt-4 py-4 text-xs border-t text-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: THEME.border, color: '#666' }}
      >
        <p>© 2026. Công ty điện thoại PhoneShop(Scambodia). Địa chỉ: 180 Cao Lỗ, Phường Chánh Hưng, TP.HCM.</p>
        <p className="mt-1 opacity-60"> Chịu trách nhiệm nội dung: Trần Quốc Nam, Email: dh52100514@student.stu.edu.vn. Đại diện giải quyết các vấn đề : Võ Trí Nhân, Email: dh52104533@student.stu.edu.vn.</p>
      </div>
    </footer>
  );
}
