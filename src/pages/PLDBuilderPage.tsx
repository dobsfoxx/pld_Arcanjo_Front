import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getToastErrorMessage } from '../lib/errors';
import { ProgressDashboard } from '../components/ProgressDashBoard';
import { useAuth } from '../contexts/useAuth';
import { usePldCatalog } from '../contexts/usePldCatalog';
import { pldBuilderApi, reportApi, api } from '../lib/api';
import type { FormProgress } from '../types/pld';
import type { PldSection, Question, Section } from '../types/types';
import { makeEmptyQuestion, makeEmptySection } from '../types/defaults';
import { isTempId, mapApiSectionToState, toIsoDateTimeOrNull } from '../types/utils';
import { BuilderHeader } from '../components/BuilderHeader';
import AppFooter from '../components/AppFooter';
import { SectionSidebar } from '../components/SectionSidebar';
import { ActiveSectionEditor } from '../components/ActiveSectionEditor';
import { QuestionCard } from '../components/QuestionCard';

export default function PLDBuilderPage() {
  const [searchParams] = useSearchParams();
  const { itemOptions } = usePldCatalog();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const subscriptionActive = (user?.subscriptionStatus || '').toUpperCase() === 'ACTIVE';
  const userRole = (user?.role || '').toString().toUpperCase();
  const trialExpiresAtMs = user?.trialExpiresAt ? new Date(user.trialExpiresAt).getTime() : null;
  const trialActive =
    (userRole === 'TRIAL_ADMIN' || user?.isTrial === true) &&
    typeof trialExpiresAtMs === 'number' &&
    !Number.isNaN(trialExpiresAtMs) &&
    trialExpiresAtMs > Date.now();

  const canEdit = userRole === 'ADMIN' || subscriptionActive || trialActive;
  const isTrial = trialActive;
  const TRIAL_MAX_SECTIONS = 3;
  const TRIAL_MAX_QUESTIONS = 3;

  const defaultItem = itemOptions[0] || 'Política (PI)';

  const [sections, setSections] = useState<Section[]>([makeEmptySection(defaultItem)]);
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0].id);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [concluding, setConcluding] = useState(false);
  const [concludeModalOpen, setConcludeModalOpen] = useState(false);
  const [initialSetupMode, setInitialSetupMode] = useState(false);
  const [concludeName, setConcludeName] = useState('');
  const [concludeSentToEmail, setConcludeSentToEmail] = useState('');
  type ConcludeInstituicao = { id: string; nome: string; cnpj: string };
  const [concludeInstituicoes, setConcludeInstituicoes] = useState<ConcludeInstituicao[]>([]);
  const [concludeQualificacaoAvaliador, setConcludeQualificacaoAvaliador] = useState('');
  const [reportFormat, setReportFormat] = useState<'DOCX' | 'PDF'>('DOCX');
  const [editFormName, setEditFormName] = useState<string | null>(null);
  
  // Estado para modal de envio de formulário
  const [sending, setSending] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendFormName, setSendFormName] = useState('');
  const [sendFormEmail, setSendFormEmail] = useState('');

  const defaultHelpTexts = {
    qualificacao:
      'Neste campo, descreva as qualificações profissionais do avaliador responsável pela avaliação de efetividade, incluindo:\n\n- Formação acadêmica\n- Certificações relevantes (ex: CAMS, CFE, CPA, etc.)\n- Experiência profissional na área de PLD/FT\n- Tempo de atuação no mercado financeiro\n- Outras qualificações pertinentes\n\nExemplo: "Profissional com 10 anos de experiência em compliance bancário, certificação CAMS, pós-graduação em Gestão de Riscos..."',
    metodologia:
      'MOSTRAR:\nInclui no relatório final a metodologia utilizada e os resultados detalhados da avaliação de efetividade.\n\nNÃO MOSTRAR:\nOmite a metodologia e resultados do relatório final. Útil quando a metodologia é confidencial ou já foi documentada em outro local.',
    recomendacoes:
      'INCLUIR:\nHabilita o campo de recomendações em cada questão, permitindo documentar sugestões de melhoria para cada item avaliado.\n\nNÃO INCLUIR:\nDesabilita o campo de recomendações. Útil quando as recomendações serão consolidadas em um documento separado ou quando não são aplicáveis ao tipo de avaliação.\n\nAo selecionar "NÃO INCLUIR", o campo de recomendação ficará desabilitado em todas as questões.',
    planoAcao:
      'Ao selecionar esta opção, indique no campo de comentários o plano de ação corretiva em andamento. Descreva:\n\n- Origem do apontamento e data\n- Responsável pelo plano de ação\n- Descrição da deficiência identificada\n- Prazos (original e atual) para implementação\n- Status atual da implementação\n- Evidências de andamento\n\nEnvie anexos que comprovem o plano de ação e seu progresso.',
  };
  const [helpTexts, setHelpTexts] = useState(defaultHelpTexts);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'PENDING' | 'ANSWERED' | 'NA'>('ALL');
  const [questionPage, setQuestionPage] = useState(1);
  const QUESTIONS_PER_PAGE = 10;

  const initialSectionIdsRef = useRef<Set<string>>(new Set());
  const initialQuestionIdsRef = useRef<Map<string, Set<string>>>(new Map());

  // Track last persisted state to avoid re-saving everything on every small change.
  const lastPersistedSectionPayloadRef = useRef<Map<string, string>>(new Map());
  const lastPersistedQuestionPayloadRef = useRef<Map<string, string>>(new Map());
  const lastPersistedSectionOrderRef = useRef<string[]>([]);
  const lastPersistedQuestionOrderRef = useRef<Map<string, string[]>>(new Map());

  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const setSectionsAndSyncRef = (updater: (prev: Section[]) => Section[]) => {
    setSections((prev) => {
      const next = updater(prev);
      sectionsRef.current = next;
      return next;
    });
  };

  const activeSectionIdRef = useRef(activeSectionId);
  useEffect(() => {
    activeSectionIdRef.current = activeSectionId;
  }, [activeSectionId]);

  const expandedQuestionsRef = useRef(expandedQuestions);
  useEffect(() => {
    expandedQuestionsRef.current = expandedQuestions;
  }, [expandedQuestions]);

  const autosaveTimerRef = useRef<number | null>(null);
  const changeCounterRef = useRef(0);
  const lastSavedCounterRef = useRef(0);
  const persistPromiseRef = useRef<Promise<boolean> | null>(null);
  const persistBuilderRef = useRef<(opts?: { silent?: boolean; reload?: boolean; setBusy?: boolean }) => Promise<boolean>>(
    async () => false
  );

  // Keep local file selections visible while preventing re-upload loops.
  const uploadedFilesRef = useRef<Map<string, Set<string>>>(new Map());
  const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;
  const wasUploaded = (scope: string, f: File) => uploadedFilesRef.current.get(scope)?.has(fileKey(f)) ?? false;
  const markUploaded = (scope: string, f: File) => {
    const key = fileKey(f);
    const set = uploadedFilesRef.current.get(scope) ?? new Set<string>();
    set.add(key);
    uploadedFilesRef.current.set(scope, set);
  };

  const progressData: FormProgress = useMemo(() => {
    const totals = sections.reduce(
      (acc, section) => {
        section.questions.forEach((question) => {
          acc.totalQuestions += 1;
          if (question.aplicavel) {
            acc.totalApplicable += 1;
            if (question.respondida) {
              acc.totalAnswered += 1;
            }
          }
        });
        return acc;
      },
      { totalQuestions: 0, totalApplicable: 0, totalAnswered: 0 }
    );

    const progress =
      totals.totalApplicable > 0
        ? Math.min(100, Math.round((totals.totalAnswered / totals.totalApplicable) * 100))
        : 0;

    return { ...totals, progress };
  }, [sections]);

  const totalQuestionsCount = useMemo(
    () => sections.reduce((acc, s) => acc + s.questions.length, 0),
    [sections]
  );

  const canAddSection = canEdit && (!trialActive || sections.length < TRIAL_MAX_SECTIONS);
  const canAddQuestion = canEdit && (!trialActive || totalQuestionsCount < TRIAL_MAX_QUESTIONS);

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) || sections[0],
    [sections, activeSectionId]
  );

  const questionStats = useMemo(() => {
    const all = activeSection?.questions ?? [];
    const notApplicable = all.filter((q) => !q.aplicavel).length;
    const answered = all.filter((q) => q.aplicavel && q.respondida).length;
    const pending = all.filter((q) => q.aplicavel && !q.respondida).length;
    return {
      total: all.length,
      answered,
      pending,
      notApplicable,
    };
  }, [activeSection]);

  const filteredQuestions = useMemo(() => {
    const all = activeSection?.questions ?? [];
    switch (questionFilter) {
      case 'PENDING':
        return all.filter((q) => q.aplicavel && !q.respondida);
      case 'ANSWERED':
        return all.filter((q) => q.aplicavel && q.respondida);
      case 'NA':
        return all.filter((q) => !q.aplicavel);
      case 'ALL':
      default:
        return all;
    }
  }, [activeSection, questionFilter]);

  // Paginação de questões
  const totalQuestionPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = useMemo(() => {
    const start = (questionPage - 1) * QUESTIONS_PER_PAGE;
    return filteredQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [filteredQuestions, questionPage]);

  // Reset página quando mudar filtro ou seção
  useEffect(() => {
    setQuestionPage(1);
  }, [questionFilter, activeSectionId]);

  // Ajustar página se exceder total
  useEffect(() => {
    if (questionPage > totalQuestionPages && totalQuestionPages > 0) {
      setQuestionPage(totalQuestionPages);
    }
  }, [totalQuestionPages, questionPage]);

  const questionIndexById = useMemo(() => {
    const map = new Map<string, number>();
    (activeSection?.questions ?? []).forEach((q, idx) => map.set(q.id, idx));
    return map;
  }, [activeSection]);

  const filterBtnClass = (active: boolean) =>
    active
      ? 'px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-900 text-white text-xs font-bold transition-colors'
      : 'px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:border-slate-300 transition-colors';

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pldBuilderApi.listSections();
      const apiSections = res.data.sections;

      // Quando o builder está vazio (ex: após /reset), precisamos limpar o estado local.
      // Caso contrário, ficamos com ids antigos (já deletados no backend) e o próximo save falha.
      if (!apiSections.length) {
        const fresh = makeEmptySection(defaultItem);
        sectionsRef.current = [fresh];
        setSections([fresh]);
        setActiveSectionId(fresh.id);
        activeSectionIdRef.current = fresh.id;
        setExpandedQuestions(new Set());
        expandedQuestionsRef.current = new Set();

        initialSectionIdsRef.current = new Set();
        initialQuestionIdsRef.current = new Map();
        lastPersistedSectionPayloadRef.current = new Map();
        lastPersistedQuestionPayloadRef.current = new Map();
        lastPersistedSectionOrderRef.current = [];
        lastPersistedQuestionOrderRef.current = new Map();
        uploadedFilesRef.current = new Map();
        changeCounterRef.current = 0;
        lastSavedCounterRef.current = 0;

        if (autosaveTimerRef.current) {
          window.clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = null;
        }
        return;
      }

      const mapped = apiSections
        .sort((a, b) => a.order - b.order)
        .map(mapApiSectionToState);

      sectionsRef.current = mapped;
      setSections(mapped);

      const desiredActiveId = activeSectionIdRef.current;
      const nextActiveId = mapped.some((s) => s.id === desiredActiveId) ? desiredActiveId : mapped[0].id;
      setActiveSectionId(nextActiveId);

      const validQuestionIds = new Set<string>();
      apiSections.forEach((sec) => {
        sec.questions.forEach((q) => validQuestionIds.add(q.id));
      });
      const prevExpanded = expandedQuestionsRef.current;
      const nextExpanded = new Set<string>();
      prevExpanded.forEach((id) => {
        if (validQuestionIds.has(id)) nextExpanded.add(id);
      });
      setExpandedQuestions(nextExpanded);

      initialSectionIdsRef.current = new Set(apiSections.map((s) => s.id));
      const qMap = new Map<string, Set<string>>();
      apiSections.forEach((sec) => {
        qMap.set(sec.id, new Set(sec.questions.map((q) => q.id)));
      });
      initialQuestionIdsRef.current = qMap;

      // Seed last-persisted snapshot from server response.
      const nextSectionPayloads = new Map<string, string>();
      const nextQuestionPayloads = new Map<string, string>();
      const nextSectionOrder = apiSections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => s.id);
      const nextQuestionOrder = new Map<string, string[]>();

      apiSections.forEach((sec) => {
        nextSectionPayloads.set(
          sec.id,
          JSON.stringify({
            item: sec.item,
            customLabel: sec.customLabel ?? null,
            hasNorma: !!sec.hasNorma,
            // Keep parity with persist payload shape.
            normaReferencia: null,
            descricao: sec.descricao ?? null,
          })
        );

        const orderedQuestionIds = sec.questions.slice().sort((a, b) => a.order - b.order).map((q) => q.id);
        nextQuestionOrder.set(sec.id, orderedQuestionIds);

        sec.questions.forEach((q) => {
          nextQuestionPayloads.set(
            q.id,
            JSON.stringify({
              sectionId: q.sectionId,
              texto: q.texto,
              aplicavel: q.aplicavel,
              respondida: q.respondida,
              templateRef: null,
              capitulacao: q.capitulacao ?? null,
              criticidade: q.criticidade,
              resposta: q.resposta ?? null,
              respostaTexto: q.respostaTexto ?? null,
              deficienciaTexto: q.deficienciaTexto ?? null,
              recomendacaoTexto: q.recomendacaoTexto ?? null,
              testStatus: q.testStatus ?? null,
              testDescription: q.testDescription ?? null,
              actionOrigem: q.actionOrigem ?? null,
              actionResponsavel: q.actionResponsavel ?? null,
              actionDescricao: q.actionDescricao ?? null,
              actionDataApontamento: q.actionDataApontamento ?? null,
              actionPrazoOriginal: q.actionPrazoOriginal ?? null,
              actionPrazoAtual: q.actionPrazoAtual ?? null,
              actionComentarios: q.actionComentarios ?? null,
            })
          );
        });
      });

      lastPersistedSectionPayloadRef.current = nextSectionPayloads;
      lastPersistedQuestionPayloadRef.current = nextQuestionPayloads;
      lastPersistedSectionOrderRef.current = nextSectionOrder;
      lastPersistedQuestionOrderRef.current = nextQuestionOrder;
    } catch (error) {
      console.error('Erro ao carregar builder:', error);
      toast.error('Não foi possível carregar o builder');
    } finally {
      setLoading(false);
    }
  }, [defaultItem]);

  useEffect(() => {
    void loadSections();
  }, [loadSections]);

  // Detectar parâmetro editFormId para carregar formulário existente
  useEffect(() => {
    const formIdParam = searchParams.get('editFormId');
    if (formIdParam) {
      // Carregar o formulário existente
      void (async () => {
        setLoading(true);
        try {
          const res = await pldBuilderApi.getConcludedForm(formIdParam);
          const form = res.data.form;
          
          if (form && form.sections) {
            setEditFormName(form.name);
            
            // Mapear seções do formulário para o formato do builder
            const mappedSections = form.sections.map((sec: any) => ({
              id: sec.id,
              item: sec.item,
              customLabel: sec.customLabel ?? null,
              hasNorma: !!sec.hasNorma,
              normaReferencia: sec.normaReferencia ?? null,
              descricao: sec.descricao ?? null,
              questions: sec.questions.map((q: any) => ({
                id: q.id,
                sectionId: sec.id,
                texto: q.texto,
                aplicavel: q.aplicavel,
                respondida: q.respondida,
                capitulacao: q.capitulacao ?? null,
                criticidade: q.criticidade,
                resposta: q.resposta ?? null,
                respostaTexto: q.respostaTexto ?? null,
                deficienciaTexto: q.deficienciaTexto ?? null,
                recomendacaoTexto: q.recomendacaoTexto ?? null,
                testStatus: q.testStatus ?? null,
                testDescription: q.testDescription ?? null,
                requisicaoRef: q.requisicaoRef ?? null,
                respostaTesteRef: q.respostaTesteRef ?? null,
                amostraRef: q.amostraRef ?? null,
                evidenciasRef: q.evidenciasRef ?? null,
                actionOrigem: q.actionOrigem ?? null,
                actionResponsavel: q.actionResponsavel ?? null,
                actionDescricao: q.actionDescricao ?? null,
                actionDataApontamento: q.actionDataApontamento ?? null,
                actionPrazoOriginal: q.actionPrazoOriginal ?? null,
                actionPrazoAtual: q.actionPrazoAtual ?? null,
                actionComentarios: q.actionComentarios ?? null,
                attachments: q.attachments ?? [],
              })),
              attachments: sec.attachments ?? [],
            }));

            sectionsRef.current = mappedSections;
            setSections(mappedSections);
            setActiveSectionId(mappedSections[0]?.id || '');
            
            toast.success('Formulário carregado para edição');
          }
        } catch (error) {
          console.error('Erro ao carregar formulário:', error);
          toast.error('Erro ao carregar formulário para edição');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const markDirtyAndScheduleAutosave = () => {
    if (!canEdit) return;
    if (loading || concluding) return;

    changeCounterRef.current += 1;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void (async () => {
        if (changeCounterRef.current === lastSavedCounterRef.current) return;
        await persistBuilder({ silent: true, reload: false, setBusy: false });
      })();
    }, 350);
  };

  const updateSection = (data: Partial<Section>) => {
      if (!canEdit) return;
    setSectionsAndSyncRef((prev) => prev.map((s) => (s.id === activeSectionId ? { ...s, ...data } : s)));
    markDirtyAndScheduleAutosave();
  };

  const addSection = () => {
    if (!canEdit) {
      toast.error('Apenas ADMIN ou Trial pode editar');
      return;
    }
    if (!canAddSection) {
      toast.error(`No modo teste, o limite é de ${TRIAL_MAX_SECTIONS} itens.`);
      return;
    }
    const newSec = makeEmptySection(defaultItem);
    setSectionsAndSyncRef((prev) => [...prev, newSec]);
    setActiveSectionId(newSec.id);
    activeSectionIdRef.current = newSec.id;
    markDirtyAndScheduleAutosave();
  };

  const addQuestion = () => {
    if (!canEdit) {
      toast.error('Apenas ADMIN ou Trial pode editar');
      return;
    }
    if (!canAddQuestion) {
      toast.error(`No modo teste, o limite é de ${TRIAL_MAX_QUESTIONS} questões.`);
      return;
    }
    const newQ = makeEmptyQuestion();
    setSectionsAndSyncRef((prev) =>
      prev.map((s) => (s.id === activeSectionId ? { ...s, questions: [...s.questions, newQ] } : s))
    );
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      next.add(newQ.id);
      return next;
    });
    markDirtyAndScheduleAutosave();
  };

  const updateQuestion = (qId: string, patch: Partial<Question>) => {
    if (!canEdit) return;
    setSectionsAndSyncRef((prev) =>
      prev.map((s) => {
        if (s.id !== activeSectionId) return s;
        return {
          ...s,
          questions: s.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
        };
      })
    );
    markDirtyAndScheduleAutosave();
  };

  // Versão síncrona do updateQuestion que usa flushSync para garantir
  // que o estado seja atualizado antes de retornar
  const updateQuestionSync = (qId: string, patch: Partial<Question>) => {
    if (!canEdit) return;
    flushSync(() => {
      setSectionsAndSyncRef((prev) =>
        prev.map((s) => {
          if (s.id !== activeSectionId) return s;
          return {
            ...s,
            questions: s.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
          };
        })
      );
    });
    markDirtyAndScheduleAutosave();
  };

  const deleteQuestionLocal = (qId: string) => {
    if (!canEdit) return;
    setSectionsAndSyncRef((prev) =>
      prev.map((s) => (s.id === activeSectionId ? { ...s, questions: s.questions.filter((q) => q.id !== qId) } : s))
    );
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      return next;
    });
    markDirtyAndScheduleAutosave();
  };

  const deleteSectionLocal = (sectionId: string) => {
    if (!canEdit) return;

    const section = sectionsRef.current.find((s) => s.id === sectionId);
    const label = section?.customLabel || section?.item || 'este item';
    if (!confirm(`Deseja apagar o item avaliado "${label}"?`)) return;

    setSectionsAndSyncRef((prev) => {
      const next = prev.filter((s) => s.id !== sectionId);
      if (next.length === 0) {
        const fresh = makeEmptySection(defaultItem);
        activeSectionIdRef.current = fresh.id;
        setActiveSectionId(fresh.id);
        return [fresh];
      }

      if (activeSectionIdRef.current === sectionId) {
        const nextActive = next[0].id;
        activeSectionIdRef.current = nextActive;
        setActiveSectionId(nextActive);
      }
      return next;
    });

    markDirtyAndScheduleAutosave();
  };

  const moveQuestion = (qId: string, direction: -1 | 1) => {
    if (!canEdit) return;
    setSectionsAndSyncRef((prev) =>
      prev.map((s) => {
        if (s.id !== activeSectionId) return s;
        const idx = s.questions.findIndex((q) => q.id === qId);
        if (idx < 0) return s;
        const nextIdx = idx + direction;
        if (nextIdx < 0 || nextIdx >= s.questions.length) return s;
        const copy = [...s.questions];
        const [removed] = copy.splice(idx, 1);
        copy.splice(nextIdx, 0, removed);
        return { ...s, questions: copy };
      })
    );
    markDirtyAndScheduleAutosave();
  };

  const persistBuilder = async (opts?: { silent?: boolean; reload?: boolean; setBusy?: boolean }) => {
    if (!canEdit) {
      toast.error('Apenas ADMIN ou Trial pode salvar o builder');
      return false;
    }

    // Se já há um persist em andamento, aguardar ele terminar e re-executar com os dados mais recentes
    if (persistPromiseRef.current) {
      await persistPromiseRef.current;
      // Após o persist anterior terminar, verificar se ainda há mudanças pendentes
      // e executar novamente com os dados mais recentes
      if (changeCounterRef.current !== lastSavedCounterRef.current) {
        return await persistBuilder(opts);
      }
      return true;
    }

    const setBusy = opts?.setBusy ?? true;
    if (setBusy) setSaving(true);

    const saveStartCounter = changeCounterRef.current;

    // Sempre salva o estado mais recente (evita closure com dados antigos).
    const sectionsSnapshot = sectionsRef.current;

    const p = (async () => {
      try {
        const sectionIdMap = new Map<string, string>();
        const questionIdMap = new Map<string, string>();
        const remoteSectionOrder: string[] = [];
        const remoteQuestionsBySection = new Map<string, string[]>();

        const nextSectionPayloads = new Map(lastPersistedSectionPayloadRef.current);
        const nextQuestionPayloads = new Map(lastPersistedQuestionPayloadRef.current);
        const nextQuestionOrder = new Map(lastPersistedQuestionOrderRef.current);

        for (const section of sectionsSnapshot) {
          const createPayload = {
            item: section.item,
            customLabel: section.customLabel || null,
            hasNorma: section.hasNorma,
            normaReferencia: null,
            descricao: section.descricao || null,
          };

          const updatePayload: Partial<PldSection> = createPayload;

          let sectionId = section.id;
          if (isTempId(section.id)) {
            const created = await pldBuilderApi.createSection(createPayload);
            sectionId = created.data.section.id;
            sectionIdMap.set(section.id, sectionId);
          } else {
            const serialized = JSON.stringify(updatePayload);
            const prev = lastPersistedSectionPayloadRef.current.get(section.id);
            if (prev !== serialized) {
              await pldBuilderApi.updateSection(section.id, updatePayload);
              nextSectionPayloads.set(section.id, serialized);
            }
          }

          if (sectionIdMap.has(section.id)) {
            // New remote id: mark as persisted.
            nextSectionPayloads.set(sectionId, JSON.stringify(updatePayload));
          }

          remoteSectionOrder.push(sectionId);

          if (section.hasNorma && section.normaFile && section.normaFile.length > 0) {
            const scope = `sec:${sectionId}:NORMA`;
            for (const f of section.normaFile.slice(0, 5)) {
              if (wasUploaded(scope, f)) continue;
              await pldBuilderApi.uploadNorma(sectionId, f, null);
              markUploaded(scope, f);
            }
          }

          const remoteQuestions: string[] = [];

          for (const question of section.questions) {
            const mappedSectionId = sectionIdMap.get(section.id) || section.id;
            const qPayload = {
              sectionId: mappedSectionId,
              texto: question.texto,
              aplicavel: question.aplicavel,
              respondida: question.respondida,
              templateRef: null,
              capitulacao: question.capitulacao || null,
              criticidade: question.criticidade,
              resposta: question.resposta || null,
              respostaTexto: question.respostaTexto || null,
              deficienciaTexto: question.deficienciaTexto || null,
              recomendacaoTexto: question.recomendacaoTexto || null,
              testStatus: question.test.status || null,
              testDescription: question.test.description || null,
              actionOrigem: question.test.actionPlan.origem || null,
              actionResponsavel: question.test.actionPlan.responsavel || null,
              actionDescricao: question.test.actionPlan.descricao || null,
              actionDataApontamento: toIsoDateTimeOrNull(question.test.actionPlan.dataApontamento),
              actionPrazoOriginal: toIsoDateTimeOrNull(question.test.actionPlan.prazoOriginal),
              actionPrazoAtual: toIsoDateTimeOrNull(question.test.actionPlan.prazoAtual),
              actionComentarios: question.test.actionPlan.comentarios || null,
            };

            let qId = question.id;
            if (isTempId(question.id)) {
              const created = await pldBuilderApi.createQuestion(sectionId, question.texto || '');
              qId = created.data.question.id;
              questionIdMap.set(question.id, qId);
            }

            const serialized = JSON.stringify(qPayload);
            const prev = lastPersistedQuestionPayloadRef.current.get(qId);
            
            // DEBUG: Log para verificar o que está sendo comparado
            console.log('[persistBuilder] Question:', qId, {
              respondida: question.respondida,
              serialized: serialized.substring(0, 200),
              prev: prev?.substring(0, 200),
              isDifferent: prev !== serialized,
            });
            
            if (prev !== serialized) {
              await pldBuilderApi.updateQuestion(qId, qPayload);
              nextQuestionPayloads.set(qId, serialized);
            } else if (!nextQuestionPayloads.has(qId)) {
              // In case the ref map was cleared for some reason.
              nextQuestionPayloads.set(qId, serialized);
            }
            remoteQuestions.push(qId);

            if (question.respostaArquivo && question.respostaArquivo.length > 0) {
              const scope = `q:${qId}:RESPOSTA`;
              for (const f of question.respostaArquivo.slice(0, 5)) {
                if (wasUploaded(scope, f)) continue;
                await pldBuilderApi.uploadAttachment(qId, f, 'RESPOSTA');
                markUploaded(scope, f);
              }
            }
            if (question.deficienciaArquivo && question.deficienciaArquivo.length > 0) {
              const scope = `q:${qId}:DEFICIENCIA`;
              for (const f of question.deficienciaArquivo.slice(0, 5)) {
                if (wasUploaded(scope, f)) continue;
                await pldBuilderApi.uploadAttachment(qId, f, 'DEFICIENCIA');
                markUploaded(scope, f);
              }
            }
            if (question.test.requisicao && question.test.requisicao.length > 0) {
              const scope = `q:${qId}:TESTE_REQUISICAO`;
              for (const f of question.test.requisicao.slice(0, 5)) {
                if (wasUploaded(scope, f)) continue;
                await pldBuilderApi.uploadAttachment(
                  qId,
                  f,
                  'TESTE_REQUISICAO',
                  question.test.requisicaoRef || undefined
                );
                markUploaded(scope, f);
              }
            }
            if (question.test.resposta && question.test.resposta.length > 0) {
              const scope = `q:${qId}:TESTE_RESPOSTA`;
              for (const f of question.test.resposta.slice(0, 5)) {
                if (wasUploaded(scope, f)) continue;
                await pldBuilderApi.uploadAttachment(
                  qId,
                  f,
                  'TESTE_RESPOSTA',
                  question.test.respostaRef || undefined
                );
                markUploaded(scope, f);
              }
            }
            if (question.test.amostra && question.test.amostra.length > 0) {
              const scope = `q:${qId}:TESTE_AMOSTRA`;
              for (const f of question.test.amostra.slice(0, 5)) {
                if (wasUploaded(scope, f)) continue;
                await pldBuilderApi.uploadAttachment(
                  qId,
                  f,
                  'TESTE_AMOSTRA',
                  question.test.amostraRef || undefined
                );
                markUploaded(scope, f);
              }
            }
            if (question.test.evidencias && question.test.evidencias.length > 0) {
              const scope = `q:${qId}:TESTE_EVIDENCIAS`;
              for (const evFile of question.test.evidencias.slice(0, 5)) {
                if (wasUploaded(scope, evFile)) continue;
                await pldBuilderApi.uploadAttachment(
                  qId,
                  evFile,
                  'TESTE_EVIDENCIAS',
                  question.test.evidenciasRef || undefined
                );
                markUploaded(scope, evFile);
              }
            }
          }

          remoteQuestionsBySection.set(sectionId, remoteQuestions);

          // Only reorder when order changed.
          if (remoteQuestions.length) {
            const prevOrder = lastPersistedQuestionOrderRef.current.get(sectionId);
            const isSameOrder =
              prevOrder && prevOrder.length === remoteQuestions.length && prevOrder.every((id, idx) => id === remoteQuestions[idx]);

            if (!isSameOrder) {
              await pldBuilderApi.reorderQuestions(sectionId, remoteQuestions);
              nextQuestionOrder.set(sectionId, remoteQuestions);
            }
          }

          const initialQuestions = initialQuestionIdsRef.current.get(section.id);
          if (initialQuestions) {
            const keep = new Set(remoteQuestions);
            const toDelete = Array.from(initialQuestions).filter((id) => !keep.has(id));
            if (toDelete.length) {
              await Promise.all(toDelete.map((id) => pldBuilderApi.deleteQuestion(id)));
            }
          }
        }

        // Only reorder sections when order changed.
        if (remoteSectionOrder.length) {
          const prev = lastPersistedSectionOrderRef.current;
          const isSameOrder =
            prev.length === remoteSectionOrder.length && prev.every((id, idx) => id === remoteSectionOrder[idx]);
          if (!isSameOrder) {
            await pldBuilderApi.reorderSections(remoteSectionOrder);
          }
        }

        const currentRemoteIds = new Set(remoteSectionOrder.filter((id) => !isTempId(id)));
        const toDeleteSections = Array.from(initialSectionIdsRef.current).filter((id) => !currentRemoteIds.has(id));
        if (toDeleteSections.length) {
          await Promise.all(toDeleteSections.map((id) => pldBuilderApi.deleteSection(id)));
        }

        if (!opts?.silent) toast.success('Builder salvo com sucesso');

        if (changeCounterRef.current === saveStartCounter) {
          lastSavedCounterRef.current = saveStartCounter;
        }

        const shouldReload = opts?.reload ?? true;
        if (shouldReload) {
          await loadSections();
        } else {
          // Atualiza ids locais (temp -> remoto) sem limpar inputs/arquivos.
          if (sectionIdMap.size || questionIdMap.size) {
            setSectionsAndSyncRef((prev) =>
              prev.map((sec) => {
                const nextSectionId = sectionIdMap.get(sec.id) || sec.id;
                return {
                  ...sec,
                  id: nextSectionId,
                  questions: sec.questions.map((q) => ({ ...q, id: questionIdMap.get(q.id) || q.id })),
                };
              })
            );

            setActiveSectionId((prev) => sectionIdMap.get(prev) || prev);
            setExpandedQuestions((prev) => {
              const next = new Set<string>();
              prev.forEach((id) => next.add(questionIdMap.get(id) || id));
              return next;
            });
          }

          // Atualiza refs para que delete/reorder funcionem sem precisar reload.
          initialSectionIdsRef.current = new Set(remoteSectionOrder);
          const nextQMap = new Map<string, Set<string>>();
          remoteQuestionsBySection.forEach((qIds, secId) => {
            nextQMap.set(secId, new Set(qIds));
          });
          initialQuestionIdsRef.current = nextQMap;

          // Commit last-persisted snapshot.
          lastPersistedSectionPayloadRef.current = nextSectionPayloads;
          lastPersistedQuestionPayloadRef.current = nextQuestionPayloads;
          lastPersistedSectionOrderRef.current = remoteSectionOrder;
          lastPersistedQuestionOrderRef.current = nextQuestionOrder;
        }

        return true;
      } catch (error: unknown) {
        console.error('Erro ao salvar builder', error);
        // Use a stable toast id to avoid autosave spam.
        toast.error(getToastErrorMessage(error, 'Falha ao salvar builder'), {
          id: 'pld-builder-save-error',
        });
        return false;
      }
    })();

    persistPromiseRef.current = p;
    let succeeded = false;
    try {
      const result = await p;
      succeeded = result;
      return result;
    } finally {
      persistPromiseRef.current = null;
      if (setBusy) setSaving(false);

      // Evita loop infinito de autosave/toasts em caso de falha.
      // Só reagenda quando o save atual foi bem-sucedido e ainda existem mudanças pendentes.
      if (succeeded && changeCounterRef.current !== lastSavedCounterRef.current) {
        markDirtyAndScheduleAutosave();
      }
    }
  };

  // Keep a stable reference for event handlers (beforeunload/visibilitychange).
  persistBuilderRef.current = persistBuilder;

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!canEdit) return;
      if (changeCounterRef.current === lastSavedCounterRef.current) return;

      // Tenta salvar, mas o navegador pode interromper a request.
      void persistBuilderRef.current({ silent: true, reload: false, setBusy: false });

      e.preventDefault();
      e.returnValue = '';
    };

    const onVisibilityChange = () => {
      if (!canEdit) return;
      if (document.visibilityState !== 'hidden') return;
      if (changeCounterRef.current === lastSavedCounterRef.current) return;

      void persistBuilderRef.current({ silent: true, reload: false, setBusy: false });
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [canEdit]);

  const handleGenerateReport = async () => {
    if (!canEdit) {
      toast.error('Acesso negado para gerar relatório');
      return;
    }

    const ok = await persistBuilder({ silent: true, reload: true, setBusy: true });
    if (!ok) return;

    try {
      const downloadBlob = (blob: Blob, filename: string) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      };

      const safeFilenameBase = (value: string) =>
        (value || 'relatorio-pld')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\-_. ]/gi, '')
          .replace(/\s+/g, '-')
          .slice(0, 80) || 'relatorio-pld';

      const introName = (editFormName || concludeName || '').trim() || null;
      const introMetadata = {
        instituicoes: concludeInstituicoes.map((i) => ({ nome: i.nome?.trim() || '', cnpj: i.cnpj || '' })),
        qualificacaoAvaliador: concludeQualificacaoAvaliador || '',
      };

      toast.loading('Gerando relatório...', { id: 'pld-report' });
      const res = await reportApi.generatePldBuilderReport(reportFormat, {
        name: introName,
        metadata: introMetadata,
      });

      const ext = reportFormat === 'PDF' ? 'pdf' : 'docx';
      const filename = `${safeFilenameBase(introName || 'relatorio-pld')}.${ext}`;

      // Preferir signedUrl (storage externo), mas baixar sem abrir nova guia.
      if (res.data.signedUrl && /^https?:\/\//i.test(res.data.signedUrl)) {
        const fetchRes = await fetch(res.data.signedUrl);
        if (!fetchRes.ok) {
          throw new Error(`Falha ao baixar arquivo (${fetchRes.status})`);
        }
        const blob = await fetchRes.blob();
        downloadBlob(blob, filename);
        toast.success('Relatório gerado', { id: 'pld-report' });
        return;
      }

      const apiOrigin = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
      const relativePath = res.data.url;
      if (!relativePath) {
        toast.error('Relatório gerado, mas sem URL de download', { id: 'pld-report' });
        return;
      }

      const fileUrl = `${apiOrigin}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
      const token = window.localStorage.getItem('pld_token');

      const blobRes = await axios.get(fileUrl, {
        responseType: 'blob',
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      downloadBlob(blobRes.data, filename);
      toast.success('Relatório gerado', { id: 'pld-report' });
    } catch (error: unknown) {
      console.error('Erro ao gerar relatório', error);
      toast.error(getToastErrorMessage(error, 'Falha ao gerar relatório'), { id: 'pld-report' });
    }
  };

  const openConcludeModal = useCallback(() => {
    if (!canEdit) {
      toast.error('Apenas ADMIN ou Trial pode concluir relatório');
      return;
    }

    setConcludeInstituicoes((prev) =>
      prev.length > 0 ? prev : [{ id: `inst_${Date.now()}`, nome: '', cnpj: '' }]
    );
    setConcludeModalOpen(true);
  }, [canEdit]);

  // Ao iniciar um NOVO formulário (via botões do admin), abrir modal de configuração inicial (sem salvar/concluir).
  useEffect(() => {
    const shouldFlagNewForm = searchParams.get('openConclude') === '1';
    if (!shouldFlagNewForm) return;
    if (!canEdit) return;

    // Evita reabrir ao recarregar
    navigate('/pld-builder', { replace: true });
    setInitialSetupMode(true);

    void (async () => {
      try {
        // Garante um builder limpo ao iniciar um novo formulário
        await pldBuilderApi.resetBuilder();
        await loadSections();
      } catch (error) {
        console.error('Erro ao iniciar novo formulário (reset builder):', error);
      } finally {
        openConcludeModal();
      }
    })();
  }, [searchParams, canEdit, navigate, openConcludeModal]);

  const handleCancelConcludeModal = () => {
    setConcludeModalOpen(false);
    if (!initialSetupMode) return;
    setInitialSetupMode(false);
    navigate('/admin/forms');
  };

  const handleConfirmInitialSetup = () => {
    const name = concludeName.trim();
    if (!name) {
      toast.error('Informe um nome para o formulário');
      return;
    }

    if (concludeInstituicoes.length === 0) {
      toast.error('Adicione ao menos uma instituição');
      return;
    }

    const qualif = concludeQualificacaoAvaliador.trim();

    for (const inst of concludeInstituicoes) {
      if (!inst.nome.trim()) {
        toast.error('Informe o nome de todas as instituições');
        return;
      }
      const cnpjDigits = inst.cnpj.replace(/\D/g, '');
      if (cnpjDigits.length !== 14) {
        toast.error('Informe um CNPJ válido para todas as instituições');
        return;
      }
    }

    if (!qualif) {
      toast.error('Informe a qualificação do avaliador');
      return;
    }

    // Apenas segue para o builder (não salva/conclui aqui)
    setInitialSetupMode(false);
    setConcludeModalOpen(false);
    setEditFormName(name);
  };

  const handleHeaderConclude = async () => {
    const ok = await persistBuilder({ silent: false, reload: true, setBusy: true });
    if (!ok) return;
    setInitialSetupMode(false);
    openConcludeModal();
  };

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const addConcludeInstituicao = () => {
    setConcludeInstituicoes((prev) => [...prev, { id: `inst_${Date.now()}`, nome: '', cnpj: '' }]);
  };

  const updateConcludeInstituicao = (id: string, field: 'nome' | 'cnpj', value: string) => {
    setConcludeInstituicoes((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, [field]: value } : inst))
    );
  };

  const removeConcludeInstituicao = (id: string) => {
    setConcludeInstituicoes((prev) => prev.filter((inst) => inst.id !== id));
  };

  const confirmConcludeReport = async () => {
    const name = concludeName.trim();
    if (!name) {
      toast.error('Informe um nome para o formulário');
      return;
    }

    if (concludeInstituicoes.length === 0) {
      toast.error('Adicione ao menos uma instituição');
      return;
    }

    const qualif = concludeQualificacaoAvaliador.trim();

    for (const inst of concludeInstituicoes) {
      if (!inst.nome.trim()) {
        toast.error('Informe o nome de todas as instituições');
        return;
      }
      const cnpjDigits = inst.cnpj.replace(/\D/g, '');
      if (cnpjDigits.length !== 14) {
        toast.error('Informe um CNPJ válido para todas as instituições');
        return;
      }
    }

    if (!qualif) {
      toast.error('Informe a qualificação do avaliador');
      return;
    }

    const sentToEmail = concludeSentToEmail.trim() ? concludeSentToEmail.trim().toLowerCase() : null;

    setConcluding(true);
    try {
      toast.loading('Concluindo relatório, salvando e limpando builder...', { id: 'pld-conclude' });
      await pldBuilderApi.concludeBuilder({
        name,
        sentToEmail,
        metadata: {
          instituicoes: concludeInstituicoes.map((i) => ({ id: i.id, nome: i.nome.trim(), cnpj: i.cnpj })),
          qualificacaoAvaliador: qualif,
          mostrarMetodologia: 'MOSTRAR',
          incluirRecomendacoes: 'INCLUIR',
        },
      });
      setConcludeModalOpen(false);
      setConcludeName('');
      setConcludeSentToEmail('');
      setConcludeInstituicoes([]);
      setConcludeQualificacaoAvaliador('');
      toast.success('Formulário salvo com sucesso!', { id: 'pld-conclude' });

      // Evita carregar um builder em branco (sem modal de instruções).
      navigate('/admin/forms');
    } catch (error: unknown) {
      console.error('Erro ao concluir relatório', error);
      toast.error(getToastErrorMessage(error, 'Falha ao concluir relatório'), { id: 'pld-conclude' });
    } finally {
      setConcluding(false);
    }
  };

  // Abre modal de envio de formulário
  const handleSendForm = () => {
    if (!canEdit) {
      toast.error('Apenas ADMIN ou Trial pode enviar formulário');
      return;
    }
    setSendModalOpen(true);
  };

  // Confirma envio: salva o form e envia para o email
  const confirmSendForm = async () => {
    const name = sendFormName.trim();
    if (!name) {
      toast.error('Informe um nome para o formulário');
      return;
    }

    const email = sendFormEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Informe o e-mail do destinatário');
      return;
    }

    // Validar formato de email simples
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Informe um e-mail válido');
      return;
    }

    setSending(true);
    try {
      toast.loading('Salvando e enviando formulário...', { id: 'pld-send' });
      
      // 1. Concluir e salvar o formulário
      const concludeRes = await pldBuilderApi.concludeBuilder({ name, sentToEmail: email, helpTexts });
      const formId = concludeRes.data.form?.id;
      
      if (formId) {
        // 2. Enviar para o usuário (muda status para SENT_TO_USER)
        await pldBuilderApi.sendFormToUser(formId, email, helpTexts);
      }
      
      setSendModalOpen(false);
      setSendFormName('');
      setSendFormEmail('');
      toast.success('Formulário enviado com sucesso!', { id: 'pld-send' });
      
      // 3. Redirecionar para página de formulários
      navigate('/admin/forms');
    } catch (error: unknown) {
      console.error('Erro ao enviar formulário', error);
      toast.error(getToastErrorMessage(error, 'Falha ao enviar formulário'), { id: 'pld-send' });
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col text-slate-800">
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-slate-600 font-semibold">Carregando builder...</p>
          </div>
        </div>
      ) : (
        <>
          {concludeModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                <div className="max-h-[90vh] overflow-y-auto">
                  <div className="p-6 bg-slate-900">
                    <h2 className="text-lg font-bold text-white">{initialSetupMode ? 'Introdução' : 'Detalhes do Formulário'}</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {initialSetupMode
                        ? 'Preencha as informações iniciais para começar a preencher o builder.'
                        : 'Dê um nome ao formulário para salvá-lo no controle do ADMIN. Ao confirmar, o builder será limpo.'}
                    </p>
                  </div>

                  <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome do formulário</label>
                    <input
                      value={concludeName}
                      onChange={(e) => setConcludeName(e.target.value)}
                      placeholder="Ex: Relatório PLD - Dez/2025"
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                      disabled={concluding}
                      autoFocus
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs font-bold text-slate-600 uppercase mb-3">Introdução</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-600">Instituições *</p>
                        <button
                          type="button"
                          onClick={addConcludeInstituicao}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                          disabled={concluding}
                        >
                          <Plus size={14} />
                          Adicionar
                        </button>
                      </div>

                      {concludeInstituicoes.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhuma instituição adicionada.</p>
                      ) : (
                        <div className="space-y-3">
                          {concludeInstituicoes.map((inst, idx) => (
                            <div key={inst.id} className="p-3 bg-white border border-slate-200 rounded-xl">
                              <div className="flex items-start gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Nome da Instituição</label>
                                    <input
                                      value={inst.nome}
                                      onChange={(e) => updateConcludeInstituicao(inst.id, 'nome', e.target.value)}
                                      placeholder="Ex: Banco ABC S.A."
                                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                      disabled={concluding}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">CNPJ</label>
                                    <input
                                      value={inst.cnpj}
                                      onChange={(e) => updateConcludeInstituicao(inst.id, 'cnpj', formatCnpj(e.target.value))}
                                      placeholder="XX.XXX.XXX/XXXX-XX"
                                      maxLength={18}
                                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                      disabled={concluding}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeConcludeInstituicao(inst.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remover"
                                  disabled={concluding || concludeInstituicoes.length === 1}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              {concludeInstituicoes.length === 1 && (
                                <p className="text-xs text-slate-500 mt-2">Mínimo de 1 instituição.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Qualificação do Avaliador *</label>
                        <textarea
                          value={concludeQualificacaoAvaliador}
                          onChange={(e) => setConcludeQualificacaoAvaliador(e.target.value)}
                          placeholder="Descreva a qualificação do avaliador responsável..."
                          rows={4}
                          className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                          disabled={concluding}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Enviado para (e-mail)</label>
                    <input
                      value={concludeSentToEmail}
                      onChange={(e) => setConcludeSentToEmail(e.target.value)}
                      placeholder="Opcional: usuario@empresa.com"
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                      disabled={concluding}
                    />
                    <p className="text-xs text-slate-500 mt-1">Se você não informar, ficará como “—” no controle.</p>
                  </div>

                </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelConcludeModal}
                      className="px-4 py-2.5 rounded-lg font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                      disabled={concluding}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => (initialSetupMode ? handleConfirmInitialSetup() : void confirmConcludeReport())}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={concluding}
                      title={initialSetupMode ? 'Ir para o builder' : 'Salvar formulário e limpar builder'}
                    >
                      {initialSetupMode ? 'Ir para o Builder' : concluding ? 'Concluindo...' : 'Concluir e salvar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Enviar Formulário */}
          {sendModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                <div className="max-h-[90vh] overflow-y-auto">
                  <div className="p-6 bg-slate-900">
                    <h2 className="text-lg font-bold text-white">Enviar Formulário</h2>
                    <p className="text-sm text-slate-200 mt-1">
                      Salve e envie o formulário para um usuário responder. O formulário será enviado visualmente idêntico, mas com campos bloqueados para edição do usuário.
                    </p>
                  </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome do formulário *</label>
                    <input
                      value={sendFormName}
                      onChange={(e) => setSendFormName(e.target.value)}
                      placeholder="Ex: Relatório PLD - Jan/2026"
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                      disabled={sending}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail do destinatário *</label>
                    <input
                      type="email"
                      value={sendFormEmail}
                      onChange={(e) => setSendFormEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                      disabled={sending}
                    />
                    <p className="text-xs text-slate-500 mt-1">O usuário receberá o formulário para responder.</p>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800">
                      <strong>Importante:</strong> Após o envio, o builder será limpo e você será redirecionado para a página de formulários.
                    </p>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-600 uppercase mb-2">Textos dos popups de ajuda (Usuário)</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Qualificação do Avaliador</label>
                        <textarea
                          value={helpTexts.qualificacao}
                          onChange={(e) => setHelpTexts((prev) => ({ ...prev, qualificacao: e.target.value }))}
                          rows={5}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                          disabled={sending}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Metodologia - Resultado da Avaliação</label>
                        <textarea
                          value={helpTexts.metodologia}
                          onChange={(e) => setHelpTexts((prev) => ({ ...prev, metodologia: e.target.value }))}
                          rows={4}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                          disabled={sending}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Recomendações</label>
                        <textarea
                          value={helpTexts.recomendacoes}
                          onChange={(e) => setHelpTexts((prev) => ({ ...prev, recomendacoes: e.target.value }))}
                          rows={4}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                          disabled={sending}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Plano de Ação (NAO_PLANO) - Comentários</label>
                        <textarea
                          value={helpTexts.planoAcao}
                          onChange={(e) => setHelpTexts((prev) => ({ ...prev, planoAcao: e.target.value }))}
                          rows={5}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                          disabled={sending}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Dica: quebre linhas para separar parágrafos. Esses textos aparecem nos botões de ajuda do usuário.</p>
                  </div>
                </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSendModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                    disabled={sending}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmSendForm()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={sending}
                    title="Salvar e enviar formulário"
                  >
                    {sending ? 'Enviando...' : 'Enviar Formulário'}
                  </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <BuilderHeader
            canEdit={canEdit}
            reportFormat={reportFormat}
            onReportFormatChange={setReportFormat}
            onGenerateReport={() => void handleGenerateReport()}
            onConcludeReport={() => void handleHeaderConclude()}
            onSendForm={() => void handleSendForm()}
            onOpenAssignments={() => navigate('/admin/assignments')}
            onOpenForms={() => navigate('/admin/forms')}
            saving={saving}
            concluding={concluding}
            sending={sending}
            mobileMenuOpen={mobileMenu}
            onToggleMobileMenu={() => setMobileMenu((prev) => !prev)}
            customTitle={editFormName ? `Editando: ${editFormName}` : undefined}
            customSubtitle={editFormName ? 'Modo de Edição' : undefined}
          />

          <div className="flex flex-1 max-w-7xl mx-auto w-full relative">
            <SectionSidebar
              sections={sections}
              activeId={activeSectionId}
              onSelect={setActiveSectionId}
              onDelete={deleteSectionLocal}
              onAdd={addSection}
              canEdit={canEdit}
              canAdd={canAddSection}
              variant="desktop"
            />

            {mobileMenu && (
              <div
                className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
                onClick={() => setMobileMenu(false)}
              >
                <div
                  className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SectionSidebar
                    sections={sections}
                    activeId={activeSectionId}
                    onSelect={(id) => {
                      setActiveSectionId(id);
                      setMobileMenu(false);
                    }}
                    onDelete={(id) => {
                      deleteSectionLocal(id)
                      setMobileMenu(false)
                    }}
                    onAdd={() => {
                      addSection();
                      setMobileMenu(false);
                    }}
                    canEdit={canEdit}
                    canAdd={canAddSection}
                    variant="mobile"
                  />
                </div>
              </div>
            )}

            <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#FAF9F6]">
              <div className="mb-6">
                <ProgressDashboard progress={progressData} />
              </div>

              <div className="max-w-4xl mx-auto space-y-8">
                <ActiveSectionEditor
                  activeSection={activeSection}
                  itemOptions={itemOptions}
                  onUpdateSection={updateSection}
                  canEdit={canEdit}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 ">Questões</h3>
                      <p className="text-md font-bold text-slate-800">Adicione perguntas e defina todos os campos obrigatórios</p>
                    </div>
                    <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                      Exibindo {filteredQuestions.length} de {activeSection.questions.length}
                    </span>
                  </div>

                  {activeSection.questions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={filterBtnClass(questionFilter === 'ALL')}
                        onClick={() => setQuestionFilter('ALL')}
                      >
                        Todas ({questionStats.total})
                      </button>
                      <button
                        type="button"
                        className={filterBtnClass(questionFilter === 'PENDING')}
                        onClick={() => setQuestionFilter('PENDING')}
                      >
                        Pendentes ({questionStats.pending})
                      </button>
                      <button
                        type="button"
                        className={filterBtnClass(questionFilter === 'ANSWERED')}
                        onClick={() => setQuestionFilter('ANSWERED')}
                      >
                        Respondidas ({questionStats.answered})
                      </button>
                      <button
                        type="button"
                        className={filterBtnClass(questionFilter === 'NA')}
                        onClick={() => setQuestionFilter('NA')}
                      >
                        Não aplicáveis ({questionStats.notApplicable})
                      </button>
                    </div>
                  )}

                  {activeSection.questions.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900">Nenhuma questão adicionada</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Inclua perguntas para este item avaliado.</p>
                      <button
                        onClick={addQuestion}
                        disabled={!canAddQuestion}
                        className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          canAddQuestion
                            ? 'Adicionar questão'
                            : isTrial
                              ? `Limite do modo teste (${TRIAL_MAX_QUESTIONS}) atingido`
                              : 'Apenas ADMIN ou Trial pode editar'
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar questão
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuestions.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <p className="text-slate-600 font-semibold">Nenhuma questão encontrada neste filtro.</p>
                          <p className="text-slate-500 text-sm mt-1">Troque o filtro para ver outras questões.</p>
                        </div>
                      ) : null}

                      {paginatedQuestions.map((q) => {
                        const originalIdx = questionIndexById.get(q.id) ?? 0;
                        const total = activeSection.questions.length;
                        return (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          index={originalIdx}
                          total={total}
                          expanded={expandedQuestions.has(q.id)}
                          onToggleExpanded={() =>
                            setExpandedQuestions((prev) => {
                              const next = new Set(prev);
                              if (next.has(q.id)) next.delete(q.id);
                              else next.add(q.id);
                              return next;
                            })
                          }
                          onMoveUp={originalIdx === 0 ? undefined : () => moveQuestion(q.id, -1)}
                          onMoveDown={originalIdx === total - 1 ? undefined : () => moveQuestion(q.id, 1)}
                          onChange={(patch) => updateQuestion(q.id, patch)}
                          onChangeSync={(patch) => updateQuestionSync(q.id, patch)}
                          onDelete={() => deleteQuestionLocal(q.id)}
                          onPersist={() => persistBuilder({ silent: true, reload: false, setBusy: false })}
                          canEdit={canEdit}
                        />
                        );
                      })}

                      {/* Question Pagination */}
                      {totalQuestionPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
                          <p className="text-sm text-slate-600">
                            Mostrando <span className="font-bold">{((questionPage - 1) * QUESTIONS_PER_PAGE) + 1}</span> a{' '}
                            <span className="font-bold">{Math.min(questionPage * QUESTIONS_PER_PAGE, filteredQuestions.length)}</span> de{' '}
                            <span className="font-bold">{filteredQuestions.length}</span> questões
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuestionPage(p => Math.max(1, p - 1))}
                              disabled={questionPage === 1}
                              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft size={16} />
                              Anterior
                            </button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(totalQuestionPages, 5) }, (_, i) => {
                                let page: number;
                                if (totalQuestionPages <= 5) {
                                  page = i + 1;
                                } else if (questionPage <= 3) {
                                  page = i + 1;
                                } else if (questionPage >= totalQuestionPages - 2) {
                                  page = totalQuestionPages - 4 + i;
                                } else {
                                  page = questionPage - 2 + i;
                                }
                                return (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() => setQuestionPage(page)}
                                    className={`w-9 h-9 text-sm font-bold rounded-lg transition-colors ${
                                      page === questionPage
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => setQuestionPage(p => Math.min(totalQuestionPages, p + 1))}
                              disabled={questionPage === totalQuestionPages}
                              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Próximo
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection.questions.length > 0 && (
                    <button
                      onClick={addQuestion}
                      disabled={!canAddQuestion}
                      className="w-full py-4 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-semibold hover:bg-white hover:border-blue-600 hover:text-blue-700 transition-colors group bg-slate-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        canAddQuestion
                          ? 'Adicionar nova questão'
                          : isTrial
                            ? `Limite do modo teste (${TRIAL_MAX_QUESTIONS}) atingido`
                            : 'Apenas ADMIN ou Trial pode editar'
                      }
                    >
                      <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Adicionar nova questão
                    </button>
                  )}
                </div>
              </div>

              <div className="h-24" />
            </main>
          </div>

          <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-sm text-slate-500 hidden sm:block">
                <span className="font-semibold text-slate-900">
                  {sections.reduce((acc, s) => acc + s.questions.length, 0)}
                </span>{' '}
                questões em{' '}
                <span className="font-semibold text-slate-900">{sections.length}</span> itens.
                {!canEdit && (
                  <span className="ml-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                    Somente ADMIN salva
                  </span>
                )}
              </div>
              <div className="sm:hidden flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-bold transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <AppFooter />
    </div>
  );
}
