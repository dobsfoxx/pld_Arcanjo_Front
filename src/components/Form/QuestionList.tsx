import React, { useState } from 'react';
import { GripVertical, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { AnswerForm } from './AnswerForms';
import { pldApi } from '../../lib/api';
import type { Topic, Question } from '../../types/pld';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface QuestionListProps {
  topic: Topic;
  onDataChange: () => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({ topic, onDataChange }) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [questionOrder, setQuestionOrder] = useState<string[] | null>(null);

  const baseQuestions: Question[] = topic.questions || [];

  const questions: Question[] = React.useMemo(() => {
    if (!questionOrder) return baseQuestions;

    const byId = new Map(baseQuestions.map(q => [q.id, q] as const));
    const ordered: Question[] = [];

    questionOrder.forEach(id => {
      const q = byId.get(id);
      if (q) {
        ordered.push(q);
        byId.delete(id);
      }
    });

    byId.forEach(q => ordered.push(q));
    return ordered;
  }, [baseQuestions, questionOrder]);

  const changeQuestionPosition = async (
    currentIndex: number,
    targetPosition: number
  ) => {
    const current = questions;
    const length = current.length;

    if (!Number.isFinite(targetPosition)) return;

    let newIndex = Math.round(targetPosition) - 1; // posição é 1-based

    if (newIndex < 0) newIndex = 0;
    if (newIndex > length - 1) newIndex = length - 1;
    if (newIndex === currentIndex) return;

    const previousOrder = questionOrder ?? baseQuestions.map(q => q.id);

    const newQuestions = [...current];
    const [movedQuestion] = newQuestions.splice(currentIndex, 1);
    newQuestions.splice(newIndex, 0, movedQuestion);

    const newOrder = newQuestions.map(q => q.id);
    setQuestionOrder(newOrder);

    try {
      await pldApi.reorderQuestions(topic.id, newOrder);
      toast.success('Ordem atualizada!');
    } catch (error: unknown) {
      console.error('Erro ao atualizar ordem:', error);
      toast.error('Erro ao atualizar ordem');
      setQuestionOrder(previousOrder);
    }
  };

  // Toggle expandir/recolher pergunta
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  // Marcar como não aplicável
  const toggleApplicable = async (questionId: string, currentStatus: boolean) => {
    try {
      await pldApi.updateQuestionApplicable(questionId, !currentStatus);
      toast.success('Status atualizado!');
      onDataChange();
    } catch (error: unknown) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Mover pergunta para cima/baixo
  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    const current = questions;

    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === current.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    await changeQuestionPosition(index, newIndex + 1);
  };

  // Deletar pergunta
  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) {
      return;
    }

    try {
      await pldApi.deleteQuestion(questionId);
      toast.success('Pergunta excluída com sucesso!');
      onDataChange();
    } catch (error: unknown) {
      console.error('Erro ao excluir pergunta:', error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{ error?: string }>;
        const apiMessage = axiosError.response?.data?.error;
        toast.error(apiMessage || 'Erro ao excluir pergunta');
      } else {
        toast.error('Erro ao excluir pergunta');
      }
    }
  };

  const getCriticalityBadge = (criticality: string) => {
    const styles = {
      ALTA: 'bg-red-100 text-red-800 border-red-200',
      MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      BAIXA: 'bg-green-100 text-green-800 border-green-200',
    };
    
    const labels = {
      ALTA: 'Alta',
      MEDIA: 'Média', 
      BAIXA: 'Baixa'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[criticality as keyof typeof styles]}`}>
        {labels[criticality as keyof typeof labels]}
      </span>
    );
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Nenhuma pergunta cadastrada neste tópico</p>
        <p className="text-sm text-gray-400 mt-1">
          Adicione perguntas para começar a avaliação
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com controle de reordenação */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">
          Perguntas ({questions.length})
        </h4>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReordering(!isReordering)}
            className="flex items-center gap-2"
          >
            <GripVertical className="h-4 w-4" />
            {isReordering ? 'Finalizar Ordenação' : 'Reordenar'}
          </Button>
        </div>
      </div>

      {/* Lista de Perguntas */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={`${question.id}-${index}`}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
          >
            {/* Cabeçalho da Pergunta */}
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Controles de Ordenação */}
                  {isReordering ? (
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={questions.length}
                        defaultValue={index + 1}
                        onBlur={e =>
                          changeQuestionPosition(index, Number(e.target.value))
                        }
                        className="w-10 h-6 text-xs text-center border border-gray-300 rounded bg-white"
                      />
                      <button
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === questions.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
                        {index + 1}
                      </div>
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>
                  )}

                  {/* Conteúdo da Pergunta */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">
                          {question.title}
                        </h5>
                        {question.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {question.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {getCriticalityBadge(question.criticality)}
                      </div>
                    </div>

                    {/* Status e Ações */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleApplicable(question.id, question.isApplicable)}
                          className={`inline-flex items-center gap-1 text-sm ${
                            question.isApplicable 
                              ? 'text-green-600 hover:text-green-800' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {question.isApplicable ? (
                            <>
                              <Eye className="h-4 w-4" />
                              <span>Aplicável</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4" />
                              <span>Não Aplicável</span>
                            </>
                          )}
                        </button>

                        {question.answer && (
                          <span className="text-sm text-blue-600 font-medium">
                            ✓ Respondida
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isReordering && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleQuestion(question.id)}
                              className="p-2"
                            >
                              {expandedQuestion === question.id ? 'Recolher' : 'Responder'}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteQuestion(question.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de Resposta (Expandido) */}
            {expandedQuestion === question.id && (
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                <AnswerForm
                  question={question}
                  answer={question.answer}
                  onAnswerSaved={() => {
                    onDataChange();
                    setExpandedQuestion(null);
                  }}
                  onCancel={() => {
                    setExpandedQuestion(null);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rodapé com estatísticas */}
      <div className="pt-4 border-t text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{questions.filter(q => q.isApplicable).length}</span> aplicáveis •{' '}
            <span className="font-medium">{questions.filter(q => q.answer).length}</span> respondidas
          </div>
          <div>
            Total: <span className="font-medium">{questions.length}</span> perguntas
          </div>
        </div>
      </div>
    </div>
  );
};