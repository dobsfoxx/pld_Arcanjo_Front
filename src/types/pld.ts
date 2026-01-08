

export interface FormProgress {
  progress: number;
  totalApplicable: number;
  totalAnswered: number;
  totalQuestions: number;
}

export type UserRole = 'ADMIN' | 'USER' | 'TRIAL_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isTrial?: boolean;
  trialExpiresAt?: string | null;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const PLD_TOPICS = [
  'Política (PI)',
  'Avaliação Interna de Risco (AIR)',
  'Avaliação de Novos Produtos, Serviços e Tecnologia (ANPST)',
  'Governança (GOV)',
  'Conheça seu Cliente (CSC)',
  'Conheça seu Funcionário (CSF)',
  'Conheça seu Prestador de Serviço Terceirizado (CSPST)',
  'Conheça seu Parceiro (CSP)',
  'Monitoramento, Seleção, Análise e Comunicação (MSAC)',
  'Sanções CSNU (CSNU)',
  'Treinamento (TREIN)',
  'Desenvolvimento de Cultura Organizacional (DCO)',
  'Mecanismos de Acompanhamento (MAC)',
  'Auditoria (AUD)'
] as const;

export const PLD_ITEM_OPTIONS = [...PLD_TOPICS, 'Outro'] as const;
export type PldItemOption = typeof PLD_ITEM_OPTIONS[number];

export type PLDTopicType = typeof PLD_TOPICS[number];

// Novos tipos para o builder PLD
export type PldAttachmentCategory =
  | 'NORMA'
  | 'TEMPLATE'
  | 'RESPOSTA'
  | 'DEFICIENCIA'
  | 'TESTE_REQUISICAO'
  | 'TESTE_RESPOSTA'
  | 'TESTE_AMOSTRA'
  | 'TESTE_EVIDENCIAS';

export interface PldAttachment {
  id: string;
  sectionId?: string | null;
  questionId?: string | null;
  category: PldAttachmentCategory;
  referenceText?: string | null;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface PldQuestion {
  id: string;
  sectionId: string;
  order: number;
  texto: string;
  aplicavel: boolean;
  respondida: boolean;
  templateRef?: string | null;
  capitulacao?: string | null;
  criticidade: 'BAIXA' | 'MEDIA' | 'ALTA';
  resposta?: string | null;
  respostaTexto?: string | null;
  deficienciaTexto?: string | null;
  recomendacaoTexto?: string | null;
  testStatus?: 'SIM' | 'NAO' | 'NAO_PLANO' | null;
  testDescription?: string | null;
  actionOrigem?: string | null;
  actionResponsavel?: string | null;
  actionDescricao?: string | null;
  actionDataApontamento?: string | null;
  actionPrazoOriginal?: string | null;
  actionPrazoAtual?: string | null;
  actionComentarios?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: PldAttachment[];
}

export interface PldSection {
  id: string;
  item: string;
  customLabel?: string | null;
  hasNorma: boolean;
  normaReferencia?: string | null;
  descricao?: string | null;
  order: number;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  questions: PldQuestion[];
  attachments: PldAttachment[];
}
