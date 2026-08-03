import api from './api';

export const chatbotService = {
  sendMessage: ({ message, history = [] }) => api.post('/Chatbot/chat', { message, history }),
};
