import { useMemo, useRef, useState, useEffect } from 'react';
import { Bot, MessageCircle, Send, X, Sparkles, RefreshCw } from 'lucide-react';
import { chatbotService } from '../services/chatbotService';

const initialMessages = [
  {
    role: 'assistant',
    content: 'Xin chào! Mình là trợ lý AI của PhoneShop. Mình có thể giúp bạn tư vấn điện thoại, kiểm tra giá, tồn kho hoặc khuyến mãi hôm nay! 🚀',
  },
];

const quickPrompts = [
  'Gợi ý iPhone hot nhất?',
  'Điện thoại dưới 10 triệu',
  'Chính sách bảo hành',
  'Khuyến mãi hôm nay'
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const chatHistory = useMemo(
    () =>
      messages
        .filter((item) => item.role === 'user' || item.role === 'assistant')
        .slice(-8),
    [messages]
  );

  const sendQuery = async (queryText) => {
    const trimmedMessage = queryText.trim();
    if (!trimmedMessage || isSending) return;

    const nextMessages = [...messages, { role: 'user', content: trimmedMessage }];
    setMessages(nextMessages);
    setMessage('');
    setError('');
    setIsSending(true);

    try {
      const response = await chatbotService.sendMessage({
        message: trimmedMessage,
        history: chatHistory,
      });
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: response.reply || 'Mình chưa có câu trả lời phù hợp.' },
      ]);
    } catch (err) {
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

  const handleSubmit = (event) => {
    event.preventDefault();
    sendQuery(message);
  };

  return (
    <div className="fixed bottom-20 right-4 z-[9991] md:bottom-6 md:right-6">
      {/* Chat Window Popup */}
      {isOpen && (
        <section className="mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
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

          {/* Messages Body */}
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
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                    item.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                      : 'border border-slate-200/80 bg-white text-slate-800 rounded-bl-none'
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))}
            
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
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
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

          {error && <div className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">{error}</div>}

          {/* Input Form */}
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

      {/* Floating Trigger Button */}
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
