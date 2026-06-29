import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    // Clear any previous editor instances inside the wrapper to prevent duplicates in strict mode
    wrapperRef.current.innerHTML = '';

    // Create a container div for Quill to attach to
    const editorContainer = document.createElement('div');
    wrapperRef.current.appendChild(editorContainer);

    // Initialize Quill editor
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
          ['blockquote', 'code-block'],
          ['link', 'image', 'video'],
          ['clean']
        ]
      }
    });

    quillRef.current = quill;

    // Populate initial content if provided
    if (value) {
      quill.root.innerHTML = value;
    }

    // Bind text-change event listener
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      // Convert default empty paragraph to empty string
      if (html === '<p><br></p>' || html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    });

    return () => {
      quillRef.current = null;
    };
  }, []); // Run only once on mount

  // Sync value from parent component if it changes externally
  useEffect(() => {
    if (quillRef.current) {
      const currentHTML = quillRef.current.root.innerHTML;
      if (value !== currentHTML && value !== undefined) {
        // Safe check to prevent cursor jumping
        const selection = quillRef.current.getSelection();
        quillRef.current.root.innerHTML = value || '';
        if (selection) {
          quillRef.current.setSelection(selection);
        }
      }
    }
  }, [value]);

  return (
    <div className="border border-admin-border rounded-md overflow-hidden bg-white hover:border-primary/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
      <div ref={wrapperRef} className="quill-editor-wrapper" />
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
      `}</style>
    </div>
  );
}
