import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ProgressDashboard } from '../components/ProgressDashBoard';
import { useAuth } from '../contexts/useAuth';
import { usePldCatalog } from '../contexts/usePldCatalog';
import { pldBuilderApi, reportApi, api } from '../lib/api';
import type { FormProgress } from '../types/pld';
import type { PldSection, Question, Section } from '../types/types';
import { makeEmptyQuestion, makeEmptySection } from '../types/defaults';
import { isTempId, mapApiSectionToState, toIsoDateTimeOrNull } from '../types/utils';
import { BuilderHeader } from '../components/BuilderHeader';
import { SectionSidebar } from '../components/SectionSidebar';
import { ActiveSectionEditor } from '../components/ActiveSectionEditor';
import { QuestionCard } from '../components/QuestionCard';

export default function PLDBuilderPage() {
  const { itemOptions } = usePldCatalog();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const canEdit = user?.role === 'ADMIN';

  const defaultItem = itemOptions[0] || 'Política (PI)';

  const [sections, setSections] = useState<Section[]>([makeEmptySection(defaultItem)]);
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0].id);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [concluding, setConcluding] = useState(false);
  const [reportFormat, setReportFormat] = useState<'DOCX' | 'PDF'>('DOCX');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const initialSectionIdsRef = useRef<Set<string>>(new Set());
  const initialQuestionIdsRef = useRef<Map<string, Set<string>>>(new Map());

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

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) || sections[0],
    [sections, activeSectionId]
  );

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pldBuilderApi.listSections();
      const apiSections = res.data.sections;

      if (!apiSections.length) {
        const fresh = makeEmptySection(defaultItem);
        sectionsRef.current = [fresh];
        setSections([fresh]);
        setActiveSectionId(fresh.id);
        initialSectionIdsRef.current = new Set();
        initialQuestionIdsRef.current = new Map();
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
        toast.error('Apenas ADMIN pode editar');
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
        toast.error('Apenas ADMIN pode editar');
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
      toast.error('Apenas ADMIN pode salvar o builder');
      return false;
    }

    if (persistPromiseRef.current) {
      return await persistPromiseRef.current;
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
            await pldBuilderApi.updateSection(section.id, updatePayload);
          }

          remoteSectionOrder.push(sectionId);

          if (section.hasNorma && section.normaFile) {
            await pldBuilderApi.uploadNorma(sectionId, section.normaFile, null);
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

            await pldBuilderApi.updateQuestion(qId, qPayload);
            remoteQuestions.push(qId);

            if (question.respostaArquivo) {
              await pldBuilderApi.uploadAttachment(qId, question.respostaArquivo, 'RESPOSTA');
            }
            if (question.deficienciaArquivo) {
              await pldBuilderApi.uploadAttachment(qId, question.deficienciaArquivo, 'DEFICIENCIA');
            }
            if (question.test.requisicao) {
              await pldBuilderApi.uploadAttachment(
                qId,
                question.test.requisicao,
                'TESTE_REQUISICAO',
                question.test.requisicaoRef || undefined
              );
            }
            if (question.test.resposta) {
              await pldBuilderApi.uploadAttachment(
                qId,
                question.test.resposta,
                'TESTE_RESPOSTA',
                question.test.respostaRef || undefined
              );
            }
            if (question.test.amostra) {
              await pldBuilderApi.uploadAttachment(
                qId,
                question.test.amostra,
                'TESTE_AMOSTRA',
                question.test.amostraRef || undefined
              );
            }
            if (question.test.evidencias) {
              await pldBuilderApi.uploadAttachment(
                qId,
                question.test.evidencias,
                'TESTE_EVIDENCIAS',
                question.test.evidenciasRef || undefined
              );
            }
          }

          remoteQuestionsBySection.set(sectionId, remoteQuestions);

          if (remoteQuestions.length) {
            await pldBuilderApi.reorderQuestions(sectionId, remoteQuestions);
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

        if (remoteSectionOrder.length) {
          await pldBuilderApi.reorderSections(remoteSectionOrder);
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
        }

        return true;
      } catch (error: unknown) {
        console.error('Erro ao salvar builder', error);
        const serverMsg =
          axios.isAxiosError(error)
            ? (error.response?.data as { error?: string; message?: string } | undefined)?.error ||
              (error.response?.data as { error?: string; message?: string } | undefined)?.message
            : undefined;

        toast.error(serverMsg ? `Falha ao salvar builder: ${serverMsg}` : 'Falha ao salvar builder');
        return false;
      }
    })();

    persistPromiseRef.current = p;
    try {
      return await p;
    } finally {
      persistPromiseRef.current = null;
      if (setBusy) setSaving(false);

      if (changeCounterRef.current !== lastSavedCounterRef.current) {
        // Houve alterações durante o save, reagenda.
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
      toast.error('Apenas ADMIN pode gerar relatório');
      return;
    }

    const ok = await persistBuilder({ silent: true, reload: true, setBusy: true });
    if (!ok) return;

    try {
      toast.loading('Gerando relatório...', { id: 'pld-report' });
      const res = await reportApi.generatePldBuilderReport(reportFormat);
      const url = res.data.url;
      if (!url) {
        toast.error('Relatório gerado, mas sem URL de download', { id: 'pld-report' });
        return;
      }

      const base = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
      const downloadUrl = `${base}${url}`;
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      toast.success('Relatório gerado', { id: 'pld-report' });
    } catch (error: unknown) {
      console.error('Erro ao gerar relatório', error);
      const serverMsg =
        axios.isAxiosError(error) ? (error.response?.data as { error?: string; message?: string } | undefined)?.error || (error.response?.data as { error?: string; message?: string } | undefined)?.message : undefined;
      toast.error(serverMsg ? `Falha ao gerar relatório: ${serverMsg}` : 'Falha ao gerar relatório', { id: 'pld-report' });
    }
  };

  const handleConcludeReport = async () => {
    if (!canEdit) {
      toast.error('Apenas ADMIN pode concluir relatório');
      return;
    }

    setConcluding(true);
    try {
      toast.loading('Concluindo relatório e limpando builder...', { id: 'pld-conclude' });
      await pldBuilderApi.concludeBuilder();
      await loadSections();
      toast.success('Builder limpo. Você pode iniciar um novo relatório.', { id: 'pld-conclude' });
    } catch (error: unknown) {
      console.error('Erro ao concluir relatório', error);
      const serverMsg =
        axios.isAxiosError(error)
          ? (error.response?.data as { error?: string; message?: string } | undefined)?.error ||
            (error.response?.data as { error?: string; message?: string } | undefined)?.message
          : undefined;
      toast.error(serverMsg ? `Falha ao concluir relatório: ${serverMsg}` : 'Falha ao concluir relatório', {
        id: 'pld-conclude',
      });
    } finally {
      setConcluding(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-slate-600">Carregando builder...</p>
          </div>
        </div>
      ) : (
        <>
          <BuilderHeader
            canEdit={canEdit}
            reportFormat={reportFormat}
            onReportFormatChange={setReportFormat}
            onGenerateReport={() => void handleGenerateReport()}
            onConcludeReport={() => void handleConcludeReport()}
            onLogout={handleLogout}
            saving={saving}
            concluding={concluding}
            mobileMenuOpen={mobileMenu}
            onToggleMobileMenu={() => setMobileMenu((prev) => !prev)}
          />

          <div className="flex flex-1 max-w-7xl mx-auto w-full relative">
            <SectionSidebar
              sections={sections}
              activeId={activeSectionId}
              onSelect={setActiveSectionId}
              onAdd={addSection}
              canEdit={canEdit}
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
                    onAdd={() => {
                      addSection();
                      setMobileMenu(false);
                    }}
                    canEdit={canEdit}
                    variant="mobile"
                  />
                </div>
              </div>
            )}

            <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50/50">
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
                      <h3 className="text-xl font-bold text-slate-800">Questões</h3>
                      <p className="text-sm text-slate-500">Adicione perguntas e defina todos os campos obrigatórios</p>
                    </div>
                    <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                      {activeSection.questions.length} questão(ões) •{' '}
                      {activeSection.questions.filter((q) => q.respondida).length} respondida(s)
                    </span>
                  </div>

                  {activeSection.questions.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900">Nenhuma questão adicionada</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Inclua perguntas para este item avaliado.</p>
                      <button
                        onClick={addQuestion}
                        disabled={!canEdit}
                        className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-colors shadow-sm"
                        title={canEdit ? 'Adicionar questão' : 'Apenas ADMIN pode editar'}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar questão
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeSection.questions.map((q, idx) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          index={idx}
                          total={activeSection.questions.length}
                          expanded={expandedQuestions.has(q.id)}
                          onToggleExpanded={() =>
                            setExpandedQuestions((prev) => {
                              const next = new Set(prev);
                              if (next.has(q.id)) next.delete(q.id);
                              else next.add(q.id);
                              return next;
                            })
                          }
                          onMoveUp={idx === 0 ? undefined : () => moveQuestion(q.id, -1)}
                          onMoveDown={idx === activeSection.questions.length - 1 ? undefined : () => moveQuestion(q.id, 1)}
                          onChange={(patch) => updateQuestion(q.id, patch)}
                          onDelete={() => deleteQuestionLocal(q.id)}
                          onPersist={() => persistBuilder({ silent: true, reload: false, setBusy: false })}
                          canEdit={canEdit}
                        />
                      ))}
                    </div>
                  )}

                  {activeSection.questions.length > 0 && (
                    <button
                      onClick={addQuestion}
                      disabled={!canEdit}
                      className="w-full py-4 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 font-semibold hover:bg-white hover:border-blue-600 hover:text-blue-700 transition-all group shadow-sm bg-slate-50/50"
                      title={canEdit ? 'Adicionar nova questão' : 'Apenas ADMIN pode editar'}
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
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl font-bold"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
