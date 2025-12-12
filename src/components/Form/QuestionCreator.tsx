import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { pldApi } from '../../lib/api';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface QuestionCreatorProps {
  topicId: string;
  topicName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuestionCreator: React.FC<QuestionCreatorProps> = ({
  topicId,
  topicName,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    criticality: 'MEDIA' as 'BAIXA' | 'MEDIA' | 'ALTA',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Título da pergunta é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      await pldApi.createQuestion({
        topicId,
        title: formData.title,
        description: formData.description,
        criticality: formData.criticality,
      });

      toast.success('Pergunta criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as AxiosError<{ error?: string }>;
        toast.error(axiosError.response?.data?.error || 'Erro ao criar pergunta');
      } else {
        toast.error('Erro desconhecido ao criar pergunta');
      }
      console.error('Erro detalhado:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Adicionar Pergunta</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tópico: <span className="font-medium">{topicName}</span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Formulário */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título da Pergunta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Pergunta *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: A política está formalmente documentada?"
                required
                maxLength={200}
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {formData.title.length}/200 caracteres
              </div>
            </div>

            {/* Descrição */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Detalhes adicionais sobre a pergunta..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {formData.description.length}/500 caracteres
              </div> */}
            {/* </div> */}

            {/* Criticidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível de Criticidade *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['BAIXA', 'MEDIA', 'ALTA'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({ ...prev, criticality: level }))
                    }
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      formData.criticality === level
                        ? level === 'ALTA'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : level === 'MEDIA'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{level}</div>
                    <div className="text-xs mt-1">
                      {level === 'ALTA'
                        ? 'Crítica'
                        : level === 'MEDIA'
                        ? 'Moderada'
                        : 'Baixa'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                variant='primary'
              >
                Adicionar Pergunta
              </Button>
            </div>
          
          </form>
        </div>
      </div>
      
    </div>
  );
};