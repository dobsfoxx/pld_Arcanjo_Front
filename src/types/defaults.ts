import type { ActionPlan, Question, Section } from './types';

export const defaultActionPlan: ActionPlan = {
  origem: '',
  responsavel: '',
  descricao: '',
  dataApontamento: '',
  prazoOriginal: '',
  prazoAtual: '',
  comentarios: '',
};

export const makeEmptyQuestion = (): Question => ({
  id: `q_${crypto.randomUUID()}`,
  texto: '',
  aplicavel: true,
  respondida: false,
  capitulacao: '',
  criticidade: 'MEDIA',
  resposta: '',
  respostaTexto: '',
  respostaArquivo: [],
  deficienciaTexto: '',
  deficienciaArquivo: [],
  recomendacaoTexto: '',
  test: {
    status: '',
    description: '',
    requisicao: [],
    requisicaoRef: '',
    resposta: [],
    respostaRef: '',
    amostra: [],
    amostraRef: '',
    evidencias: [],
    evidenciasRef: '',
    actionPlan: { ...defaultActionPlan },
  },
});

export const makeEmptySection = (defaultItem: string): Section => ({
  id: `sec_${crypto.randomUUID()}`,
  item: defaultItem,
  customLabel: '',
  hasNorma: false,
  normaFile: [],
  descricao: '',
  questions: [],
});
