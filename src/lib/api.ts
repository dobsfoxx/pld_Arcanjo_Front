import axios from 'axios';
import type { Answer, Evidence, FormProgress, Question, Topic } from '../types/pld';

const API_URL = 'http://localhost:3001/api/form';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors para logging
api.interceptors.request.use(
  (config) => {
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

// Funções específicas do PLD
export const pldApi = {
  // Tópicos
  getTopics: () => api.get<{ topics: Topic[] }>('/topics'),
  createTopic: (data: { name: string; description?: string; internalNorm?: string }) =>
    api.post<{ topic: Topic }>('/topics', data),
  deleteTopic: (topicId: string) =>
    api.delete(`/topics/${topicId}`),
  reorderTopics: (topicIds: string[]) =>
    api.patch('/topics/reorder', { topicIds }),

  // Perguntas
  createQuestion: (data: { 
    topicId: string; 
    title: string; 
    description?: string; 
    criticality?: string;
  }) => api.post<{ question: Question }>('/questions', data),
  deleteQuestion: (questionId: string) =>
    api.delete(`/questions/${questionId}`),
  
  updateQuestionApplicable: (questionId: string, isApplicable: boolean) =>
    api.patch<{ question: Question }>(`/questions/${questionId}/applicable`, { isApplicable }),
  
  reorderQuestions: (topicId: string, questionIds: string[]) =>
    api.patch('/questions/reorder', { topicId, questionIds }),

  // Respostas
  answerQuestion: (data: {
    questionId: string;
    response: boolean;
    justification?: string;
    deficiency?: string;
    recommendation?: string;
  }) => api.post<{ answer: Answer }>('/answers', data),
  
  getAnswer: (questionId: string) =>
    api.get<{ answer: Answer }>(`/answers/${questionId}`),

  // Evidências
  uploadEvidences: (answerId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post<{ evidences: Evidence[] }>(
      `/answers/${answerId}/evidences`, 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  
  deleteEvidence: (evidenceId: string) =>
    api.delete(`/evidences/${evidenceId}`),

  // Progresso
  getProgress: () => api.get<{ progress: FormProgress }>('/progress'),
  getTopicProgress: (topicId: string) =>
    api.get<{ progress: unknown }>(`/progress/topic/${topicId}`),

  // Dados completos
  getFormData: () => api.get<{ data: Topic[] }>('/data'),
};

export type { Topic, Question, Answer, Evidence, FormProgress } from '../types/pld';