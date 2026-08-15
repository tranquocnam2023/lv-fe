import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { THEME } from '../utils/theme';

export default function TermsOfServicePage() {
    // Hook điều hướng trang (useNavigate) để chuyển hướng Route
    const navigate = useNavigate();
    // Khai báo giải nén các thuộc tính/hàm (stopLoading) từ Hook / Context / Props
    const { stopLoading } = useLoading();
    
    useEffect(() => {
        stopLoading();
    }, [navigate, stopLoading]);

    return (
        <div className="container-box py-10 text-sm" style={{ color: THEME.textDark }}>
            <h1 className="text-2xl font-bold text-gray-800 mb-6" style={{ color: THEME.textDark }}>Điều khoản dịch vụ</h1>
            <div className="bg-white rounded-lg border border-admin-border/60 p-5 shadow-sm">
                <p className="mb-4 text-gray-600">
                    <strong>Ngày có hiệu lực:</strong> 2026-08-11
                </p>
            
                    <h2 className="text-xl font-bold mb-3 text-admin-text-main">1. Chấp nhận Điều khoản</h2>
                    <p className="mb-3">Bằng cách sử dụng trang web <strong>mwg-phone-shop.app</strong>, bạn đồng ý với các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng trang web.</p>
                
                    <h2 className="text-xl font-bold mb-3 text-admin-text-main">2. Quyền sở hữu trí tuệ</h2>
                    <p className="mb-3">Trang web và nội dung của nó, bao gồm nhưng không giới hạn văn bản, đồ họa, hình ảnh, logo và phần mềm, là tài sản của <strong>mwg-phone-shop.app</strong> hoặc các nhà cấp phép của nó và được bảo vệ bởi luật bản quyền và các luật sở hữu trí tuệ khác.</p>
                
                    <h2 className="text-xl font-bold mb-3 text-admin-text-main">3. Giới hạn trách nhiệm</h2>
                    <p className="mb-3"><strong>mwg-phone-shop.app</strong> sẽ không chịu trách nhiệm pháp lý đối với bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt hoặc do hậu quả nào phát sinh từ việc sử dụng hoặc không có khả năng sử dụng trang web.</p>
                 
                    <h2 className="text-xl font-bold mb-3 text-admin-text-main">4. Thay đổi Điều khoản</h2>
                    <p className="mb-3">Chúng tôi bảo lưu quyền sửa đổi hoặc thay thế các điều khoản này bất kỳ lúc nào mà không cần thông báo trước. Việc bạn tiếp tục sử dụng trang web sau khi có bất kỳ thay đổi nào sẽ cấu thành sự chấp nhận của bạn đối với các điều khoản mới.</p>               
            </div>
        </div>
    );
}