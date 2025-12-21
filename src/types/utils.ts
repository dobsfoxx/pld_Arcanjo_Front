import type { Criticidade, Resposta, Section, Teste, Question } from './types';
import type { PldAttachment, PldSection } from './types';

export const isTempId = (id: string) => id.startsWith('sec_') || id.startsWith('q_');

export const toIsoDateTimeOrNull = (dateValue: string) => {
  const trimmed = (dateValue || '').trim();
  if (!trimmed) return null;
  // `<input type="date" />` returns `YYYY-MM-DD`. Prisma DateTime expects ISO-8601.
  const isoLike = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00.000Z` : trimmed;
  const parsed = new Date(isoLike);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

export const mapApiSectionToState = (section: PldSection): Section => {
  const mappedQuestions: Question[] = section.questions
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const findAtt = (category: PldAttachment['category']) =>
        q.attachments.find((att) => att.category === category);

      return {
        id: q.id,
        texto: q.texto,
        aplicavel: q.aplicavel,
        respondida: q.respondida,
        capitulacao: q.capitulacao || '',
        criticidade: q.criticidade,
        resposta: (q.resposta as Resposta) || '',
        respostaTexto: q.respostaTexto || '',
        respostaArquivo: null,
        deficienciaTexto: q.deficienciaTexto || '',
        deficienciaArquivo: null,
        recomendacaoTexto: q.recomendacaoTexto || '',
        test: {
          status: (q.testStatus as Teste) || '',
          description: q.testDescription || '',
          requisicao: null,
          requisicaoRef: findAtt('TESTE_REQUISICAO')?.referenceText || '',
          resposta: null,
          respostaRef: findAtt('TESTE_RESPOSTA')?.referenceText || '',
          amostra: null,
          amostraRef: findAtt('TESTE_AMOSTRA')?.referenceText || '',
          evidencias: null,
          evidenciasRef: findAtt('TESTE_EVIDENCIAS')?.referenceText || '',
          actionPlan: {
            origem: q.actionOrigem || '',
            responsavel: q.actionResponsavel || '',
            descricao: q.actionDescricao || '',
            dataApontamento: q.actionDataApontamento?.slice(0, 10) || '',
            prazoOriginal: q.actionPrazoOriginal?.slice(0, 10) || '',
            prazoAtual: q.actionPrazoAtual?.slice(0, 10) || '',
            comentarios: q.actionComentarios || '',
          },
        },
      };
    });

  return {
    id: section.id,
    item: section.item,
    customLabel: section.customLabel || '',
    hasNorma: section.hasNorma,
    normaFile: null,
    descricao: section.descricao || '',
    questions: mappedQuestions,
  };
};

export const criticidadeTone = (criticidade: Criticidade) => {
  if (criticidade === 'ALTA') {
    return {
      badge: 'bg-red-50 text-red-700 border-red-200',
      ring: 'focus:ring-red-500/20 focus:border-red-500',
    };
  }

  return {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ring: 'focus:ring-emerald-500/20 focus:border-emerald-500',
  };
};
