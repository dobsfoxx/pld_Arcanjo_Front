import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Eye, Loader2, ChevronLeft, ChevronRight, 
  CheckCircle, Clock, Download, Inbox, Trash2
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
  status: 'SENT_TO_USER' | 'IN_PROGRESS' | 'COMPLETED';
  assignedToEmail: string;
  sentAt: string | null;
  submittedAt: string | null;
}

const STATUS_LABELS: Record<Form['status'], string> = {
  SENT_TO_USER: 'Pendente',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluído',
};

const STATUS_COLORS: Record<Form['status'], string> = {
  SENT_TO_USER: 'bg-slate-100 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

const ITEMS_PER_PAGE = 10;

export default function UserFormsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormName, setSelectedFormName] = useState<string>('');

  // Paginação
  const totalPages = Math.ceil(forms.length / ITEMS_PER_PAGE);
  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return forms.slice(start, start + ITEMS_PER_PAGE);
  }, [forms, currentPage]);

  const formStats = useMemo(() => {
    const stats = {
      total: forms.length,
      pending: 0,
      completed: 0,
    };

    for (const form of forms) {
      if (form.status === 'SENT_TO_USER' || form.status === 'IN_PROGRESS') {
        stats.pending += 1;
        continue;
      }
      if (form.status === 'COMPLETED') stats.completed += 1;
    }

    return stats;
  }, [forms]);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const res = await pldBuilderApi.listMyForms();
      setForms(res.data.forms || []);
    } catch (error) {
      console.error('Erro ao carregar formulários:', error);
      toast.error(getToastErrorMessage(error, 'Erro ao carregar formulários'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = (formId: string) => {
    navigate(`/forms/${formId}`);
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
      await pldBuilderApi.deleteUserForm(selectedFormId);
      toast.success('Formulário removido com sucesso!');
      setDeleteModalOpen(false);
      setSelectedFormId(null);
      setSelectedFormName('');
      loadForms();
    } catch (error: unknown) {
      console.error('Erro ao remover formulário:', error);
      toast.error(getToastErrorMessage(error, 'Erro ao remover formulário'));
    } finally {
      setDeletingFormId(null);
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

  const canEdit = (status: Form['status']) => {
    return status === 'SENT_TO_USER' || status === 'IN_PROGRESS';
  };

  const canDownloadReport = (status: Form['status']) => {
    return status === 'COMPLETED';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Meus Formulários" subtitle={user?.email} />

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
                  <p className="text-2xl font-bold text-slate-900">{formStats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock size={22} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-700">{formStats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={22} className="text-emerald-600" />
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
            <Inbox size={64} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Nenhum formulário atribuído
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Você ainda não possui formulários para preencher. Quando um administrador enviar um formulário, ele aparecerá aqui.
            </p>
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
                        Recebido em
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
                          <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border-2 ${STATUS_COLORS[form.status]}`}>
                            {STATUS_LABELS[form.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700">{formatDate(form.sentAt)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleViewForm(form.id)}
                              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title={canEdit(form.status) ? 'Preencher' : 'Visualizar'}
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

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(form)}
                              disabled={deletingFormId === form.id}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Remover Formulário"
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-strong border-2 border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 size={20} className="text-red-400" />
                Remover formulário
              </h2>
              <p className="text-sm text-slate-300 mt-1">O formulário será removido da sua lista.</p>
            </div>
            <div className="p-6">
              <p className="text-slate-700 mb-2">Você está prestes a remover o formulário:</p>
              <p className="font-bold text-slate-900 text-lg mb-4 wrap-break-word">{selectedFormName || '—'}</p>

              <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-semibold">
                  Nota: O formulário será removido apenas da sua lista. O administrador ainda terá acesso a ele.
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
                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remover
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
