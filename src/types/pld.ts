export interface Topic {
  id: string;
  name: string;
  description?: string;
  internalNorm?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  isApplicable: boolean;
  criticality: 'BAIXA' | 'MEDIA' | 'ALTA';
  order: number;
  topicId: string;
  createdAt: string;
  updatedAt: string;
  answer?: Answer;
}

export interface Answer {
  id: string;
  response: boolean;
  justification?: string;
  deficiency?: string;
  recommendation?: string;
  questionId: string;
  createdAt: string;
  updatedAt: string;
  evidences: Evidence[];
}

export interface Evidence {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  answerId: string;
  uploadedAt: string;
}

export interface FormProgress {
  progress: number;
  totalApplicable: number;
  totalAnswered: number;
  totalQuestions: number;
}

// ENUMS para as opções do PLD
export const PLD_TOPICS = [
  'Política (PI)',
  'Avaliação Interna de Risco (AIR)',
  'Avaliação de Novos Produtos, Serviços e Tecnologia (ANPST)',
  'Governança (GOV)',
  'Conheça seu Cliente (CSC)',
  'Conheça seu Funcionário (CSF)',
  'Conheça seu Presidente de Serviço Terceirizado (CSPET)',
  'Conheça seu Parente (CSP)',
  'Monitoramento, Seleção, Análise e Comunicação (MSAC)',
  'Sanções CSMU (CSMU)',
  'Treinamento (TREN)',
  'Desenvolvimento de Cultura Organizacional (DCO)',
  'Mecanismos de Acompanhamento (MAC)',
  'Auditoria (AUD)'
] as const;

export type PLDTopicType = typeof PLD_TOPICS[number];