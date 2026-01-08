import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle, Download, ExternalLink, AlertTriangle, Clock, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/useAuth';
import { pldBuilderApi, api } from '../lib/api';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';

// Interface para metadados do formulário
interface Instituicao {
  id: string;
  nome: string;
  cnpj: string;
}

interface FormMetadata {
  instituicoes: Instituicao[];
  qualificacaoAvaliador: string;
  mostrarMetodologia: 'MOSTRAR' | 'NAO_MOSTRAR';
  incluirRecomendacoes: 'INCLUIR' | 'NAO_INCLUIR';
}

interface Attachment {
  id: string;
  category: string;
  filename: string;
  originalName: string;
  path: string;
  referenceText?: string;
}

interface Question {
  id: string;
  texto: string;
  aplicavel: boolean;
  respondida: boolean;
  resposta?: string;
  respostaTexto?: string;
  criticidade: string;
  capitulacao?: string;
  deficienciaTexto?: string;
  recomendacaoTexto?: string;
  testStatus?: string;
  testDescription?: string;
  // Referências de teste
  requisicaoRef?: string;
  respostaTesteRef?: string;
  amostraRef?: string;
  evidenciasRef?: string;
  // Plano de ação
  actionOrigem?: string;
  actionResponsavel?: string;
  actionDescricao?: string;
  actionDataApontamento?: string;
  actionPrazoOriginal?: string;
  actionPrazoAtual?: string;
  actionComentarios?: string;
  attachments?: Attachment[];
}

interface Section {
  id: string;
  item: string;
  customLabel?: string;
  hasNorma: boolean;
  normaReferencia?: string;
  descricao?: string;
  questions: Question[];
  attachments?: Attachment[];
}

interface FormDetail {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  sentToEmail: string | null;
  assignedToEmail: string | null;
  sections: Section[];
  metadata?: FormMetadata;
}

