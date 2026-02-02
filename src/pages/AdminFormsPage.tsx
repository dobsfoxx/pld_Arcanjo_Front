import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Send, Eye, Mail, Plus, 
  Loader2, Trash2, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/useAuth';
import { pldBuilderApi, reportApi, api } from '../lib/api';
import axios from 'axios';
import { getToastErrorMessage } from '../lib/errors';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';

interface Form {
  id: string;
  name: string;
  createdAt: string;
  sentToEmail: string | null;
  status: 'DRAFT' | 'SENT_TO_USER' | 'IN_PROGRESS' | 'COMPLETED';
  assignedToEmail: string | null;
  sentAt: string | null;
  submittedAt: string | null;
}

type HelpTexts = {
  qualificacao?: string;
  metodologia?: string;
  recomendacoes?: string;
  planoAcao?: string;
};

const STATUS_LABELS: Record<Form['status'], string> = {
  DRAFT: 'Rascunho',
  SENT_TO_USER: 'Enviado ao Usuário',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluído',
};

const STATUS_COLORS: Record<Form['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  SENT_TO_USER: 'bg-slate-100 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-300',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-300',
};

const ITEMS_PER_PAGE = 10;

export default function AdminFormsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingFormId, setSendingFormId] = useState<string | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormName, setSelectedFormName] = useState<string>('');
  const [emailToSend, setEmailToSend] = useState('');
  const defaultHelpTexts: HelpTexts = {
    qualificacao:
      'Neste campo, descreva as qualificações profissionais do avaliador responsável pela avaliação de efetividade, incluindo:\n\n- Formação acadêmica\n- Certificações relevantes (ex: CAMS, CFE, CPA, etc.)\n- Experiência profissional na área de PLD/FT\n- Tempo de atuação no mercado financeiro\n- Outras qualificações pertinentes\n\nExemplo: "Profissional com 10 anos de experiência em compliance bancário, certificação CAMS, pós-graduação em Gestão de Riscos..."',
    metodologia:
      'MOSTRAR:\nInclui no relatório final a metodologia utilizada e os resultados detalhados da avaliação de efetividade.\n\nNÃO MOSTRAR:\nOmite a metodologia e resultados do relatório final. Útil quando a metodologia é confidencial ou já foi documentada em outro local.',
    recomendacoes:
      'INCLUIR:\nHabilita o campo de recomendações em cada questão, permitindo documentar sugestões de melhoria para cada item avaliado.\n\nNÃO INCLUIR:\nDesabilita o campo de recomendações. Útil quando as recomendações serão consolidadas em um documento separado ou quando não são aplicáveis ao tipo de avaliação.\n\nAo selecionar "NÃO INCLUIR", o campo de recomendação ficará desabilitado em todas as questões.',
    planoAcao:
      'Ao selecionar esta opção, indique no campo de comentários o plano de ação corretiva em andamento. Descreva:\n\n- Origem do apontamento e data\n- Responsável pelo plano de ação\n- Descrição da deficiência identificada\n- Prazos (original e atual) para implementação\n- Status atual da implementação\n- Evidências de andamento\n\nEnvie anexos que comprovem o plano de ação e seu progresso.',
  };
  const [helpTexts, setHelpTexts] = useState<HelpTexts>(defaultHelpTexts);
  const [loadingHelpTexts, setLoadingHelpTexts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Paginação
  const totalPages = Math.ceil(forms.length / ITEMS_PER_PAGE);
  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return forms.slice(start, start + ITEMS_PER_PAGE);
  }, [forms, currentPage]);

  const formStats = useMemo(() => {
    const stats = {
      draft: 0,
      pending: 0,
      completed: 0,
    };

    for (const form of forms) {
      if (form.status === 'DRAFT') stats.draft += 1;
      if (form.status === 'IN_PROGRESS' || form.status === 'SENT_TO_USER') stats.pending += 1;
      if (form.status === 'COMPLETED') stats.completed += 1;
    }

    return stats;
  }, [forms]);

  useEffect(() => {
    const subscriptionActive = (user?.subscriptionStatus || '').toUpperCase() === 'ACTIVE';
    const hasAccess = user?.role === 'ADMIN' || user?.role === 'TRIAL_ADMIN' || subscriptionActive;
    if (!hasAccess) {
      toast.error('Acesso negado');
      navigate('/');
      return;
    }
    loadForms();
  }, [user, navigate]);

  // Reset para página 1 quando forms mudar
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const res = await pldBuilderApi.listConcludedForms();
      setForms(res.data.forms || []);
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
      toast.error('Erro ao carregar formulários');
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = (formId: string) => {
    navigate(`/admin/forms/${formId}`);
  };

  const handleSendToUser = (formId: string) => {
    setSelectedFormId(formId);
    setEmailModalOpen(true);
    setLoadingHelpTexts(true);
    void (async () => {
      try {
        const res = await pldBuilderApi.getConcludedForm(formId);
        const form = res.data.form;
        const serverHelpTexts = (form?.helpTexts ?? null) as HelpTexts | null;
        setHelpTexts({
          qualificacao: serverHelpTexts?.qualificacao ?? defaultHelpTexts.qualificacao,
          metodologia: serverHelpTexts?.metodologia ?? defaultHelpTexts.metodologia,
          recomendacoes: serverHelpTexts?.recomendacoes ?? defaultHelpTexts.recomendacoes,
          planoAcao: serverHelpTexts?.planoAcao ?? defaultHelpTexts.planoAcao,
        });
      } catch (error) {
        console.error('Erro ao carregar textos de ajuda:', error);
        setHelpTexts(defaultHelpTexts);
      } finally {
        setLoadingHelpTexts(false);
      }
    })();
  };

  const handleDeleteClick = (form: Form) => {
    setSelectedFormId(form.id);
    setSelectedFormName(form.name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFormId) return;

    setDeletingFormId(selectedFormId);
    try {
      await pldBuilderApi.deleteForm(selectedFormId);
      toast.success('Formulário deletado com sucesso!');
      setDeleteModalOpen(false);
      setSelectedFormId(null);
      setSelectedFormName('');
      loadForms();
    } catch (error: unknown) {
      console.error('Erro ao deletar formulário:', error);
      toast.error(getToastErrorMessage(error, 'Erro ao deletar formulário'));
    } finally {
      setDeletingFormId(null);
    }
  };

  const confirmSendToUser = async () => {
    if (!emailToSend.trim()) {
      toast.error('Informe um e-mail válido');
      return;
    }

    if (!selectedFormId) return;

    setSendingFormId(selectedFormId);
    try {
      await pldBuilderApi.sendFormToUser(selectedFormId, emailToSend.trim(), helpTexts);
      toast.success('Formulário enviado com sucesso!');
      setEmailModalOpen(false);
      setEmailToSend('');
      setSelectedFormId(null);
      loadForms();
    } catch (error: unknown) {
      console.error('Erro ao enviar formulário:', error);
      toast.error(getToastErrorMessage(error, 'Erro ao enviar formulário'));
    } finally {
      setSendingFormId(null);
    }
  };


  const handleDownloadReport = async (formId: string, formName?: string) => {
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
        (value || 'relatorio')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\-_. ]/gi, '')
          .replace(/\s+/g, '-')
          .slice(0, 80) || 'relatorio';

      toast.loading('Gerando relatório...', { id: `report-${formId}` });
      const res = await reportApi.generateMyBuilderFormReport(formId, 'DOCX');

      const filename = `${safeFilenameBase(formName || `relatorio-${formId}`)}.docx`;

      if (res.data?.signedUrl && /^https?:\/\//i.test(res.data.signedUrl)) {
        const fetchRes = await fetch(res.data.signedUrl);
        if (!fetchRes.ok) {
          throw new Error(`Falha ao baixar arquivo (${fetchRes.status})`);
        }
        const blob = await fetchRes.blob();
        downloadBlob(blob, filename);
        toast.success('Relatório gerado', { id: `report-${formId}` });
        return;
      }

      const apiOrigin = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
      const relativePath = res.data?.url;
      if (!relativePath) {
        toast.error('Relatório gerado, mas sem URL de download', { id: `report-${formId}` });
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
      toast.success('Relatório gerado', { id: `report-${formId}` });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(getToastErrorMessage(error, 'Erro ao gerar relatório'), { id: `report-${formId}` });
    }
  };

  const canDownloadReport = (status: Form['status']) => status === 'COMPLETED';


  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader
        title="Controle de Formulários"
        subtitle="Gerencie todos os formulários PLD"
        actions={
          <button
            type="button"
            onClick={() => navigate('/pld-builder?openConclude=1')}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Novo Formulário"
          >
            <Plus size={16} />
            <span>Novo Formulário</span>
          </button>
        }
      />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Stats Cards */}
        {!loading && forms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileText size={22} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{forms.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FileText size={22} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Em andamento</p>
                  <p className="text-2xl font-bold text-amber-700">{formStats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <FileText size={22} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Concluídos</p>
                  <p className="text-2xl font-bold text-emerald-700">{formStats.completed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-slate-200 shadow-sm">
            <Loader2 className="h-12 w-12 animate-spin text-slate-700 mb-3" />
            <p className="text-slate-600 font-semibold">Carregando formulários...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-slate-200 shadow-sm">
            <FileText size={64} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Nenhum formulário criado
            </h3>
            <p className="text-slate-500 mb-6">
              Crie seu primeiro formulário no Builder PLD
            </p>
            <button
              type="button"
              onClick={() => navigate('/pld-builder?openConclude=1')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus size={18} />
              Criar Formulário
            </button>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="text-left text-xs font-bold text-slate-300 uppercase tracking-wider px-6 py-4">
                        Nome do Formulário
                      </th>
                      <th className="text-left text-xs font-bold text-slate-300 uppercase tracking-wider px-6 py-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-bold text-slate-300 uppercase tracking-wider px-6 py-4">
                        Enviado Para
                      </th>
                      <th className="text-left text-xs font-bold text-slate-300 uppercase tracking-wider px-6 py-4">
                        Data de Criação
                      </th>
                      <th className="text-right text-xs font-bold text-slate-300 uppercase tracking-wider px-6 py-4">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedForms.map((form, idx) => (
                      <tr 
                        key={form.id} 
                        className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <FileText size={18} className="text-slate-600" />
                            </div>
                            <span className="font-bold text-slate-900">{form.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border-2 ${STATUS_COLORS[form.status] || STATUS_COLORS.DRAFT}`}>
                            {STATUS_LABELS[form.status] || 'Desconhecido'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {form.assignedToEmail || form.sentToEmail || '—'}
                          </p>
                          {form.sentAt && (
                            <p className="text-xs text-slate-500">
                              Enviado em {formatDate(form.sentAt)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700">{formatDate(form.createdAt)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleViewForm(form.id)}
                              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Ver Detalhes"
                            >
                              <Eye size={18} />
                            </button>

                            {canDownloadReport(form.status) && (
                              <button
                                type="button"
                                onClick={() => void handleDownloadReport(form.id, form.name)}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Gerar relatório"
                              >
                                <Download size={18} />
                              </button>
                            )}

                            {(form.status === 'DRAFT' || form.status === 'COMPLETED') && (
                              <button
                                type="button"
                                onClick={() => handleSendToUser(form.id)}
                                disabled={sendingFormId === form.id}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Enviar para Usuário"
                              >
                                {sendingFormId === form.id ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <Send size={18} />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(form)}
                              disabled={deletingFormId === form.id}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Deletar Formulário"
                            >
                              {deletingFormId === form.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Mostrando <span className="font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a{' '}
                    <span className="font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, forms.length)}</span> de{' '}
                    <span className="font-bold">{forms.length}</span> formulários
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 text-sm font-bold rounded-lg transition-colors ${
                            page === currentPage
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próximo
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-strong border-2 border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail size={20} className="text-blue-400" />
                Enviar Formulário para Usuário
              </h2>
              <p className="text-sm text-slate-300 mt-1">O usuário receberá o formulário por e-mail para preenchimento</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                E-mail do Usuário
              </label>
              <input
                type="email"
                value={emailToSend}
                onChange={(e) => setEmailToSend(e.target.value)}
                placeholder="usuario@empresa.com"
                disabled={!!sendingFormId}
                autoFocus
                className="w-full h-11 px-4 text-sm bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
              />
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailModalOpen(false);
                  setEmailToSend('');
                  setSelectedFormId(null);
                }}
                disabled={!!sendingFormId}
                className="px-4 py-2.5 rounded-xl font-bold border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmSendToUser()}
                disabled={!!sendingFormId || !emailToSend.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingFormId ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-strong border-2 border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 size={20} className="text-red-400" />
                Excluir formulário
              </h2>
              <p className="text-sm text-slate-300 mt-1">O formulário será removido da sua lista.</p>
            </div>
            <div className="p-6">
              <p className="text-slate-700 mb-2">Você está prestes a excluir o formulário:</p>
              <p className="font-bold text-slate-900 text-lg mb-4 wrap-break-word">{selectedFormName || '—'}</p>

              <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-semibold">
                  Nota: O formulário será removido apenas da sua lista. Se já foi enviado ao usuário, ele ainda poderá acessá-lo.
                </p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedFormId(null);
                  setSelectedFormName('');
                }}
                disabled={!!deletingFormId}
                className="px-4 py-2.5 rounded-xl font-bold border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={!!deletingFormId}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletingFormId ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
      {/* Modal de Envio por Email */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-strong border-2 border-slate-200 overflow-hidden">
            <div className="max-h-[90vh] overflow-y-auto">
              <div className="p-6 bg-slate-900 rounded-t-2xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail size={20} className="text-blue-400" />
                  Enviar Formulário
                </h2>
                <p className="text-sm text-slate-300 mt-1">Defina o e-mail do usuário e os textos de ajuda dos popups.</p>
              </div>

              <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail do destinatário *</label>
                <input
                  type="email"
                  value={emailToSend}
                  onChange={(e) => setEmailToSend(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full h-11 px-4 text-sm bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                  disabled={!!sendingFormId}
                  autoFocus
                />
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-slate-600 uppercase mb-3">Textos dos popups de ajuda (Usuário)</p>
                {loadingHelpTexts ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando textos...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Qualificação do Avaliador</label>
                      <textarea
                        value={helpTexts.qualificacao ?? ''}
                        onChange={(e) => setHelpTexts((prev) => ({ ...prev, qualificacao: e.target.value }))}
                        rows={5}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                        disabled={!!sendingFormId}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Metodologia - Resultado da Avaliação</label>
                      <textarea
                        value={helpTexts.metodologia ?? ''}
                        onChange={(e) => setHelpTexts((prev) => ({ ...prev, metodologia: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                        disabled={!!sendingFormId}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Recomendações</label>
                      <textarea
                        value={helpTexts.recomendacoes ?? ''}
                        onChange={(e) => setHelpTexts((prev) => ({ ...prev, recomendacoes: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                        disabled={!!sendingFormId}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Plano de Ação (NAO_PLANO)</label>
                      <textarea
                        value={helpTexts.planoAcao ?? ''}
                        onChange={(e) => setHelpTexts((prev) => ({ ...prev, planoAcao: e.target.value }))}
                        rows={5}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50"
                        disabled={!!sendingFormId}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">Dica: quebre linhas para separar parágrafos.</p>
              </div>
            </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmailModalOpen(false);
                    setEmailToSend('');
                    setSelectedFormId(null);
                    setHelpTexts(defaultHelpTexts);
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  disabled={!!sendingFormId}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmSendToUser()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={!!sendingFormId || loadingHelpTexts}
                >
                  {sendingFormId ? 'Enviando...' : 'Enviar Formulário'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
