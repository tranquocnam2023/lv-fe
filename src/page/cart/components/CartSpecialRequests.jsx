import React from 'react';

export default function CartSpecialRequests({
  specialRequests,
  setSpecialRequests,
  companyInvoiceDetails,
  setCompanyInvoiceDetails,
  otherRequestText,
  setOtherRequestText
}) {
  return (
    <div className="bg-white rounded-md border border-gray-100 p-4 space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yêu cầu hỗ trợ đặc biệt</h3>
      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900 select-none">
          <input
            type="checkbox"
            checked={specialRequests.transferData}
            onChange={(e) => setSpecialRequests({ ...specialRequests, transferData: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
          />
          <span>Chuyển danh bạ, sao lưu dữ liệu sang máy mới (Miễn phí)</span>
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900 select-none">
          <input
            type="checkbox"
            checked={specialRequests.companyInvoice}
            onChange={(e) => setSpecialRequests({ ...specialRequests, companyInvoice: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
          />
          <span>Yêu cầu xuất hóa đơn công ty</span>
        </label>

        {specialRequests.companyInvoice && (
          <div className="ml-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <input
              type="text"
              placeholder="Tên công ty"
              value={companyInvoiceDetails.companyName}
              onChange={(e) => setCompanyInvoiceDetails({ ...companyInvoiceDetails, companyName: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
            />
            <input
              type="text"
              placeholder="Mã số thuế"
              value={companyInvoiceDetails.taxCode}
              onChange={(e) => setCompanyInvoiceDetails({ ...companyInvoiceDetails, taxCode: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
            />
            <input
              type="text"
              placeholder="Địa chỉ công ty"
              value={companyInvoiceDetails.companyAddress}
              onChange={(e) => setCompanyInvoiceDetails({ ...companyInvoiceDetails, companyAddress: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900 select-none">
          <input
            type="checkbox"
            checked={specialRequests.otherRequest}
            onChange={(e) => setSpecialRequests({ ...specialRequests, otherRequest: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
          />
          <span>Yêu cầu giao nhận hàng đặc biệt khác</span>
        </label>

        {specialRequests.otherRequest && (
          <div className="ml-6 animate-in slide-in-from-top-2 duration-150">
            <textarea
              placeholder="Ví dụ: Giao ngoài giờ hành chính, gọi trước khi đến..."
              value={otherRequestText}
              onChange={(e) => setOtherRequestText(e.target.value)}
              rows="2"
              className="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 resize-none text-gray-800"
            ></textarea>
          </div>
        )}
      </div>
    </div>
  );
}
