import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, ListCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '../components/FileUpload';
import type { Question, TestData, ActionPlan } from '../types/types';
import { criticidadeTone } from '../types/utils';
import { defaultActionPlan } from '../types/defaults';

export const QuestionCard: React.FC<{
  question: Question;
  index: number;
  total: number;
  expanded: boolean;
  showRecommendations?: boolean;
  planoAcaoHelpText?: string;
  onToggleExpanded: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveTo?: (position: number) => void;
  onChange: (patch: Partial<Question>) => void;
  onChangeSync?: (patch: Partial<Question>) => void;
  onDelete: () => void;
  onPersist: () => Promise<boolean>;
  canEdit: boolean;
}> = ({
  question,
  index,
  total,
  expanded,
  onToggleExpanded,
  onMoveUp,
  onMoveDown,
  onChange,
  onDelete,
  onPersist,
  canEdit,
}) => {
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
        if (!question.test.requisicao) errors.push('Anexe o arquivo de REQUISIÇÃO do teste.');
        if (!question.test.resposta) errors.push('Anexe o arquivo de RESPOSTA do teste.');
        if (!question.test.amostra) errors.push('Anexe o arquivo de AMOSTRA do teste.');
        if (!question.test.evidencias) errors.push('Anexe o arquivo de EVIDÊNCIAS do teste.');
      }

      if (question.test.status === 'NAO_PLANO') {
        const ap = question.test.actionPlan;
        if (!ap.origem?.trim()) errors.push('Informe a origem do apontamento.');
        if (!ap.responsavel?.trim()) errors.push('Informe o responsável pelo apontamento.');
        if (!ap.dataApontamento?.trim()) errors.push('Informe a data do apontamento.');
        if (!ap.descricao?.trim()) errors.push('Informe a descrição do apontamento.');
        if (!ap.prazoOriginal?.trim()) errors.push('Informe o prazo original.');
        if (!ap.prazoAtual?.trim()) errors.push('Informe o prazo atual.');
      }
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

  const tone = criticidadeTone(question.criticidade);

  const selectedEvidenceFiles = useMemo(() => {
    const items: Array<{ label: string; file: File }> = [];

    const addFiles = (label: string, files: File[] | null | undefined) => {
      for (const f of files ?? []) {
        items.push({ label, file: f });
      }
    };

    addFiles('Resposta', question.respostaArquivo);
    addFiles('Deficiência', question.deficienciaArquivo);
    addFiles('Requisição', question.test.requisicao);
    addFiles('Resposta (teste)', question.test.resposta);
    addFiles('Amostra', question.test.amostra);
    addFiles('Evidências', question.test.evidencias);
    return items;
  }, [
    question.respostaArquivo,
    question.deficienciaArquivo,
    question.test.requisicao,
    question.test.resposta,
    question.test.amostra,
    question.test.evidencias,
  ]);

  const summaryResposta = question.aplicavel
    ? question.resposta
      ? `Resposta: ${question.resposta}`
      : 'Resposta: não definida'
    : 'Não aplicável';

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-4 md:p-6 ${
        question.respondida ? 'border-emerald-200'  : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              

              <div className="flex items-center gap-1">
                {onMoveUp && (
                  <button
                    type="button"
                    onClick={onMoveUp}
                    disabled={!canEdit}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={canEdit ? 'Mover para cima' : 'Apenas ADMIN pode editar'}
                    aria-label="Mover questão para cima"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    type="button"
                    onClick={onMoveDown}
                    disabled={!canEdit}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={canEdit ? 'Mover para baixo' : 'Apenas ADMIN pode editar'}
                    aria-label="Mover questão para baixo"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                )}
                <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded text-xs font-bold">#{index + 1}</span>
              </div>

              <h4 className="text-sm font-extrabold text-slate-900 truncate max-w-152">
                {question.texto?.trim() ? question.texto : 'Sem título'}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${tone.badge}`}>
                {question.criticidade}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  question.respondida
                    ? 'bg-green-50 text-emerald-800 border-emerald-200'
                    : 'bg-orange-100 text-amber-900 border-amber-500'
                }`}
              >
                {question.respondida ? 'SALVA' : 'PENDENTE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">{summaryResposta}</p>
            <p className="text-sm text-slate-800">
              {index + 1} de {total}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label={expanded ? 'Recolher questão' : 'Expandir questão'}
            title={expanded ? 'Recolher questão' : 'Expandir questão'}
          >
            {expanded ? <ListCheck className="h-4 w-4" /> : <ListCheck className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!canEdit}
            className="p-2 text-slate-800 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={canEdit ? 'Remover questão' : 'Apenas ADMIN pode editar'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!expanded ? null : (
        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">Título da questão</label>
            <textarea
              value={question.texto}
              onChange={(e) => update({ texto: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
              rows={3}
              placeholder="Digite a pergunta"
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">Aplicável?</label>
              <select
                value={question.aplicavel ? 'sim' : 'nao'}
                onChange={(e) => update({ aplicavel: e.target.value === 'sim', respondida: false })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                disabled={!canEdit}
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">Criticidade</label>
              <div className="flex items-center gap-2">
                <select
                  value={question.criticidade}
                  onChange={(e) => update({ criticidade: e.target.value as Question['criticidade'] })}
                  className={`w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 focus:ring-2 ${tone.ring}`}
                  disabled={!canEdit}
                >
                  <option value="BAIXA">BAIXA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="ALTA">ALTA</option>
                </select>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${tone.badge}`}>
                  {question.criticidade}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">Capitulação (200)</label>
              <input
                maxLength={200}
                value={question.capitulacao}
                onChange={(e) => update({ capitulacao: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                placeholder="Ex: Art. 10"
                disabled={!canEdit}
              />
            </div>
          </div>

          {!question.aplicavel ? (
            <div className="text-sm text-slate-500">Questão marcada como não aplicável.</div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex flex-col items-center justify-between">
                  <h5 className="text-md font-bold text-slate-500 uppercase tracking-wider">Teste?</h5>
                  <select
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
                    className="border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                    disabled={!canEdit}
                  >
                    <option value="">Selecione...</option>
                    <option value="SIM">Sim</option>
                    <option value="NAO">Não</option>
                    <option value="NAO_PLANO">Não, pois há plano de ação corretiva em andamento</option>
                  </select>
                </div>

                {question.test.status === 'SIM' && (
                  <div className="space-y-4">
                    <textarea
                      maxLength={300}
                      value={question.test.description}
                      onChange={(e) => updateTest({ description: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
                      rows={3}
                      placeholder="Descrição do teste (300)"
                      disabled={!canEdit}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FileUpload
                          label="REQUISIÇÃO"
                          file={question.test.requisicao?.[0]}
                          onFileSelect={(f) => updateTest({ requisicao: [f] })}
                          onRemove={() => updateTest({ requisicao: [] })}
                          disabled={!canEdit}
                        />
                        <input
                          maxLength={200}
                          value={question.test.requisicaoRef}
                          onChange={(e) => updateTest({ requisicaoRef: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                          placeholder="Referência da requisição (200)"
                          disabled={!canEdit}
                        />
                      </div>

                      <div className="space-y-2">
                        <FileUpload
                          label="RESPOSTA"
                          file={question.test.resposta?.[0]}
                          onFileSelect={(f) => updateTest({ resposta: [f] })}
                          onRemove={() => updateTest({ resposta: [] })}
                          disabled={!canEdit}
                        />
                        <input
                          maxLength={200}
                          value={question.test.respostaRef}
                          onChange={(e) => updateTest({ respostaRef: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                          placeholder="Referência da resposta (200)"
                          disabled={!canEdit}
                        />
                      </div>

                      <div className="space-y-2">
                        <FileUpload
                          label="AMOSTRA"
                          file={question.test.amostra?.[0]}
                          onFileSelect={(f) => updateTest({ amostra: [f] })}
                          onRemove={() => updateTest({ amostra: [] })}
                          disabled={!canEdit}
                        />
                        <input
                          maxLength={200}
                          value={question.test.amostraRef}
                          onChange={(e) => updateTest({ amostraRef: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                          placeholder="Referência da amostra (200)"
                          disabled={!canEdit}
                        />
                      </div>

                      <div className="space-y-2">
                        <FileUpload
                          label="EVIDÊNCIAS"
                          file={question.test.evidencias?.[0]}
                          onFileSelect={(f) => updateTest({ evidencias: [f] })}
                          onRemove={() => updateTest({ evidencias: [] })}
                          disabled={!canEdit}
                        />
                        <input
                          maxLength={200}
                          value={question.test.evidenciasRef}
                          onChange={(e) => updateTest({ evidenciasRef: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                          placeholder="Referência das evidências (200)"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {question.test.status === 'NAO_PLANO' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Origem do apontamento</label>
                      <input
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                        value={question.test.actionPlan.origem}
                        onChange={(e) => updateActionPlan('origem', e.target.value)}
                        disabled={!canEdit}
                      />
                      <label className="block text-xs font-semibold text-slate-600">Responsável pelo apontamento</label>
                      <input
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                        value={question.test.actionPlan.responsavel}
                        onChange={(e) => updateActionPlan('responsavel', e.target.value)}
                        disabled={!canEdit}
                      />
                      <label className="block text-xs font-semibold text-slate-600">Data do apontamento</label>
                      <input
                        type="date"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                        value={question.test.actionPlan.dataApontamento}
                        onChange={(e) => updateActionPlan('dataApontamento', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Descrição do apontamento (200)</label>
                      <textarea
                        maxLength={200}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                        rows={3}
                        value={question.test.actionPlan.descricao}
                        onChange={(e) => updateActionPlan('descricao', e.target.value)}
                        disabled={!canEdit}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600">Prazo original</label>
                          <input
                            type="date"
                            className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                            value={question.test.actionPlan.prazoOriginal}
                            onChange={(e) => updateActionPlan('prazoOriginal', e.target.value)}
                            disabled={!canEdit}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600">Prazo atual</label>
                          <input
                            type="date"
                            className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                            value={question.test.actionPlan.prazoAtual}
                            onChange={(e) => updateActionPlan('prazoAtual', e.target.value)}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>

                      <label className="block text-xs font-semibold text-slate-600">Comentários</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700"
                        rows={2}
                        value={question.test.actionPlan.comentarios}
                        onChange={(e) => updateActionPlan('comentarios', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">Resposta</label>
                <div className="bg-slate-50 rounded-xl p-2 inline-flex items-center border border-slate-200">
                  <button
                    type="button"
                    onClick={() => update({ resposta: 'Sim', respondida: false })}
                    disabled={!canEdit}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                      question.resposta === 'Sim'
                        ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100'
                        : 'text-slate-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    SIM
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ resposta: 'Não', respondida: false })}
                    disabled={!canEdit}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                      question.resposta === 'Não'
                        ? 'bg-white text-red-600 shadow-sm border border-red-100'
                        : 'text-slate-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    NÃO
                  </button>
                </div>

                <textarea
                  maxLength={500}
                  value={question.respostaTexto}
                  onChange={(e) => update({ respostaTexto: e.target.value, respondida: false })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
                  rows={3}
                  placeholder="Justificativa/observações (500)"
                  disabled={!canEdit}
                />

                <FileUpload
                  label="Arquivo da resposta"
                  file={question.respostaArquivo?.[0]}
                  onFileSelect={(f) => update({ respostaArquivo: [f], respondida: false })}
                  onRemove={() => update({ respostaArquivo: [], respondida: false })}
                  disabled={!canEdit}
                />

                {question.resposta === 'Não' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">Deficiência (500)</label>
                      <textarea
                        maxLength={500}
                        value={question.deficienciaTexto}
                        onChange={(e) => update({ deficienciaTexto: e.target.value, respondida: false })}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
                        rows={4}
                        placeholder="Deficiência"
                        disabled={!canEdit}
                      />
                      <FileUpload
                        label="Arquivo da deficiência"
                        file={question.deficienciaArquivo?.[0]}
                        onFileSelect={(f) => update({ deficienciaArquivo: [f], respondida: false })}
                        onRemove={() => update({ deficienciaArquivo: [], respondida: false })}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">Recomendação (500)</label>
                      <textarea
                        maxLength={500}
                        value={question.recomendacaoTexto}
                        onChange={(e) => update({ recomendacaoTexto: e.target.value, respondida: false })}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
                        rows={4}
                        placeholder="Recomendação"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Evidências</h5>
                {selectedEvidenceFiles.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum arquivo selecionado.</p>
                ) : (
                  <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
                    {selectedEvidenceFiles.map((it) => (
                      <li key={`${it.label}-${it.file.name}`}>
                        <span className="font-semibold">{it.label}:</span> {it.file.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
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
                    update({ respondida: true });

                    toast.loading('Salvando...', { id: `pld-save-${question.id}` });
                    void (async () => {
                      const ok = await onPersist();
                      if (ok) toast.success('Resposta salva', { id: `pld-save-${question.id}` });
                      else toast.error('Falha ao salvar resposta', { id: `pld-save-${question.id}` });
                    })();
                  }}
                  disabled={!canSaveResposta}
                  className="px-5 py-2.5 rounded-xl text-sm font-extrabold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !canEdit
                      ? 'Apenas ADMIN pode salvar'
                      : canSaveResposta
                        ? 'Conta como respondida apenas após salvar'
                        : saveErrors.length
                          ? `Pendências: ${saveErrors[0]}`
                          : 'Preencha os campos obrigatórios'
                  }
                >
                  Salvar resposta
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
