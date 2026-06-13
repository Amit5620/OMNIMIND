/**
 * OmniMind API Service
 * Connects frontend to FastAPI backend
 * FIXED: Proper error handling and better user isolation
 */

import axios, { AxiosInstance } from 'axios';

// API Base URL - change this to your FastAPI server address
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 240000, // 4 minutes for longer YouTube summarization requests
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
      return Promise.reject(
        new Error(
          'Request timed out. The YouTube summarization may still be processing. Please try again in a moment.'
        )
      );
    }

    const backendDetail =
      error.response?.data?.detail || error.response?.data?.message;
    if (backendDetail) {
      return Promise.reject(new Error(backendDetail));
    }

    return Promise.reject(error);
  }
);

// ===================
// Types
// ===================

export interface ChatRequest {
  message: string;
  chat_id?: string;
  user_id: string;
  system_prompt?: string;
}

export interface ChatResponse {
  response: string;
  chat_id: string;
  message_id: string;
}

export interface CodingRequest {
  message: string;
  chat_id?: string;
  user_id: string;
  language?: string;
}

export interface YouTubeSummarizeRequest {
  url: string;
  chat_id?: string;
  user_id: string;
}

export interface WebsiteSummarizeRequest {
  url: string;
  chat_id?: string;
  user_id: string;
}

export interface DocumentSummarizeRequest {
  file_content: string;
  file_name: string;
  user_id: string;
  chat_id?: string;
  content_encoding?: 'utf-8' | 'base64';
}

export interface ImageGenerateRequest {
  prompt: string;
  user_id: string;
  chat_id?: string;
  width?: number;
  height?: number;
  samples?: number;
}

export interface ImageGenerateResponse {
  images: string[];
  chat_id: string;
}

export interface ImageEditRequest {
  edit_prompt: string;
  base_image_url: string;
  chat_id?: string;
  user_id: string;
}

export interface TranslateRequest {
  text: string;
  source_language: string;
  target_language: string;
  user_id: string;
  chat_id?: string;
}

export interface TranslationResponse {
  translated_text: string;
  detected_language?: string;
  chat_id: string;
  message_id: string;
}

export interface ChatHistoryRequest {
  user_id: string;
  tool?: string;
  chat_id?: string;
  limit?: number;
}

export interface ChatHistoryResponse {
  chats: any[];
}

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
  user_id?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ===================
// AI Chat API
// ===================

export const chatAPI = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/api/ai/chat', request);
    return response.data;
  },

  coding: async (request: CodingRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/api/ai/coding', request);
    return response.data;
  },

  youtubeSummarize: async (request: YouTubeSummarizeRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/api/ai/youtube-summarize', request);
    return response.data;
  },

  qa: async (request: { chat_id: string; question: string; user_id: string }): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/api/ai/qa', request);
    return response.data;
  },

  websiteSummarize: async (request: WebsiteSummarizeRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/api/ai/website-summarize', request);
    return response.data;
  },

  documentSummarize: async (request: DocumentSummarizeRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/api/ai/document-summarize', request);
    return response.data;
  },

  generateImage: async (request: ImageGenerateRequest): Promise<ImageGenerateResponse> => {
    const response = await apiClient.post<ImageGenerateResponse>('/api/ai/image-generate', request);
    return response.data;
  },

  editImage: async (request: ImageEditRequest): Promise<ImageGenerateResponse> => {
    const response = await apiClient.post<ImageGenerateResponse>('/api/ai/image-edit', request);
    return response.data;
  },

  translate: async (request: TranslateRequest): Promise<TranslationResponse> => {
    const response = await apiClient.post<TranslationResponse>('/api/ai/translate', request);
    return response.data;
  },
};

// ===================
// Chat History API
// ===================

export const chatHistoryAPI = {
  getHistory: async (request: ChatHistoryRequest): Promise<ChatHistoryResponse> => {
    try {
      const response = await apiClient.post<ChatHistoryResponse>('/api/chat/history', request);
      return response.data;
    } catch (error: any) {
      // Return empty chats if error (user not loaded yet)
      console.warn('Chat history error, returning empty:', error.message);
      return { chats: [] };
    }
  },

  createChat: async (userId: string): Promise<{ chat_id: string }> => {
    try {
      const response = await apiClient.post<{ chat_id: string }>('/api/chat/create', null, {
        params: { user_id: userId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Create chat error:', error);
      throw error;
    }
  },

  editChatTitle: async (userId: string, chatId: string, title: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/api/chat/edit-title', {
        user_id: userId,
        chat_id: chatId,
        title: title
      });
      return response.data;
    } catch (error: any) {
      console.error('Edit chat title error:', error);
      // Return success anyway for local update
      return { success: true, message: 'Chat title updated locally' };
    }
  },

deleteChat: async (userId: string, chatId: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/api/chat/delete', {
        user_id: userId,
        chat_id: chatId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Delete chat error:', error);
      // Return success anyway for local update
      return { success: true, message: 'Chat deleted locally' };
    }
  },
};

// ===================
// Contact API
// ===================

export const contactAPI = {
  submit: async (request: ContactRequest): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/api/contact', request);
    return response.data;
  },
};

// ===================
// Health Check
// ===================

export const healthAPI = {
  check: async (): Promise<{ status: string; services: any }> => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },
};

// ===================
// Code Studio API
// ===================

export const codeStudioAPI = {
  createProject: async (request: {
    user_id: string;
    title: string;
    language: string;
    platform: string;
    initial_request: string;
  }): Promise<{ project: any; session: any; files: Record<string, string> }> => {
    const response = await apiClient.post('/api/code/create', request);
    return response.data;
  },

  generateNextFile: async (request: {
    user_id: string;
    project_id: string;
    session_id: string;
  }): Promise<{ status: string; project_id: string; session_id: string; file_path?: string }> => {
    const response = await apiClient.post('/api/code/generate', request);
    return response.data;
  },

  // legacy alias
  generateNext: async (request: {
    user_id: string;
    project_id: string;
    session_id: string;
  }) => {
    return codeStudioAPI.generateNextFile(request);
  },

  testFile: async (request: { user_id: string; project_id: string; session_id: string; path: string }): Promise<any> => {
    const response = await apiClient.post('/api/code/test', request);
    return response.data;
  },

  saveAssistantPrompt: async (request: {
    user_id: string;
    project_id: string;
    session_id: string;
    message: string;
  }): Promise<{ status: string }> => {
    const response = await apiClient.post('/api/code/save', request);
    return response.data;
  },

  loadProject: async (request: {
    user_id: string;
    project_id: string;
  }): Promise<{ project: any; files: Record<string, string> }> => {
    const response = await apiClient.post('/api/code/load', request);
    return response.data;
  },

  runProject: async (request: {
    user_id: string;
    project_id: string;
    session_id: string;
  }): Promise<{ output?: string; command?: string; logs?: string[] }> => {
    const response = await apiClient.post('/api/code/run', request);
    return response.data;
  },
};

export default apiClient;

