import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Trash2, Save, AlertCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from './FileUpload';
import type { Question, TestData, ActionPlan } from '../types/types';
import { defaultActionPlan } from '../types/defaults';

export const QuestionCard: React.FC<{
  question: Question;
  index: number;
  total: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onChange: (patch: Partial<Question>) => void;
  onChangeSync: (patch: Partial<Question>) => void;
  onDelete: () => void;
  onPersist: () => Promise<boolean>;
  canEdit: boolean;
}> = ({
  question,
  index,
  expanded,
  onToggleExpanded,
  onMoveUp,
  onMoveDown,
  onChange,
  onChangeSync: _onChangeSync,
  onDelete,
  onPersist,
  canEdit,
}) => {
  void _onChangeSync;
  const [saving, setSaving] = useState(false);
  
  const update = (patch: Partial<Question>) => onChange(patch);
  const updateTest = (patch: Partial<TestData>) => update({ test: { ...question.test, ...patch }, respondida: false });
  const updateActionPlan = (field: keyof ActionPlan, value: string) =>
    updateTest({ actionPlan: { ...question.test.actionPlan, [field]: value } });

  const saveErrors = useMemo(() => {
    const errors: string[] = [];

    if (!question.texto?.trim()) {
      errors.push('Informe o título/texto da questão.');
    }

    if (!question.criticidade) {
      errors.push('Selecione a criticidade.');
    }

    if (question.aplicavel) {
      if (!question.resposta) {
        errors.push('Selecione a resposta (SIM ou NÃO).');
      }

      if (!question.test.status) {
        errors.push('Selecione o resultado do teste.');
      }

      if (question.test.status === 'SIM') {
        if (!question.test.description?.trim()) {
          errors.push('Informe a descrição do teste.');
        }
        if (!question.test.requisicao || question.test.requisicao.length === 0) errors.push('Anexe o(s) arquivo(s) de REQUISIÇÃO do teste.');
        if (!question.test.resposta || question.test.resposta.length === 0) errors.push('Anexe o(s) arquivo(s) de RESPOSTA do teste.');
        if (!question.test.amostra || question.test.amostra.length === 0) errors.push('Anexe o(s) arquivo(s) de AMOSTRA do teste.');
        if (!question.test.evidencias || question.test.evidencias.length === 0) {
          errors.push('Anexe o(s) arquivo(s) de EVIDÊNCIAS do teste.');
        }
      }

      // NAO_PLANO: na tela do builder, só exibimos o campo de comentários.
      // Não devemos bloquear o save exigindo campos que não são editáveis aqui.
    }

    return errors;
  }, [
    question.aplicavel,
    question.criticidade,
    question.resposta,
    question.test.actionPlan,
    question.test.amostra,
    question.test.description,
    question.test.evidencias,
    question.test.requisicao,
    question.test.resposta,
    question.test.status,
    question.texto,
  ]);

  const canSaveResposta = canEdit && question.aplicavel && saveErrors.length === 0;

  const selectedEvidenceFiles = useMemo(() => {
    const items: Array<{ label: string; file: File }> = [];
    (question.respostaArquivo ?? []).forEach((file, idx) => items.push({ label: `Resposta (${idx + 1})`, file }));
    (question.deficienciaArquivo ?? []).forEach((file, idx) => items.push({ label: `Deficiência (${idx + 1})`, file }));
    (question.test.requisicao ?? []).forEach((file, idx) => items.push({ label: `Requisição (${idx + 1})`, file }));
    (question.test.resposta ?? []).forEach((file, idx) => items.push({ label: `Resposta (teste) (${idx + 1})`, file }));
    (question.test.amostra ?? []).forEach((file, idx) => items.push({ label: `Amostra (${idx + 1})`, file }));
    if (question.test.evidencias && question.test.evidencias.length > 0) {
      question.test.evidencias.forEach((file, idx) => {
        items.push({ label: `Evidências (${idx + 1})`, file });
      });
    }
    return items;
  }, [
    question.respostaArquivo,
    question.deficienciaArquivo,
    question.test.requisicao,
    question.test.resposta,
    question.test.amostra,
    question.test.evidencias,
  ]);



  const getCriticidadeColor = (crit: string) => {
    switch (crit) {
      case 'ALTA': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIA': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'BAIXA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error('Apenas ADMIN pode salvar');
      return;
    }
    if (!question.aplicavel) return;
    if (saveErrors.length) {
      const first = saveErrors[0];
      const rest = saveErrors.length - 1;
      toast.error(rest > 0 ? `${first} (+${rest} pendência(s))` : first);
      return;
    }
    
    setSaving(true);
    toast.loading('Salvando...', { id: `pld-save-${question.id}` });
    const ok = await onPersist();
    
    if (ok) {
      update({ respondida: true });
      toast.success('Resposta salva', { id: `pld-save-${question.id}` });
    }
    else toast.error('Falha ao salvar', { id: `pld-save-${question.id}` });
    setSaving(false);
  };

  return (
    <article
      className={`
        rounded-lg border-2 transition-all duration-150
        ${question.respondida
          ? 'border-emerald-400 bg-white shadow-sm'
          : 'border-slate-200 bg-white shadow-sm hover:border-slate-400 hover:shadow-md'
        }
      `}
      aria-label={`Questão ${index + 1}: ${question.texto?.trim() || 'Sem título'}`}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 cursor-pointer"
          onClick={onToggleExpanded}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpanded(); } }}
        >
          <div className="flex-1 min-w-0 gap-2 flex flex-col">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {/* Move buttons */}
              <div className="flex gap-1">
                {onMoveUp && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                    disabled={!canEdit}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500"
                    aria-label={canEdit ? 'Mover questão para cima' : 'Apenas ADMIN pode mover'}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                    disabled={!canEdit}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500"
                    aria-label={canEdit ? 'Mover questão para baixo' : 'Apenas ADMIN pode mover'}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              <span className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-white rounded-md">
                #{index + 1}
              </span>

              <span className="text-sm font-semibold text-slate-900 truncate flex-1">
                {question.texto?.trim() ? question.texto : 'Sem título'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Criticidade:</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getCriticidadeColor(question.criticidade)}`}>
                {question.criticidade}
              </span>
              <span className="text-xs font-medium text-slate-500 ml-2">Status:</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${question.respondida ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'}`}>
                {question.respondida ? 'SALVA' : 'PENDENTE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label={expanded ? 'Recolher questão' : 'Expandir questão'}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {expanded ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={!canEdit}
              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={canEdit ? 'Remover questão' : 'Apenas ADMIN pode remover'}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-6 space-y-6">
            {/* Question Title */}
            <div>
              <label htmlFor={`question-title-${question.id}`} className="block text-sm font-semibold text-slate-800 mb-2">
                Título da Questão <span className="text-red-600">*</span>
              </label>
              <textarea
                id={`question-title-${question.id}`}
                value={question.texto}
                onChange={(e) => update({ texto: e.target.value })}
                disabled={!canEdit}
                placeholder="Digite o título ou texto da questão..."
                rows={3}
                className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 resize-none transition-colors"
              />
            </div>

            {/* Grid: Aplicável, Criticidade, Capitulação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label htmlFor={`aplicavel-${question.id}`} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Aplicável?
                </label>
                <select
                  id={`aplicavel-${question.id}`}
                  value={question.aplicavel ? 'sim' : 'nao'}
                  onChange={(e) => update({ aplicavel: e.target.value === 'sim', respondida: false })}
                  disabled={!canEdit}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>

              <div>
                <label htmlFor={`criticidade-${question.id}`} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Criticidade <span className="text-red-600">*</span>
                </label>
                <select
                  id={`criticidade-${question.id}`}
                  value={question.criticidade}
                  onChange={(e) => update({ criticidade: e.target.value as Question['criticidade'] })}
                  disabled={!canEdit}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <option value="BAIXA">BAIXA</option>
                  <option value="MEDIA">MÉDIA</option>
                  <option value="ALTA">ALTA</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor={`capitulacao-${question.id}`} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Capitulação
                </label>
                <input
                  id={`capitulacao-${question.id}`}
                  type="text"
                  value={question.capitulacao}
                  onChange={(e) => update({ capitulacao: e.target.value })}
                  placeholder="Ex: Art. 10"
                  disabled={!canEdit}
                  maxLength={200}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>
            </div>

            {/* Applicability Check */}
            {!question.aplicavel ? (
              <p className="text-sm text-slate-600 italic p-4 bg-slate-50 rounded-lg border border-slate-200">
                Esta questão foi marcada como não aplicável e não requer resposta.
              </p>
            ) : (
              <>
                {/* Test Section */}
                <div className="p-5 bg-white rounded-lg border border-slate-200">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                     Informações do Teste
                  </h3>

                  <div className="mb-4">
                    <label htmlFor={`test-status-${question.id}`} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Teste realizado? <span className="text-red-600">*</span>
                    </label>
                    <select
                      id={`test-status-${question.id}`}
                      value={question.test.status}
                      onChange={(e) =>
                        updateTest({
                          status: e.target.value as TestData['status'],
                          description: '',
                          actionPlan: { ...defaultActionPlan },
                          requisicao: [],
                          resposta: [],
                          amostra: [],
                          evidencias: [],
                          requisicaoRef: '',
                          respostaRef: '',
                          amostraRef: '',
                          evidenciasRef: '',
                        })
                      }
                      disabled={!canEdit}
                      className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <option value="">Selecione...</option>
                      <option value="SIM">Sim</option>
                      <option value="NAO">Não</option>
                      <option value="NAO_PLANO">Apresenta deficiências para as quais há plano de ação corretiva em andamento.</option>
                    </select>
                  </div>

                  {question.test.status === 'SIM' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`test-description-${question.id}`} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                          Descrição do Teste <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          id={`test-description-${question.id}`}
                          value={question.test.description}
                          onChange={(e) => updateTest({ description: e.target.value })}
                          disabled={!canEdit}
                          placeholder="Descreva o teste realizado..."
                          rows={3}
                          maxLength={300}
                          className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-slate-200">
                        {/* Requisição */}
                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                             Requisição <span className="text-red-600">*</span>
                          </label>
                          <FileUpload
                            label="Selecionar arquivo"
                            multiple
                            maxFiles={5}
                            files={question.test.requisicao}
                            onFilesSelect={(files) => {
                              updateTest({ requisicao: files });
                            }}
                            onRemove={() => updateTest({ requisicao: [] })}
                            onRemoveAt={(idx) => {
                              const next = [...(question.test.requisicao ?? [])];
                              next.splice(idx, 1);
                              updateTest({ requisicao: next });
                            }}
                            disabled={!canEdit}
                            required
                          />
                          <label htmlFor={`req-ref-${question.id}`} className="block text-xs font-medium text-slate-500 mt-3 mb-1.5">
                            Referência
                          </label>
                          <input
                            id={`req-ref-${question.id}`}
                            type="text"
                            value={question.test.requisicaoRef}
                            onChange={(e) => updateTest({ requisicaoRef: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Ex: DOC-001"
                            maxLength={200}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          />
                        </div>

                        {/* Resposta */}
                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                             Resposta <span className="text-red-600">*</span>
                          </label>
                          <FileUpload
                            label="Selecionar arquivo"
                            multiple
                            maxFiles={5}
                            files={question.test.resposta}
                            onFilesSelect={(files) => {
                              updateTest({ resposta: files });
                            }}
                            onRemove={() => updateTest({ resposta: [] })}
                            onRemoveAt={(idx) => {
                              const next = [...(question.test.resposta ?? [])];
                              next.splice(idx, 1);
                              updateTest({ resposta: next });
                            }}
                            disabled={!canEdit}
                            required
                          />
                          <label htmlFor={`resp-ref-${question.id}`} className="block text-xs font-medium text-slate-500 mt-3 mb-1.5">
                            Referência
                          </label>
                          <input
                            id={`resp-ref-${question.id}`}
                            type="text"
                            value={question.test.respostaRef}
                            onChange={(e) => updateTest({ respostaRef: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Ex: DOC-002"
                            maxLength={200}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          />
                        </div>

                        {/* Amostra */}
                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                             Amostra <span className="text-red-600">*</span>
                          </label>
                          <FileUpload
                            label="Selecionar arquivo"
                            multiple
                            maxFiles={5}
                            files={question.test.amostra}
                            onFilesSelect={(files) => {
                              updateTest({ amostra: files });
                            }}
                            onRemove={() => updateTest({ amostra: [] })}
                            onRemoveAt={(idx) => {
                              const next = [...(question.test.amostra ?? [])];
                              next.splice(idx, 1);
                              updateTest({ amostra: next });
                            }}
                            disabled={!canEdit}
                            required
                          />
                          <label htmlFor={`amostra-ref-${question.id}`} className="block text-xs font-medium text-slate-500 mt-3 mb-1.5">
                            Referência
                          </label>
                          <input
                            id={`amostra-ref-${question.id}`}
                            type="text"
                            value={question.test.amostraRef}
                            onChange={(e) => updateTest({ amostraRef: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Ex: DOC-003"
                            maxLength={200}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          />
                        </div>

                        {/* Evidências */}
                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                             Evidências <span className="text-red-600">*</span>
                          </label>
                          <FileUpload
                            label="Selecionar arquivo"
                            multiple
                            maxFiles={5}
                            files={question.test.evidencias}
                            onFilesSelect={(files) => {
                              updateTest({ evidencias: files });
                            }}
                            onRemove={() => updateTest({ evidencias: [] })}
                            onRemoveAt={(idx) => {
                              const next = [...(question.test.evidencias ?? [])];
                              next.splice(idx, 1);
                              updateTest({ evidencias: next });
                            }}
                            disabled={!canEdit}
                            required
                          />
                          <label htmlFor={`evidencias-ref-${question.id}`} className="block text-xs font-medium text-slate-500 mt-3 mb-1.5">
                            Referência
                          </label>
                          <input
                            id={`evidencias-ref-${question.id}`}
                            type="text"
                            value={question.test.evidenciasRef}
                            onChange={(e) => updateTest({ evidenciasRef: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Ex: DOC-004"
                            maxLength={200}
                            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {question.test.status === 'NAO_PLANO' && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-bold text-amber-800">Comentários (Plano de Ação)</h4>
                        <button
                          type="button"
                          onClick={() => toast('Configure as instruções para plano de ação no modal de envio do formulário ao usuário.', { duration: 4000, icon: 'ℹ️' })}
                          className="text-amber-600 hover:text-amber-800 transition-colors"
                          title="Informações sobre plano de ação"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">O usuário preencherá as observações e o plano de ação em até 600 caracteres neste campo.</p>
                      <textarea
                        id={`comentarios-${question.id}`}
                        value={question.test.actionPlan.comentarios}
                        onChange={(e) => updateActionPlan('comentarios', e.target.value)}
                        disabled={!canEdit}
                        placeholder="Comentários do plano de ação..."
                        rows={5}
                        maxLength={600}
                        className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
                      />
                    </div>
                  )}
                </div>

                {/* Response Section */}
                <div className="p-5 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                     Resposta da Questão
                  </h3>

                  <fieldset className="mb-4">
                    <legend className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                      Selecione a Resposta <span className="text-red-600">*</span>
                    </legend>
                    <div className="flex gap-3" role="group">
                      <button
                        type="button"
                        onClick={() => update({ resposta: 'Sim', respondida: false })}
                        disabled={!canEdit}
                        aria-pressed={question.resposta === 'Sim'}
                        className={`
                          flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all duration-150
                          ${question.resposta === 'Sim'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-600 hover:text-emerald-700'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                        `}
                      >
                        SIM
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ resposta: 'Não', respondida: false })}
                        disabled={!canEdit}
                        aria-pressed={question.resposta === 'Não'}
                        className={`
                          flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all duration-150
                          ${question.resposta === 'Não'
                            ? 'bg-red-700 text-white border-red-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-red-600 hover:text-red-700'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                        `}
                      >
                        NÃO
                      </button>
                    </div>
                  </fieldset>

                  <div className="mb-4">
                    <label htmlFor={`justificativa-${question.id}`} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Justificativa / Observações
                    </label>
                    <textarea
                      id={`justificativa-${question.id}`}
                      value={question.respostaTexto}
                      onChange={(e) => update({ respostaTexto: e.target.value, respondida: false })}
                      disabled={!canEdit}
                      placeholder="Descreva a justificativa ou observações..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Arquivo da Resposta
                    </label>
                    <FileUpload
                      label="Selecionar arquivo"
                      multiple
                      maxFiles={5}
                      files={question.respostaArquivo}
                      onFilesSelect={(files) => {
                        update({ respostaArquivo: files, respondida: false });
                      }}
                      onRemove={() => update({ respostaArquivo: [], respondida: false })}
                      onRemoveAt={(idx) => {
                        const next = [...(question.respostaArquivo ?? [])];
                        next.splice(idx, 1);
                        update({ respostaArquivo: next, respondida: false });
                      }}
                      disabled={!canEdit}
                    />
                  </div>

                  {question.resposta === 'Não' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-red-200">
                      <div>
                        <label htmlFor={`deficiencia-${question.id}`} className="flex text-xs font-semibold text-red-700 mb-2 items-center gap-1.5">
                          <AlertCircle size={14} aria-hidden="true" />
                          Deficiência Identificada
                        </label>
                        <textarea
                          id={`deficiencia-${question.id}`}
                          value={question.deficienciaTexto}
                          onChange={(e) => update({ deficienciaTexto: e.target.value, respondida: false })}
                          disabled={!canEdit}
                          placeholder="Descreva a deficiência encontrada..."
                          rows={4}
                          maxLength={500}
                          className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none mb-3 transition-colors"
                        />
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                          Arquivo comprobatório
                        </label>
                        <FileUpload
                          label="Selecionar arquivo"
                          multiple
                          maxFiles={5}
                          files={question.deficienciaArquivo}
                          onFilesSelect={(files) => {
                            update({ deficienciaArquivo: files, respondida: false });
                          }}
                          onRemove={() => update({ deficienciaArquivo: [], respondida: false })}
                          onRemoveAt={(idx) => {
                            const next = [...(question.deficienciaArquivo ?? [])];
                            next.splice(idx, 1);
                            update({ deficienciaArquivo: next, respondida: false });
                          }}
                          disabled={!canEdit}
                        />
                      </div>
                      <div>
                        <label htmlFor={`recomendacao-${question.id}`} className="flex text-xs font-semibold text-amber-700 mb-2 items-center gap-1.5">
                           Recomendação
                        </label>
                        <textarea
                          id={`recomendacao-${question.id}`}
                          value={question.recomendacaoTexto}
                          onChange={(e) => update({ recomendacaoTexto: e.target.value, respondida: false })}
                          disabled={!canEdit}
                          placeholder="Descreva a recomendação de melhoria..."
                          rows={4}
                          maxLength={500}
                          className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Evidence Files Summary */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">
                    Evidências anexadas
                  </h4>
                  {selectedEvidenceFiles.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">
                      Nenhum arquivo selecionado.
                    </p>
                  ) : (
                    <ul className="list-disc list-inside space-y-1.5" role="list">
                      {selectedEvidenceFiles.map((it) => (
                        <li key={`${it.label}-${it.file.name}`} className="text-sm text-slate-700">
                          <strong className="font-medium">{it.label}:</strong> {it.file.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Save Button */}
                <div className="border-t border-slate-200 pt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleSave(); }}
                    aria-label='Salvar resposta da questão'
                    disabled={!canSaveResposta || saving}
                    className={`
                      inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150
                      ${canSaveResposta && !saving
                        ? 'bg-slate-800 text-white hover:bg-slate-900 active:bg-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }
                    `}
                    title={
                      !canEdit
                        ? 'Apenas ADMIN pode salvar'
                        : canSaveResposta
                          ? 'Salvar resposta'
                          : saveErrors.length
                            ? `Pendências: ${saveErrors[0]}`
                            : 'Preencha os campos obrigatórios'
                    }
                  >
                    <Save size={16} aria-hidden="true" />
                    {saving ? 'Salvando...' : 'Salvar resposta'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
