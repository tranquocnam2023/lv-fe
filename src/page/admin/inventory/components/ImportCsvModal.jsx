import React, { useState } from 'react';
import { Upload, Download, X, AlertCircle } from 'lucide-react';
import { excelService } from '../../../../utils/excelService';
import { inventoryService } from '../../../../services/inventoryService';
import { useFormat } from '../../../../hooks/useFormat';

export default function ImportCsvModal({ isOpen, onClose, onSuccess, products }) {
  const { formatCurrency } = useFormat();
  const [isDragOver, setIsDragOver] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importingProgress, setImportingProgress] = useState(null);
  const [importError, setImportError] = useState(null);

  if (!isOpen) return null;

  const handleDownloadTemplateCSV = async () => {
    try {
      await excelService.downloadImportTemplate(products);
    } catch (err) {
      alert('Lỗi tạo tệp mẫu: ' + err.message);
    }
  };

  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null);
    setImportPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          setImportError("Tệp tin trống hoặc không hợp lệ!");
          return;
        }

        const parseLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseLine(lines[0]);
        if (headers.length < 7) {
          setImportError("Cấu trúc cột của tệp không khớp với file mẫu!");
          return;
        }

        const previewData = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseLine(line);
          if (values.length < 6) continue; 

          const productId = parseInt(values[0]);
          const variantId = values[1] ? parseInt(values[1]) : null;
          const productName = values[2];
          const variantName = values[3];
          const quantity = parseInt(values[4]);
          const price = parseFloat(values[5]);
          const transactionType = values[6]?.toUpperCase();
          const note = values[7] || '';

          if (isNaN(productId) || isNaN(quantity) || quantity === 0 || isNaN(price)) {
            continue;
          }

          const validTypes = ['IMPORT_SUPPLIER', 'IMPORT_RETURN', 'EXPORT_SELL', 'EXPORT_DEFECT'];
          if (!validTypes.includes(transactionType)) {
            continue;
          }

          previewData.push({
            productId,
            variantId: isNaN(variantId) ? null : variantId,
            productName,
            variantName,
            quantityChanged: quantity,
            price,
            transactionType,
            note
          });
        }

        if (previewData.length === 0) {
          setImportError("Không tìm thấy dòng hợp lệ nào để nhập hàng (số lượng và đơn giá phải lớn hơn 0).");
        } else {
          setImportPreview(previewData);
        }
      } catch (err) {
        console.error(err);
        setImportError("Lỗi đọc file: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImportExcelConfirm = async () => {
    if (importPreview.length === 0) return;
    setImportingProgress({ current: 0, total: importPreview.length });
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < importPreview.length; i++) {
      const item = importPreview[i];
      setImportingProgress({ current: i + 1, total: importPreview.length });
      
      try {
        await inventoryService.create({
          productId: item.productId,
          variantId: item.variantId,
          quantityChanged: item.quantityChanged,
          transactionType: item.transactionType,
          price: item.price,
          note: item.note || 'Nhập từ file Excel'
        });
        successCount++;
      } catch (err) {
        console.error(`Lỗi nhập dòng ${i + 1}:`, err);
        failCount++;
      }
    }
    
    alert(`Hoàn thành nhập kho từ file Excel!\n- Thành công: ${successCount} dòng\n- Thất bại: ${failCount} dòng.`);
    setImportPreview([]);
    setImportingProgress(null);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-admin-border animate-in zoom-in duration-200 flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-admin-border pb-4">
          <h3 className="text-xl font-bold text-admin-text-main flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            Nhập tồn kho từ file Excel / CSV
          </h3>
          <button
            onClick={() => {
              setImportPreview([]);
              setImportError(null);
              onClose();
            }}
            disabled={importingProgress !== null}
            className="p-1 hover:bg-admin-bg text-admin-text-muted hover:text-admin-text-main rounded-full transition-all disabled:opacity-50 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 flex-1">
          <div className="p-4 bg-slate-50 border border-admin-border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-sm font-bold text-admin-text-main">Chưa có file mẫu nhập kho?</h4>
              <p className="text-xs text-admin-text-muted">Tải file mẫu được sinh tự động dựa trên danh sách sản phẩm hiện tại của bạn.</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplateCSV}
              className="flex items-center gap-1.5 px-4 py-2 border border-admin-border text-admin-text-main rounded-md hover:bg-admin-bg transition-all text-xs font-bold whitespace-nowrap bg-white cursor-pointer shadow-sm"
            >
              <Download size={14} />
              Tải file mẫu (.csv)
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); if (importingProgress === null) setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (importingProgress !== null) return;
              const file = e.dataTransfer.files[0];
              if (file) {
                handleCSVFileChange({ target: { files: [file] } });
              }
            }}
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center relative transition-all duration-200 min-h-[140px] cursor-pointer ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-admin-border bg-slate-50/50 hover:border-primary/50'
            } ${importingProgress !== null ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={importingProgress !== null}
            />
            <Upload size={32} className={`mb-2 ${isDragOver ? 'text-primary animate-bounce' : 'text-admin-text-muted'}`} />
            <span className="text-sm font-bold text-admin-text-main">
              {isDragOver ? 'Thả tệp vào đây!' : 'Tải file lên hoặc kéo thả tệp tại đây'}
            </span>
            <span className="text-xs mt-1 text-admin-text-muted">Chỉ hỗ trợ tệp CSV mã hóa UTF-8. Tối đa 2MB.</span>
          </div>

          {importError && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{importError}</span>
            </div>
          )}

          {importPreview.length > 0 && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-admin-text-main">Xem trước dữ liệu nhập kho ({importPreview.length} dòng hợp lệ)</h4>
                <span className="text-[11px] text-gray-500 font-medium italic">* Vui lòng kiểm tra kỹ trước khi xác nhận</span>
              </div>
              <div className="border border-admin-border rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-admin-border text-admin-text-muted font-bold sticky top-0 z-10">
                      <th className="py-2 px-3">Sản phẩm</th>
                      <th className="py-2 px-3">Biến thể</th>
                      <th className="py-2 px-3 text-center">Số lượng</th>
                      <th className="py-2 px-3 text-right">Đơn giá</th>
                      <th className="py-2 px-3 text-center">Loại GD</th>
                      <th className="py-2 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {importPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-admin-text-main">{item.productName}</td>
                        <td className="py-2 px-3 text-gray-500">{item.variantName || 'Mặc định'}</td>
                        <td className="py-2 px-3 text-center font-bold text-admin-text-main">{item.quantityChanged}</td>
                        <td className="py-2 px-3 text-right font-semibold text-admin-text-main">{formatCurrency(item.price)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            item.transactionType === 'IMPORT_SUPPLIER' ? 'bg-blue-50 text-blue-600' :
                            item.transactionType === 'IMPORT_RETURN' ? 'bg-green-50 text-green-600' :
                            item.transactionType === 'EXPORT_SELL' ? 'bg-purple-50 text-purple-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {item.transactionType === 'IMPORT_SUPPLIER' ? 'Nhập NCC' :
                             item.transactionType === 'IMPORT_RETURN' ? 'Khách trả' :
                             item.transactionType === 'EXPORT_SELL' ? 'Xuất bán' : 'Xuất lỗi'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-500 truncate max-w-[120px]">{item.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importingProgress && (
            <div className="space-y-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex justify-between items-center text-xs font-bold text-blue-800">
                <span>Đang thực hiện nhập kho hàng loạt...</span>
                <span>{importingProgress.current} / {importingProgress.total} dòng</span>
              </div>
              <div className="w-full bg-blue-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(importingProgress.current / importingProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-admin-border pt-4">
          <button
            type="button"
            onClick={() => {
              setImportPreview([]);
              setImportError(null);
              onClose();
            }}
            disabled={importingProgress !== null}
            className="px-5 py-2.5 rounded-md font-bold text-admin-text-muted hover:text-admin-text-main hover:bg-admin-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleImportExcelConfirm}
            disabled={importPreview.length === 0 || importingProgress !== null}
            className="px-6 py-2.5 rounded-md font-bold transition-all hover:opacity-90 bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Xác nhận nhập
          </button>
        </div>
      </div>
    </div>
  );
}
