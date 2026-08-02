// Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { THEME } from '../utils/theme';

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
          <h3 className="font-bold text-gray-800 uppercase mb-2">Website cùng tập đoàn</h3>
          
          {/* Grid logo tập đoàn */}
          <div className="grid grid-cols-2 gap-2 w-fit font-sans text-white text-[10px] font-black select-none">
            {/* TopZone */}
            <a href="https://www.topzone.vn" target="_blank" rel="noopener noreferrer" className="bg-[#1a1a1a] border border-gray-800 rounded px-2 py-1.5 flex items-center justify-center gap-1 w-28 h-8 transition-transform hover:scale-105 active:scale-95">
              <span className="text-white">top</span>
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">zone</span>
            </a>
            
            {/* Điện Máy Xanh */}
            <a href="https://www.dienmayxanh.com" target="_blank" rel="noopener noreferrer" className="bg-[#00a6e5] rounded px-2 py-1.5 flex items-center justify-center gap-1 w-28 h-8 transition-transform hover:scale-105 active:scale-95">
              <span className="w-2.5 h-2.5 bg-yellow-450 rounded-full flex items-center justify-center text-[5px] text-blue-600">⚡</span>
              <span className="text-white text-[9px]">Điện máy</span>
              <span className="text-yellow-300 text-[9px] uppercase">XANH</span>
            </a>

            {/* Bách Hóa Xanh */}
            <a href="https://www.bachhoaxanh.com" target="_blank" rel="noopener noreferrer" className="bg-[#008f4c] rounded px-2 py-1.5 flex items-center justify-center gap-1 w-28 h-8 transition-transform hover:scale-105 active:scale-95">
              <span className="w-2.5 h-2.5 bg-yellow-450 rounded-full flex items-center justify-center text-[5px] text-green-800">❖</span>
              <span className="text-white text-[9px]">Bách hóa</span>
              <span className="text-yellow-300 text-[9px] uppercase">XANH</span>
            </a>

            {/* Nhà Thuốc An Khang */}
            <a href="https://www.nhathuocankhang.com" target="_blank" rel="noopener noreferrer" className="bg-[#2daf52] rounded px-2 py-1.5 flex items-center justify-center gap-1 w-28 h-8 transition-transform hover:scale-105 active:scale-95">
              <span className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center text-[6px] text-green-600 font-bold">+</span>
              <span className="text-white text-[9px]">nhà thuốc</span>
              <span className="text-white text-[9px] font-extrabold uppercase">An Khang</span>
            </a>

            {/* AVAKids */}
            <a href="https://www.avakids.com" target="_blank" rel="noopener noreferrer" className="bg-[#e71a74] rounded px-2 py-1.5 flex items-center justify-center gap-0.5 w-28 h-8 transition-transform hover:scale-105 active:scale-95">
              <span className="text-white">AVA</span>
              <span className="text-white font-light">Kids</span>
            </a>

            {/* Việc Làm */}
            <a href="https://vieclam.thegioididong.com" target="_blank" rel="noopener noreferrer" className="bg-[#ffc500] text-black rounded px-2 py-1.5 flex items-center justify-center gap-1 w-28 h-8 transition-transform hover:scale-105 active:scale-95">
              <span className="w-2 h-2.5 bg-black rounded flex items-center justify-center text-[5px] text-white">🚹</span>
              <span className="font-extrabold uppercase">VIỆC LÀM</span>
            </a>

            {/* EraBlue */}
            <a href="https://www.erablue.com" target="_blank" rel="noopener noreferrer" className="bg-[#f8a307] text-[#0f2d59] rounded px-2 py-1.5 flex items-center justify-center gap-0.5 w-28 h-8 transition-transform hover:scale-105 active:scale-95">
              <span className="font-extrabold">era</span>
              <span className="font-light">blue</span>
            </a>

            {/* Thợ Điện Máy Xanh */}
            <a href="#" className="bg-[#1c355e] rounded px-2 py-1.5 flex items-center justify-center gap-0.5 w-28 h-8 transition-transform hover:scale-105 active:scale-95">
              <span className="text-yellow-400 font-black">Thợ</span>
              <span className="text-white font-bold">ĐMX</span>
            </a>
          </div>

          {/* Mạng xã hội theo phong cách TGDD */}
          <div className="pt-2 flex flex-col space-y-2">
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/thegioididongcom" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <span className="w-6 h-6 rounded-full bg-[#3b5998] flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">f</span>
                <span className="text-xs font-bold text-blue-600">3886.8k Fan TGDĐ</span>
              </a>
              <a href="https://www.youtube.com/user/TGDDVideoReviews" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-red-600 transition-colors">
                <span className="w-6 h-6 rounded-full bg-[#dd4b39] flex items-center justify-center text-white text-[10px] shrink-0 select-none">▶</span>
                <span className="text-xs font-bold text-red-600">678.9k Đăng ký</span>
              </a>
            </div>
            <div>
              <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                <span className="w-6 h-6 rounded-full bg-[#0088cc] flex items-center justify-center text-white text-[8px] font-black shrink-0 select-none">Zalo</span>
                <span className="text-xs font-bold text-blue-500">Zalo</span>
              </a>
            </div>
          </div>

          {/* Chứng nhận */}
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
