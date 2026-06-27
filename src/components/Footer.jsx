// Footer.jsx
import { Link } from 'react-router-dom';

import { THEME } from '../utils/theme';

export default function Footer() {
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
          <h3 className="font-bold text-gray-800 uppercase mb-2">Thông tin công ty</h3>
          <a href="https://mwg.vn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Giới thiệu công ty (MWG)</a>
          <a href="https://vieclam.thegioididong.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Tuyển dụng</a>
          <a href="https://www.thegioididong.com/lien-he" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Gửi góp ý, khiếu nại</a>
          <a href="https://www.thegioididong.com/he-thong-sieu-thi-the-gioi-di-dong" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">Tìm siêu thị (3.300+ shop)</a>
          <Link to="/donate" className="hover:text-primary text-xs transition">Donate cho thằng thiết kế Frontend</Link>
        </div>

        {/* Col 3 */}
        <div className="flex flex-col space-y-3">
          <h3 className="font-bold text-gray-800 uppercase mb-2">Chính sách chung</h3>
          <Link to="/chinh-sach/bao-hanh" className="hover:text-primary transition">Chính sách bảo hành</Link>
          <Link to="/chinh-sach/doi-tra" className="hover:text-primary transition">Chính sách đổi trả</Link>
          <Link to="/chinh-sach/tra-gop" className="hover:text-primary transition">Chính sách trả góp</Link>
          <Link to="/chinh-sach/giao-hang" className="hover:text-primary transition">Giao hàng & Thanh toán</Link>
          <Link to="/chinh-sach/mua-online" className="hover:text-primary transition">Hướng dẫn mua online</Link>
        </div>

        {/* Col 4 */}
        <div className="flex flex-col space-y-3">
          <h3 className="font-bold text-gray-800 uppercase mb-2">Website cùng tập đoàn</h3>
          <div className="flex flex-col space-y-2 text-xs font-bold font-sans">
            <a href="https://www.dienmayxanh.com" target="_blank" rel="noopener noreferrer" className="flex p-2 bg-blue-500 hover:bg-blue-600 transition-colors rounded w-fit text-white">Điện Máy Xanh</a>
            <a href="https://www.bachhoaxanh.com" target="_blank" rel="noopener noreferrer" className="flex p-2 bg-green-600 hover:bg-green-700 transition-colors rounded w-fit text-white">Bách Hóa Xanh</a>
            <a href="https://www.nhathuocankhang.com" target="_blank" rel="noopener noreferrer" className="flex p-2 bg-purple-600 hover:bg-purple-700 transition-colors rounded w-fit text-white">Nhà Thuốc An Khang</a>
          </div>
          <div className="mt-4 flex space-x-2">
            <a href="https://www.facebook.com/thegioididongcom" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:opacity-80 transition-opacity">FB</a>
            <a href="https://www.youtube.com/user/TGDDVideoReviews" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white hover:opacity-80 transition-opacity">YT</a>
            <a href="https://www.tiktok.com/@thegioididong.official" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white hover:opacity-80 transition-opacity">TT</a>
          </div>
        </div>
      </div>

      {/* Copyright row */}
      <div
        className="mt-4 py-4 text-xs border-t text-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: THEME.border, color: '#666' }}
      >
        <p>© 2026. Công ty điện thoại PhoneShop (Scampuchia-Scambodia). Địa chỉ: LuanVan, TP.HCM.</p>
        <p className="mt-1 opacity-60">Giao diện này được xây dựng bởi thằng Nam.</p>
      </div>
    </footer>
  );
}
