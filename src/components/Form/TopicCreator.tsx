import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { pldApi } from '../../lib/api';
import { PLD_TOPICS } from '../../types/pld';
import toast from 'react-hot-toast';

interface TopicCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const TopicCreator: React.FC<TopicCreatorProps> = ({ onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    internalNorm: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do tópico é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      await pldApi.createTopic(formData);
      toast.success('Tópico criado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Erro ao criar tópico');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTopic = (topic: string) => {
    setFormData(prev => ({ ...prev, name: topic }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Criar Novo Tópico</h2>
            <p className="text-sm text-gray-600 mt-1">
              Adicione um novo tópico ao formulário PLD
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tópicos pré-definidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione um tópico pré-definido
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {PLD_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleSelectTopic(topic)}
                    className={`p-2 text-sm text-left rounded hover:bg-gray-100 transition-colors ${
                      formData.name === topic ? 'bg-primary-50 border border-primary-200' : ''
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome personalizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Tópico *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Política Interna de PLD"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Descreva o objetivo deste tópico..."
              />
            </div>

            {/* Norma Interna
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referência à Norma Interna
              </label>
              <textarea
                value={formData.internalNorm}
                onChange={(e) => setFormData(prev => ({ ...prev, internalNorm: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                placeholder="Referência ao arquivo ou norma interna..."
              />
            </div> */}

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
                variant='secondary'
              >
                Criar Tópico
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};