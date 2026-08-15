// COMPONENT GIAO DIỆN CỬA SỔ VÀ NÚT BẤM CHATBOT AI TRỢ LÝ TƯ VẤN (PHONESHOP)
import { useMemo, useRef, useState, useEffect } from 'react';
import { Bot, MessageCircle, Send, X, Sparkles, RefreshCw } from 'lucide-react';
import { chatbotService } from '../services/chatbotService';

// Tin nhắn chào mừng ban đầu khi mở khung chat
const initialMessages = [
  {
    role: 'assistant',
    content: 'Xin chào! Mình là trợ lý AI của PhoneShop. Mình có thể giúp bạn tư vấn điện thoại, kiểm tra giá, tồn kho hoặc khuyến mãi hôm nay! 🚀',
  },
];

// Danh sách các câu hỏi gợi ý nhanh (Quick Prompts)
const quickPrompts = [
  'Gợi ý iPhone hot nhất?',
  'Điện thoại dưới 10 triệu',
  'Phụ kiện điện thoại',
  'Tai nghe dành cho điện thoại'
];

export default function ChatbotWidget() {
  // State ẩn/hiện cửa sổ chat
  const [isOpen, setIsOpen] = useState(false);
  // State lưu danh sách hội thoại tin nhắn ({ role: 'user' | 'assistant', content: string })
  const [messages, setMessages] = useState(initialMessages);
  // State lưu nội dung tin nhắn người dùng đang nhập ở ô Input
  const [message, setMessage] = useState('');
  // State trạng thái đang gửi yêu cầu và đợi AI phản hồi
  const [isSending, setIsSending] = useState(false);
  // State lưu thông báo lỗi nếu gọi API thất bại
  const [error, setError] = useState('');
  // Ref quản lý phần tử cuối danh sách tin nhắn để tự động cuộn (Auto Scroll)
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất khi danh sách tin nhắn thay đổi hoặc khi bật khung chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Cắt lấy tối đa 12 tin nhắn gần nhất để Tạo bộ nhớ ngữ cảnh trò chuyện (Context Window) gửi lên Backend
  const chatHistory = useMemo(
    () =>
      messages
        .filter((item) => item.role === 'user' || item.role === 'assistant')
        .slice(-12),
    [messages]
  );

  // Hàm xử lý gửi tin nhắn của người dùng tới Backend AI Service
  const sendQuery = async (queryText) => {
    // Khai báo biến/hằng số: trimmedMessage - Dùng trong logic xử lý của component
    const trimmedMessage = queryText.trim();
    if (!trimmedMessage || isSending) return;

    // 1. Thêm tin nhắn của người dùng vào giao diện ngay lập tức
    const nextMessages = [...messages, { role: 'user', content: trimmedMessage }];
    setMessages(nextMessages);
    setMessage('');
    setError('');
    setIsSending(true);

    try {
      // 2. Gọi API chatbotService gửi tin nhắn và lịch sử trò chuyện
      const response = await chatbotService.sendMessage({
        message: trimmedMessage,
        history: chatHistory,
      });

      // 3. Nhận câu trả lời từ AI và thêm vào mảng tin nhắn
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: response.reply || 'Mình chưa có câu trả lời phù hợp.' },
      ]);
    } catch (err) {
      // 4. Xử lý khi gặp lỗi kết nối hoặc API bị gián đoạn
      const errorMessage = err?.message || err || 'Chatbot đang tạm thời không khả dụng.';
      setError(errorMessage);
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: 'Mình chưa xử lý được yêu cầu này. Bạn thử lại sau nhé.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Hàm xử lý khi người dùng submit Form (nhấn Enter hoặc bấm nút Gửi)
  const handleSubmit = (event) => {
    event.preventDefault();
    sendQuery(message);
  };

  return (
    <div className="fixed bottom-20 right-4 z-[9991] md:bottom-6 md:right-6">
      {/* ─── KHUNG CỬA SỔ TRÒ CHUYỆN CHATBOT (POPUP WINDOW) ──────────────── */}
      {isOpen && (
        <section className="mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          {/* Header Cửa Sổ Chat */}
          <header className="flex h-14 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20">
                  <Sparkles size={18} />
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold tracking-tight">Trợ Lý AI PhoneShop</p>
                  <span className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[9px] font-extrabold rounded-full uppercase">AI 24/7</span>
                </div>
                <p className="text-[11px] text-slate-300">Sẵn sàng tư vấn cho bạn</p>
              </div>
            </div>
          </header>

          {/* Thân Cửa Sổ Chứa Danh Sách Tin Nhắn (Messages Body) */}
          <div className="h-80 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {item.role === 'assistant' && (
                  <div className="mr-2 flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 mt-0.5">
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow-sm break-words [word-break:break-word] overflow-hidden whitespace-pre-wrap ${item.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                      : 'border border-slate-200/80 bg-white text-slate-800 rounded-bl-none'
                    }`}
                >
                  {item.content}
                </div>
              </div>
            ))}

            {/* Hiển thị hiệu ứng AI đang soạn câu trả lời */}
            {isSending && (
              <div className="flex items-center gap-2 text-slate-500">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Bot size={15} />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-none border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                  <RefreshCw size={13} className="animate-spin text-blue-600" />
                  <span>AI đang soạn câu trả lời...</span>
                </div>
              </div>
            )}
            {/* Thẻ ghim đáy để cuộn tự động */}
            <div ref={messagesEndRef} />
          </div>

          {/* Thanh Gợi Ý Nhanh (Quick Suggestions / Prompts) */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-white px-3 py-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendQuery(prompt)}
                  className="rounded-full border border-blue-100 bg-blue-50/50 px-2.5 py-1 text-[11px] font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                >
                  ✨ {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Khối Hiển Thị Thông Báo Lỗi (Nếu có) */}
          {error && <div className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">{error}</div>}

          {/* Form Nhập Tin Nhắn (Input Form) */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Nhập câu hỏi (ví dụ: iPhone 15 Pro bao nhiêu?)..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Gửi tin nhắn"
            >
              <Send size={15} />
            </button>
          </form>
        </section>
      )}

      {/* ─── NÚT TRÒN BONG BÓNG CHAT NỔI (FLOATING TRIGGER BUTTON) ────────── */}
      <div className="flex items-center gap-2.5 group">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-lg backdrop-blur-md transition-all group-hover:scale-105 animate-in fade-in slide-in-from-right-3 duration-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tư vấn AI 24/7</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/35 transition-all hover:scale-110 active:scale-95"
          aria-label="Mở chat tư vấn"
        >
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-white"></span>
            </span>
          )}

          {isOpen ? <X size={24} /> : <MessageCircle size={26} className="fill-current" />}
        </button>
      </div>
    </div>
  );
}

