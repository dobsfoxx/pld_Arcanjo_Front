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
  respostaArquivo: null,
  deficienciaTexto: '',
  deficienciaArquivo: null,
  recomendacaoTexto: '',
  test: {
    status: '',
    description: '',
    requisicao: null,
    requisicaoRef: '',
    resposta: null,
    respostaRef: '',
    amostra: null,
    amostraRef: '',
    evidencias: null,
    evidenciasRef: '',
    actionPlan: { ...defaultActionPlan },
  },
});

export const makeEmptySection = (defaultItem: string): Section => ({
  id: `sec_${crypto.randomUUID()}`,
  item: defaultItem,
  customLabel: '',
  hasNorma: false,
  normaFile: null,
  descricao: '',
  questions: [],
});
