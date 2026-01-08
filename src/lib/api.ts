import axios from 'axios';
import type { User, PldSection, PldAttachmentCategory } from '../types/pld';
import type { UpdateMePayload } from '../types/profile';

const rawBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').trim();
const API_BASE_URL = /\/api\/?$/.test(rawBase)
  ? rawBase.replace(/\/+$/, '')
  : `${rawBase.replace(/\/+$/, '')}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function safeGetStoredToken(): string | null {
  try {
    const token = window.localStorage.getItem('pld_token')
    return token && token.trim() ? token : null
  } catch {
    return null
  }
}

export function setClientAuthToken(token: string | null) {
  const trimmed = token && token.trim() ? token.trim() : null
  if (trimmed) {
    api.defaults.headers.common.Authorization = `Bearer ${trimmed}`
    return
  }
  delete (api.defaults.headers.common as any).Authorization
}

// Interceptors para logging
api.interceptors.request.use(
  (config) => {
    // Anexa token JWT, se existir
    const token = safeGetStoredToken()
    if (token) {
      const headers: any = (config.headers ?? {}) as any
      // Axios 1.x pode usar AxiosHeaders (com .set)
      if (typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`)
      } else {
        headers.Authorization = `Bearer ${token}`
      }
      config.headers = headers
    }

    // Garantia extra (alguns callers podem sobrescrever)
    config.withCredentials = true

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

  register: (data: { name: string; email: string; password: string; startTrial?: boolean }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),

  me: () => api.get<{ user: User }>('/auth/me'),

  updateMe: (data: UpdateMePayload) => api.patch<{ user: User }>('/auth/me', data),

  google: (data: { credential: string }) =>
    api.post<{ token: string; user: User }>('/auth/google', data),

  forgotPassword: (data: { email: string }) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string }) =>
    api.post<{ message: string }>('/auth/reset-password', data),

  logout: () => api.post<{ message: string }>('/auth/logout', {}),
};

export const billingApi = {
  me: () => api.get<{ entitlements: any }>('/billing/me'),
  checkout: () => api.post<{ url?: string }>('/billing/checkout', {}),
  portal: () => api.post<{ url?: string }>('/billing/portal', {}),
};

// Relatórios
export const reportApi = {
  generateMyReport: (type: 'PARTIAL' | 'FULL' = 'FULL', format: 'PDF' | 'DOCX' = 'PDF') =>
    api.get('/report/me', { params: { type, format } }),

  generateMyBuilderFormReport: (formId: string, format: 'PDF' | 'DOCX' = 'PDF') =>
    api.get(`/report/forms/${formId}`, { params: { format } }),

  generateUserReport: (
    userId: string,
    type: 'PARTIAL' | 'FULL' = 'FULL',
    format: 'PDF' | 'DOCX' = 'PDF',
    topicIds?: string[]
  ) =>
    api.get(`/report/user/${userId}`, {
      params: { type, format, topicIds: topicIds?.length ? topicIds.join(',') : undefined },
    }),

  generatePldBuilderReport: (
    format: 'PDF' | 'DOCX' = 'DOCX',
    payload?: {
      name?: string | null
      metadata?: {
        instituicoes?: Array<{ nome?: string; cnpj?: string }>
        qualificacaoAvaliador?: string
      } | null
    }
  ) =>
    api.post<{ report: unknown; url: string; downloadUrl?: string | null; signedUrl?: string | null }>(
      '/report/pld-builder',
      payload ?? {},
      { params: { format } }
    ),
};
// Builder PLD (novo)
export const pldBuilderApi = {
  listSections: () => api.get<{ sections: PldSection[] }>('/pld/sections'),

  resetBuilder: () => api.post('/pld/reset'),

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

  concludeBuilder: (data: {
    name: string
    sentToEmail?: string | null
    helpTexts?: { qualificacao?: string; metodologia?: string; recomendacoes?: string; planoAcao?: string } | null
    metadata?: any
  }) => 
    api.post('/pld/conclude', data),

  listConcludedForms: () => 
    api.get<{ forms: any[] }>('/pld/forms'),

  listMyForms: () => 
    api.get<{ forms: any[] }>('/pld/my-forms'),

  getConcludedForm: (id: string) => 
    api.get<{ form: any }>(`/pld/forms/${id}`),

  deleteForm: (formId: string) =>
    api.delete(`/pld/forms/${formId}`),

  sendFormToUser: (
    formId: string,
    email: string,
    helpTexts?: { qualificacao?: string; metodologia?: string; recomendacoes?: string; planoAcao?: string } | null
  ) => api.post(`/pld/forms/${formId}/send`, { email, helpTexts: helpTexts ?? null }),

  approveForm: (formId: string) => 
    api.post(`/pld/forms/${formId}/approve`),

  returnForm: (formId: string, reason?: string) => 
    api.post(`/pld/forms/${formId}/return`, { reason }),

  getUserForm: (formId: string) => 
    api.get<{ form: any }>(`/pld/forms/${formId}/user`),

  saveUserFormResponses: (formId: string, data: { answers: any[]; sections?: any[]; metadata?: any }) => 
    api.post(`/pld/forms/${formId}/responses`, data),

  submitUserFormForReview: (formId: string, data: { answers: any[]; sections?: any[]; metadata?: any }) => 
    api.post(`/pld/forms/${formId}/submit`, data),

  completeUserForm: (formId: string) =>
    api.post(`/pld/forms/${formId}/complete`),

  uploadUserFormAttachment: (formId: string, file: File, category: string, options?: { questionId?: string; sectionId?: string; referenceText?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (options?.questionId) formData.append('questionId', options.questionId);
    if (options?.sectionId) formData.append('sectionId', options.sectionId);
    if (options?.referenceText) formData.append('referenceText', options.referenceText);
    return api.post<{ attachment: any }>(`/pld/forms/${formId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
