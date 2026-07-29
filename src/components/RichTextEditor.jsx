// COMPONENT TRÌNH SOẠN THẢO VĂN BẢN PHONG PHÚ (RICH TEXT EDITOR WYSIWYG)
// Chức năng: Cho phép Admin nhập bài viết mô tả sản phẩm có định dạng (Bold, Italic, Bullet list, blockquote, link...), upload ảnh tự động lên server và sửa mã nguồn HTML.
import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Eye, Code, Loader2 } from 'lucide-react';
import { productService } from '../services/productService';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!wrapperRef.current) return;

    // Xóa trắng vùng chứa cũ trước khi render để tránh lặp lại editor trong Strict Mode của React
    wrapperRef.current.innerHTML = '';

    // Tạo thẻ div tạm thời làm nơi gắn kết trình soạn thảo Quill
    const editorContainer = document.createElement('div');
    wrapperRef.current.appendChild(editorContainer);

    // Khởi tạo thư viện soạn thảo Quill
    const quill = new Quill(editorContainer, {
      theme: 'snow',
      placeholder: placeholder || 'Nhập mô tả chi tiết sản phẩm...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote'],
          ['link', 'image', 'video'],
          ['clean']
        ]
      }
    });

    quillRef.current = quill;

    // GHI ĐÈ BỘ XỬ LÝ ẢNH (CUSTOM IMAGE HANDLER) ĐỂ UPLOAD LÊN SERVER
    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', () => {
      // Tạo một thẻ input file ẩn để mở hộp thoại chọn ảnh từ máy tính
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/svg+xml,image/webp,image/png,image/jpeg,image/jpg');
      input.click();

      // Sự kiện khi người dùng đã chọn tệp ảnh
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        // KIỂM TRA CHẶN ẢNH CÓ DUNG LƯỢNG VƯỢT QUÁ 2MB
        if (file.size > 2 * 1024 * 1024) {
          alert('Kích thước ảnh quá lớn (>2MB). Vui lòng chọn ảnh nhỏ hơn.');
          return;
        }

        setIsUploading(true);
        try {
          // Gọi API upload ảnh của backend lên thư mục chứa ảnh sản phẩm
          const res = await productService.uploadLocalImage(file, 'products');
          if (res && res.url) {
            let finalUrl = res.url;
            if (finalUrl.startsWith('/')) {
              const apiBase = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';
              const hostBase = apiBase.replace('/api', '');
              finalUrl = `${hostBase}${finalUrl}`;
            }

            // Lấy vị trí con trỏ hiện tại trong khung soạn thảo để chèn ảnh vào
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', finalUrl);
            quill.setSelection(range.index + 1);
          }
        } catch (err) {
          console.error('Lỗi khi tải ảnh lên:', err);
          alert('Lỗi khi tải hình ảnh lên server: ' + (err.message || err));
        } finally {
          setIsUploading(false);
        }
      };
    });

    // Điền dữ liệu mô tả ban đầu nếu có truyền từ cha xuống
    if (value) {
      quill.root.innerHTML = value;
    }

    // LẮNG NGHE SỰ KIỆN THAY ĐỔI VĂN BẢN ĐỂ ĐẨY DỮ LIỆU HTML VỀ CHO CHA
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      // Tránh việc Quill sinh ra các đoạn thẻ trống mặc định '<p><br></p>'
      if (html === '<p><br></p>' || html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    });

    return () => {
      quillRef.current = null;
    };
  }, []); // Chỉ chạy một lần duy nhất khi component mount

  // ĐỒNG BỘ LẠI NỘI DUNG KHI VALUE TỪ CHA THAY ĐỔI NGOÀI Ý MUỐN (VÍ DỤ: RESET FORM)
  useEffect(() => {
    if (quillRef.current) {
      const currentHTML = quillRef.current.root.innerHTML;
      if (value !== currentHTML && value !== undefined) {
        // Lưu giữ vị trí con trỏ chuột để tránh cursor bị nhảy lung tung khi nhập liệu
        const selection = quillRef.current.getSelection();
        quillRef.current.root.innerHTML = value || '';
        if (selection) {
          quillRef.current.setSelection(selection);
        }
      }
    }
  }, [value]);

  return (
    <div className="border border-admin-border rounded-md overflow-hidden bg-white hover:border-primary/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200 relative">
      {/* THANH TAB CHUYỂN ĐỔI CHẾ ĐỘ SOẠN THẢO HOẶC XEM HTML */}
      <div className="flex justify-between items-center bg-gray-50 border-b border-admin-border px-4 py-2 flex-wrap gap-2 select-none">
        <span className="text-xs font-black text-admin-text-muted uppercase tracking-wider">Mô tả sản phẩm</span>
        <div className="flex bg-gray-200/60 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setIsHtmlMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              !isHtmlMode
                ? 'bg-white text-primary shadow-sm'
                : 'text-admin-text-muted hover:text-admin-text-main'
            }`}
          >
            <Eye size={14} />
            <span>Soạn thảo trực quan</span>
          </button>
          <button
            type="button"
            onClick={() => setIsHtmlMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              isHtmlMode
                ? 'bg-white text-primary shadow-sm'
                : 'text-admin-text-muted hover:text-admin-text-main'
            }`}
          >
            <Code size={14} />
            <span>Xem mã HTML</span>
          </button>
        </div>
      </div>

      {/* KHUNG SOẠN THẢO TRỰC QUAN (QUILL EDITOR) */}
      <div className="relative" style={{ display: isHtmlMode ? 'none' : 'block' }}>
        {isUploading && (
          <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span className="text-xs font-black text-admin-text-main">Đang tải ảnh lên...</span>
          </div>
        )}
        <div ref={wrapperRef} className="quill-editor-wrapper" />
      </div>

      {/* KHUNG XEM MÃ HTML THÔ (TEXTAREA) */}
      {isHtmlMode && (
        <div className="relative">
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[250px] max-h-[500px] p-4 font-mono text-sm bg-slate-900 text-slate-100 border-0 focus:outline-none focus:ring-0 resize-y block"
            placeholder="Nhập hoặc dán mã HTML thô tại đây..."
            spellCheck={false}
          />
        </div>
      )}

      {/* Cấu hình style CSS riêng biệt cho trình soạn thảo Quill */}
      <style>{`
        .quill-editor-wrapper .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid var(--color-admin-border, #e5e7eb);
          background-color: #f9fafb;
          padding: 8px 12px;
        }
        .quill-editor-wrapper .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
        }
        .quill-editor-wrapper .ql-editor {
          min-height: 250px;
          max-height: 500px;
          overflow-y: auto;
          line-height: 1.6;
          color: #1f2937;
        }
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
          left: 15px;
        }
        .quill-editor-wrapper .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          color: #4b5563;
          font-style: italic;
          background-color: #f3f4f6;
          margin: 8px 0;
          padding-top: 8px;
          padding-bottom: 8px;
        }
      `}</style>
    </div>
  );
}
