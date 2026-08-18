
// SERVICE GỬI YÊU CẦU ĐẾN TRỢ LÝ AI CHATBOT
import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: chatbotService
export const chatbotService = {
  /**
   * Gửi tin nhắn và lịch sử trò chuyện đến Backend Chatbot (/Chatbot/chat)
   * @param {Object} param0 
   * @param {string} param0.message Nội dung câu hỏi mới người dùng nhập
   * @param {Array} param0.history Danh sách lịch sử tin nhắn ngữ cảnh trước đó (tối đa 12 tin)
   * @returns {Promise} Kết quả phản hồi từ AI Chatbot ({ reply: string })
   */
  sendMessage: ({ message, history = [] }) => api.post('/Chatbot/chat', { message, history }),
};

