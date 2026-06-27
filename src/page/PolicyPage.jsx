import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';

const POLICY_DATA = {
  'bao-hanh': {
    title: 'TRUNG TÂM HỖ TRỢ TRA CỨU THÔNG TIN, CHÍNH SÁCH BẢO HÀNH SẢN PHẨM CHÍNH HÃNG',
    content: (
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-md border border-gray-200 text-sm text-gray-700 leading-relaxed">
          <p>Thegioididong.com xin lỗi vì sự cố khiến điện thoại của quý khách bị hỏng và phải đi bảo hành. Thế Giới Di Động có 2 hỗ trợ dành riêng cho khách hàng mua điện thoại tại TGDĐ trong thời gian đi bảo hành như sau:</p>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li>Thế Giới Di Động cung cấp cho khách hàng một điện thoại đã qua sử dụng để khách hàng sử dụng tạm thời trong thời gian bảo hành. Chi tiết máy cung cấp quý khách có thể hỏi nhân viên siêu thị hoặc xem trên giấy tiếp nhận bảo hành/sửa chữa dịch vụ.</li>
            <li><strong>Bảo hành có cam kết trong 12 tháng:</strong> Nếu máy gửi đi bảo hành quá 15 ngày hãng chưa trả máy cho khách hàng, hoặc phải bảo hành lại sản phẩm lần nữa trong 30 ngày kể từ lần bảo hành trước, khách hàng được áp dụng phương thức: <strong>Hư gì đổi nấy ngay và luôn</strong> hoặc <strong>Hoàn tiền</strong> với mức phí giảm 50%.</li>
          </ul>
          <p className="mt-4 italic text-blue-600">Lưu ý: Chỉ áp dụng cho điện thoại và phải còn trong điều kiện bảo hành.</p>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Chọn Hãng Cần Tìm Điểm Bảo Hành</h2>
          <div className="relative max-w-md mx-auto mb-10">
             <input 
               type="text" 
               placeholder="Mời nhập tên hãng để tìm" 
               className="w-full border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
             <svg className="w-5 h-5 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
             {['OPPO', 'SAMSUNG', 'REALME', 'GIGABYTE', 'MICROLAB', 'CHUWI', 'LIFETRONS', 'ASIA MŨ BẢO HIỂM', 'VIVO', 'ARCA', 'FUROVER', '365 SELECTION'].map(brand => (
               <div key={brand} className="border border-gray-100 rounded-md p-4 flex flex-col items-center justify-center transition-shadow bg-white cursor-pointer group">
                  <div className="text-xs font-black text-gray-400 group-hover:text-blue-600 transition-colors">{brand}</div>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase">{brand}</div>
               </div>
             ))}
          </div>
        </div>
      </div>
    )
  },
  'doi-tra': {
    title: 'CHÍNH SÁCH ĐỔI TRẢ SẢN PHẨM TẠI THẾ GIỚI DI ĐỘNG',
    content: (
      <div className="bg-white p-8 rounded-md border border-gray-100">
        <h3 className="text-xl font-bold text-blue-700 mb-4">1. Lỗi kỹ thuật từ nhà sản xuất</h3>
        <p className="text-gray-600 mb-6">Áp dụng đổi mới sản phẩm tương đương hoặc hoàn tiền nếu sản phẩm gặp lỗi phần cứng do nhà sản xuất trong vòng 30 ngày đầu sử dụng.</p>
        <h3 className="text-xl font-bold text-blue-700 mb-4">2. Đổi trả theo nhu cầu</h3>
        <p className="text-gray-600">Sản phẩm không lỗi nhưng khách hàng muốn đổi sang mẫu khác sẽ được thu mua lại với mức giá ưu đãi theo quy định của hệ thống.</p>
      </div>
    )
  },
  'tra-gop': {
    title: 'HƯỚNG DẪN MUA TRẢ GÓP 0% LÃI SUẤT',
    content: (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-blue-50 p-6 rounded-md border border-blue-100">
          <h3 className="text-lg font-bold text-blue-800 mb-4">Trả góp qua thẻ tín dụng</h3>
          <p className="text-sm text-blue-700">Hỗ trợ hơn 20 ngân hàng lớn tại Việt Nam. Thủ tục nhanh gọn, không cần chứng minh thu nhập.</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-md border border-orange-100">
          <h3 className="text-lg font-bold text-orange-800 mb-4">Trả góp qua công ty tài chính</h3>
          <p className="text-sm text-orange-700">Dành cho khách hàng chưa có thẻ tín dụng. Chỉ cần CCCD, duyệt hồ sơ trong 15-30 phút.</p>
        </div>
      </div>
    )
  }
};

export default function PolicyPage() {
  const { type } = useParams();
  const policy = POLICY_DATA[type] || POLICY_DATA['bao-hanh'];

  const breadcrumbItems = [
    { label: 'Trang chủ', link: '/' },
    { label: 'Chính sách' },
    { label: policy.title.split(' ')[0] === 'TRUNG' ? 'Bảo hành' : 'Chi tiết' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="mt-8">
        <h1 className="text-3xl font-black text-gray-800 text-center mb-10 leading-tight uppercase max-w-4xl mx-auto">
          {policy.title}
        </h1>

        <div className="animate-fade-in">
          {policy.content}
        </div>
      </div>

      {/* Footer Navigation within policy page */}
      <div className="mt-20 pt-10 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-6">CHÍNH SÁCH CHUNG</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link to="/chinh-sach/bao-hanh" className="text-gray-600 hover:text-blue-600 transition-colors">• Chính sách bảo hành</Link>
          <Link to="/chinh-sach/doi-tra" className="text-gray-600 hover:text-blue-600 transition-colors">• Chính sách đổi trả</Link>
          <Link to="/chinh-sach/tra-gop" className="text-gray-600 hover:text-blue-600 transition-colors">• Chính sách trả góp</Link>
          <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">• Giao hàng & Thanh toán</a>
          <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">• Hướng dẫn mua online</a>
        </div>
      </div>
    </div>
  );
}
