import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Save, ArrowLeft, AlertTriangle, Loader2, 
  ChevronDown, ChevronUp, Download, ExternalLink, Plus, Trash2, 
  HelpCircle, X, Building2,
  Settings,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/useAuth';
import axios from 'axios';
import { pldBuilderApi, api, reportApi } from '../lib/api';
import { getToastErrorMessage } from '../lib/errors';
import { FileUpload } from '../components/FileUpload';
import { ProgressDashboard } from '../components/ProgressDashBoard';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';
import type { FormProgress } from '../types/pld';

// Interface para instituições
interface Instituicao {
  id: string;
  nome: string;
  cnpj: string;
}

// Interface para metadados do formulário
interface FormMetadata {
  instituicoes: Instituicao[];
  qualificacaoAvaliador: string;
  mostrarMetodologia: 'MOSTRAR' | 'NAO_MOSTRAR';
  incluirRecomendacoes: 'INCLUIR' | 'NAO_INCLUIR';
}

type HelpTexts = {
  qualificacao?: string;
  metodologia?: string;
  recomendacoes?: string;
  planoAcao?: string;
};

type MetadataErrors = {
  instituicoes?: string;
  instituicoesById?: Record<string, { nome?: string; cnpj?: string }>;
  qualificacaoAvaliador?: string;
};

const defaultFormMetadata: FormMetadata = {
  instituicoes: [],
  qualificacaoAvaliador: '',
  mostrarMetodologia: 'MOSTRAR',
  incluirRecomendacoes: 'INCLUIR',
};

type MetadataModalProps = {
  formMetadata: FormMetadata;
  setFormMetadata: React.Dispatch<React.SetStateAction<FormMetadata>>;
  metadataConfigured: boolean;
  canContinue: boolean;
  errors: MetadataErrors;
  onClose: () => void;
  onContinue: () => void;
  addInstituicao: () => void;
  updateInstituicao: (id: string, field: 'nome' | 'cnpj', value: string) => void;
  removeInstituicao: (id: string) => void;
  formatCNPJ: (value: string) => string;
  onShowQualificacao: () => void;
  onShowMetodologia: () => void;
  onShowRecomendacoes: () => void;
};

