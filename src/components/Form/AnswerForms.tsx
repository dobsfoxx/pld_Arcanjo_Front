import React, { useState, useEffect } from 'react';
import { Check, X, Paperclip, FileText, Image, Download, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { pldApi } from '../../lib/api';
import type { Question, Answer, Evidence } from '../../types/pld';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface AnswerFormProps {
  question: Question;
  answer?: Answer;
  onAnswerSaved: () => void;
  onCancel: () => void;
}

export const AnswerForm: React.FC<AnswerFormProps> = ({
  question,
  answer,
  onAnswerSaved,
  onCancel,
}) => {
  const [response, setResponse] = useState<boolean | null>(answer?.response ?? null);
  const [justification, setJustification] = useState(answer?.justification || '');
  const [deficiency, setDeficiency] = useState(answer?.deficiency || '');
  const [recommendation, setRecommendation] = useState(answer?.recommendation || '');
  const [saving, setSaving] = useState(false);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [evidences, setEvidences] = useState<Evidence[]>(answer?.evidences || []);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (answer) {
      setResponse(answer.response);
      setJustification(answer.justification || '');
      setDeficiency(answer.deficiency || '');
      setRecommendation(answer.recommendation || '');
      setEvidences(answer.evidences || []);
    }
  }, [answer]);

  const handleSubmit = async () => {
    if (response === null) {
      toast.error('Por favor, selecione Sim ou Não');
      return;
    }

    // Validação: se resposta é Não, deve ter deficiência e recomendação
    if (response === false && (!deficiency.trim() || !recommendation.trim())) {
      toast.error('Para resposta "Não", é obrigatório preencher Deficiência e Recomendação');
      return;
    }

    setSaving(true);

    try {
      await pldApi.answerQuestion({
        questionId: question.id,
        response,
        justification: justification.trim() || undefined,
        deficiency: response === false ? deficiency.trim() : undefined,
        recommendation: response === false ? recommendation.trim() : undefined,
      });

      toast.success('Resposta salva com sucesso!');
      onAnswerSaved();
    } catch (error: unknown) {
      console.error('Erro ao salvar resposta:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{ error?: string }>;
        toast.error(axiosError.response?.data?.error || 'Erro ao salvar resposta');
      } else {
        toast.error('Erro ao salvar resposta');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar tamanho máximo (10MB por arquivo)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} excede 10MB`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleUploadEvidences = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione arquivos para upload');
      return;
    }

    if (!answer?.id) {
      toast.error('Salve a resposta antes de anexar evidências');
      return;
    }

    setUploadingFiles(true);

    try {
      const response = await pldApi.uploadEvidences(answer.id, selectedFiles);
      setEvidences(prev => [...prev, ...response.data.evidences]);
      setSelectedFiles([]);
      toast.success(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{ error?: string }>;
        toast.error(axiosError.response?.data?.error || 'Erro ao enviar arquivos');
      } else {
        toast.error('Erro ao enviar arquivos');
      }
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) {
      return;
    }

    try {
      await pldApi.deleteEvidence(evidenceId);
      setEvidences(prev => prev.filter(e => e.id !== evidenceId));
      toast.success('Arquivo excluído com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType.includes('image')) {
      return <Image className="h-5 w-5 text-green-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'ALTA': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIA': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'BAIXA': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Pergunta */}
      <div className="border-l-4 border-primary-500 pl-4 py-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-lg text-gray-900 mb-2">
              {question.title}
            </h4>
            {question.description && (
              <p className="text-gray-600 mb-3">{question.description}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCriticalityColor(question.criticality)}`}>
            {question.criticality}
          </span>
        </div>
      </div>

      {/* Seleção Sim/Não */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Resposta *
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setResponse(true)}
            className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
              response === true
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
          >
            <Check className="mr-2 h-5 w-5" />
            <span className="font-medium">Sim</span>
          </button>
          
          <button
            type="button"
            onClick={() => setResponse(false)}
            className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
              response === false
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
            }`}
          >
            <X className="mr-2 h-5 w-5" />
            <span className="font-medium">Não</span>
          </button>
        </div>
      </div>

      {/* Justificativa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Justificativa (opcional)
        </label>
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="Explique sua resposta..."
          maxLength={500}
        />
        <div className="text-xs text-gray-500 text-right mt-1">
          {justification.length}/500 caracteres
        </div>
      </div>

      {/* Campos Condicionais (apenas se resposta = Não) */}
      {response === false && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deficiência Identificada *
            </label>
            <textarea
              value={deficiency}
              onChange={(e) => setDeficiency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Descreva a deficiência encontrada..."
              required
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {deficiency.length}/500 caracteres
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recomendação *
            </label>
            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Descreva a recomendação para correção..."
              required
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {recommendation.length}/500 caracteres
            </div>
          </div>
        </>
      )}

      {/* Evidências Anexadas */}
      {evidences.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-700">Evidências Anexadas</h5>
            <span className="text-sm text-gray-500">
              {evidences.length} arquivo(s)
            </span>
          </div>
          
          <div className="space-y-2">
            {evidences.map((evidence) => (
              <div
                key={evidence.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(evidence.mimeType)}
                  <div>
                    <div className="font-medium">{evidence.originalName}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(evidence.size)} •{' '}
                      {new Date(evidence.uploadedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={`http://localhost:3001/uploads/${evidence.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteEvidence(evidence.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload de Novas Evidências */}
      <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-700">
              Adicionar Evidências
            </h5>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowEvidenceUpload(!showEvidenceUpload)}
              className="flex items-center gap-2"
            >
              <Paperclip className="h-4 w-4" />
              {showEvidenceUpload ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>

          {showEvidenceUpload && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              {/* Seleção de Arquivos */}
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="block bg-slate-100 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500 mt-2">
                  PDF, DOC, DOCX, JPG, PNG até 10MB cada
                </p>
              </div>

              {/* Preview dos Arquivos Selecionados */}
              {selectedFiles.length > 0 && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">
                    Arquivos selecionados ({selectedFiles.length})
                  </h6>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão de Upload */}
              {selectedFiles.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleUploadEvidences}
                    disabled={uploadingFiles}
                    isLoading={uploadingFiles}
                  >
                    {uploadingFiles ? 'Enviando...' : 'Enviar Arquivos'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      

      {/* Ações */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          isLoading={saving}
          variant='primary'
        >
          Salvar Resposta
        </Button>
      </div>
    </div>
  );
};