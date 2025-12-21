import axios from 'axios';
import type { User, PldSection, PldAttachmentCategory } from '../types/pld';

const rawBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').trim();
const API_BASE_URL = /\/api\/?$/.test(rawBase)
  ? rawBase.replace(/\/+$/, '')
  : `${rawBase.replace(/\/+$/, '')}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors para logging
api.interceptors.request.use(
  (config) => {
    // Anexa token JWT, se existir
    const token = window.localStorage.getItem('pld_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Response Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===== Auth =====
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),

  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),

  me: () => api.get<{ user: User }>('/auth/me'),

  forgotPassword: (data: { email: string }) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string }) =>
    api.post<{ message: string }>('/auth/reset-password', data),
};

// Relatórios
export const reportApi = {
  generateMyReport: (type: 'PARTIAL' | 'FULL' = 'FULL', format: 'PDF' | 'DOCX' = 'PDF') =>
    api.get('/report/me', { params: { type, format } }),

  generateUserReport: (
    userId: string,
    type: 'PARTIAL' | 'FULL' = 'FULL',
    format: 'PDF' | 'DOCX' = 'PDF',
    topicIds?: string[]
  ) =>
    api.get(`/report/user/${userId}`, {
      params: { type, format, topicIds: topicIds?.length ? topicIds.join(',') : undefined },
    }),

  generatePldBuilderReport: (format: 'PDF' | 'DOCX' = 'DOCX') =>
    api.get<{ report: unknown; url: string }>('/report/pld-builder', { params: { format } }),
};
// Builder PLD (novo)
export const pldBuilderApi = {
  listSections: () => api.get<{ sections: PldSection[] }>('/pld/sections'),

  createSection: (data: {
    item: string;
    customLabel?: string | null;
    hasNorma?: boolean;
    normaReferencia?: string | null;
    descricao?: string | null;
  }) => api.post<{ section: PldSection }>('/pld/sections', data),

  updateSection: (id: string, data: Partial<PldSection>) =>
    api.patch<{ section: PldSection }>(`/pld/sections/${id}`, data),

  deleteSection: (id: string) => api.delete(`/pld/sections/${id}`),

  reorderSections: (sectionIds: string[]) =>
    api.post('/pld/sections/reorder', { sectionIds }),

  uploadNorma: (sectionId: string, file: File, referencia?: string | null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (referencia) formData.append('referencia', referencia);
    return api.post<{ section: PldSection }>(`/pld/sections/${sectionId}/norma`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createQuestion: (sectionId: string, texto: string) =>
    api.post<{ question: any }>(`/pld/questions`, { sectionId, texto }),

  updateQuestion: (id: string, data: Record<string, unknown>) =>
    api.patch<{ question: any }>(`/pld/questions/${id}`, data),

  deleteQuestion: (id: string) => api.delete(`/pld/questions/${id}`),

  reorderQuestions: (sectionId: string, questionIds: string[]) =>
    api.post('/pld/questions/reorder', { sectionId, questionIds }),

  uploadAttachment: (questionId: string, file: File, category: PldAttachmentCategory, referenceText?: string | null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (referenceText) formData.append('referenceText', referenceText);
    return api.post(`/pld/questions/${questionId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAttachment: (attachmentId: string) => api.delete(`/pld/attachments/${attachmentId}`),

  concludeBuilder: () => api.post('/pld/conclude'),
};