function MetadataModal({
  formMetadata,
  setFormMetadata,
  metadataConfigured,
  canContinue,
  errors,
  onClose,
  onContinue,
  addInstituicao,
  updateInstituicao,
  removeInstituicao,
  formatCNPJ,
  onShowQualificacao,
  onShowMetodologia,
  onShowRecomendacoes,
}: MetadataModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Configurar Formulário</h2>
                <p className="text-sm text-slate-500">Preencha as informações iniciais</p>
              </div>
            </div>
            {metadataConfigured && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                <X size={20} className="text-slate-500" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Instituições */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-700 uppercase">
                Instituição(ões)
              </label>
              <button
                type="button"
                onClick={addInstituicao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Plus size={14} /> Adicionar Instituição
              </button>
            </div>

            {formMetadata.instituicoes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhuma instituição adicionada</p>
                <p className="text-xs text-slate-400 mt-1">Clique em "Adicionar Instituição" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formMetadata.instituicoes.map((inst, idx) => (
                  <div key={inst.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Nome da Instituição
                          </label>
                          <input
                            type="text"
                            value={inst.nome}
                            onChange={(e) => updateInstituicao(inst.id, 'nome', e.target.value)}
                            placeholder="Ex: Banco ABC S.A."
                            className={`w-full h-10 px-3 text-sm bg-white border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
                              errors.instituicoesById?.[inst.id]?.nome ? 'border-red-300' : 'border-slate-200'
                            }`}
                          />
                          {errors.instituicoesById?.[inst.id]?.nome && (
                            <p className="text-xs text-red-600 mt-1">{errors.instituicoesById?.[inst.id]?.nome}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            CNPJ
                          </label>
                          <input
                            type="text"
                            value={inst.cnpj}
                            onChange={(e) => updateInstituicao(inst.id, 'cnpj', formatCNPJ(e.target.value))}
                            placeholder="XX.XXX.XXX/XXXX-XX"
                            maxLength={18}
                            className={`w-full h-10 px-3 text-sm bg-white border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
                              errors.instituicoesById?.[inst.id]?.cnpj ? 'border-red-300' : 'border-slate-200'
                            }`}
                          />
                          {errors.instituicoesById?.[inst.id]?.cnpj && (
                            <p className="text-xs text-red-600 mt-1">{errors.instituicoesById?.[inst.id]?.cnpj}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInstituicao(inst.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.instituicoes && (
              <p className="text-xs text-red-600 mt-2">{errors.instituicoes}</p>
            )}
          </div>

          {/* Qualificação do Avaliador */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-bold text-slate-700 uppercase">
                Qualificação do Avaliador
              </label>
              <button
                type="button"
                onClick={onShowQualificacao}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                title="Ver orientações"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <textarea
              value={formMetadata.qualificacaoAvaliador}
              onChange={(e) => setFormMetadata((prev) => ({ ...prev, qualificacaoAvaliador: e.target.value }))}
              placeholder="Descreva a qualificação do avaliador responsável..."
              maxLength={500}
              rows={4}
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 resize-none ${
                errors.qualificacaoAvaliador ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.qualificacaoAvaliador && (
              <p className="text-xs text-red-600 mt-1">{errors.qualificacaoAvaliador}</p>
            )}
            <p className="text-xs text-slate-400 mt-1 text-right">
              {formMetadata.qualificacaoAvaliador.length}/500 caracteres
            </p>
          </div>

          {/* Metodologia - Resultado da Avaliação */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-bold text-slate-700 uppercase">
                Metodologia - Resultado da Avaliação
              </label>
              <button
                type="button"
                onClick={onShowMetodologia}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                title="Ver esclarecimentos"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <div className="flex gap-3">
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formMetadata.mostrarMetodologia === 'MOSTRAR'
                    ? 'border-slate-400 bg-slate-100 text-slate-800'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="metodologia"
                  value="MOSTRAR"
                  checked={formMetadata.mostrarMetodologia === 'MOSTRAR'}
                  onChange={() => setFormMetadata((prev) => ({ ...prev, mostrarMetodologia: 'MOSTRAR' }))}
                  className="sr-only"
                />
                <span className="font-medium">MOSTRAR</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formMetadata.mostrarMetodologia === 'NAO_MOSTRAR'
                    ? 'border-slate-400 bg-slate-100 text-slate-800'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="metodologia"
                  value="NAO_MOSTRAR"
                  checked={formMetadata.mostrarMetodologia === 'NAO_MOSTRAR'}
                  onChange={() => setFormMetadata((prev) => ({ ...prev, mostrarMetodologia: 'NAO_MOSTRAR' }))}
                  className="sr-only"
                />
                <span className="font-medium">NÃO MOSTRAR</span>
              </label>
            </div>
          </div>

          {/* Recomendações */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-bold text-slate-700 uppercase">
                Recomendações
              </label>
              <button
                type="button"
                onClick={onShowRecomendacoes}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                title="Ver esclarecimentos"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <div className="flex gap-3">
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formMetadata.incluirRecomendacoes === 'INCLUIR'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="recomendacoes"
                  value="INCLUIR"
                  checked={formMetadata.incluirRecomendacoes === 'INCLUIR'}
                  onChange={() => setFormMetadata((prev) => ({ ...prev, incluirRecomendacoes: 'INCLUIR' }))}
                  className="sr-only"
                />
                <span className="font-medium">INCLUIR</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formMetadata.incluirRecomendacoes === 'NAO_INCLUIR'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="recomendacoes"
                  value="NAO_INCLUIR"
                  checked={formMetadata.incluirRecomendacoes === 'NAO_INCLUIR'}
                  onChange={() => setFormMetadata((prev) => ({ ...prev, incluirRecomendacoes: 'NAO_INCLUIR' }))}
                  className="sr-only"
                />
                <span className="font-medium">NÃO INCLUIR</span>
              </label>
            </div>
            {formMetadata.incluirRecomendacoes === 'NAO_INCLUIR' && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                O campo "Recomendação" será desabilitado nas questões
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-lg">
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar para o Formulário
          </button>
          {!canContinue && (
            <p className="text-xs text-slate-500 mt-2">
              Preencha os campos obrigatórios para continuar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type SimplePopupProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

function SimplePopup({ title, onClose, children }: SimplePopupProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 text-sm text-slate-600 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function QualificacaoPopup({ onClose, text }: { onClose: () => void; text?: string }) {
  return (
    <SimplePopup title="Qualificação do Avaliador" onClose={onClose}>
      {text ? (
        <p className="whitespace-pre-wrap">{text}</p>
      ) : (
        <>
          <p>
            Neste campo, descreva as qualificações profissionais do avaliador responsável pela avaliação
            de efetividade, incluindo:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Formação acadêmica</li>
            <li>Certificações relevantes (ex: CAMS, CFE, CPA, etc.)</li>
            <li>Experiência profissional na área de PLD/FT</li>
            <li>Tempo de atuação no mercado financeiro</li>
            <li>Outras qualificações pertinentes</li>
          </ul>
          <p className="text-slate-500 italic">
            Exemplo: "Profissional com 10 anos de experiência em compliance bancário, certificação CAMS,
            pós-graduação em Gestão de Riscos..."
          </p>
        </>
      )}
    </SimplePopup>
  );
}

function MetodologiaPopup({ onClose, text }: { onClose: () => void; text?: string }) {
  return (
    <SimplePopup title="Metodologia - Resultado da Avaliação" onClose={onClose}>
      {text ? (
        <p className="whitespace-pre-wrap">{text}</p>
      ) : (
        <>
          <p>
            <strong>MOSTRAR:</strong>
          </p>
          <p className="pl-4">
            Selecione esta opção para incluir no relatório final a metodologia utilizada e os resultados
            detalhados da avaliação de efetividade.
          </p>
          <p>
            <strong>NÃO MOSTRAR:</strong>
          </p>
          <p className="pl-4">
            Selecione esta opção para omitir a metodologia e resultados do relatório final. Útil quando a
            metodologia é confidencial ou já foi documentada em outro local.
          </p>
        </>
      )}
    </SimplePopup>
  );
}

function RecomendacoesPopup({ onClose, text }: { onClose: () => void; text?: string }) {
  return (
    <SimplePopup title="Recomendações" onClose={onClose}>
      {text ? (
        <p className="whitespace-pre-wrap">{text}</p>
      ) : (
        <>
          <p>
            <strong>INCLUIR:</strong>
          </p>
          <p className="pl-4">
            Selecione esta opção para habilitar o campo de recomendações em cada questão. Isso permite
            documentar sugestões de melhoria para cada item avaliado.
          </p>
          <p>
            <strong>NÃO INCLUIR:</strong>
          </p>
          <p className="pl-4">
            Selecione esta opção para desabilitar o campo de recomendações. Útil quando as recomendações
            serão consolidadas em um documento separado ou quando não são aplicáveis ao tipo de
            avaliação.
          </p>
          <p className="text-amber-600 flex items-center gap-2 mt-4">
            <AlertTriangle size={16} />
            Ao selecionar "NÃO INCLUIR", o campo de recomendação ficará desabilitado em todas as
            questões.
          </p>
        </>
      )}
    </SimplePopup>
  );
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
  sections: Section[];
  // Metadados do formulário
  metadata?: FormMetadata;
  helpTexts?: HelpTexts | null;
}

// Tipos para respostas do usuário
interface UserQuestionResponse {
  // Aplicabilidade da questão
  aplicavel: boolean;
  // Resposta da questão
  resposta: string;
  respostaTexto: string;
  respostaArquivo: File[];
  // Deficiência (quando resposta = Não)
  deficienciaTexto: string;
  deficienciaArquivo: File[];
  recomendacaoTexto: string;
  // Campos de teste
  testStatus: string;
  testDescription: string;
  // Arquivos de teste
  requisicaoArquivo: File[];
  requisicaoRef: string;
  respostaTesteArquivo: File[];
  respostaTesteRef: string;
  amostraArquivo: File[];
  amostraRef: string;
  evidenciasArquivo: File[];
  evidenciasRef: string;
  // Plano de ação
  actionOrigem: string;
  actionResponsavel: string;
  actionDescricao: string;
  actionDataApontamento: string;
  actionPrazoOriginal: string;
  actionPrazoAtual: string;
  actionComentarios: string;
}

interface UserSectionResponse {
  hasNorma: boolean;
  normaArquivo: File[];
  normaReferencia: string;
}

const defaultQuestionResponse: UserQuestionResponse = {
  aplicavel: true,
  resposta: '',
  respostaTexto: '',
  respostaArquivo: [],
  deficienciaTexto: '',
  deficienciaArquivo: [],
  recomendacaoTexto: '',
  testStatus: '',
  testDescription: '',
  requisicaoArquivo: [],
  requisicaoRef: '',
  respostaTesteArquivo: [],
  respostaTesteRef: '',
  amostraArquivo: [],
  amostraRef: '',
  evidenciasArquivo: [],
  evidenciasRef: '',
  actionOrigem: '',
  actionResponsavel: '',
  actionDescricao: '',
  actionDataApontamento: '',
  actionPrazoOriginal: '',
  actionPrazoAtual: '',
  actionComentarios: '',
};

const defaultSectionResponse: UserSectionResponse = {
  hasNorma: false,
  normaArquivo: [],
  normaReferencia: '',
};

export default function UserSubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: _user } = useAuth();
  void _user;
  
  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [questionResponses, setQuestionResponses] = useState<Map<string, UserQuestionResponse>>(new Map());
  const [sectionResponses, setSectionResponses] = useState<Map<string, UserSectionResponse>>(new Map());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'PENDING' | 'ANSWERED' | 'NA'>('ALL');
  
  // Estados para metadados do formulário
  const [formMetadata, setFormMetadata] = useState<FormMetadata>(defaultFormMetadata);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showQualificacaoPopup, setShowQualificacaoPopup] = useState(false);
  const [showMetodologiaPopup, setShowMetodologiaPopup] = useState(false);
  const [showRecomendacoesPopup, setShowRecomendacoesPopup] = useState(false);
  const [showNaoplanoPopup, setShowNaoplanoPopup] = useState(false);
  const [metadataConfigured, setMetadataConfigured] = useState(false);
  const [reportFormat, setReportFormat] = useState<'DOCX' | 'PDF'>('DOCX');

  const validateMetadata = (metadata: FormMetadata): { canContinue: boolean; errors: MetadataErrors } => {
    const errors: MetadataErrors = {};
    const instituicoesById: Record<string, { nome?: string; cnpj?: string }> = {};

    if (!metadata.instituicoes.length) {
      errors.instituicoes = 'Adicione pelo menos 1 instituição.';
    } else {
      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
      for (const inst of metadata.instituicoes) {
        const instErr: { nome?: string; cnpj?: string } = {};
        if (!inst.nome.trim()) instErr.nome = 'Nome obrigatório.';
        if (!inst.cnpj.trim()) instErr.cnpj = 'CNPJ obrigatório.';
        else if (!cnpjRegex.test(inst.cnpj.trim())) instErr.cnpj = 'CNPJ inválido (use XX.XXX.XXX/XXXX-XX).';
        if (instErr.nome || instErr.cnpj) instituicoesById[inst.id] = instErr;
      }
      if (Object.keys(instituicoesById).length) {
        errors.instituicoesById = instituicoesById;
      }
    }

    if (!metadata.qualificacaoAvaliador.trim()) {
      errors.qualificacaoAvaliador = 'Qualificação do avaliador é obrigatória.';
    }

    const canContinue =
      !errors.instituicoes &&
      !errors.instituicoesById &&
      !errors.qualificacaoAvaliador;

    return { canContinue, errors };
  };

  const metadataValidation = useMemo(() => validateMetadata(formMetadata), [formMetadata]);

  // Funções para gerenciar instituições
  const addInstituicao = () => {
    setFormMetadata(prev => ({
      ...prev,
      instituicoes: [
        ...prev.instituicoes,
        { id: `inst_${Date.now()}`, nome: '', cnpj: '' }
      ]
    }));
  };

  const updateInstituicao = (id: string, field: 'nome' | 'cnpj', value: string) => {
    setFormMetadata(prev => ({
      ...prev,
      instituicoes: prev.instituicoes.map(inst =>
        inst.id === id ? { ...inst, [field]: value } : inst
      )
    }));
  };

  const removeInstituicao = (id: string) => {
    setFormMetadata(prev => ({
      ...prev,
      instituicoes: prev.instituicoes.filter(inst => inst.id !== id)
    }));
  };

  // Formatar CNPJ
  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  useEffect(() => {
    if (id) {
      loadForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadForm = async (opts?: { silent?: boolean; preserveActiveSection?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await pldBuilderApi.getUserForm(id!);
      const formData = res.data.form;
      setForm(formData);

      // Carregar metadados salvos
      if (formData.metadata) {
        setFormMetadata({
          instituicoes: formData.metadata.instituicoes || [],
          qualificacaoAvaliador: formData.metadata.qualificacaoAvaliador || '',
          mostrarMetodologia: formData.metadata.mostrarMetodologia || 'MOSTRAR',
          incluirRecomendacoes: formData.metadata.incluirRecomendacoes || 'INCLUIR',
        });
        // Se já tem metadados, não precisa mostrar o modal
        if (formData.metadata.instituicoes?.length > 0 || formData.metadata.qualificacaoAvaliador) {
          setMetadataConfigured(true);
        }
      }

      // Set first section as active
      if (formData.sections?.length > 0) {
        setActiveSectionId((prev) => {
          if (opts?.preserveActiveSection && prev) return prev;
          return formData.sections[0].id;
        });
      }

      // Initialize section responses
      const initialSectionResponses = new Map<string, UserSectionResponse>();
      formData.sections.forEach((section: Section) => {
        initialSectionResponses.set(section.id, {
          hasNorma: section.hasNorma || false,
          normaArquivo: [],
          normaReferencia: section.normaReferencia || '',
        });
      });
      setSectionResponses(initialSectionResponses);

      // Initialize question responses
      const initialQuestionResponses = new Map<string, UserQuestionResponse>();
      formData.sections.forEach((section: Section) => {
        section.questions.forEach((q: Question) => {
          initialQuestionResponses.set(q.id, {
            aplicavel: q.aplicavel !== false, // Default to true if not explicitly false
            resposta: q.resposta || '',
            respostaTexto: q.respostaTexto || '',
            respostaArquivo: [],
            deficienciaTexto: q.deficienciaTexto || '',
            deficienciaArquivo: [],
            recomendacaoTexto: q.recomendacaoTexto || '',
            testStatus: q.testStatus || '',
            testDescription: q.testDescription || '',
            requisicaoArquivo: [],
            requisicaoRef: q.requisicaoRef || '',
            respostaTesteArquivo: [],
            respostaTesteRef: q.respostaTesteRef || '',
            amostraArquivo: [],
            amostraRef: q.amostraRef || '',
            evidenciasArquivo: [],
            evidenciasRef: q.evidenciasRef || '',
            actionOrigem: q.actionOrigem || '',
            actionResponsavel: q.actionResponsavel || '',
            actionDescricao: q.actionDescricao || '',
            actionDataApontamento: q.actionDataApontamento ? q.actionDataApontamento.split('T')[0] : '',
            actionPrazoOriginal: q.actionPrazoOriginal ? q.actionPrazoOriginal.split('T')[0] : '',
            actionPrazoAtual: q.actionPrazoAtual ? q.actionPrazoAtual.split('T')[0] : '',
            actionComentarios: q.actionComentarios || '',
          });
        });
      });
      setQuestionResponses(initialQuestionResponses);
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      toast.error('Erro ao carregar formulário');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  const updateQuestionResponse = (
    questionId: string,
    field: keyof UserQuestionResponse,
    value: string | File | File[] | null | boolean
  ) => {
    setQuestionResponses(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(questionId) || { ...defaultQuestionResponse };
      newMap.set(questionId, { ...current, [field]: value });
      return newMap;
    });
  };

  const updateSectionResponse = (
    sectionId: string,
    field: keyof UserSectionResponse,
    value: boolean | File | File[] | null | string
  ) => {
    setSectionResponses(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(sectionId) || { ...defaultSectionResponse };
      newMap.set(sectionId, { ...current, [field]: value });
      return newMap;
    });
  };

  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Upload de todos os arquivos pendentes (chamado no save)
  const uploadPendingFiles = async () => {
    if (!id) return;

    // IMPORTANTE: o backend persiste anexos dentro do JSON do report.
    // Se enviarmos uploads em paralelo, as atualizações podem se sobrescrever (last-write-wins)
    // e só um arquivo “sobrevive”. Por isso, fazemos upload SEQUENCIAL.

    // Upload de arquivos de seções (norma)
    for (const [sectionId, sectionData] of sectionResponses.entries()) {
      if (sectionData.normaArquivo && sectionData.normaArquivo.length > 0) {
        for (const f of sectionData.normaArquivo.slice(0, 5)) {
          await pldBuilderApi.uploadUserFormAttachment(id, f, 'NORMA', {
            sectionId,
            referenceText: sectionData.normaReferencia,
          });
        }
        updateSectionResponse(sectionId, 'normaArquivo', []);
      }
    }

    // Upload de arquivos de questões
    for (const [questionId, qData] of questionResponses.entries()) {
      if (qData.requisicaoArquivo && qData.requisicaoArquivo.length > 0) {
        for (const f of qData.requisicaoArquivo.slice(0, 5)) {
          await pldBuilderApi.uploadUserFormAttachment(id, f, 'TEST_REQUISICAO', {
            questionId,
            referenceText: qData.requisicaoRef,
          });
        }
        updateQuestionResponse(questionId, 'requisicaoArquivo', []);
      }

      if (qData.respostaTesteArquivo && qData.respostaTesteArquivo.length > 0) {
        for (const f of qData.respostaTesteArquivo.slice(0, 5)) {
          await pldBuilderApi.uploadUserFormAttachment(id, f, 'TEST_RESPOSTA', {
            questionId,
            referenceText: qData.respostaTesteRef,
          });
        }
        updateQuestionResponse(questionId, 'respostaTesteArquivo', []);
      }

      if (qData.amostraArquivo && qData.amostraArquivo.length > 0) {
        for (const f of qData.amostraArquivo.slice(0, 5)) {
          await pldBuilderApi.uploadUserFormAttachment(id, f, 'TEST_AMOSTRA', {
            questionId,
            referenceText: qData.amostraRef,
          });
        }
        updateQuestionResponse(questionId, 'amostraArquivo', []);
      }

      if (qData.evidenciasArquivo && qData.evidenciasArquivo.length > 0) {
        for (const file of qData.evidenciasArquivo.slice(0, 5)) {
          await pldBuilderApi.uploadUserFormAttachment(id, file, 'TEST_EVIDENCIAS', {
            questionId,
            referenceText: qData.evidenciasRef,
          });
        }
        updateQuestionResponse(questionId, 'evidenciasArquivo', []);
      }

      if (qData.respostaArquivo && qData.respostaArquivo.length > 0) {
        for (const f of qData.respostaArquivo.slice(0, 5)) {
          await pldBuilderApi.uploadUserFormAttachment(id, f, 'RESPOSTA', { questionId });
        }
        updateQuestionResponse(questionId, 'respostaArquivo', []);
      }

      if (qData.deficienciaArquivo && qData.deficienciaArquivo.length > 0) {
        for (const f of qData.deficienciaArquivo.slice(0, 5)) {
          await pldBuilderApi.uploadUserFormAttachment(id, f, 'DEFICIENCIA', { questionId });
        }
        updateQuestionResponse(questionId, 'deficienciaArquivo', []);
      }
    }
  };

  const handleSave = async () => {
    if (!metadataValidation.canContinue) {
      toast.error('Preencha os metadados obrigatórios antes de salvar.');
      setShowMetadataModal(true);
      return;
    }

    setSaving(true);
    try {
      // Primeiro, fazer upload de todos os arquivos pendentes
      await uploadPendingFiles();

      const answers = Array.from(questionResponses.entries()).map(([questionId, data]) => ({
        questionId,
        aplicavel: data.aplicavel,
        resposta: data.resposta,
        respostaTexto: data.respostaTexto,
        deficienciaTexto: data.deficienciaTexto,
        recomendacaoTexto: data.recomendacaoTexto,
        testStatus: data.testStatus,
        testDescription: data.testDescription,
        // Referências de teste
        requisicaoRef: data.requisicaoRef,
        respostaTesteRef: data.respostaTesteRef,
        amostraRef: data.amostraRef,
        evidenciasRef: data.evidenciasRef,
        // Plano de ação
        actionOrigem: data.actionOrigem,
        actionResponsavel: data.actionResponsavel,
        actionDescricao: data.actionDescricao,
        actionDataApontamento: data.actionDataApontamento || null,
        actionPrazoOriginal: data.actionPrazoOriginal || null,
        actionPrazoAtual: data.actionPrazoAtual || null,
        actionComentarios: data.actionComentarios,
      }));

      const sections = Array.from(sectionResponses.entries()).map(([sectionId, data]) => ({
        sectionId,
        hasNorma: data.hasNorma,
        normaReferencia: data.normaReferencia,
      }));

      await pldBuilderApi.saveUserFormResponses(id!, { answers, sections, metadata: formMetadata });
      await loadForm({ silent: true, preserveActiveSection: true });
      toast.success('Respostas salvas com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao salvar respostas:', error);
      toast.error(getToastErrorMessage(error, 'Erro ao salvar respostas'));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!metadataValidation.canContinue) {
      toast.error('Preencha os metadados obrigatórios antes de gerar o relatório.');
      setShowMetadataModal(true);
      return;
    }

    // Salva respostas primeiro
    setSaving(true);
    try {
      await uploadPendingFiles();

      const answers = Array.from(questionResponses.entries()).map(([questionId, data]) => ({
        questionId,
        aplicavel: data.aplicavel,
        resposta: data.resposta,
        respostaTexto: data.respostaTexto,
        deficienciaTexto: data.deficienciaTexto,
        recomendacaoTexto: data.recomendacaoTexto,
        testStatus: data.testStatus,
        testDescription: data.testDescription,
        requisicaoRef: data.requisicaoRef,
        respostaTesteRef: data.respostaTesteRef,
        amostraRef: data.amostraRef,
        evidenciasRef: data.evidenciasRef,
        actionOrigem: data.actionOrigem,
        actionResponsavel: data.actionResponsavel,
        actionDescricao: data.actionDescricao,
        actionDataApontamento: data.actionDataApontamento || null,
        actionPrazoOriginal: data.actionPrazoOriginal || null,
        actionPrazoAtual: data.actionPrazoAtual || null,
        actionComentarios: data.actionComentarios,
      }));

      const sections = Array.from(sectionResponses.entries()).map(([sectionId, data]) => ({
        sectionId,
        hasNorma: data.hasNorma,
        normaReferencia: data.normaReferencia,
      }));

      await pldBuilderApi.saveUserFormResponses(id!, { answers, sections, metadata: formMetadata });

      toast.loading('Gerando relatório...', { id: 'user-report' });
      const res = await reportApi.generateMyBuilderFormReport(id!, reportFormat === 'DOCX' ? 'DOCX' : 'PDF');

      // Prefer signedUrl
      if (res.data?.signedUrl && /^https?:\/\//i.test(res.data.signedUrl)) {
        window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
        toast.success('Relatório gerado', { id: 'user-report' });
        return;
      }

      const apiOrigin = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
      const relativePath = res.data?.url;
      if (!relativePath) {
        toast.error('Relatório gerado, mas sem URL de download', { id: 'user-report' });
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
      toast.success('Relatório gerado', { id: 'user-report' });
    } catch (error: unknown) {
      console.error('Erro ao gerar relatório', error);
      toast.error(getToastErrorMessage(error, 'Falha ao gerar relatório'), { id: 'user-report' });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteForm = async () => {
    if (progressData.progress !== 100) {
      toast.error('O formulário precisa estar 100% preenchido para concluir.');
      return;
    }

    setSaving(true);
    try {
      await uploadPendingFiles();

      const answers = Array.from(questionResponses.entries()).map(([questionId, data]) => ({
        questionId,
        aplicavel: data.aplicavel,
        resposta: data.resposta,
        respostaTexto: data.respostaTexto,
        deficienciaTexto: data.deficienciaTexto,
        recomendacaoTexto: data.recomendacaoTexto,
        testStatus: data.testStatus,
        testDescription: data.testDescription,
        requisicaoRef: data.requisicaoRef,
        respostaTesteRef: data.respostaTesteRef,
        amostraRef: data.amostraRef,
        evidenciasRef: data.evidenciasRef,
        actionOrigem: data.actionOrigem,
        actionResponsavel: data.actionResponsavel,
        actionDescricao: data.actionDescricao,
        actionDataApontamento: data.actionDataApontamento || null,
        actionPrazoOriginal: data.actionPrazoOriginal || null,
        actionPrazoAtual: data.actionPrazoAtual || null,
        actionComentarios: data.actionComentarios,
      }));

      const sections = Array.from(sectionResponses.entries()).map(([sectionId, data]) => ({
        sectionId,
        hasNorma: data.hasNorma,
        normaReferencia: data.normaReferencia,
      }));

      await pldBuilderApi.saveUserFormResponses(id!, { answers, sections, metadata: formMetadata });
      await pldBuilderApi.completeUserForm(id!);
      await loadForm({ silent: true, preserveActiveSection: true });
      toast.success('Formulário concluído com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao concluir formulário:', error);
      toast.error(getToastErrorMessage(error, 'Erro ao concluir formulário'));
    } finally {
      setSaving(false);
    }
  };

  

  const canEdit = form?.status === 'SENT_TO_USER' || form?.status === 'RETURNED' || form?.status === 'IN_PROGRESS';

  const activeSection = useMemo(() => {
    return form?.sections.find(s => s.id === activeSectionId) || form?.sections[0];
  }, [form, activeSectionId]);

  const activeSectionResponse = useMemo(() => {
    if (!activeSection) return defaultSectionResponse;
    return sectionResponses.get(activeSection.id) || defaultSectionResponse;
  }, [activeSection, sectionResponses]);

  // Calculate progress
  const progressData: FormProgress = useMemo(() => {
    if (!form?.sections) {
      return { totalQuestions: 0, totalApplicable: 0, totalAnswered: 0, progress: 0 };
    }

    const totals = form.sections.reduce(
      (acc, section) => {
        section.questions.forEach((q) => {
          const qResponse = questionResponses.get(q.id);
          const isApplicable = qResponse?.aplicavel ?? q.aplicavel;
          const isAnswered = Boolean(qResponse?.resposta || q.respondida);

          acc.totalQuestions += 1;
          if (isApplicable) {
            acc.totalApplicable += 1;
            if (isAnswered) acc.totalAnswered += 1;
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
  }, [form, questionResponses]);

  const questionIndexById = useMemo(() => {
    const map = new Map<string, number>();
    (activeSection?.questions ?? []).forEach((q, idx) => map.set(q.id, idx));
    return map;
  }, [activeSection]);

  const questionStats = useMemo(() => {
    const all = activeSection?.questions ?? [];
    const stats = { total: all.length, answered: 0, pending: 0, notApplicable: 0 };

    all.forEach((q) => {
      const qResponse = questionResponses.get(q.id);
      const isApplicable = qResponse?.aplicavel ?? q.aplicavel;
      const isAnswered = Boolean(qResponse?.resposta || q.respondida);

      if (!isApplicable) {
        stats.notApplicable += 1;
        return;
      }
      if (isAnswered) stats.answered += 1;
      else stats.pending += 1;
    });

    return stats;
  }, [activeSection, questionResponses]);

  const filteredQuestions = useMemo(() => {
    const all = activeSection?.questions ?? [];
    switch (questionFilter) {
      case 'PENDING':
        return all.filter((q) => {
          const qResponse = questionResponses.get(q.id);
          const isApplicable = qResponse?.aplicavel ?? q.aplicavel;
          const isAnswered = Boolean(qResponse?.resposta || q.respondida);
          return isApplicable && !isAnswered;
        });
      case 'ANSWERED':
        return all.filter((q) => {
          const qResponse = questionResponses.get(q.id);
          const isApplicable = qResponse?.aplicavel ?? q.aplicavel;
          const isAnswered = Boolean(qResponse?.resposta || q.respondida);
          return isApplicable && isAnswered;
        });
      case 'NA':
        return all.filter((q) => {
          const qResponse = questionResponses.get(q.id);
          const isApplicable = qResponse?.aplicavel ?? q.aplicavel;
          return !isApplicable;
        });
      case 'ALL':
      default:
        return all;
    }
  }, [activeSection, questionFilter, questionResponses]);

  const filterBtnClass = (active: boolean) =>
    active
      ? 'px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-900 text-white text-xs font-bold transition-colors'
      : 'px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:border-slate-300 transition-colors';

  const getCriticidadeColor = (criticidade: string) => {
    if (criticidade === 'ALTA') return 'bg-red-100 text-red-700 border-red-200';
    if (criticidade === 'MEDIA') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const getAttachmentUrl = (path: string) => {
    const base = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
    return `${base}/${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-700 mx-auto mb-3" />
          <p className="text-slate-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">
            Formulário não encontrado
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Modais e Popups */}
      {(showMetadataModal || !metadataConfigured) && (
        <MetadataModal
          formMetadata={formMetadata}
          setFormMetadata={setFormMetadata}
          metadataConfigured={metadataConfigured}
          canContinue={metadataValidation.canContinue}
          errors={metadataValidation.errors}
          onClose={() => setShowMetadataModal(false)}
          onContinue={() => {
            if (!metadataValidation.canContinue) {
              toast.error('Preencha os campos obrigatórios para continuar.');
              return;
            }
            setMetadataConfigured(true);
            setShowMetadataModal(false);
          }}
          addInstituicao={addInstituicao}
          updateInstituicao={updateInstituicao}
          removeInstituicao={removeInstituicao}
          formatCNPJ={formatCNPJ}
          onShowQualificacao={() => setShowQualificacaoPopup(true)}
          onShowMetodologia={() => setShowMetodologiaPopup(true)}
          onShowRecomendacoes={() => setShowRecomendacoesPopup(true)}
        />
      )}
      {showQualificacaoPopup && (
        <QualificacaoPopup onClose={() => setShowQualificacaoPopup(false)} text={form?.helpTexts?.qualificacao} />
      )}
      {showMetodologiaPopup && (
        <MetodologiaPopup onClose={() => setShowMetodologiaPopup(false)} text={form?.helpTexts?.metodologia} />
      )}
      {showRecomendacoesPopup && (
        <RecomendacoesPopup onClose={() => setShowRecomendacoesPopup(false)} text={form?.helpTexts?.recomendacoes} />
      )}
      {showNaoplanoPopup && (
        <SimplePopup title="Esclarecimentos - Plano de Ação" onClose={() => setShowNaoplanoPopup(false)}>
          <p className="whitespace-pre-wrap">
            {form?.helpTexts?.planoAcao || 'Ao selecionar esta opção, indique no campo de comentários o plano de ação corretiva em andamento. Envie evidências e informações complementares conforme solicitado nos demais pop-ups.'}
          </p>
        </SimplePopup>
      )}

      <AppHeader
        title={form?.name ?? 'Formulário'}
        subtitle={`Status: ${form.status === 'SENT_TO_USER' ? 'Pendente' : form.status === 'IN_PROGRESS' ? 'Em Progresso' : form.status}${
          formMetadata.instituicoes.length > 0 ? ` • ${formMetadata.instituicoes.length} instituição(ões)` : ''
        }`}
        leading={
          <button
            type="button"
            onClick={() => navigate('/my-forms')}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        }
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMetadataModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Configurar Formulário"
            >
              <Settings size={16} />
              <span>Informações</span>
            </button>

            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value as 'DOCX' | 'PDF')}
              className="hidden md:inline-block h-9 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              aria-label="Formato do relatório"
            >
              <option value="DOCX">DOCX</option>
              <option value="PDF">PDF</option>
            </select>

            <button
              type="button"
              onClick={() => void handleGenerateReport()}
              disabled={saving}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gerar Relatório"
            >
              <Download size={16} />
              <span>Gerar</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCompleteForm()}
              disabled={saving || !canEdit || progressData.progress !== 100}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !canEdit
                  ? 'Este formulário não pode mais ser concluído'
                  : progressData.progress !== 100
                    ? 'Conclua 100% para habilitar'
                    : 'Concluir formulário'
              }
            >
              <Check size={16} />
              <span>Concluir</span>
            </button>
          </div>
        }
      />

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar de Seções */}
        <aside className="hidden md:block w-64 bg-white border-r border-slate-200 p-4 shrink-0">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Itens Avaliados</h3>
          <nav className="space-y-1">
            {form.sections.map((section, idx) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeSectionId === section.id 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                {idx + 1}. {section.customLabel || section.item}
              </button>
            ))}
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="mb-6">
            <ProgressDashboard progress={progressData} />
          </div>

          {!canEdit && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Atenção:</strong> Este formulário está em revisão ou já foi aprovado. Você não pode mais editá-lo.
              </p>
            </div>
          )}

          {activeSection && (
            <div className="space-y-6">
              {/* Header da Seção */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  {activeSection.customLabel || activeSection.item}
                </h2>
                
                {/* Descrição do Item (somente leitura - definido pelo admin) */}
                {/* Descrição do item removida para usuários — apenas admins visualizam essa informação. */}

                {/* Norma Interna - Editável pelo usuário */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-3">
                    Possui Norma Interna?
                  </label>
                  
                  {canEdit ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateSectionResponse(activeSection.id, 'hasNorma', true)}
                          className={`
                            px-6 py-2 text-sm font-bold rounded-xl border transition-colors
                            ${activeSectionResponse.hasNorma
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500'
                            }
                          `}
                        >
                          SIM
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateSectionResponse(activeSection.id, 'hasNorma', false);
                            updateSectionResponse(activeSection.id, 'normaArquivo', []);
                            updateSectionResponse(activeSection.id, 'normaReferencia', '');
                          }}
                          className={`
                            px-6 py-2 text-sm font-bold rounded-xl border transition-colors
                            ${!activeSectionResponse.hasNorma
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-red-500'
                            }
                          `}
                        >
                          NÃO
                        </button>
                      </div>

                      {activeSectionResponse.hasNorma && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                              Upload da Norma
                            </label>
                            <FileUpload
                              label="Selecionar arquivo da norma"
                              multiple
                              maxFiles={5}
                              files={activeSectionResponse.normaArquivo}
                              onFilesSelect={(files) => {
                                updateSectionResponse(activeSection.id, 'normaArquivo', files);
                              }}
                              onRemove={() => updateSectionResponse(activeSection.id, 'normaArquivo', [])}
                              onRemoveAt={(idx) => {
                                const next = [...(activeSectionResponse.normaArquivo ?? [])];
                                next.splice(idx, 1);
                                updateSectionResponse(activeSection.id, 'normaArquivo', next);
                              }}
                              disabled={false}
                            />
                          </div>

                          {/* Arquivos de norma existentes */}
                          {activeSection.attachments?.filter(a => a.category === 'NORMA').map(att => (
                            <a
                              key={att.id}
                              href={getAttachmentUrl(att.path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <Download size={14} />
                              {att.originalName}
                              <ExternalLink size={12} />
                            </a>
                          ))}

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                              Referência da Norma
                            </label>
                            <input
                              type="text"
                              value={activeSectionResponse.normaReferencia}
                              onChange={(e) => updateSectionResponse(activeSection.id, 'normaReferencia', e.target.value)}
                              placeholder="Ex: Política Interna nº 001"
                              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-900 font-semibold">
                        {activeSectionResponse.hasNorma ? 'Sim' : 'Não'}
                      </p>
                      {activeSectionResponse.normaReferencia && (
                        <p className="text-sm text-slate-600 mt-1">
                          Referência: {activeSectionResponse.normaReferencia}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Questões */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Questões</h3>
                    <p className="text-md font-bold text-slate-800">Responda as questões e anexe evidências quando necessário</p>
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

                {activeSection.questions.length > 0 && filteredQuestions.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600 font-semibold">Nenhuma questão encontrada neste filtro.</p>
                    <p className="text-slate-500 text-sm mt-1">Troque o filtro para ver outras questões.</p>
                  </div>
                ) : null}

                {filteredQuestions.map((question) => {
                  const qResponse = questionResponses.get(question.id) || { ...defaultQuestionResponse };
                  const isExpanded = expandedQuestions.has(question.id);
                  const originalIdx = questionIndexById.get(question.id) ?? 0;
                  
                  return (
                    <div 
                      key={question.id} 
                      className={`
                        bg-white rounded-2xl border-2 transition-all
                        ${!qResponse.aplicavel 
                          ? 'border-slate-300 bg-slate-50/50'
                          : question.respondida || qResponse.resposta
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : 'border-slate-200'
                        }
                      `}
                    >
                      {/* Header da Questão */}
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleQuestionExpanded(question.id)}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold ${
                            !qResponse.aplicavel ? 'bg-slate-400' : 'bg-slate-800'
                          }`}>
                            {originalIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${!qResponse.aplicavel ? 'text-slate-500' : 'text-slate-900'}`}>{question.texto}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getCriticidadeColor(question.criticidade)}`}>
                                {question.criticidade}
                              </span>
                              {question.capitulacao && (
                                <span className="text-xs text-slate-500">
                                  Capitulação: {question.capitulacao}
                                </span>
                              )}
                              {qResponse.aplicavel && (question.respondida || qResponse.resposta) && (
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-600 text-white">
                                  RESPONDIDA
                                </span>
                              )}
                              {!qResponse.aplicavel && (
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-500 text-white">
                                  NÃO APLICÁVEL
                                </span>
                              )}
                            </div>
                          </div>
                          <button type="button" className="p-1 text-slate-400 hover:text-slate-600">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Conteúdo Expandido */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4">
                          {/* Toggle de Aplicabilidade */}
                          {canEdit && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-sm font-bold text-slate-700">Esta questão é aplicável?</h5>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Marque como não aplicável se esta questão não se aplica ao seu contexto.
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuestionResponse(question.id, 'aplicavel', true);
                                    }}
                                    className={`
                                      px-4 py-2 text-sm font-bold rounded-xl border transition-colors
                                      ${qResponse.aplicavel
                                        ? 'bg-emerald-700 text-white border-emerald-700'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-600'
                                      }
                                    `}
                                  >
                                    SIM
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuestionResponse(question.id, 'aplicavel', false);
                                    }}
                                    className={`
                                      px-4 py-2 text-sm font-bold rounded-xl border transition-colors
                                      ${!qResponse.aplicavel
                                        ? 'bg-slate-600 text-white border-slate-600'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                                      }
                                    `}
                                  >
                                    NÃO
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Se não aplicável (pelo usuário) */}
                          {!qResponse.aplicavel ? (
                            <p className="text-sm text-slate-500 italic p-4 bg-slate-100 rounded-xl">
                              Esta questão foi marcada como não aplicável. Os campos de resposta foram ocultados.
                            </p>
                          ) : canEdit ? (
                            <>
                              {/* Seção de Teste - Editável */}
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h5 className="text-sm font-bold text-slate-800 mb-4">
                                  📋 Informações do Teste
                                </h5>
                                
                                <div className="mb-4">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    Teste Realizado? *
                                  </label>
                                  <select
                                    value={qResponse.testStatus}
                                    onChange={(e) => {
                                      updateQuestionResponse(question.id, 'testStatus', e.target.value);
                                      if (e.target.value === 'NAO_PLANO') setShowNaoplanoPopup(true);
                                      // Limpar campos quando mudar o status
                                      if (e.target.value !== 'SIM') {
                                        updateQuestionResponse(question.id, 'testDescription', '');
                                        updateQuestionResponse(question.id, 'requisicaoArquivo', []);
                                        updateQuestionResponse(question.id, 'respostaTesteArquivo', []);
                                        updateQuestionResponse(question.id, 'amostraArquivo', []);
                                        updateQuestionResponse(question.id, 'evidenciasArquivo', []);
                                      }
                                      if (e.target.value !== 'NAO_PLANO') {
                                        updateQuestionResponse(question.id, 'actionOrigem', '');
                                        updateQuestionResponse(question.id, 'actionResponsavel', '');
                                        updateQuestionResponse(question.id, 'actionDescricao', '');
                                        updateQuestionResponse(question.id, 'actionDataApontamento', '');
                                        updateQuestionResponse(question.id, 'actionPrazoOriginal', '');
                                        updateQuestionResponse(question.id, 'actionPrazoAtual', '');
                                        updateQuestionResponse(question.id, 'actionComentarios', '');
                                      }
                                    }}
                                    className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                  >
                                    <option value="">Selecione...</option>
                                    <option value="SIM">Sim</option>
                                    <option value="NAO">Não</option>
                                    <option value="NAO_PLANO">Apresenta deficiências para as quais há plano de ação corretiva em andamento</option>
                                  </select>
                                </div>

                                {/* Campos quando teste = SIM */}
                                {qResponse.testStatus === 'SIM' && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                        Descrição do Teste *
                                      </label>
                                      <textarea
                                        value={qResponse.testDescription}
                                        onChange={(e) => updateQuestionResponse(question.id, 'testDescription', e.target.value)}
                                        placeholder="Descreva o teste realizado..."
                                        rows={3}
                                        maxLength={300}
                                        className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none transition-colors"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Requisição */}
                                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-800 mb-2">
                                          REQUISIÇÃO *
                                        </label>
                                        <FileUpload
                                          label="Selecionar arquivo"
                                          multiple
                                          maxFiles={5}
                                          files={qResponse.requisicaoArquivo}
                                          onFilesSelect={(files) => {
                                            updateQuestionResponse(question.id, 'requisicaoArquivo', files);
                                          }}
                                          onRemove={() => updateQuestionResponse(question.id, 'requisicaoArquivo', [])}
                                          onRemoveAt={(idx) => {
                                            const next = [...(qResponse.requisicaoArquivo ?? [])];
                                            next.splice(idx, 1);
                                            updateQuestionResponse(question.id, 'requisicaoArquivo', next);
                                          }}
                                          disabled={false}
                                        />
                                        {/* Arquivo já enviado */}
                                        {question.attachments?.filter(a => a.category === 'TEST_REQUISICAO').map(att => (
                                          <a key={att.id} href={getAttachmentUrl(att.path)} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 hover:bg-emerald-100"
                                          >
                                            <Download size={12} />{att.originalName}<ExternalLink size={10} />
                                          </a>
                                        ))}
                                        <input
                                          type="text"
                                          value={qResponse.requisicaoRef}
                                          onChange={(e) => updateQuestionResponse(question.id, 'requisicaoRef', e.target.value)}
                                          placeholder="Referência (ex: DOC-001)"
                                          className="w-full h-10 px-3 mt-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                                        />
                                      </div>

                                      {/* Resposta do Teste */}
                                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-800 mb-2">
                                          RESPOSTA *
                                        </label>
                                        <FileUpload
                                          label="Selecionar arquivo"
                                          multiple
                                          maxFiles={5}
                                          files={qResponse.respostaTesteArquivo}
                                          onFilesSelect={(files) => {
                                            updateQuestionResponse(question.id, 'respostaTesteArquivo', files);
                                          }}
                                          onRemove={() => updateQuestionResponse(question.id, 'respostaTesteArquivo', [])}
                                          onRemoveAt={(idx) => {
                                            const next = [...(qResponse.respostaTesteArquivo ?? [])];
                                            next.splice(idx, 1);
                                            updateQuestionResponse(question.id, 'respostaTesteArquivo', next);
                                          }}
                                          disabled={false}
                                        />
                                        {/* Arquivo já enviado */}
                                        {question.attachments?.filter(a => a.category === 'TEST_RESPOSTA').map(att => (
                                          <a key={att.id} href={getAttachmentUrl(att.path)} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 hover:bg-emerald-100"
                                          >
                                            <Download size={12} />{att.originalName}<ExternalLink size={10} />
                                          </a>
                                        ))}
                                        <input
                                          type="text"
                                          value={qResponse.respostaTesteRef}
                                          onChange={(e) => updateQuestionResponse(question.id, 'respostaTesteRef', e.target.value)}
                                          placeholder="Referência (ex: DOC-002)"
                                          className="w-full h-9 px-3 mt-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                        />
                                      </div>

                                      {/* Amostra */}
                                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-800 mb-2">
                                          AMOSTRA *
                                        </label>
                                        <FileUpload
                                          label="Selecionar arquivo"
                                          multiple
                                          maxFiles={5}
                                          files={qResponse.amostraArquivo}
                                          onFilesSelect={(files) => {
                                            updateQuestionResponse(question.id, 'amostraArquivo', files);
                                          }}
                                          onRemove={() => updateQuestionResponse(question.id, 'amostraArquivo', [])}
                                          onRemoveAt={(idx) => {
                                            const next = [...(qResponse.amostraArquivo ?? [])];
                                            next.splice(idx, 1);
                                            updateQuestionResponse(question.id, 'amostraArquivo', next);
                                          }}
                                          disabled={false}
                                        />
                                        {/* Arquivo já enviado */}
                                        {question.attachments?.filter(a => a.category === 'TEST_AMOSTRA').map(att => (
                                          <a key={att.id} href={getAttachmentUrl(att.path)} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 hover:bg-emerald-100"
                                          >
                                            <Download size={12} />{att.originalName}<ExternalLink size={10} />
                                          </a>
                                        ))}
                                        <input
                                          type="text"
                                          value={qResponse.amostraRef}
                                          onChange={(e) => updateQuestionResponse(question.id, 'amostraRef', e.target.value)}
                                          placeholder="Referência (ex: DOC-003)"
                                          className="w-full h-9 px-3 mt-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                        />
                                      </div>

                                      {/* Evidências */}
                                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-800 mb-2">
                                          EVIDÊNCIAS *
                                        </label>
                                        <FileUpload
                                          label="Selecionar arquivo"
                                          multiple
                                          maxFiles={5}
                                          files={qResponse.evidenciasArquivo}
                                          onFilesSelect={(files) => {
                                            updateQuestionResponse(question.id, 'evidenciasArquivo', files);
                                          }}
                                          onRemove={() => updateQuestionResponse(question.id, 'evidenciasArquivo', [])}
                                          onRemoveAt={(idx) => {
                                            const next = [...(qResponse.evidenciasArquivo ?? [])];
                                            next.splice(idx, 1);
                                            updateQuestionResponse(question.id, 'evidenciasArquivo', next);
                                          }}
                                          disabled={false}
                                        />
                                        {/* Arquivo já enviado */}
                                        {question.attachments?.filter(a => a.category === 'TEST_EVIDENCIAS').map(att => (
                                          <a key={att.id} href={getAttachmentUrl(att.path)} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 hover:bg-emerald-100"
                                          >
                                            <Download size={12} />{att.originalName}<ExternalLink size={10} />
                                          </a>
                                        ))}
                                        <input
                                          type="text"
                                          value={qResponse.evidenciasRef}
                                          onChange={(e) => updateQuestionResponse(question.id, 'evidenciasRef', e.target.value)}
                                          placeholder="Referência (ex: DOC-004)"
                                          className="w-full h-9 px-3 mt-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                        />
                                      </div>
                                    </div>

                                    {/* Anexos existentes do admin */}
                                    {question.attachments && question.attachments.length > 0 && (
                                      <div className="mt-3">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                          Arquivos existentes (definidos pelo Admin)
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {question.attachments.filter(a => 
                                            ['TESTE_REQUISICAO', 'TESTE_RESPOSTA', 'TESTE_AMOSTRA', 'TESTE_EVIDENCIAS'].includes(a.category)
                                          ).map(att => (
                                            <a
                                              key={att.id}
                                              href={getAttachmentUrl(att.path)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                              <Download size={14} />
                                              <span className="truncate">
                                                {att.category.replace('TESTE_', '')}: {att.originalName}
                                              </span>
                                              <ExternalLink size={12} className="shrink-0" />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Campos quando teste = NAO_PLANO: apenas comentários */}
                                {qResponse.testStatus === 'NAO_PLANO' && (
                                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h5 className="text-sm font-bold text-slate-800">Comentários (Plano de Ação)</h5>
                                      <button
                                        type="button"
                                        onClick={() => setShowNaoplanoPopup(true)}
                                        className="text-slate-500 hover:text-slate-800 transition-colors"
                                        title="Ver informações sobre o plano de ação"
                                      >
                                        <HelpCircle className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Descreva as observações e o plano de ação em até 600 caracteres.</p>
                                    <textarea
                                      value={qResponse.actionComentarios}
                                      onChange={(e) => updateQuestionResponse(question.id, 'actionComentarios', e.target.value)}
                                      placeholder="Comentários do plano de ação..."
                                      rows={5}
                                      maxLength={600}
                                      className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none transition-colors"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Seção de Resposta da Questão */}
                              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h5 className="text-sm font-bold text-slate-800 mb-4">
                                  ✅ Resposta da Questão
                                </h5>

                                <div className="space-y-4">
                                  {/* Resposta Sim/Não */}
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                      Selecione a Resposta *
                                    </label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateQuestionResponse(question.id, 'resposta', 'Sim')}
                                        className={`
                                          px-6 py-2.5 text-sm font-bold rounded-lg border-2 transition-colors
                                          ${qResponse.resposta === 'Sim'
                                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-600 hover:text-emerald-700'
                                          }
                                        `}
                                      >
                                        SIM
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateQuestionResponse(question.id, 'resposta', 'Não')}
                                        className={`
                                          px-6 py-2.5 text-sm font-bold rounded-lg border-2 transition-colors
                                          ${qResponse.resposta === 'Não'
                                            ? 'bg-red-700 text-white border-red-700 shadow-sm'
                                            : 'bg-white text-slate-700 border-slate-300 hover:border-red-600 hover:text-red-700'
                                          }
                                        `}
                                      >
                                        NÃO
                                      </button>
                                    </div>
                                  </div>

                                  {/* Justificativa */}
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                      Justificativa / Observações
                                    </label>
                                    <textarea
                                      value={qResponse.respostaTexto}
                                      onChange={(e) => updateQuestionResponse(question.id, 'respostaTexto', e.target.value)}
                                      placeholder="Descreva sua justificativa..."
                                      rows={3}
                                      maxLength={500}
                                      className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none transition-colors"
                                    />
                                  </div>

                                  {/* Upload de arquivo de resposta */}
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                      Arquivo da Resposta (opcional)
                                    </label>
                                    <FileUpload
                                      label="Selecionar arquivo"
                                      multiple
                                      maxFiles={5}
                                      files={qResponse.respostaArquivo}
                                      onFilesSelect={(files) => {
                                        updateQuestionResponse(question.id, 'respostaArquivo', files);
                                      }}
                                      onRemove={() => updateQuestionResponse(question.id, 'respostaArquivo', [])}
                                      onRemoveAt={(idx) => {
                                        const next = [...(qResponse.respostaArquivo ?? [])];
                                        next.splice(idx, 1);
                                        updateQuestionResponse(question.id, 'respostaArquivo', next);
                                      }}
                                      disabled={false}
                                    />
                                    {/* Arquivo já enviado */}
                                    {question.attachments?.filter(a => a.category === 'RESPOSTA').map(att => (
                                      <a key={att.id} href={getAttachmentUrl(att.path)} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 hover:bg-emerald-100"
                                      >
                                        <Download size={12} />{att.originalName}<ExternalLink size={10} />
                                      </a>
                                    ))}
                                  </div>

                                  {/* Campos para resposta "Não" */}
                                  {qResponse.resposta === 'Não' && (
                                    <div
                                      className={`grid grid-cols-1 ${
                                        formMetadata.incluirRecomendacoes === 'INCLUIR' ? 'md:grid-cols-2' : 'md:grid-cols-1'
                                      } gap-4 p-4 bg-red-50 rounded-lg border border-red-200`}
                                    >
                                      <div>
                                        <label className="block text-xs font-bold text-red-700 uppercase mb-1.5">
                                          Deficiência Identificada
                                        </label>
                                        <textarea
                                          value={qResponse.deficienciaTexto}
                                          onChange={(e) => updateQuestionResponse(question.id, 'deficienciaTexto', e.target.value)}
                                          placeholder="Descreva a deficiência encontrada..."
                                          rows={3}
                                          maxLength={500}
                                          className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none transition-colors"
                                        />
                                        <div className="mt-2">
                                          <FileUpload
                                            label="Arquivo comprobatório"
                                            multiple
                                            maxFiles={5}
                                            files={qResponse.deficienciaArquivo}
                                            onFilesSelect={(files) => {
                                              updateQuestionResponse(question.id, 'deficienciaArquivo', files);
                                            }}
                                            onRemove={() => updateQuestionResponse(question.id, 'deficienciaArquivo', [])}
                                            onRemoveAt={(idx) => {
                                              const next = [...(qResponse.deficienciaArquivo ?? [])];
                                              next.splice(idx, 1);
                                              updateQuestionResponse(question.id, 'deficienciaArquivo', next);
                                            }}
                                            disabled={false}
                                          />
                                          {/* Arquivo já enviado */}
                                          {question.attachments?.filter(a => a.category === 'DEFICIENCIA').map(att => (
                                            <a key={att.id} href={getAttachmentUrl(att.path)} target="_blank" rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700 hover:bg-red-100"
                                            >
                                              <Download size={12} />{att.originalName}<ExternalLink size={10} />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                      {formMetadata.incluirRecomendacoes === 'INCLUIR' && (
                                        <div>
                                          <label className="block text-xs font-bold text-amber-700 uppercase mb-1.5">
                                            Recomendação
                                          </label>
                                          <textarea
                                            value={qResponse.recomendacaoTexto}
                                            onChange={(e) => updateQuestionResponse(question.id, 'recomendacaoTexto', e.target.value)}
                                            placeholder="Recomendações de melhoria..."
                                            rows={3}
                                            maxLength={500}
                                            disabled={false}
                                            className="w-full px-3 py-3 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none transition-colors"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            // Modo somente leitura (formulário em revisão ou aprovado)
                            <div className="space-y-4">
                              {/* Teste somente leitura */}
                              {qResponse.testStatus && (
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                  <h5 className="text-sm font-bold text-slate-900 mb-2">Informações do Teste</h5>
                                  <p className="text-sm text-slate-900">
                                    <strong>Teste Realizado:</strong> {
                                      qResponse.testStatus === 'SIM' ? 'Sim' :
                                      qResponse.testStatus === 'NAO' ? 'Não' :
                                      qResponse.testStatus === 'NAO_PLANO' ? 'Apresenta deficiências com plano de ação' :
                                      qResponse.testStatus
                                    }
                                  </p>
                                  {qResponse.testDescription && (
                                    <p className="text-sm text-slate-900 mt-2">
                                      <strong>Descrição:</strong> {qResponse.testDescription}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Resposta somente leitura */}
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h5 className="text-sm font-bold text-slate-800 mb-2">Resposta</h5>
                                {qResponse.resposta && (
                                  <p className="text-sm text-slate-900">
                                    <strong>Resposta:</strong> {qResponse.resposta}
                                  </p>
                                )}
                                {qResponse.respostaTexto && (
                                  <p className="text-sm text-slate-900 mt-2">
                                    <strong>Justificativa:</strong> {qResponse.respostaTexto}
                                  </p>
                                )}
                                {qResponse.deficienciaTexto && (
                                  <p className="text-sm text-red-700 mt-2">
                                    <strong>Deficiência:</strong> {qResponse.deficienciaTexto}
                                  </p>
                                )}
                                {formMetadata.incluirRecomendacoes === 'INCLUIR' && qResponse.recomendacaoTexto && (
                                  <p className="text-sm text-amber-700 mt-2">
                                    <strong>Recomendação:</strong> {qResponse.recomendacaoTexto}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {canEdit && (
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