export default function AdminFormDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadForm = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pldBuilderApi.getConcludedForm(id!);
      setForm(res.data.form);
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      toast.error('Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const subscriptionActive = (user?.subscriptionStatus || '').toUpperCase() === 'ACTIVE';
    const hasAccess = user?.role === 'ADMIN' || user?.role === 'TRIAL_ADMIN' || subscriptionActive;
    if (!hasAccess) {
      toast.error('Acesso negado');
      navigate('/');
      return;
    }
    if (id) loadForm();
  }, [id, user, navigate, loadForm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getAttachmentUrl = (path: string) => {
    const base = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
    return `${base}/${path}`;
  };

  const getTestStatusLabel = (status?: string) => {
    if (status === 'SIM') return 'Sim - Teste Realizado';
    if (status === 'NAO') return 'Não';
    if (status === 'NAO_PLANO') return 'Apresenta deficiências com plano de ação';
    return status || '—';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto" />
          <p className="text-slate-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppHeader
          title="Formulário não encontrado"
          subtitle="O item pode ter sido removido ou você não tem acesso"
          leading={
            <button
              type="button"
              onClick={() => navigate('/admin/forms')}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          }
        />

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Formulário não encontrado</h3>
            <button
              type="button"
              onClick={() => navigate('/admin/forms')}
              className="px-6 py-3 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800"
            >
              Voltar
            </button>
          </div>
        </main>

        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader
        title={form.name}
        subtitle={`Criado em ${formatDate(form.createdAt)}`}
        leading={
          <button
            type="button"
            onClick={() => navigate('/admin/forms')}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        }
      />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1">
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Status</p>
                <p className="font-semibold text-slate-900">{form.status}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Enviado Para</p>
                <p className="font-semibold text-slate-900">{form.assignedToEmail || form.sentToEmail || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Total de Seções</p>
                <p className="font-semibold text-slate-900">{form.sections.length}</p>
              </div>
            </div>
          </div>

          {/* Botão Editar no Builder para formulários enviados ao usuário */}
          {(form.status === 'IN_PROGRESS' || form.status === 'SENT_TO_USER') && (
            <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Editar Formulário</p>
                    <p className="text-sm text-amber-700">
                      Este formulário está {form.status === 'IN_PROGRESS' ? 'em andamento' : 'aguardando resposta'}. 
                      Você pode adicionar ou editar questões no builder.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/pld-builder?editFormId=${form.id}`)}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors whitespace-nowrap"
                >
                  Editar no Builder
                </button>
              </div>
            </div>
          )}

          {/* Metadados do Formulário */}
          {form.metadata && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Informações do Formulário</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Instituições */}
                {form.metadata.instituicoes && form.metadata.instituicoes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2 uppercase">Instituição(ões)</p>
                    <div className="space-y-2">
                      {form.metadata.instituicoes.map((inst, idx) => (
                        <div key={inst.id || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="font-medium text-slate-900">{inst.nome || 'Nome não informado'}</p>
                          <p className="text-sm text-slate-600">CNPJ: {inst.cnpj || 'Não informado'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qualificação do Avaliador */}
                {form.metadata.qualificacaoAvaliador && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2 uppercase">Qualificação do Avaliador</p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{form.metadata.qualificacaoAvaliador}</p>
                    </div>
                  </div>
                )}

                {/* Opções */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Metodologia - Resultado da Avaliação</p>
                    <p className={`font-semibold ${
                      form.metadata.mostrarMetodologia === 'MOSTRAR' ? 'text-emerald-600' : 'text-slate-600'
                    }`}>
                      {form.metadata.mostrarMetodologia === 'MOSTRAR' ? 'MOSTRAR' : 'NÃO MOSTRAR'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Recomendações</p>
                    <p className={`font-semibold ${
                      form.metadata.incluirRecomendacoes === 'INCLUIR' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {form.metadata.incluirRecomendacoes === 'INCLUIR' ? 'INCLUIR' : 'NÃO INCLUIR'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sections */}
          {form.sections.map((section, idx) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">
                  {idx + 1}. {section.customLabel || section.item}
                </h2>
                {section.descricao && (
                  <p className="text-sm text-slate-600 mt-2">{section.descricao}</p>
                )}
                
                {/* Informação de Norma */}
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-800">
                    <strong>Possui Norma Interna:</strong> {section.hasNorma ? 'Sim' : 'Não'}
                  </p>
                  {section.hasNorma && section.normaReferencia && (
                    <p className="text-sm text-slate-700 mt-1">
                      <strong>Referência:</strong> {section.normaReferencia}
                    </p>
                  )}
                  {/* Arquivos de norma anexados */}
                  {section.attachments && section.attachments.filter(a => a.category === 'NORMA').length > 0 && (
                    <div className="mt-2">
                      {section.attachments.filter(a => a.category === 'NORMA').map(att => (
                        <a
                          key={att.id}
                          href={getAttachmentUrl(att.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download size={14} />
                          {att.originalName}
                          <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {section.questions.map((question, qIdx) => (
                    <div 
                      key={question.id} 
                      className={`border-2 rounded-xl p-5 ${
                        !question.aplicavel 
                          ? 'border-slate-300 bg-slate-50'
                          : question.resposta 
                            ? 'border-emerald-200 bg-emerald-50/30'
                            : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          !question.aplicavel ? 'bg-slate-400' : 'bg-slate-700'
                        }`}>
                          {qIdx + 1}
                        </div>
                        <div className="flex-1 space-y-4">
                          {/* Question Header */}
                          <div>
                            <p className={`font-semibold text-lg ${!question.aplicavel ? 'text-slate-500' : 'text-slate-900'}`}>
                              {question.texto}
                            </p>
                          
                            {question.capitulacao && (
                              <p className="text-sm text-slate-600 mt-1">
                                <strong>Capitulação:</strong> {question.capitulacao}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                question.criticidade === 'ALTA' ? 'bg-red-100 text-red-700' :
                                question.criticidade === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {question.criticidade}
                              </span>
                              {question.resposta && question.aplicavel && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                  <CheckCircle className="w-3 h-3" />
                                  Respondida: {question.resposta}
                                </span>
                              )}
                              {!question.aplicavel && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                                  <AlertTriangle className="w-3 h-3" />
                                  Não Aplicável
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Non-applicable message */}
                          {!question.aplicavel && (
                            <div className="p-4 bg-slate-100 rounded-lg">
                              <p className="text-sm text-slate-600 italic">
                                Esta questão foi marcada como não aplicável pelo usuário.
                              </p>
                            </div>
                          )}

                          {/* Aplicável - Show all responses */}
                          {question.aplicavel && (
                            <>
                              {/* Test Information */}
                              {question.testStatus && (
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                  <h5 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                                    📋 Informações do Teste
                                  </h5>
                                  <div className="space-y-2">
                                    <p className="text-sm">
                                      <strong className="text-slate-700">Status:</strong>{' '}
                                      <span className="text-slate-900">{getTestStatusLabel(question.testStatus)}</span>
                                    </p>
                                    {question.testDescription && (
                                      <p className="text-sm">
                                        <strong className="text-slate-700">Descrição:</strong>{' '}
                                        <span className="text-slate-900">{question.testDescription}</span>
                                      </p>
                                    )}
                                  </div>

                                  {/* Referências de Teste */}
                                  {(question.requisicaoRef || question.respostaTesteRef || question.amostraRef || question.evidenciasRef) && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {question.requisicaoRef && (
                                        <div className="p-2 bg-white rounded border border-blue-100">
                                          <p className="text-xs font-bold text-blue-700">REQUISIÇÃO</p>
                                          <p className="text-sm text-slate-700">{question.requisicaoRef}</p>
                                        </div>
                                      )}
                                      {question.respostaTesteRef && (
                                        <div className="p-2 bg-white rounded border border-blue-100">
                                          <p className="text-xs font-bold text-blue-700">RESPOSTA</p>
                                          <p className="text-sm text-slate-700">{question.respostaTesteRef}</p>
                                        </div>
                                      )}
                                      {question.amostraRef && (
                                        <div className="p-2 bg-white rounded border border-blue-100">
                                          <p className="text-xs font-bold text-blue-700">AMOSTRA</p>
                                          <p className="text-sm text-slate-700">{question.amostraRef}</p>
                                        </div>
                                      )}
                                      {question.evidenciasRef && (
                                        <div className="p-2 bg-white rounded border border-blue-100">
                                          <p className="text-xs font-bold text-blue-700">EVIDÊNCIAS</p>
                                          <p className="text-sm text-slate-700">{question.evidenciasRef}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Test Attachments */}
                                  {question.attachments && question.attachments.filter(a => 
                                    ['TEST_REQUISICAO', 'TEST_RESPOSTA', 'TEST_AMOSTRA', 'TEST_EVIDENCIAS'].includes(a.category)
                                  ).length > 0 && (
                                    <div className="mt-4">
                                      <p className="text-xs font-bold text-slate-600 uppercase mb-2">Arquivos de Teste</p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {question.attachments.filter(a => 
                                          ['TEST_REQUISICAO', 'TEST_RESPOSTA', 'TEST_AMOSTRA', 'TEST_EVIDENCIAS'].includes(a.category)
                                        ).map(att => (
                                          <a
                                            key={att.id}
                                            href={getAttachmentUrl(att.path)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                                          >
                                            <Download size={14} />
                                            <span className="truncate flex-1">
                                              {att.category.replace('TEST_', '')}: {att.originalName}
                                            </span>
                                            <ExternalLink size={12} className="shrink-0" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Plan (when testStatus = NAO_PLANO) */}
                              {question.testStatus === 'NAO_PLANO' && (
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                  <h5 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                                    <Clock size={16} />
                                    Plano de Ação
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {question.actionOrigem && (
                                      <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase">Origem</p>
                                        <p className="text-sm text-slate-900">{question.actionOrigem}</p>
                                      </div>
                                    )}
                                    {question.actionResponsavel && (
                                      <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase">Responsável</p>
                                        <p className="text-sm text-slate-900 flex items-center gap-1">
                                          <User size={14} />
                                          {question.actionResponsavel}
                                        </p>
                                      </div>
                                    )}
                                    {question.actionDataApontamento && (
                                      <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase">Data do Apontamento</p>
                                        <p className="text-sm text-slate-900">{formatDateOnly(question.actionDataApontamento)}</p>
                                      </div>
                                    )}
                                    {question.actionPrazoOriginal && (
                                      <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase">Prazo Original</p>
                                        <p className="text-sm text-slate-900">{formatDateOnly(question.actionPrazoOriginal)}</p>
                                      </div>
                                    )}
                                    {question.actionPrazoAtual && (
                                      <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase">Prazo Atual</p>
                                        <p className="text-sm text-slate-900">{formatDateOnly(question.actionPrazoAtual)}</p>
                                      </div>
                                    )}
                                    {question.actionDescricao && (
                                      <div className="md:col-span-2">
                                        <p className="text-xs font-bold text-slate-600 uppercase">Descrição</p>
                                        <p className="text-sm text-slate-900 whitespace-pre-wrap">{question.actionDescricao}</p>
                                      </div>
                                    )}
                                    {question.actionComentarios && (
                                      <div className="md:col-span-2">
                                        <p className="text-xs font-bold text-slate-600 uppercase">Comentários</p>
                                        <p className="text-sm text-slate-900 whitespace-pre-wrap">{question.actionComentarios}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Main Response */}
                              {question.resposta && (
                                <div className={`p-4 rounded-xl border ${
                                  question.resposta === 'Sim' 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-red-50 border-red-200'
                                }`}>
                                  <h5 className={`text-sm font-bold mb-3 ${
                                    question.resposta === 'Sim' ? 'text-emerald-800' : 'text-red-800'
                                  }`}>
                                    ✅ Resposta da Questão
                                  </h5>
                                  <p className="text-sm">
                                    <strong className="text-slate-700">Resposta:</strong>{' '}
                                    <span className={`font-bold ${
                                      question.resposta === 'Sim' ? 'text-emerald-700' : 'text-red-700'
                                    }`}>
                                      {question.resposta}
                                    </span>
                                  </p>
                                  
                                  {question.respostaTexto && (
                                    <div className="mt-3 p-3 bg-white rounded-lg">
                                      <p className="text-xs font-bold text-slate-600 uppercase mb-1">Justificativa</p>
                                      <p className="text-sm text-slate-900 whitespace-pre-wrap">{question.respostaTexto}</p>
                                    </div>
                                  )}

                                  {/* Response Attachment */}
                                  {question.attachments && question.attachments.filter(a => a.category === 'RESPOSTA').length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-xs font-bold text-slate-600 uppercase mb-2">Arquivo de Resposta</p>
                                      {question.attachments.filter(a => a.category === 'RESPOSTA').map(att => (
                                        <a
                                          key={att.id}
                                          href={getAttachmentUrl(att.path)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                                        >
                                          <Download size={14} />
                                          {att.originalName}
                                          <ExternalLink size={12} />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Deficiency (when resposta = Não) */}
                              {question.resposta === 'Não' && (question.deficienciaTexto || question.recomendacaoTexto) && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                  <h5 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    Deficiência Identificada
                                  </h5>
                                  
                                  {question.deficienciaTexto && (
                                    <div className="mb-3">
                                      <p className="text-xs font-bold text-slate-600 uppercase mb-1">Descrição da Deficiência</p>
                                      <p className="text-sm text-slate-900 whitespace-pre-wrap">{question.deficienciaTexto}</p>
                                    </div>
                                  )}

                                  {/* Deficiency Attachment */}
                                  {question.attachments && question.attachments.filter(a => a.category === 'DEFICIENCIA').length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-xs font-bold text-slate-600 uppercase mb-2">Arquivo Comprobatório</p>
                                      {question.attachments.filter(a => a.category === 'DEFICIENCIA').map(att => (
                                        <a
                                          key={att.id}
                                          href={getAttachmentUrl(att.path)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-red-200 rounded-lg text-sm text-red-700 hover:bg-red-100 transition-colors"
                                        >
                                          <Download size={14} />
                                          {att.originalName}
                                          <ExternalLink size={12} />
                                        </a>
                                      ))}
                                    </div>
                                  )}

                                  {question.recomendacaoTexto && (
                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                      <p className="text-xs font-bold text-amber-700 uppercase mb-1">Recomendação</p>
                                      <p className="text-sm text-slate-900 whitespace-pre-wrap">{question.recomendacaoTexto}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* All Other Attachments */}
                              {question.attachments && question.attachments.filter(a => 
                                !['RESPOSTA', 'DEFICIENCIA', 'TEST_REQUISICAO', 'TEST_RESPOSTA', 'TEST_AMOSTRA', 'TEST_EVIDENCIAS'].includes(a.category)
                              ).length > 0 && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <p className="text-xs font-bold text-slate-600 uppercase mb-2">Outros Anexos</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {question.attachments.filter(a => 
                                      !['RESPOSTA', 'DEFICIENCIA', 'TEST_REQUISICAO', 'TEST_RESPOSTA', 'TEST_AMOSTRA', 'TEST_EVIDENCIAS'].includes(a.category)
                                    ).map(att => (
                                      <a
                                        key={att.id}
                                        href={getAttachmentUrl(att.path)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                                      >
                                        <Download size={14} />
                                        <span className="truncate flex-1">{att.originalName}</span>
                                        <ExternalLink size={12} className="shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
