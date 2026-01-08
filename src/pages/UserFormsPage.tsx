import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Eye, Loader2, ChevronLeft, ChevronRight, 
  CheckCircle, Clock, Send, AlertCircle, Download
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
  status: 'SENT_TO_USER' | 'IN_PROGRESS' | 'SENT_FOR_REVIEW' | 'APPROVED' | 'RETURNED' | 'COMPLETED';
  assignedToEmail: string;
  sentAt: string | null;
  submittedAt: string | null;
}

const STATUS_LABELS: Record<Form['status'], string> = {
  SENT_TO_USER: 'Pendente',
  IN_PROGRESS: 'Em Progresso',
  SENT_FOR_REVIEW: 'Enviado para Revisão',
  APPROVED: 'Aprovado',
  RETURNED: 'Devolvido para Correção',
  COMPLETED: 'Concluído',
};

const STATUS_COLORS: Record<Form['status'], string> = {
  SENT_TO_USER: 'bg-slate-100 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-300',
  SENT_FOR_REVIEW: 'bg-slate-100 text-slate-700 border-slate-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  RETURNED: 'bg-red-100 text-red-700 border-red-300',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-300',
};

const STATUS_ICONS: Record<Form['status'], React.ReactNode> = {
  SENT_TO_USER: <Clock size={14} />,
  IN_PROGRESS: <Clock size={14} />,
  SENT_FOR_REVIEW: <Send size={14} />,
  APPROVED: <CheckCircle size={14} />,
  RETURNED: <AlertCircle size={14} />,
  COMPLETED: <CheckCircle size={14} />,
};

const ITEMS_PER_PAGE = 10;

export default function UserFormsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Paginação
  const totalPages = Math.ceil(forms.length / ITEMS_PER_PAGE);
  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return forms.slice(start, start + ITEMS_PER_PAGE);
  }, [forms, currentPage]);

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

  const handleDownloadReport = async (formId: string) => {
    try {
      toast.loading('Gerando relatório...', { id: `report-${formId}` });
      const res = await reportApi.generateMyBuilderFormReport(formId, 'PDF');

      if (res.data?.signedUrl && /^https?:\/\//i.test(res.data.signedUrl)) {
        window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
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

      const blobUrl = URL.createObjectURL(blobRes.data);
      const popup = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!popup) window.location.href = blobUrl;
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
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
    return status === 'SENT_TO_USER' || status === 'IN_PROGRESS' || status === 'RETURNED';
  };

  const canDownloadReport = (status: Form['status']) => {
    return status === 'COMPLETED' || status === 'APPROVED';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Meus Formulários" subtitle={user?.email} />

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1">
        {/* Stats Cards */}
        {!loading && forms.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-slate-900">{forms.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-slate-900">
                {forms.filter(f => f.status === 'SENT_TO_USER' || f.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Em Revisão</p>
              <p className="text-2xl font-bold text-slate-900">
                {forms.filter(f => f.status === 'SENT_FOR_REVIEW').length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Aprovados</p>
              <p className="text-2xl font-bold text-emerald-700">
                {forms.filter(f => f.status === 'APPROVED').length}
              </p>
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
              Nenhum formulário atribuído
            </h3>
            <p className="text-slate-500">
              Você ainda não possui formulários para preencher.
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
                        Formulário
                      </th>
                      <th className="text-left text-xs font-bold text-slate-300 uppercase tracking-wider px-6 py-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-bold text-slate-300 uppercase tracking-wider px-6 py-4">
                        Recebido em
                      </th>
                      <th className="text-right text-xs font-bold text-slate-300 uppercase tracking-wider px-6 py-4">
                        Ação
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
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border-2 ${STATUS_COLORS[form.status]}`}>
                            {STATUS_ICONS[form.status]}
                            {STATUS_LABELS[form.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700">{formatDate(form.sentAt)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {canDownloadReport(form.status) && (
                              <button
                                type="button"
                                onClick={() => void handleDownloadReport(form.id)}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Gerar relatório"
                              >
                                <Download size={18} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleViewForm(form.id)}
                              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                                canEdit(form.status)
                                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Eye size={16} />
                              {canEdit(form.status) ? 'Preencher' : 'Visualizar'}
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

      <AppFooter />
    </div>
  );
}
