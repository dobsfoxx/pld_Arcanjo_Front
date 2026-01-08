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
  requisicao: File[];
  requisicaoRef: string;
  resposta: File[];
  respostaRef: string;
  amostra: File[];
  amostraRef: string;
  evidencias: File[];
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
  respostaArquivo: File[];
  deficienciaTexto: string;
  deficienciaArquivo: File[];
  recomendacaoTexto: string;
  test: TestData;
};

export type Section = {
  id: string;
  item: string;
  customLabel: string;
  hasNorma: boolean;
  normaFile: File[];
  descricao: string;
  questions: Question[];
};

export type { PldSection, PldAttachment };
