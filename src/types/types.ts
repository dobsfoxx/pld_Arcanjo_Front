import type { PldQuestion, PldSection, PldAttachment } from './pld';

export type Criticidade = PldQuestion['criticidade'];
export type Resposta = 'Sim' | 'Não' | '';
export type Teste = '' | NonNullable<PldQuestion['testStatus']>;

export type ActionPlan = {
  origem: string;
  responsavel: string;
  descricao: string;
  dataApontamento: string;
  prazoOriginal: string;
  prazoAtual: string;
  comentarios: string;
};

export type TestData = {
  status: Teste;
  description: string;
  requisicao: File | null;
  requisicaoRef: string;
  resposta: File | null;
  respostaRef: string;
  amostra: File | null;
  amostraRef: string;
  evidencias: File | null;
  evidenciasRef: string;
  actionPlan: ActionPlan;
};

export type Question = {
  id: string;
  texto: string;
  aplicavel: boolean;
  respondida: boolean;
  capitulacao: string;
  criticidade: Criticidade;
  resposta: Resposta;
  respostaTexto: string;
  respostaArquivo: File | null;
  deficienciaTexto: string;
  deficienciaArquivo: File | null;
  recomendacaoTexto: string;
  test: TestData;
};

export type Section = {
  id: string;
  item: string;
  customLabel: string;
  hasNorma: boolean;
  normaFile: File | null;
  descricao: string;
  questions: Question[];
};

export type { PldSection, PldAttachment };
